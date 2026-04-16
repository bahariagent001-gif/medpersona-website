import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getAuthProfile } from "@/lib/supabase/auth"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"
import { CheckSquare, Clock, Image as ImageIcon, Video, FileText } from "lucide-react"
import Link from "next/link"
import { BatchApproveButton } from "./batch-approve-button"

export const metadata = {
  title: "Persetujuan Konten — MedPersona",
}

export default async function ApprovalPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const params = await searchParams
  const { user, profile } = await getAuthProfile()
  if (!user) redirect("/masuk")

  const supabase = await createClient()

  const isAdmin = ["super_admin", "admin", "staff"].includes(profile?.role || "")
  const statusFilter = params.status || "pending_review"

  // Build query based on role
  let query = supabase
    .from("content_items")
    .select("id, doctor_id, topic_title, platform, content_type, status, planned_date, copy_hook, assets, personal_upload, created_at")
    .order("planned_date", { ascending: true })

  if (!isAdmin && profile?.doctor_id) {
    query = query.eq("doctor_id", profile.doctor_id)
  }

  if (statusFilter !== "all") {
    query = query.eq("status", statusFilter)
  }

  const { data: content } = await query.limit(50)

  const statusTabs = [
    { value: "pending_review", label: "Menunggu Review", count: 0 },
    { value: "approved", label: "Disetujui", count: 0 },
    { value: "revision", label: "Revisi", count: 0 },
    { value: "rejected", label: "Ditolak", count: 0 },
    { value: "all", label: "Semua", count: 0 },
  ]

  const contentTypeIcons: Record<string, React.ReactNode> = {
    carousel: <ImageIcon className="h-4 w-4" />,
    single_image: <ImageIcon className="h-4 w-4" />,
    image: <ImageIcon className="h-4 w-4" />,
    video: <Video className="h-4 w-4" />,
    reel: <Video className="h-4 w-4" />,
    text: <FileText className="h-4 w-4" />,
  }

  const platformColors: Record<string, string> = {
    instagram: "bg-pink-100 text-pink-700",
    tiktok: "bg-gray-100 text-gray-800",
    linkedin: "bg-blue-100 text-blue-700",
  }

  const pendingNonPersonal = content?.filter(
    (c) => c.status === "pending_review" && !c.personal_upload
  ) || []

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-dark">Persetujuan Konten</h1>
          <p className="text-sm text-gray-500">
            {isAdmin ? "Review konten semua dokter" : "Review dan setujui konten Anda"}
          </p>
        </div>
        {pendingNonPersonal.length > 1 && (
          <BatchApproveButton
            contentIds={pendingNonPersonal.map((c) => c.id)}
            count={pendingNonPersonal.length}
          />
        )}
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {statusTabs.map((tab) => (
          <Link
            key={tab.value}
            href={`/persetujuan?status=${tab.value}`}
            className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              statusFilter === tab.value
                ? "bg-teal-dark text-white"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Content cards */}
      {content && content.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {content.map((item) => (
            <Link key={item.id} href={`/persetujuan/${item.id}`}>
              <Card className="h-full transition-all hover:border-teal/30 hover:shadow-md">
                {/* Thumbnail placeholder */}
                <div className="relative h-40 rounded-t-xl bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center">
                  <div className="text-gray-300">
                    {contentTypeIcons[item.content_type] || <FileText className="h-8 w-8" />}
                  </div>
                  {/* Platform badge */}
                  <div className="absolute left-3 top-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${platformColors[item.platform] || "bg-gray-100 text-gray-700"}`}>
                      {item.platform}
                    </span>
                  </div>
                  {/* Status badge */}
                  <div className="absolute right-3 top-3">
                    <Badge
                      variant={
                        item.status === "pending_review" ? "warning" :
                        item.status === "approved" ? "success" :
                        item.status === "revision" ? "info" :
                        item.status === "rejected" ? "danger" : "secondary"
                      }
                    >
                      {item.status === "pending_review" ? "Review" : item.status}
                    </Badge>
                  </div>
                  {item.personal_upload && (
                    <div className="absolute bottom-3 left-3">
                      <Badge variant="outline">Personal</Badge>
                    </div>
                  )}
                </div>

                <CardContent className="p-4">
                  <h3 className="font-medium text-navy-dark line-clamp-2">
                    {item.topic_title || "Tanpa judul"}
                  </h3>
                  {item.copy_hook && (
                    <p className="mt-1.5 text-sm text-gray-500 line-clamp-2">{item.copy_hook}</p>
                  )}
                  <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
                    <Clock className="h-3 w-3" />
                    <span>{item.planned_date ? formatDate(item.planned_date) : "Belum dijadwalkan"}</span>
                    {isAdmin && (
                      <>
                        <span>&middot;</span>
                        <span>{item.doctor_id}</span>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center">
          <CheckSquare className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-medium text-navy-dark">
            {statusFilter === "pending_review"
              ? "Semua konten sudah direview!"
              : "Tidak ada konten dengan status ini"}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Konten baru akan muncul di sini saat siap untuk direview.
          </p>
        </div>
      )}
    </div>
  )
}
