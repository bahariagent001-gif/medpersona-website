import { getAuthProfile } from "@/lib/supabase/auth"
import { DashboardShell } from "./dashboard-shell"

// Auth promise type for passing to client components via use()
export type AuthData = Awaited<ReturnType<typeof getAuthProfile>>

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Start auth but DON'T await — proxy.ts already handles unauthenticated redirects.
  // Not awaiting cookies() here unblocks loading.tsx files for instant navigation.
  const authPromise = getAuthProfile()

  return (
    <DashboardShell authPromise={authPromise}>
      {children}
    </DashboardShell>
  )
}
