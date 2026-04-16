import { cache } from "react"
import { createClient } from "./server"

/**
 * Cached per-request auth helper. Deduplicates getUser() + profile
 * queries across layout and page within the same request.
 */
export const getAuthProfile = cache(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { user: null, profile: null }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, doctor_id, email, phone")
    .eq("id", user.id)
    .single()

  return { user, profile }
})
