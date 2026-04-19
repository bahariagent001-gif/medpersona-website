import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getAuthProfile } from "@/lib/supabase/auth"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatShortDate } from "@/lib/utils"
import { Image, Video, FileText } from "lucide-react"
import { EmptyState } from "@/components/ui/empty-state"

export const metadata = { title: "Aset Konten — MedPersona" }

export const revalidate = 60

export default async function AssetLibraryPage() {
  const { user, profile } = await getAuthProfile()
  if (!user) redirect("/masuk")
  if (!["super_admin", "admin", "staff"].includes(profile?.role || "")) redirect("/dashboard?akses=ditolak")

  const supabase = await createClient()

  // Fetch content items and doctors in parallel
  const [{ data: items }, { data: doctors }] = await Promise.all([
    supabase.from("content_items")
      .select("id, topic_title, doctor_id, platform, content_type, assets, status, planned_date")
      .not("assets", "is", null)
      .order("created_at", { ascending: false })
      .limit(100),
    supabase.from("doctors").select("id, full_name"),
  ])
  const doctorMap: Record<string, string> = {}
  doctors?.forEach((d) => { doctorMap[d.id] = d.full_name })

  const typeIcon = (type: string) => {
    if (type === "video" || type === "reel") return <Video className="h-5 w-5" />
    if (type === "carousel") return <FileText className="h-5 w-5" />
    return <Image className="h-5 w-5" />
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-dark">Aset Konten</h1>
        <p className="text-sm text-gray-500">Library aset gambar, video, dan konten yang sudah dibuat</p>
      </div>

      {/* Asset grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items?.map((item) => {
          const assets = item.assets as Record<string, unknown> | null
          const assetCount = assets ? Object.keys(assets).length : 0

          return (
            <Card key={item.id} className="overflow-hidden">
              {/* Thumbnail placeholder */}
              <div className="flex h-40 items-center justify-center bg-gray-100">
                <div className="text-gray-300">
                  {typeIcon(item.content_type)}
                </div>
              </div>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-navy-dark">{item.topic_title || "Untitled"}</p>
                    <p className="mt-1 text-xs text-gray-500">{doctorMap[item.doctor_id] || item.doctor_id}</p>
                  </div>
                  <Badge variant="secondary" className="ml-2 capitalize">{item.platform}</Badge>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
                  <span className="capitalize">{item.content_type} &middot; {assetCount} aset</span>
                  <span>{item.planned_date ? formatShortDate(item.planned_date) : "-"}</span>
                </div>
              </CardContent>
            </Card>
          )
        })}
        {(!items || items.length === 0) && (
          <div className="col-span-full">
            <EmptyState
              icon={<Image className="h-10 w-10" />}
              title="Belum Ada Aset"
              description="Aset muncul dari konten yang sudah disetujui dan dipublikasikan."
              action={{ label: "Lihat Konten", href: "/konten" }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
