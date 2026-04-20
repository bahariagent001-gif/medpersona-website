/**
 * Server-side proxy helpers for Anita Railway admin API.
 *
 * The admin secret never reaches the browser — all calls go through Next.js
 * route handlers that read ANITA_ADMIN_SECRET from server env and forward to
 * the Railway Flask service at ANITA_BASE_URL.
 */
import { getAuthProfile } from "@/lib/supabase/auth"
import { NextResponse } from "next/server"

export const ANITA_BASE = process.env.ANITA_BASE_URL || "https://anita-production.up.railway.app"
const ANITA_SECRET = process.env.ANITA_ADMIN_SECRET || ""

export async function requireAdmin() {
  const { user, profile } = await getAuthProfile()
  if (!user) return { error: NextResponse.json({ error: "unauthorized" }, { status: 401 }) }
  if (!["super_admin", "admin"].includes(profile?.role || "")) {
    return { error: NextResponse.json({ error: "forbidden" }, { status: 403 }) }
  }
  return { user, profile }
}

export async function anitaGet(path: string) {
  const url = `${ANITA_BASE}${path}`
  const res = await fetch(url, {
    headers: { "X-Admin-Secret": ANITA_SECRET },
    cache: "no-store",
  })
  return res
}

export async function anitaPost(path: string, body?: unknown) {
  const url = `${ANITA_BASE}${path}`
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "X-Admin-Secret": ANITA_SECRET,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  })
  return res
}
