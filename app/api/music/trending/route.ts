import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getAuthProfile } from "@/lib/supabase/auth"

/**
 * GET /api/music/trending?limit=20&platform=tiktok
 * Returns trending audio tracks from music_library.
 */
export async function GET(req: Request) {
  const { user } = await getAuthProfile()
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const url = new URL(req.url)
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 50)

  const supabase = await createClient()
  let q = supabase
    .from("music_library")
    .select("id, title, artist, duration_sec, preview_url, tags, mood, source, is_trending, times_used")
    .order("times_used", { ascending: false })
    .limit(limit)

  if (url.searchParams.get("trending_only") !== "0") {
    q = q.eq("is_trending", true)
  }

  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ tracks: data || [] })
}
