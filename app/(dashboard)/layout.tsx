import { redirect } from "next/navigation"
import { getAuthProfile } from "@/lib/supabase/auth"
import { DashboardShell } from "./dashboard-shell"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, profile } = await getAuthProfile()

  if (!user) {
    redirect("/masuk")
  }

  const userName = profile?.full_name || user.email || "User"
  const userRole = profile?.role || "doctor"

  return (
    <DashboardShell userName={userName} userRole={userRole}>
      {children}
    </DashboardShell>
  )
}
