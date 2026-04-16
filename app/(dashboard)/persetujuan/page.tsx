import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getAuthProfile } from "@/lib/supabase/auth"
import { ApprovalContent } from "./approval-content"

export const metadata = {
  title: "Persetujuan Konten — MedPersona",
}

export const revalidate = 30

export default async function ApprovalPage() {
  const { user, profile } = await getAuthProfile()
  if (!user) redirect("/masuk")

  const supabase = await createClient()

  const isAdmin = ["super_admin", "admin", "staff"].includes(profile?.role || "")

  let query = supabase
    .from("content_items")
    .select("id, doctor_id, topic_title, platform, content_type, status, planned_date, copy_hook, assets, personal_upload, created_at")
    .order("planned_date", { ascending: true })

  if (!isAdmin && profile?.doctor_id) {
    query = query.eq("doctor_id", profile.doctor_id)
  }

  const { data: content } = await query.limit(200)

  return (
    <div className="space-y-6">
      <ApprovalContent
        content={content || []}
        isAdmin={isAdmin}
      />
    </div>
  )
}
