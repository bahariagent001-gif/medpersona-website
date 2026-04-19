import { NextResponse } from "next/server"
import { getAuthProfile } from "@/lib/supabase/auth"

/**
 * GET /api/ads/ig-recent-posts?limit=20
 * Fetch MedPersona's recent IG Business posts via Graph API for the
 * "Boost existing post" UI. Uses server-side token only — never exposed.
 */
export async function GET(req: Request) {
  const { user, profile } = await getAuthProfile()
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  if (!["super_admin", "admin"].includes(profile?.role || "")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 })
  }

  const url = new URL(req.url)
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 50)

  const token = process.env.MEDPERSONA_IG_ACCESS_TOKEN
  const igId = process.env.MEDPERSONA_IG_BUSINESS_ACCOUNT_ID
  if (!token || !igId) {
    return NextResponse.json({ error: "IG credentials not configured" }, { status: 500 })
  }

  const fields = [
    "id", "caption", "media_type", "media_url", "thumbnail_url",
    "permalink", "timestamp", "like_count", "comments_count",
  ].join(",")
  const graph = `https://graph.facebook.com/v25.0/${igId}/media?fields=${fields}&limit=${limit}&access_token=${token}`

  try {
    const r = await fetch(graph, { next: { revalidate: 60 } })
    const data = await r.json()
    if (!r.ok) {
      return NextResponse.json({ error: data?.error?.message || "graph error" }, { status: 500 })
    }
    return NextResponse.json({ posts: data.data || [] })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "unknown" }, { status: 500 })
  }
}
