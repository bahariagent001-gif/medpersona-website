import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getAuthProfile } from "@/lib/supabase/auth"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { KpiCard } from "@/components/dashboard/kpi-card"
import { Badge } from "@/components/ui/badge"
import { Search, TrendingUp, Award, AlertTriangle } from "lucide-react"

export const metadata = { title: "SEO — MedPersona" }
export const revalidate = 300

export default async function SeoOverviewPage() {
  const { user, profile } = await getAuthProfile()
  if (!user) redirect("/masuk")
  if (!["super_admin", "admin"].includes(profile?.role || "")) redirect("/dashboard?akses=ditolak")

  const supabase = await createClient()

  const [{ data: keywords }, { data: pages }] = await Promise.all([
    supabase
      .from("seo_keywords")
      .select("id, keyword, current_rank, previous_rank, search_volume, difficulty, last_checked")
      .eq("active", true)
      .order("current_rank", { ascending: true, nullsFirst: false })
      .limit(50),
    supabase
      .from("seo_pages")
      .select("path, title, meta_description, lh_performance, lh_seo, lh_accessibility, issues, last_audited")
      .order("last_audited", { ascending: false, nullsFirst: false })
      .limit(25),
  ])

  const trackedCount = keywords?.length || 0
  const top10 = keywords?.filter((k) => (k.current_rank ?? 999) <= 10).length || 0
  const improving = keywords?.filter((k) => k.current_rank && k.previous_rank && k.current_rank < k.previous_rank).length || 0
  const avgPerf = pages && pages.length > 0
    ? Math.round(pages.reduce((s, p) => s + (p.lh_performance || 0), 0) / pages.length)
    : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-dark">SEO</h1>
        <p className="text-sm text-gray-500">Rank + technical SEO medpersona.id</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <KpiCard title="Keyword Tracked" value={String(trackedCount)} icon={<Search className="h-5 w-5" />} />
        <KpiCard title="Top 10" value={String(top10)} icon={<Award className="h-5 w-5" />} />
        <KpiCard title="Naik pekan ini" value={String(improving)} icon={<TrendingUp className="h-5 w-5" />} />
        <KpiCard title="Avg Lighthouse" value={`${avgPerf}/100`} icon={<AlertTriangle className="h-5 w-5" />} />
      </div>

      <Card>
        <CardHeader><CardTitle>Keyword Ranks</CardTitle></CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-4 py-3 text-left font-medium text-gray-500">Keyword</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Rank</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Prev</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Vol</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">KD</th>
              </tr>
            </thead>
            <tbody>
              {keywords?.map((k) => {
                const delta = (k.current_rank && k.previous_rank)
                  ? k.previous_rank - k.current_rank : 0
                const deltaLabel = delta > 0 ? `↑ ${delta}` : delta < 0 ? `↓ ${Math.abs(delta)}` : "="
                return (
                  <tr key={k.id} className="border-b border-gray-50">
                    <td className="px-4 py-3 font-medium text-navy-dark">{k.keyword}</td>
                    <td className="px-4 py-3 text-right">
                      {k.current_rank ?? <span className="text-gray-400">-</span>}
                      {delta !== 0 && <span className={`ml-2 text-xs ${delta > 0 ? "text-green-600" : "text-red-600"}`}>{deltaLabel}</span>}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-500">{k.previous_rank ?? "-"}</td>
                    <td className="px-4 py-3 text-right">{k.search_volume?.toLocaleString("id-ID") ?? "-"}</td>
                    <td className="px-4 py-3 text-right">{k.difficulty ?? "-"}</td>
                  </tr>
                )
              })}
              {(!keywords || keywords.length === 0) && (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-400">Belum ada keyword di-track</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Halaman & Audit</CardTitle></CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-4 py-3 text-left font-medium text-gray-500">Path</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Title</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Perf</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">SEO</th>
                <th className="px-4 py-3 text-center font-medium text-gray-500">Issues</th>
              </tr>
            </thead>
            <tbody>
              {pages?.map((p) => (
                <tr key={p.path} className="border-b border-gray-50">
                  <td className="px-4 py-3 font-mono text-xs">{p.path}</td>
                  <td className="px-4 py-3 truncate max-w-sm">{p.title ?? "-"}</td>
                  <td className="px-4 py-3 text-right">{p.lh_performance ?? "-"}</td>
                  <td className="px-4 py-3 text-right">{p.lh_seo ?? "-"}</td>
                  <td className="px-4 py-3 text-center">
                    {Array.isArray(p.issues) && p.issues.length > 0 ? (
                      <Badge variant="danger">{p.issues.length}</Badge>
                    ) : (
                      <Badge variant="success">clean</Badge>
                    )}
                  </td>
                </tr>
              ))}
              {(!pages || pages.length === 0) && (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-400">Belum ada audit halaman</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
