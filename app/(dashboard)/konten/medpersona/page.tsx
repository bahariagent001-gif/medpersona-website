import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getAuthProfile } from "@/lib/supabase/auth"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export const metadata = { title: "Konten MedPersona — Kalender + Monitoring" }
export const revalidate = 30

type ApprovalRow = {
  id: string
  type: string
  title: string
  summary: string | null
  payload: Record<string, unknown> | null
  status: string
  created_at: string
  decided_at: string | null
  decision: string | null
}

type ScheduledRow = {
  id: string
  platform: string
  content_type: string | null
  caption: string | null
  visual_url: string | null
  audio_title: string | null
  scheduled_for: string | null
  published_at: string | null
  status: string
  platform_permalink: string | null
  metrics: Record<string, number> | null
}

function statusBadge(s: string) {
  const v =
    s === "published" ? "success" :
    s === "scheduled" ? "info" :
    s === "failed" ? "danger" :
    s === "publishing" ? "warning" : "secondary"
  return <Badge variant={v} className="text-[10px] capitalize">{s}</Badge>
}

function platformIcon(p: string) {
  const emoji = p === "instagram" ? "📷" : p === "tiktok" ? "🎵" : p === "linkedin" ? "💼" : "🌐"
  return <span>{emoji}</span>
}

export default async function MedPersonaContentHub() {
  const { user, profile } = await getAuthProfile()
  if (!user) redirect("/masuk")
  if (!["super_admin", "admin", "staff"].includes(profile?.role || "")) redirect("/dashboard?akses=ditolak")

  const supabase = await createClient()

  // Pending organic posts (draft / menunggu keputusan)
  const { data: pendingRaw } = await supabase
    .from("approvals_pending")
    .select("id, type, title, summary, payload, status, created_at, decided_at, decision")
    .eq("type", "organic_post")
    .in("status", ["pending", "notified"])
    .order("created_at", { ascending: false })
    .limit(100)

  // Scheduled + published posts
  let scheduled: ScheduledRow[] = []
  try {
    const { data } = await supabase
      .from("scheduled_posts")
      .select("id, platform, content_type, caption, visual_url, audio_title, scheduled_for, published_at, status, platform_permalink, metrics")
      .order("published_at", { ascending: false, nullsFirst: true })
      .limit(200)
    scheduled = (data || []) as ScheduledRow[]
  } catch { /* schema not applied yet */ }

  const pending = (pendingRaw || []) as ApprovalRow[]
  const scheduledUpcoming = scheduled.filter(s => s.status === "scheduled")
  const published = scheduled.filter(s => s.status === "published")
  const failed = scheduled.filter(s => s.status === "failed")

  const byPlatform = {
    instagram: scheduled.filter(s => s.platform === "instagram"),
    tiktok: scheduled.filter(s => s.platform === "tiktok"),
    linkedin: scheduled.filter(s => s.platform === "linkedin"),
  }

  // 7-day velocity
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400_000)
  const last7 = published.filter(p => p.published_at && new Date(p.published_at) > sevenDaysAgo)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy-dark">Konten MedPersona</h1>
          <p className="text-sm text-gray-500">
            Pipeline konten organik untuk akun @medpersona.id · real-time
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/persetujuan/growth"
            className="rounded-md bg-amber-50 border border-amber-200 px-3 py-1.5 text-sm font-medium text-amber-900 hover:bg-amber-100"
          >
            Review ({pending.length})
          </Link>
          <Link
            href="/konten/medpersona/musik"
            className="rounded-md bg-slate-50 border border-slate-200 px-3 py-1.5 text-sm font-medium hover:bg-slate-100"
          >
            🎵 Musik
          </Link>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <KPI label="Draft menunggu" value={pending.length} tone="amber" />
        <KPI label="Terjadwal" value={scheduledUpcoming.length} tone="blue" />
        <KPI label="Dipublikasi (7h)" value={last7.length} tone="green" />
        <KPI label="Total live" value={published.length} tone="slate" />
        <KPI label="Gagal" value={failed.length} tone="red" />
      </div>

      {/* Pending approvals preview */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold">Draft menunggu review</h2>
          <Link href="/persetujuan/growth" className="text-xs text-teal-700 hover:underline">
            lihat semua →
          </Link>
        </div>
        {pending.length === 0 ? (
          <Card><CardContent className="py-6 text-center text-xs text-gray-400">
            Tidak ada draft menunggu. <Link href="/konten/medpersona" className="underline">Generate lebih banyak?</Link>
          </CardContent></Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {pending.slice(0, 6).map(a => {
              const p = (a.payload as Record<string, unknown>) || {}
              const visual = (p.visual as { public_url?: string })?.public_url
              const plat = String(p.platform || "—")
              return (
                <Card key={a.id} className="overflow-hidden">
                  {visual && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={visual} alt="" className="aspect-square w-full object-cover" loading="lazy" />
                  )}
                  <CardContent className="space-y-1 p-3">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      {platformIcon(plat)}
                      <span className="capitalize">{plat}</span>
                      <span className="ml-auto text-[10px]">{new Date(a.created_at).toLocaleString("id-ID")}</span>
                    </div>
                    <h3 className="line-clamp-2 text-sm font-medium">{a.title}</h3>
                    <Link href="/persetujuan/growth" className="text-[11px] text-teal-700 hover:underline">
                      Review →
                    </Link>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </section>

      {/* Scheduled + published feed */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold">Feed MedPersona</h2>
          {scheduled.length === 0 && (
            <span className="text-[11px] text-amber-700">
              Schema `scheduled_posts` belum diterapkan — jalankan schema-content-calendar.sql di Supabase
            </span>
          )}
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {(["instagram", "tiktok", "linkedin"] as const).map(plat => (
            <Card key={plat}>
              <CardContent className="space-y-2 p-4">
                <div className="flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-sm font-semibold capitalize">
                    {platformIcon(plat)} {plat}
                  </h3>
                  <Badge variant="outline" className="text-[10px]">{byPlatform[plat].length}</Badge>
                </div>
                {byPlatform[plat].length === 0 ? (
                  <p className="text-[11px] text-gray-400">Belum ada post.</p>
                ) : (
                  <ul className="space-y-2">
                    {byPlatform[plat].slice(0, 4).map(s => (
                      <li key={s.id} className="flex gap-2 text-xs">
                        {s.visual_url && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={s.visual_url} alt="" className="h-12 w-12 flex-shrink-0 rounded object-cover" loading="lazy" />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1">
                            {statusBadge(s.status)}
                            {s.audio_title && (
                              <span className="text-[10px] text-purple-700">🎵 {s.audio_title.slice(0, 20)}</span>
                            )}
                          </div>
                          <p className="truncate text-gray-700">{(s.caption || "").slice(0, 60)}</p>
                          {s.platform_permalink && (
                            <a href={s.platform_permalink} target="_blank" rel="noopener" className="text-[10px] text-teal-700 hover:underline">
                              Lihat live →
                            </a>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}

function KPI({ label, value, tone }: { label: string; value: number; tone: "amber" | "blue" | "green" | "slate" | "red" }) {
  const bg = {
    amber: "bg-amber-50 text-amber-900 border-amber-200",
    blue: "bg-blue-50 text-blue-900 border-blue-200",
    green: "bg-green-50 text-green-900 border-green-200",
    slate: "bg-slate-50 text-slate-900 border-slate-200",
    red: "bg-red-50 text-red-900 border-red-200",
  }[tone]
  return (
    <div className={`rounded-md border p-3 ${bg}`}>
      <p className="text-xs uppercase opacity-70">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  )
}
