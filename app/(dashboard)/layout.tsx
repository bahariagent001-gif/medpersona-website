import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardShell } from "./dashboard-shell"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/masuk")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, doctor_id")
    .eq("id", user.id)
    .single()

  const userName = profile?.full_name || user.email || "User"
  const userRole = profile?.role || "doctor"

  return (
    <DashboardShell userName={userName} userRole={userRole}>
      {children}
    </DashboardShell>
  )
}
