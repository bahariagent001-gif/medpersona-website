import { redirect } from "next/navigation"
import { getAuthProfile } from "@/lib/supabase/auth"
import { AnitaChatView } from "./chat-view"

export const metadata = { title: "Anita Chat — MedPersona" }

export default async function AnitaChatPage({
  params,
}: {
  params: Promise<{ phone: string }>
}) {
  const { user, profile } = await getAuthProfile()
  if (!user) redirect("/masuk")
  if (!["super_admin", "admin"].includes(profile?.role || "")) {
    redirect("/dashboard?akses=ditolak")
  }
  const { phone } = await params
  return <AnitaChatView phone={phone} />
}
