import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getAuthProfile } from "@/lib/supabase/auth"
import { KpiCard } from "@/components/dashboard/kpi-card"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"
import Link from "next/link"
import { TrendingUp, Heart, MessageCircle, Share2, Bookmark, ExternalLink, Info, Users } from "lucide-react"

export const metadata = { title: "Performa — MedPersona" }
export const revalidate = 300

type Performance = {
  likes?: number
  comments?: number
  shares?: number
  saves?: number
  reach?: number
  views?: number
  impressions?: number
  engagement_rate?: number
  last_synced_at?: string
}

type PostedItem = {
  id: string
  platform: string
  topic_title: string | null
  posted_at: string | null
  platform_post_id: string | null
  performance: Performance | null
  doctor_id?: string
}

type DoctorLite = {
  id: string
  full_name: string | null
  specialty: string | null
  tier: string | null
}

function pickNum(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? v : 0
}

function engagementOf(p: Performance | null): number {
  if (!p) return 0
  return pickNum(p.likes) + pickNum(p.comments) + pickNum(p.shares) + pickNum(p.saves)
}

function platformLabel(p: string): string {
  const map: Record<string, string> = {
    instagram: "Instagram",
    tiktok: "TikTok",
    linkedin: "LinkedIn",
    facebook: "Facebook",
    youtube: "YouTube",
  }
  return map[p.toLowerCase()] ?? p
}

export default async function PerformaPage() {
  const { user, profile } = await getAuthProfile()
  if (!user) redirect("/masuk")

  const isAdmin = ["super_admin", "admin", "staff"].includes(profile?.role || "")

  if (isAdmin) return <AdminPerformance />
  if (!profile?.doctor_id) redirect("/dashboard")
  return <DoctorPerformance doctorId={profile.doctor_id} />
}

async function DoctorPerformance({ doctorId }: { doctorId: string }) {
  const supabase = await createClient()

  const [{ data: doctor }, { data: posted }] = await Promise.all([
    supabase.from("doctors").select("full_name, social_accounts").eq("id", doctorId).single(),
    supabase
      .from("content_items")
      .select("id, platform, topic_title, posted_at, platform_post_id, performance")
      .eq("doctor_id", doctorId)
      .eq("status", "posted")
      .order("posted_at", { ascending: false })
      .limit(50)
      .returns<PostedItem[]>(),
  ])

  const items = posted ?? []
  const stats = aggregate(items)
  const lastSynced = lastSyncOf(items)
  const hasAnyMetrics = items.some((i) => engagementOf(i.performance) > 0 || pickNum(i.performance?.reach) > 0)

  const socialAccounts = (doctor?.social_accounts ?? {}) as Record<string, string | { handle?: string; url?: string }>
  const attachedAccounts = Object.entries(socialAccounts)
    .map(([platform, val]) => {
      const handle = typeof val === "string" ? val : val?.handle
      return { platform, handle }
    })
    .filter((a) => a.handle)

  return (
    <div className="space-y-6">
      <Header title="Performa Konten" subtitle="Engagement dari konten yang sudah tayang di akun sosial media Anda" lastSynced={lastSynced} />

      {attachedAccounts.length > 0 && (
        <Card>
          <CardContent className="py-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">Akun tersambung</p>
            <div className="flex flex-wrap gap-2">
              {attachedAccounts.map((a) => (
                <Badge key={a.platform} variant="secondary">
                  {platformLabel(a.platform)}: @{a.handle}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <KpiRow stats={stats} />

      {stats.byPlatform.size > 0 && <PlatformBreakdown byPlatform={stats.byPlatform} />}

      <Card>
        <CardHeader>
          <CardTitle>Posting Terbaru</CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <EmptyState
              title="Belum ada konten tayang"
              description="Begitu konten disetujui dan dipublish, performanya akan muncul di sini."
              action={{ label: "Lihat konten saya", href: "/konten" }}
            />
          ) : !hasAnyMetrics ? (
            <div className="space-y-3">
              <SyncNotice />
              <PostedTable items={items} />
            </div>
          ) : (
            <PostedTable items={items} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

async function AdminPerformance() {
  const supabase = await createClient()

  const [{ data: posted }, { data: doctors }] = await Promise.all([
    supabase
      .from("content_items")
      .select("id, platform, topic_title, posted_at, platform_post_id, performance, doctor_id")
      .eq("status", "posted")
      .order("posted_at", { ascending: false })
      .limit(200)
      .returns<PostedItem[]>(),
    supabase
      .from("doctors")
      .select("id, full_name, specialty, tier")
      .returns<DoctorLite[]>(),
  ])

  const items = posted ?? []
  const doctorMap = new Map<string, DoctorLite>((doctors ?? []).map((d) => [d.id, d]))
  const stats = aggregate(items)
  const lastSynced = lastSyncOf(items)

  const byDoctor = new Map<string, { posts: number; engagement: number; reach: number }>()
  for (const i of items) {
    if (!i.doctor_id) continue
    const cur = byDoctor.get(i.doctor_id) ?? { posts: 0, engagement: 0, reach: 0 }
    cur.posts += 1
    cur.engagement += engagementOf(i.performance)
    cur.reach += pickNum(i.performance?.reach)
    byDoctor.set(i.doctor_id, cur)
  }

  const doctorRows = [...byDoctor.entries()]
    .map(([id, s]) => ({ id, doctor: doctorMap.get(id), ...s }))
    .sort((a, b) => b.engagement - a.engagement)

  return (
    <div className="space-y-6">
      <Header
        title="Performa Konten (Agregat)"
        subtitle="Ringkasan engagement seluruh dokter aktif"
        lastSynced={lastSynced}
      />

      <KpiRow stats={stats} />

      {stats.byPlatform.size > 0 && <PlatformBreakdown byPlatform={stats.byPlatform} />}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Per Dokter
          </CardTitle>
        </CardHeader>
        <CardContent>
          {doctorRows.length === 0 ? (
            <EmptyState title="Belum ada konten tayang" description="Tidak ada data posting untuk dirata-ratakan." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500">
                    <th className="py-2 pr-4">Dokter</th>
                    <th className="py-2 pr-4">Spesialis</th>
                    <th className="py-2 pr-4">Tier</th>
                    <th className="py-2 pr-4 text-right">Posting</th>
                    <th className="py-2 pr-4 text-right">Engagement</th>
                    <th className="py-2 pr-4 text-right">Reach</th>
                    <th className="py-2 pr-0 text-right">Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {doctorRows.map((r) => (
                    <tr key={r.id} className="border-b border-gray-100 last:border-0">
                      <td className="py-2 pr-4 font-medium text-navy-dark">{r.doctor?.full_name || <span className="text-gray-400">(tidak ditemukan)</span>}</td>
                      <td className="py-2 pr-4 text-gray-600">{r.doctor?.specialty || "—"}</td>
                      <td className="py-2 pr-4"><Badge variant="secondary">{r.doctor?.tier || "—"}</Badge></td>
                      <td className="py-2 pr-4 text-right tabular-nums">{r.posts}</td>
                      <td className="py-2 pr-4 text-right tabular-nums">{r.engagement.toLocaleString("id-ID")}</td>
                      <td className="py-2 pr-4 text-right tabular-nums">{r.reach.toLocaleString("id-ID")}</td>
                      <td className="py-2 pr-0 text-right">
                        <Link href={`/dokter/${r.id}`} className="text-teal-dark hover:text-teal">Lihat</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Posting Terbaru (Semua Dokter)</CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <EmptyState title="Belum ada konten tayang" description="Data akan muncul setelah konten pertama dipublish." />
          ) : (
            <PostedTable items={items.slice(0, 50)} doctorMap={doctorMap} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function aggregate(items: PostedItem[]) {
  const totalPosts = items.length
  const totalEngagement = items.reduce((s, i) => s + engagementOf(i.performance), 0)
  const totalReach = items.reduce((s, i) => s + pickNum(i.performance?.reach), 0)
  const avgEngagement = totalPosts > 0 ? Math.round(totalEngagement / totalPosts) : 0

  const byPlatform = new Map<string, { posts: number; engagement: number; reach: number }>()
  for (const i of items) {
    const key = i.platform.toLowerCase()
    const cur = byPlatform.get(key) ?? { posts: 0, engagement: 0, reach: 0 }
    cur.posts += 1
    cur.engagement += engagementOf(i.performance)
    cur.reach += pickNum(i.performance?.reach)
    byPlatform.set(key, cur)
  }
  return { totalPosts, totalEngagement, totalReach, avgEngagement, byPlatform }
}

function lastSyncOf(items: PostedItem[]): string | undefined {
  return items
    .map((i) => i.performance?.last_synced_at)
    .filter((v): v is string => typeof v === "string")
    .sort()
    .pop()
}

function Header({ title, subtitle, lastSynced }: { title: string; subtitle: string; lastSynced?: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-navy-dark">{title}</h1>
        <p className="text-sm text-gray-500">{subtitle}</p>
      </div>
      {lastSynced && <Badge variant="secondary">Sinkron terakhir: {formatDate(lastSynced)}</Badge>}
    </div>
  )
}

function KpiRow({ stats }: { stats: ReturnType<typeof aggregate> }) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <KpiCard title="Total Posting" value={String(stats.totalPosts)} icon={<TrendingUp className="h-5 w-5" />} />
      <KpiCard title="Total Engagement" value={stats.totalEngagement.toLocaleString("id-ID")} icon={<Heart className="h-5 w-5" />} />
      <KpiCard title="Rata-rata / Post" value={stats.avgEngagement.toLocaleString("id-ID")} icon={<MessageCircle className="h-5 w-5" />} />
      <KpiCard title="Total Reach" value={stats.totalReach.toLocaleString("id-ID")} icon={<Share2 className="h-5 w-5" />} />
    </div>
  )
}

function PlatformBreakdown({ byPlatform }: { byPlatform: Map<string, { posts: number; engagement: number; reach: number }> }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Per Platform</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {[...byPlatform.entries()].map(([platform, stats]) => (
            <div key={platform} className="rounded-lg border border-gray-200 p-4">
              <p className="text-sm font-semibold text-navy-dark">{platformLabel(platform)}</p>
              <div className="mt-2 space-y-0.5 text-xs text-gray-600">
                <div className="flex justify-between"><span>Posting</span><span className="font-medium">{stats.posts}</span></div>
                <div className="flex justify-between"><span>Engagement</span><span className="font-medium">{stats.engagement.toLocaleString("id-ID")}</span></div>
                <div className="flex justify-between"><span>Reach</span><span className="font-medium">{stats.reach.toLocaleString("id-ID")}</span></div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function SyncNotice() {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
      <Info className="mt-0.5 h-4 w-4 shrink-0" />
      <p>Konten sudah tayang tapi metrics belum disinkron. Tim akan menyinkron dari Instagram/TikTok/LinkedIn harian.</p>
    </div>
  )
}

function PostedTable({ items, doctorMap }: { items: PostedItem[]; doctorMap?: Map<string, DoctorLite> }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500">
            <th className="py-2 pr-4">Judul</th>
            {doctorMap && <th className="py-2 pr-4">Dokter</th>}
            <th className="py-2 pr-4">Platform</th>
            <th className="py-2 pr-4">Tayang</th>
            <th className="py-2 pr-4 text-right"><Heart className="inline h-3.5 w-3.5" /></th>
            <th className="py-2 pr-4 text-right"><MessageCircle className="inline h-3.5 w-3.5" /></th>
            <th className="py-2 pr-4 text-right"><Share2 className="inline h-3.5 w-3.5" /></th>
            <th className="py-2 pr-4 text-right"><Bookmark className="inline h-3.5 w-3.5" /></th>
            <th className="py-2 pr-4 text-right">Reach</th>
            <th className="py-2 pr-0 text-right">Link</th>
          </tr>
        </thead>
        <tbody>
          {items.map((i) => {
            const p = i.performance
            return (
              <tr key={i.id} className="border-b border-gray-100 last:border-0">
                <td className="py-2 pr-4">
                  <Link href={`/konten/${i.id}`} className="text-navy-dark hover:text-teal-dark">
                    {i.topic_title || <span className="text-gray-400">(tanpa judul)</span>}
                  </Link>
                </td>
                {doctorMap && (
                  <td className="py-2 pr-4 text-gray-600">
                    {i.doctor_id ? doctorMap.get(i.doctor_id)?.full_name || "—" : "—"}
                  </td>
                )}
                <td className="py-2 pr-4 text-gray-600">{platformLabel(i.platform)}</td>
                <td className="py-2 pr-4 text-gray-500">{i.posted_at ? formatDate(i.posted_at) : "—"}</td>
                <td className="py-2 pr-4 text-right tabular-nums">{pickNum(p?.likes).toLocaleString("id-ID")}</td>
                <td className="py-2 pr-4 text-right tabular-nums">{pickNum(p?.comments).toLocaleString("id-ID")}</td>
                <td className="py-2 pr-4 text-right tabular-nums">{pickNum(p?.shares).toLocaleString("id-ID")}</td>
                <td className="py-2 pr-4 text-right tabular-nums">{pickNum(p?.saves).toLocaleString("id-ID")}</td>
                <td className="py-2 pr-4 text-right tabular-nums">{pickNum(p?.reach).toLocaleString("id-ID")}</td>
                <td className="py-2 pr-0 text-right">
                  {i.platform_post_id ? (
                    <a
                      href={postUrl(i.platform, i.platform_post_id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-teal-dark hover:text-teal"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  ) : (
                    <span className="text-gray-300">—</span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function postUrl(platform: string, postId: string): string {
  if (/^https?:\/\//i.test(postId)) return postId
  const p = platform.toLowerCase()
  if (p === "instagram") return `https://www.instagram.com/p/${postId}/`
  if (p === "tiktok") return `https://www.tiktok.com/video/${postId}`
  if (p === "linkedin") return `https://www.linkedin.com/feed/update/${postId}/`
  return "#"
}
