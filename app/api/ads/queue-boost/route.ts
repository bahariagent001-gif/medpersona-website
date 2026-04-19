import { NextResponse } from "next/server"
import { getAuthProfile } from "@/lib/supabase/auth"

/**
 * POST /api/ads/queue-boost
 * Body: { mediaId, caption, permalink, thumbnailUrl, budgetDailyIdr, durationDays }
 * Proxies to the Python worker's queue endpoint so we can reuse the
 * single approvals_pending row shape.
 */
export async function POST(req: Request) {
  const { user, profile } = await getAuthProfile()
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  if (!["super_admin", "admin"].includes(profile?.role || "")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const { mediaId, caption, permalink, thumbnailUrl, budgetDailyIdr, durationDays } = body || {}
  if (!mediaId || !budgetDailyIdr) {
    return NextResponse.json({ error: "missing mediaId or budget" }, { status: 400 })
  }

  const workerBase = process.env.WORKER_EXECUTE_URL?.replace(/\/api\/execute-approval\/?$/, "")
  if (!workerBase) {
    return NextResponse.json({ error: "WORKER_EXECUTE_URL not configured" }, { status: 500 })
  }

  const res = await fetch(`${workerBase}/api/queue-boost`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Worker-Secret": process.env.WORKER_EXECUTE_SECRET || "",
    },
    body: JSON.stringify({
      media_id: mediaId,
      caption: caption || "",
      permalink: permalink || "",
      thumbnail_url: thumbnailUrl || "",
      budget_daily_idr: budgetDailyIdr,
      duration_days: durationDays || 3,
    }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) return NextResponse.json({ error: data?.error || "queue failed" }, { status: res.status })
  return NextResponse.json({ ok: true, approval_id: data.approval_id })
}
