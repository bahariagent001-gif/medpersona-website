import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getAuthProfile } from "@/lib/supabase/auth"

/**
 * POST /api/approval/growth/attach-music
 * Body: { approvalId, trackId | null }
 *
 * Attach a music_library track to an organic_post approval so when the
 * dispatcher executes the post, the caption (or scheduler metadata)
 * includes the track hint. For IG/TikTok Business API publishing the
 * audio can only be attached if the track has a usable audio_url; for
 * native IG trending tracks (tiktok-native license) the metadata is
 * surfaced to the owner as a manual-upload hint.
 */
export async function POST(req: Request) {
  const { user, profile } = await getAuthProfile()
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  if (!["super_admin", "admin"].includes(profile?.role || "")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 })
  }

  const { approvalId, trackId } = await req.json().catch(() => ({}))
  if (!approvalId) return NextResponse.json({ error: "bad_request" }, { status: 400 })

  const supabase = await createClient()

  // Load approval payload
  const { data: row, error: readErr } = await supabase
    .from("approvals_pending")
    .select("payload, type")
    .eq("id", approvalId)
    .single()
  if (readErr) return NextResponse.json({ error: readErr.message }, { status: 500 })
  if (row?.type !== "organic_post") {
    return NextResponse.json({ error: "attach-music only for organic_post" }, { status: 400 })
  }

  const payload = (row.payload as Record<string, unknown>) || {}

  // Detach
  if (!trackId) {
    const next = { ...payload }
    delete (next as Record<string, unknown>).audio
    await supabase.from("approvals_pending").update({ payload: next }).eq("id", approvalId)
    return NextResponse.json({ ok: true, detached: true })
  }

  // Load track metadata
  const { data: track, error: trackErr } = await supabase
    .from("music_library")
    .select("id, title, artist, audio_url, preview_url, duration_sec, license, source, is_trending")
    .eq("id", trackId)
    .single()
  if (trackErr) return NextResponse.json({ error: trackErr.message }, { status: 500 })

  const updatedPayload = {
    ...payload,
    audio: {
      track_id: track.id,
      title: track.title,
      artist: track.artist,
      audio_url: track.audio_url,
      preview_url: track.preview_url,
      duration_sec: track.duration_sec,
      license: track.license,
      source: track.source,
      is_trending: track.is_trending,
      // Hint for manual-upload flow: if license is tiktok-native we can't
      // attach via API → surface to owner as "pick this track in IG app"
      requires_manual_selection: track.license === "tiktok-native",
    },
    audio_attached_at: new Date().toISOString(),
  }

  const { error: writeErr } = await supabase
    .from("approvals_pending")
    .update({ payload: updatedPayload })
    .eq("id", approvalId)
  if (writeErr) return NextResponse.json({ error: writeErr.message }, { status: 500 })

  return NextResponse.json({ ok: true, audio: updatedPayload.audio })
}
