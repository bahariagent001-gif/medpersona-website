import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

const TIER_PRICING: Record<string, number> = {
  starter: 299000,
  growth: 649000,
  pro: 1299000,
  elite: 2499000,
}

/**
 * POST /api/payment/setup-recurring
 * Body: { tier: "starter"|"growth"|"pro"|"elite" }
 *
 * Creates a Xendit Recurring Plan that handles CC + eWallet auto-debit
 * uniformly. Returns a Xendit-hosted URL where the doctor authorizes the
 * payment method (3DS for CC, OAuth for linked eWallet). After completion
 * Xendit fires `recurring.plan.activated` to our webhook, which flips our
 * local row to status='active'.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { tier } = await request.json()
    if (!tier || !TIER_PRICING[tier]) {
      return NextResponse.json({ error: "Paket tidak valid" }, { status: 400 })
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("doctor_id, full_name, email, phone")
      .eq("id", user.id)
      .single()
    if (!profile?.doctor_id) {
      return NextResponse.json({ error: "Profil dokter tidak ditemukan" }, { status: 404 })
    }

    const xenditKey = process.env.XENDIT_SECRET_KEY
    if (!xenditKey) {
      return NextResponse.json({ error: "Layanan pembayaran sedang tidak tersedia" }, { status: 503 })
    }

    const admin = createAdminClient()

    // Refuse if this doctor already has an active or pending plan — avoid
    // duplicate charges.
    const { data: existing } = await admin
      .from("recurring_plans")
      .select("id, status")
      .eq("doctor_id", profile.doctor_id)
      .in("status", ["active", "pending_auth"])
      .maybeSingle()
    if (existing) {
      return NextResponse.json({
        error: "Auto-renewal sudah aktif atau sedang dalam proses aktivasi",
        existingPlanId: existing.id,
      }, { status: 409 })
    }

    const amount = TIER_PRICING[tier]
    const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "https://medpersona.id"

    // Xendit Recurring Plan creation. API docs:
    // https://docs.xendit.co/recurring/api-reference/recurring-plan
    const refId = `rp_${profile.doctor_id}_${tier}_${Date.now().toString(36)}`
    const xenditPayload = {
      reference_id: refId,
      customer: {
        reference_id: profile.doctor_id,
        given_names: profile.full_name || user.email,
        email: profile.email || user.email,
        mobile_number: profile.phone || undefined,
      },
      recurring_action: "PAYMENT",
      currency: "IDR",
      amount,
      schedule: {
        reference_id: `sch_${profile.doctor_id}_${Date.now().toString(36)}`,
        interval: "MONTH",
        interval_count: 1,
        // Start next charge 30 days after first payment
        anchor_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
      // Allow BOTH tokenized credit card AND linked e-wallet — Xendit picks
      // the right UI based on what the doctor chooses on the hosted page.
      payment_methods: [
        { type: "CARD", reference_id: `card_${profile.doctor_id}`, priority: 0 },
        { type: "EWALLET", reference_id: `ewallet_${profile.doctor_id}`, priority: 1 },
      ],
      immediate_action_type: "FULL_AMOUNT", // first charge happens right away
      notification_config: {
        recurring_created: ["WHATSAPP", "EMAIL"],
        recurring_succeeded: ["WHATSAPP", "EMAIL"],
        recurring_failed: ["WHATSAPP", "EMAIL"],
      },
      success_return_url: `${origin}/langganan?auto_renewal=success`,
      failure_return_url: `${origin}/langganan?auto_renewal=failed`,
      metadata: {
        doctor_id: profile.doctor_id,
        tier,
        source: "langganan_page_setup",
      },
    }

    const xenditRes = await fetch("https://api.xendit.co/recurring/plans", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(xenditKey + ":").toString("base64")}`,
        "Idempotency-Key": refId,
      },
      body: JSON.stringify(xenditPayload),
    })

    if (!xenditRes.ok) {
      const errText = await xenditRes.text()
      console.error("Xendit recurring plan create failed:", errText)
      return NextResponse.json({
        error: "Gagal setup auto-renewal. Coba lagi atau hubungi support.",
      }, { status: 502 })
    }

    const xendit = await xenditRes.json()
    const planId = xendit.id || xendit.plan_id || refId
    const actionsUrl = xendit.actions?.[0]?.url || xendit.redirect_url

    // Record local plan row so we can reconcile later via webhook
    await admin.from("recurring_plans").insert({
      id: planId,
      doctor_id: profile.doctor_id,
      tier,
      amount_idr: amount,
      method_type: null, // populated via webhook once doctor picks
      status: "pending_auth",
      interval_unit: "MONTH",
      interval_count: 1,
      next_charge_at: xenditPayload.schedule.anchor_date,
    })

    return NextResponse.json({
      success: true,
      planId,
      authUrl: actionsUrl,
    })
  } catch (err) {
    console.error("setup-recurring error:", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
