import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { getAuthProfile } from "@/lib/supabase/auth"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { KpiCard } from "@/components/dashboard/kpi-card"
import { Badge } from "@/components/ui/badge"
import { formatShortDate } from "@/lib/utils"
import Link from "next/link"
import { ArrowLeft, BarChart3, Eye, Heart, Share2 } from "lucide-react"

export const revalidate = 60

export default async function DoctorAnalyticsPage({
  params,
}: {
  params: Promise<{ doctorId: string }>
}) {
  const { doctorId } = await params
  const { user, profile } = await getAuthProfile()
  if (!user) redirect("/masuk")
  if (!["super_admin", "admin", "staff"].includes(profile?.role || "")) redirect("/dashboard?akses=ditolak")
  const supabase = await createClient()

  const [{ data: doctor }, { data: items }, { data: usage }] = await Promise.all([
    supabase.from("doctors").select("id, full_name, title, platforms").eq("id", doctorId).single(),
    supabase.from("content_items").select("id, topic_title, platform, planned_date, performance, status").eq("doctor_id", doctorId).eq("status", "posted").order("planned_date", { ascending: false }).limit(50),
    supabase.from("monthly_usage").select("month, posts_published, videos_published, revisions_used").eq("doctor_id", doctorId).order("month", { ascending: false }).limit(6),
  ])

  if (!doctor) notFound()

  // Aggregate performance from posted content
  let totalViews = 0, totalLikes = 0, totalShares = 0, totalComments = 0
  items?.forEach((item) => {
    const perf = item.performance as Record<string, number> | null
    if (perf) {
      totalViews += perf.views || perf.impressions || 0
      totalLikes += perf.likes || 0
      totalShares += perf.shares || 0
      totalComments += perf.comments || 0
    }
  })

  const totalEngagement = totalLikes + totalShares + totalComments
  const engagementRate = totalViews > 0 ? ((totalEngagement / totalViews) * 100) : 0

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/dokter/${doctorId}`} className="mb-2 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-teal-dark">
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Profil
        </Link>
        <h1 className="text-2xl font-bold text-navy-dark">Analytics — {doctor.full_name}</h1>
        <p className="text-sm text-gray-500">{doctor.title}</p>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <KpiCard title="Total Views" value={totalViews.toLocaleString("id-ID")} icon={<Eye className="h-5 w-5" />} />
        <KpiCard title="Total Likes" value={totalLikes.toLocaleString("id-ID")} icon={<Heart className="h-5 w-5" />} />
        <KpiCard title="Total Shares" value={totalShares.toLocaleString("id-ID")} icon={<Share2 className="h-5 w-5" />} />
        <KpiCard title="Engagement Rate" value={`${engagementRate.toFixed(2)}%`} icon={<BarChart3 className="h-5 w-5" />} />
      </div>

      {/* Monthly usage */}
      <Card>
        <CardHeader><CardTitle>Penggunaan Bulanan</CardTitle></CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-4 py-3 text-left font-medium text-gray-500">Bulan</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Post</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Video</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Revisi</th>
              </tr>
            </thead>
            <tbody>
              {usage?.map((u) => (
                <tr key={u.month} className="border-b border-gray-50">
                  <td className="px-4 py-3 font-medium text-navy-dark">{u.month}</td>
                  <td className="px-4 py-3 text-right">{u.posts_published || 0}</td>
                  <td className="px-4 py-3 text-right">{u.videos_published || 0}</td>
                  <td className="px-4 py-3 text-right">{u.revisions_used || 0}</td>
                </tr>
              ))}
              {(!usage || usage.length === 0) && (
                <tr><td colSpan={4} className="px-4 py-12 text-center text-gray-400">Belum ada data analytics. Data muncul setelah konten dipublikasikan.</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Top performing content */}
      <Card>
        <CardHeader><CardTitle>Konten Terbaik</CardTitle></CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-4 py-3 text-left font-medium text-gray-500">Judul</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Platform</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Tanggal</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Views</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Likes</th>
              </tr>
            </thead>
            <tbody>
              {items
                ?.sort((a, b) => {
                  const aViews = (a.performance as Record<string, number> | null)?.views || 0
                  const bViews = (b.performance as Record<string, number> | null)?.views || 0
                  return bViews - aViews
                })
                .slice(0, 10)
                .map((item) => {
                  const perf = item.performance as Record<string, number> | null
                  return (
                    <tr key={item.id} className="border-b border-gray-50">
                      <td className="px-4 py-3 font-medium text-navy-dark">{item.topic_title || "Untitled"}</td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary" className="capitalize">{item.platform}</Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{item.planned_date ? formatShortDate(item.planned_date) : "-"}</td>
                      <td className="px-4 py-3 text-right">{(perf?.views || 0).toLocaleString("id-ID")}</td>
                      <td className="px-4 py-3 text-right">{(perf?.likes || 0).toLocaleString("id-ID")}</td>
                    </tr>
                  )
                })}
              {(!items || items.length === 0) && (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-400">Belum ada konten yang diposting. Performa akan muncul setelah konten dipublikasikan.</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
