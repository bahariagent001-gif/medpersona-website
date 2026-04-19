import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getAuthProfile } from "@/lib/supabase/auth"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { KpiCard } from "@/components/dashboard/kpi-card"
import { Hash, Users, TrendingUp, Eye } from "lucide-react"

export const metadata = { title: "Organic Growth — MedPersona" }
export const revalidate = 120

export default async function OrganicOverviewPage() {
  const { user, profile } = await getAuthProfile()
  if (!user) redirect("/masuk")
  if (!["super_admin", "admin"].includes(profile?.role || "")) redirect("/dashboard?akses=ditolak")

  const supabase = await createClient()

  const [{ data: posts }, { data: hashtags }, { data: competitors }, { data: kpis }] =
    await Promise.all([
      supabase
        .from("organic_posts")
        .select("id, platform, hook, caption, engagement_rate, reach, posted_at, permalink")
        .order("posted_at", { ascending: false })
        .limit(15),
      supabase
        .from("hashtag_performance")
        .select("hashtag, platform, opportunity_score, relevance_score, post_count, snapshot_date")
        .order("snapshot_date", { ascending: false })
        .order("opportunity_score", { ascending: false })
        .limit(10),
      supabase
        .from("competitor_snapshots")
        .select("competitor_id, follower_count, snapshot_date")
        .order("snapshot_date", { ascending: false })
        .limit(10),
      supabase.from("growth_kpis").select("*").single(),
    ])

  const postCount = posts?.length || 0
  const avgER = posts && posts.length > 0
    ? (posts.reduce((s, p) => s + (p.engagement_rate || 0), 0) / posts.length).toFixed(2)
    : "0"
  const totalReach = posts?.reduce((s, p) => s + (p.reach || 0), 0) || 0
  const compCount = competitors?.length || 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-dark">Organic Growth</h1>
        <p className="text-sm text-gray-500">Pertumbuhan organik akun MedPersona</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <KpiCard title="Posts (recent)" value={String(postCount)} icon={<TrendingUp className="h-5 w-5" />} />
        <KpiCard title="Avg Engagement" value={`${avgER}%`} icon={<Eye className="h-5 w-5" />} />
        <KpiCard title="Total Reach" value={totalReach.toLocaleString("id-ID")} icon={<Users className="h-5 w-5" />} />
        <KpiCard title="Kompetitor Tracked" value={String(compCount)} icon={<Hash className="h-5 w-5" />} />
      </div>

      <Card>
        <CardHeader><CardTitle>Post Terbaru</CardTitle></CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-4 py-3 text-left font-medium text-gray-500">Platform</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Hook</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">ER</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Reach</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Waktu</th>
              </tr>
            </thead>
            <tbody>
              {posts?.map((p) => (
                <tr key={p.id} className="border-b border-gray-50">
                  <td className="px-4 py-3 capitalize text-gray-600">{p.platform}</td>
                  <td className="px-4 py-3 text-navy-dark truncate max-w-md">{p.hook || p.caption?.slice(0, 60)}</td>
                  <td className="px-4 py-3 text-right">{p.engagement_rate?.toFixed(2) || "-"}%</td>
                  <td className="px-4 py-3 text-right">{p.reach?.toLocaleString("id-ID") || "-"}</td>
                  <td className="px-4 py-3 text-gray-500">{p.posted_at ? new Date(p.posted_at).toLocaleDateString("id-ID") : "-"}</td>
                </tr>
              ))}
              {(!posts || posts.length === 0) && (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-400">Belum ada data post</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Top Hashtag Opportunities</CardTitle></CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-4 py-3 text-left font-medium text-gray-500">Hashtag</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Platform</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Opportunity</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Relevance</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Posts</th>
              </tr>
            </thead>
            <tbody>
              {hashtags?.map((h, i) => (
                <tr key={`${h.hashtag}-${h.platform}-${i}`} className="border-b border-gray-50">
                  <td className="px-4 py-3 font-medium text-navy-dark">#{h.hashtag}</td>
                  <td className="px-4 py-3 capitalize text-gray-600">{h.platform}</td>
                  <td className="px-4 py-3 text-right">{h.opportunity_score?.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right">{h.relevance_score?.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right">{h.post_count?.toLocaleString("id-ID") || "-"}</td>
                </tr>
              ))}
              {(!hashtags || hashtags.length === 0) && (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-400">Belum ada hashtag di-track</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
