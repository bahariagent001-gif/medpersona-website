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

  const workerBase = process.env.WORKER_EXECUTE_URL?.replace(/\/api\/execute-approval\/?$/, "")
  const workerSecret = process.env.WORKER_EXECUTE_SECRET || ""

  // EDIT: delegate to Python regenerate endpoint. It marks original as
  // superseded, generates a new draft with the feedback applied, and queues
  // it as a fresh approval.
  if (decision === "edit") {
    if (!note || !note.trim()) {
      return NextResponse.json({ error: "feedback required for edit" }, { status: 400 })
    }
    if (!workerBase) {
      return NextResponse.json({ error: "WORKER_EXECUTE_URL not configured" }, { status: 500 })
    }
    try {
      const res = await fetch(`${workerBase}/api/regenerate-approval`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Worker-Secret": workerSecret,
        },
        body: JSON.stringify({ approval_id: approvalId, feedback: note }),
      })
      const result = await res.json().catch(() => ({}))
      if (!res.ok) {
        return NextResponse.json({ error: result.error || "regenerate failed" }, { status: res.status })
      }
      return NextResponse.json({ ok: true, regenerated: result })
    } catch (e) {
      return NextResponse.json({ error: e instanceof Error ? e.message : "unknown" }, { status: 500 })
    }
  }

  // APPROVE / REJECT: update row, fire worker for approve
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

  const workerUrl = process.env.WORKER_EXECUTE_URL
  if (workerUrl && decision === "approve") {
    try {
      await fetch(workerUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Worker-Secret": workerSecret,
        },
        body: JSON.stringify({ approval_id: approvalId }),
      })
    } catch {
      // execution is polled by the Python worker; inline fire is best-effort
    }
  }

  return NextResponse.json({ ok: true, row: data })
}
