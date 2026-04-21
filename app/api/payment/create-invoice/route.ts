import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

const TIER_PRICING: Record<string, { amount: number; label: string }> = {
  starter: { amount: 299000, label: "Starter" },
  growth: { amount: 649000, label: "Growth" },
  pro: { amount: 1299000, label: "Pro" },
  elite: { amount: 2499000, label: "Elite" },
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { tier } = await request.json()

    if (!tier || !TIER_PRICING[tier]) {
      return NextResponse.json({ error: "Paket tidak valid." }, { status: 400 })
    }

    // Get doctor profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("doctor_id, full_name, email, phone")
      .eq("id", user.id)
      .single()

    if (!profile?.doctor_id) {
      return NextResponse.json({ error: "Profil dokter tidak ditemukan." }, { status: 404 })
    }

    const pricing = TIER_PRICING[tier]
    const now = new Date()
    const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`

    const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "https://medpersona.id"

    // Call Xendit API to create invoice
    const xenditKey = process.env.XENDIT_SECRET_KEY
    if (!xenditKey) {
      return NextResponse.json({ error: "Layanan pembayaran sedang tidak tersedia. Silakan coba lagi nanti atau hubungi support@medpersona.id" }, { status: 503 })
    }

    // Idempotency: if doctor already has a pending invoice for the same tier
    // in the current period, return its existing invoice_url instead of
    // creating a duplicate (Xendit rejects duplicate external_id with 400).
    const admin = createAdminClient()
    const { data: existingPending } = await admin
      .from("invoices")
      .select("id, invoice_url, created_at, tier, period, status")
      .eq("doctor_id", profile.doctor_id)
      .eq("status", "pending")
      .eq("tier", tier)
      .eq("period", period)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (existingPending?.invoice_url) {
      // Reuse the still-open invoice — saves the user from a duplicate-ID
      // error and lets them just re-open the checkout link.
      return NextResponse.json({
        success: true,
        invoiceUrl: existingPending.invoice_url,
        invoiceId: existingPending.id,
        reused: true,
      })
    }

    // externalId now includes a short timestamp suffix so repeated clicks
    // or switching-tiers-mid-period always produce a unique id.
    const tsSuffix = now.getTime().toString(36).slice(-6)
    const externalId = `${profile.doctor_id}_${period}_${tier}_${tsSuffix}`

    // Detect if this is an upgrade (doctor already has active tier) so we can
    // redirect back to /langganan on failure instead of /daftar/paket which
    // is semantically a sign-up flow.
    const { data: currentDoctor } = await admin
      .from("doctors")
      .select("tier, subscription_status")
      .eq("id", profile.doctor_id)
      .maybeSingle()
    const isUpgrade = currentDoctor?.subscription_status === "active"
    const failureRedirect = isUpgrade
      ? `${origin}/langganan?error=payment_failed`
      : `${origin}/daftar/paket?error=payment_failed`

    const xenditPayload = {
      external_id: externalId,
      amount: pricing.amount,
      currency: "IDR",
      description: `Langganan MedPersona ${pricing.label} — ${period}`,
      invoice_duration: 259200, // 3 days
      payment_methods: [
        // Bank transfer
        "BCA", "BNI", "BSI", "MANDIRI", "BRI", "PERMATA",
        // E-wallet
        "OVO", "DANA", "SHOPEEPAY", "QRIS",
      ],
      success_redirect_url: `${origin}/dashboard?pembayaran=berhasil`,
      failure_redirect_url: failureRedirect,
      customer: {
        given_names: profile.full_name || user.email,
        email: profile.email || user.email,
        mobile_number: profile.phone || undefined,
      },
      customer_notification_preference: {
        invoice_created: ["whatsapp", "email"],
        invoice_reminder: ["whatsapp", "email"],
        invoice_paid: ["whatsapp", "email"],
      },
      metadata: {
        doctor_id: profile.doctor_id,
        tier,
        period,
        type: "subscription",
      },
    }

    const xenditRes = await fetch("https://api.xendit.co/v2/invoices", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(xenditKey + ":").toString("base64")}`,
      },
      body: JSON.stringify(xenditPayload),
    })

    if (!xenditRes.ok) {
      const xenditErr = await xenditRes.text()
      console.error("Xendit invoice creation failed:", xenditErr)
      return NextResponse.json(
        { error: "Gagal membuat tagihan. Silakan coba lagi." },
        { status: 502 }
      )
    }

    const xenditData = await xenditRes.json()
    const invoiceUrl = xenditData.invoice_url

    // Save invoice to database (admin client already instantiated above for
    // idempotency lookup — reuse it to bypass RLS on insert).
    await admin.from("invoices").insert({
      id: externalId,
      doctor_id: profile.doctor_id,
      tier,
      type: "subscription",
      amount_idr: pricing.amount,
      status: "pending",
      invoice_url: invoiceUrl,
      period,
    })

    // Tier is intentionally NOT updated here — the xendit webhook promotes the
    // tier AFTER the payment is confirmed paid. If we updated tier before
    // payment, a doctor who abandons Xendit checkout would be left on the new
    // tier without having paid for it.

    return NextResponse.json({
      success: true,
      invoiceUrl,
      invoiceId: externalId,
    })
  } catch (err) {
    console.error("Create invoice error:", err)
    return NextResponse.json(
      { error: "Terjadi kesalahan internal." },
      { status: 500 }
    )
  }
}
