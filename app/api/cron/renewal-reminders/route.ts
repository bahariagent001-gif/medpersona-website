import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * GET /api/cron/renewal-reminders
 *
 * Scans doctors whose `subscription_expires` falls in the next 7 days (or
 * just expired) and pushes a renewal-reminder WhatsApp template via Anita's
 * Railway admin endpoint. Idempotent per (doctor_id, bucket, day) so the
 * same dokter doesn't get spammed if the cron fires multiple times.
 *
 * Schedule via Vercel Cron (set in vercel.json):
 *   "0 2 * * *"  — every day at 02:00 UTC (09:00 WIB)
 *
 * Authentication: require CRON_SECRET matches header X-Cron-Secret.
 */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  const provided = request.headers.get("x-cron-secret")
  if (cronSecret && provided !== cronSecret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  const admin = createAdminClient()
  const anitaBase = (process.env.ANITA_BASE_URL || "https://anita-production.up.railway.app").replace(/\/$/, "")
  const anitaSecret = process.env.ANITA_ADMIN_SECRET || ""

  // Skip dokter with active auto-renewal — no reminder needed
  const now = new Date()
  const sevenDaysAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const threeDaysBehind = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)

  const { data: doctors } = await admin
    .from("doctors")
    .select("id, full_name, phone, tier, subscription_expires, subscription_status")
    .gte("subscription_expires", threeDaysBehind.toISOString())
    .lte("subscription_expires", sevenDaysAhead.toISOString())

  if (!doctors || doctors.length === 0) {
    return NextResponse.json({ ok: true, scanned: 0, sent: 0 })
  }

  // Query active recurring plans to exclude auto-renewing doctors
  const doctorIds = doctors.map((d) => d.id)
  const { data: activePlans } = await admin
    .from("recurring_plans")
    .select("doctor_id")
    .in("doctor_id", doctorIds)
    .eq("status", "active")
  const autoRenewSet = new Set((activePlans || []).map((p) => p.doctor_id))

  // Dedup by (doctor_id, date_bucket) using a reminder-log table so we don't
  // send the same H-7/H-3/H-1/expired bucket twice in the same day.
  const today = now.toISOString().slice(0, 10)

  let sent = 0
  let skipped = 0
  const errors: string[] = []

  for (const d of doctors) {
    if (!d.phone) continue
    if (autoRenewSet.has(d.id)) {
      skipped++
      continue
    }

    const exp = new Date(d.subscription_expires)
    const daysLeft = Math.floor((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    let bucket: string | null = null
    if (daysLeft < 0) bucket = "expired"
    else if (daysLeft <= 1) bucket = "h1"
    else if (daysLeft <= 3) bucket = "h3"
    else if (daysLeft <= 7) bucket = "h7"
    if (!bucket) continue

    // Idempotency: check if we've already sent this bucket today
    const logKey = `${d.id}:${bucket}:${today}`
    const { data: existingLog } = await admin
      .from("renewal_reminder_log")
      .select("id")
      .eq("id", logKey)
      .maybeSingle()
    if (existingLog) {
      skipped++
      continue
    }

    // Send via Anita admin endpoint
    const templateName = process.env.ANITA_RENEWAL_TEMPLATE || "anita_renewal_reminder"
    try {
      const res = await fetch(`${anitaBase}/admin/send-template/${encodeURIComponent(d.phone)}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Secret": anitaSecret,
        },
        body: JSON.stringify({
          template: templateName,
          lang: "id",
          body_params: [
            d.full_name || "Dokter",
            String(daysLeft < 0 ? 0 : daysLeft),
            d.tier || "starter",
          ],
        }),
      })
      if (res.ok) {
        sent++
        await admin.from("renewal_reminder_log").insert({
          id: logKey,
          doctor_id: d.id,
          bucket,
          sent_at: now.toISOString(),
        })
      } else {
        const errBody = await res.text().catch(() => "")
        errors.push(`${d.phone}:${res.status}:${errBody.slice(0, 80)}`)
      }
    } catch (e: unknown) {
      errors.push(`${d.phone}:${(e as Error).message}`)
    }
  }

  return NextResponse.json({
    ok: true,
    scanned: doctors.length,
    sent,
    skipped,
    errors,
  })
}
