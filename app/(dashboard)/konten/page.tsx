import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getAuthProfile } from "@/lib/supabase/auth"
import { ContentList } from "./content-list"

export const metadata = { title: "Konten — MedPersona" }

export const revalidate = 30

export default async function ContentPage() {
  const { user, profile } = await getAuthProfile()
  if (!user) redirect("/masuk")
  if (!["super_admin", "admin", "staff"].includes(profile?.role || "")) redirect("/dashboard")

  const supabase = await createClient()

  const { data: content } = await supabase
    .from("content_items")
    .select("id, doctor_id, topic_title, platform, content_type, status, planned_date, funnel_stage")
    .order("planned_date", { ascending: false })
    .limit(200)

  return (
    <div className="space-y-6">
      <ContentList content={content || []} />
    </div>
  )
}
