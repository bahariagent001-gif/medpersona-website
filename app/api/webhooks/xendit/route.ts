import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Verify Xendit callback token
    const callbackToken = request.headers.get("x-callback-token")
    const expectedToken = process.env.XENDIT_WEBHOOK_SECRET
    if (expectedToken && callbackToken !== expectedToken) {
      return NextResponse.json({ error: "Invalid callback token" }, { status: 403 })
    }

    // Recurring plan events come with `event` key and `data` payload that
    // look different from regular invoice callbacks — handle them first.
    const eventType = body.event || body.type || ""
    if (typeof eventType === "string" && eventType.startsWith("recurring.")) {
      return handleRecurringEvent(eventType, body)
    }

    const {
      id,
      external_id,
      status,
      paid_amount,
      paid_at,
      payment_method,
      payment_channel,
    } = body

    if (!id || !external_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Update invoice status based on Xendit callback
    const updateData: Record<string, unknown> = {
      status: status === "PAID" ? "paid" : status === "EXPIRED" ? "expired" : "pending",
    }

    if (status === "PAID") {
      updateData.paid_at = paid_at || new Date().toISOString()
      updateData.payment_method = payment_method
      updateData.payment_channel = payment_channel
    }

    const { error: invoiceError } = await supabase
      .from("invoices")
      .update(updateData)
      .eq("id", external_id)

    if (invoiceError) {
      console.error("Xendit webhook update error:", invoiceError)
      return NextResponse.json({ error: "Failed to update invoice" }, { status: 500 })
    }

    // On successful payment, activate the subscription
    if (status === "PAID") {
      // Get the invoice to find doctor_id and tier
      const { data: invoice } = await supabase
        .from("invoices")
        .select("doctor_id, tier, amount_idr")
        .eq("id", external_id)
        .single()

      if (invoice) {
        const now = new Date()
        const expiresAt = new Date(now)
        expiresAt.setDate(expiresAt.getDate() + 30)

        // Activate doctor subscription
        await supabase
          .from("doctors")
          .update({
            subscription_status: "active",
            subscription_started: now.toISOString(),
            subscription_expires: expiresAt.toISOString(),
            monthly_cost_idr: invoice.amount_idr,
            tier: invoice.tier,
          })
          .eq("id", invoice.doctor_id)

        // Initialize monthly usage for current month
        const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
        await supabase
          .from("monthly_usage")
          .upsert({
            doctor_id: invoice.doctor_id,
            month,
            posts_published: 0,
            videos_published: 0,
            revisions_used: 0,
            personal_uploads_used: 0,
          }, { onConflict: "doctor_id,month" })
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Xendit webhook error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * Handle Xendit Recurring Plan webhook events. Event key prefixes:
 *   recurring.plan.activated    — user completed auth, plan is live
 *   recurring.plan.inactivated  — user/admin cancelled, or all retries failed
 *   recurring.cycle.succeeded   — a monthly charge went through → new invoice
 *   recurring.cycle.retrying    — charge failed but Xendit will retry
 *   recurring.cycle.failed      — a cycle is permanently failed
 */
async function handleRecurringEvent(event: string, body: Record<string, unknown>) {
  const data = (body.data as Record<string, unknown>) || body
  const planId = (data.id as string) || (data.plan_id as string) || (body.plan_id as string)
  if (!planId) {
    return NextResponse.json({ error: "missing plan id" }, { status: 400 })
  }
  const supabase = createAdminClient()

  if (event === "recurring.plan.activated") {
    const methodType = (data.payment_methods as Array<Record<string, unknown>>)?.[0]?.type as string | undefined
    const methodMask = (data.payment_methods as Array<Record<string, unknown>>)?.[0]?.masked_card_number as string | undefined
    await supabase
      .from("recurring_plans")
      .update({
        status: "active",
        method_type: methodType ?? null,
        method_mask: methodMask ?? null,
      })
      .eq("id", planId)
    return NextResponse.json({ ok: true, handled: "plan.activated" })
  }

  if (event === "recurring.plan.inactivated") {
    await supabase
      .from("recurring_plans")
      .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
      .eq("id", planId)
    return NextResponse.json({ ok: true, handled: "plan.inactivated" })
  }

  if (event === "recurring.cycle.succeeded") {
    // Extend doctor's subscription_expires by 30 days and record an invoice
    const { data: plan } = await supabase
      .from("recurring_plans")
      .select("doctor_id, tier, amount_idr")
      .eq("id", planId)
      .maybeSingle()
    if (plan) {
      const cycleId = (data.id as string) || `${planId}_${Date.now()}`
      const now = new Date()
      const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 30)

      await supabase.from("invoices").upsert(
        {
          id: cycleId,
          doctor_id: plan.doctor_id,
          tier: plan.tier,
          type: "subscription",
          amount_idr: plan.amount_idr,
          status: "paid",
          paid_at: now.toISOString(),
          period,
          payment_method: "RECURRING",
        },
        { onConflict: "id" }
      )

      await supabase
        .from("doctors")
        .update({
          subscription_status: "active",
          subscription_expires: expiresAt.toISOString(),
          monthly_cost_idr: plan.amount_idr,
          tier: plan.tier,
        })
        .eq("id", plan.doctor_id)

      await supabase
        .from("recurring_plans")
        .update({
          last_cycle_id: cycleId,
          last_cycle_at: now.toISOString(),
          next_charge_at: expiresAt.toISOString(),
          failure_reason: null,
        })
        .eq("id", planId)
    }
    return NextResponse.json({ ok: true, handled: "cycle.succeeded" })
  }

  if (event === "recurring.cycle.failed" || event === "recurring.cycle.retrying") {
    const reason = (data.failure_reason as string) || (data.failure_code as string) || event
    await supabase
      .from("recurring_plans")
      .update({
        status: event === "recurring.cycle.failed" ? "failed" : "active",
        failure_reason: reason,
      })
      .eq("id", planId)
    return NextResponse.json({ ok: true, handled: event })
  }

  return NextResponse.json({ ok: true, ignored: event })
}
