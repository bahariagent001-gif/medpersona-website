import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * POST /api/payment/cancel-recurring/[planId]
 *
 * Cancels an active Xendit recurring plan. Side effects:
 *  - Xendit stops future charges
 *  - Local row flips to status='cancelled' so UI shows proper CTA
 *  - Doctor's current paid period REMAINS VALID (they already paid for it)
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { planId } = await params

    const { data: profile } = await supabase
      .from("profiles")
      .select("doctor_id, role")
      .eq("id", user.id)
      .single()

    const admin = createAdminClient()
    const { data: plan } = await admin
      .from("recurring_plans")
      .select("id, doctor_id, status")
      .eq("id", planId)
      .maybeSingle()
    if (!plan) return NextResponse.json({ error: "Plan not found" }, { status: 404 })

    const isOwner = plan.doctor_id === profile?.doctor_id
    const isAdmin = ["super_admin", "admin"].includes(profile?.role || "")
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const xenditKey = process.env.XENDIT_SECRET_KEY
    if (!xenditKey) {
      return NextResponse.json({ error: "Layanan pembayaran tidak tersedia" }, { status: 503 })
    }

    const xenditRes = await fetch(`https://api.xendit.co/recurring/plans/${encodeURIComponent(planId)}/deactivate`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(xenditKey + ":").toString("base64")}`,
      },
    })

    if (!xenditRes.ok && xenditRes.status !== 404) {
      // 404 = already inactive upstream; treat as success
      const errText = await xenditRes.text()
      console.error("Xendit deactivate failed:", errText)
      return NextResponse.json({ error: "Gagal cancel di Xendit" }, { status: 502 })
    }

    await admin
      .from("recurring_plans")
      .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
      .eq("id", planId)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("cancel-recurring error:", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
