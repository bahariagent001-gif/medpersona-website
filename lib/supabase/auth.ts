import { cache } from "react"
import { createClient } from "./server"

/**
 * Cached per-request auth helper. Uses getSession() (local JWT read)
 * instead of getUser() (network call) for speed. Session validity is
 * already verified by proxy.ts on every request.
 *
 * Session lookup is synchronous (JWT decode), so it runs inline. The profile
 * lookup is the real RTT — keep it awaited but consider that the caller can
 * also start the query without awaiting if they just need `user`.
 */
export const getAuthProfile = cache(async () => {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session?.user) return { user: null, profile: null }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, doctor_id, email, phone")
    .eq("id", session.user.id)
    .single()

  return { user: session.user, profile }
})

/**
 * Lightweight variant for pages that only need the user (auth gate), not the
 * full profile row. Skips the profiles table lookup, saving one round-trip.
 * Use when you only need to verify the user is logged in.
 */
export const getAuthUser = cache(async () => {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session?.user ?? null
})
