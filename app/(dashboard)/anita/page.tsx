import { redirect } from "next/navigation"
import { getAuthProfile } from "@/lib/supabase/auth"
import { AnitaConversationsList } from "./conversations-list"

export const metadata = { title: "Anita — MedPersona" }
// Fresh data on every request; client component refreshes periodically on top.
export const dynamic = "force-dynamic"

export default async function AnitaAdminPage() {
  const { user, profile } = await getAuthProfile()
  if (!user) redirect("/masuk")
  if (!["super_admin", "admin"].includes(profile?.role || "")) {
    redirect("/dashboard?akses=ditolak")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Anita — Live Conversations</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Pantau interaksi WhatsApp Anita dengan dokter secara real-time. Klik
          phone untuk buka thread + takeover.
        </p>
      </div>
      <AnitaConversationsList />
    </div>
  )
}
