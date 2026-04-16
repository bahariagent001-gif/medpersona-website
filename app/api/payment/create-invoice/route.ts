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
    const externalId = `${profile.doctor_id}_${period}_${tier}`

    const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "https://medpersona.id"

    // Call Xendit API to create invoice
    const xenditKey = process.env.XENDIT_SECRET_KEY
    if (!xenditKey) {
      return NextResponse.json({ error: "Payment gateway belum dikonfigurasi." }, { status: 503 })
    }

    const xenditPayload = {
      external_id: externalId,
      amount: pricing.amount,
      currency: "IDR",
      description: `Langganan MedPersona ${pricing.label} — ${period}`,
      invoice_duration: 259200, // 3 days
      payment_methods: [
        "BCA", "BNI", "BSI", "MANDIRI", "BRI", "PERMATA",
        "OVO", "DANA", "SHOPEEPAY", "QRIS",
      ],
      success_redirect_url: `${origin}/dashboard?pembayaran=berhasil`,
      failure_redirect_url: `${origin}/daftar/paket?error=payment_failed`,
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

    // Save invoice to database (use admin client to bypass RLS)
    const admin = createAdminClient()

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

    // Update doctor's tier
    await admin
      .from("doctors")
      .update({ tier })
      .eq("id", profile.doctor_id)

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
