import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { getAuthProfile } from "@/lib/supabase/auth"
import { formatDate } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { ArrowLeft, Calendar, Globe, Hash, FileText } from "lucide-react"
import Link from "next/link"
import { ApprovalActions } from "./approval-actions"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ contentId: string }>
}) {
  const { contentId } = await params
  return { title: `Review Konten — MedPersona` }
}

export default async function ContentApprovalPage({
  params,
}: {
  params: Promise<{ contentId: string }>
}) {
  const { contentId } = await params
  const { user, profile } = await getAuthProfile()
  if (!user) redirect("/masuk")

  const supabase = await createClient()
  const { data: content } = await supabase
    .from("content_items")
    .select("id, topic_title, platform, status, content_type, copy_hook, copy_body, copy_cta, caption, hashtags, planned_date, funnel_stage, doctor_id, personal_upload, approval_notes")
    .eq("id", contentId)
    .single()

  if (!content) notFound()

  const isAdmin = ["super_admin", "admin", "staff"].includes(profile?.role || "")
  const isOwnContent = profile?.doctor_id === content.doctor_id

  if (!isAdmin && !isOwnContent) {
    redirect("/persetujuan")
  }

  const canApprove = content.status === "pending_review" || content.status === "revision"

  const platformColors: Record<string, string> = {
    instagram: "bg-pink-100 text-pink-700",
    tiktok: "bg-gray-100 text-gray-800",
    linkedin: "bg-blue-100 text-blue-700",
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Back link */}
      <Link
        href="/persetujuan"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-teal-dark"
      >
        <ArrowLeft className="h-4 w-4" />
        Kembali ke daftar
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-navy-dark">
            {content.topic_title || "Konten Tanpa Judul"}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${platformColors[content.platform] || "bg-gray-100 text-gray-700"}`}>
              {content.platform}
            </span>
            <Badge variant={
              content.status === "pending_review" ? "warning" :
              content.status === "approved" ? "success" :
              content.status === "revision" ? "info" :
              content.status === "rejected" ? "danger" : "secondary"
            }>
              {content.status.replace("_", " ")}
            </Badge>
            {content.content_type && (
              <Badge variant="outline">{content.content_type}</Badge>
            )}
            {content.personal_upload && (
              <Badge variant="outline">Personal Upload</Badge>
            )}
          </div>
        </div>
      </div>

      {/* Content details */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Preview area */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="aspect-square rounded-lg bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center">
              <p className="text-sm text-gray-400">Preview gambar/video</p>
            </div>
          </CardContent>
        </Card>

        {/* Copy details */}
        <div className="space-y-4">
          {/* Hook */}
          {content.copy_hook && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-500">Hook</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium text-navy-dark">{content.copy_hook}</p>
              </CardContent>
            </Card>
          )}

          {/* Body */}
          {content.copy_body && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-500">Body</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm text-gray-700">{content.copy_body}</p>
              </CardContent>
            </Card>
          )}

          {/* CTA */}
          {content.copy_cta && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-500">Call to Action</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-medium text-teal-dark">{content.copy_cta}</p>
              </CardContent>
            </Card>
          )}

          {/* Caption */}
          {content.caption && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-500">Caption</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm text-gray-700">{content.caption}</p>
              </CardContent>
            </Card>
          )}

          {/* Hashtags */}
          {content.hashtags && content.hashtags.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-1 text-sm text-gray-500">
                  <Hash className="h-3.5 w-3.5" />
                  Hashtags
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1.5">
                  {content.hashtags.map((tag: string) => (
                    <span key={tag} className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600">
                      {tag}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Meta info */}
          <Card>
            <CardContent className="p-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Tanggal rencana</span>
                  <span className="text-navy-dark">
                    {content.planned_date ? formatDate(content.planned_date) : "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Funnel</span>
                  <span className="text-navy-dark">{content.funnel_stage || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Dokter</span>
                  <span className="text-navy-dark">{content.doctor_id}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Approval actions - sticky on mobile */}
      {canApprove && (
        <div className="sticky bottom-0 -mx-4 border-t border-gray-200 bg-white p-4 lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:p-0">
          <ApprovalActions contentId={content.id} currentStatus={content.status} />
        </div>
      )}

      {/* Previous notes */}
      {content.approval_notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Catatan Sebelumnya</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700">{content.approval_notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
