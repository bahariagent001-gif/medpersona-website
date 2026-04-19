import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getAuthProfile } from "@/lib/supabase/auth"

/**
 * POST /api/approval/growth/patch-caption
 * Body: { approvalId, caption }
 *
 * Direct-edit caption on an organic_post approval without re-running the
 * AI generator. Useful for small tweaks (typo fix, tone polish) that don't
 * warrant a full regenerate.
 *
 * Patches approvals_pending.payload.caption_final AND
 * approvals_pending.payload.content.caption in one atomic update.
 */
export async function POST(req: Request) {
  const { user, profile } = await getAuthProfile()
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  if (!["super_admin", "admin"].includes(profile?.role || "")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 })
  }

  const { approvalId, caption } = await req.json().catch(() => ({}))
  if (!approvalId || typeof caption !== "string") {
    return NextResponse.json({ error: "bad_request" }, { status: 400 })
  }

  const supabase = await createClient()
  // Read current payload, patch both fields, write back
  const { data: row, error: readErr } = await supabase
    .from("approvals_pending")
    .select("payload, type")
    .eq("id", approvalId)
    .single()
  if (readErr) return NextResponse.json({ error: readErr.message }, { status: 500 })
  if (row?.type !== "organic_post") {
    return NextResponse.json({ error: "patch-caption only for organic_post" }, { status: 400 })
  }

  const payload = (row.payload as Record<string, unknown>) || {}
  const content = (payload.content as Record<string, unknown>) || {}
  const updatedPayload = {
    ...payload,
    caption_final: caption,
    content: { ...content, caption },
    edited_manually_at: new Date().toISOString(),
  }

  const { error: writeErr } = await supabase
    .from("approvals_pending")
    .update({ payload: updatedPayload })
    .eq("id", approvalId)

  if (writeErr) return NextResponse.json({ error: writeErr.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
