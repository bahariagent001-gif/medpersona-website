import { cache } from "react"
import { createClient } from "./server"

/**
 * Cached per-request auth helper. Uses getSession() (local JWT read)
 * instead of getUser() (network call) for speed. Session validity is
 * already verified by proxy.ts on every request.
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
