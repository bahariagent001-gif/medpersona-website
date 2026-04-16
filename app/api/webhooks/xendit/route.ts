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
