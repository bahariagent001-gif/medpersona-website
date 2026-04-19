import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getAuthProfile } from "@/lib/supabase/auth"

/**
 * POST /api/approval/growth/decide
 * Body: { approvalId, decision: "approve" | "reject" | "edit", note?: string }
 *
 * Marks the approvals_pending row as decided. A background Python job
 * (ad_approval_dispatcher._execute_approved) picks up 'decided' rows whose
 * decision is 'approve' and executes the action. Rejection is terminal.
 *
 * When ?execute=inline a lightweight in-process call can trigger execution
 * via a deployed worker endpoint (set WORKER_EXECUTE_URL in env).
 */
export async function POST(req: Request) {
  const { user, profile } = await getAuthProfile()
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  if (!["super_admin", "admin"].includes(profile?.role || "")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 })
  }

  const { approvalId, decision, note } = await req.json().catch(() => ({}))
  if (!approvalId || !["approve", "reject", "edit"].includes(decision)) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("approvals_pending")
    .update({
      decision,
      decision_note: note ?? null,
      decided_at: new Date().toISOString(),
      status: "decided",
    })
    .eq("id", approvalId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Fire-and-forget: notify backend worker to execute. Non-fatal if missing.
  const workerUrl = process.env.WORKER_EXECUTE_URL
  if (workerUrl && decision === "approve") {
    try {
      await fetch(workerUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Worker-Secret": process.env.WORKER_EXECUTE_SECRET || "",
        },
        body: JSON.stringify({ approval_id: approvalId }),
      })
    } catch {
      // execution is polled by the Python worker; inline fire is best-effort
    }
  }

  return NextResponse.json({ ok: true, row: data })
}
