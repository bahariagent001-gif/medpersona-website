import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getAuthProfile } from "@/lib/supabase/auth"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { KpiCard } from "@/components/dashboard/kpi-card"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Send, Flame, CheckCircle2 } from "lucide-react"

export const metadata = { title: "Lead Hunter — MedPersona" }
export const revalidate = 120

export default async function LeadsPage() {
  const { user, profile } = await getAuthProfile()
  if (!user) redirect("/masuk")
  if (!["super_admin", "admin"].includes(profile?.role || "")) redirect("/dashboard?akses=ditolak")

  const supabase = await createClient()

  const [{ data: prospects }, { data: statusCounts }] = await Promise.all([
    supabase
      .from("prospects")
      .select("id, handle, full_name, specialty, city, platform, source, icp_score, outreach_status, follower_count, last_contacted_at")
      .order("icp_score", { ascending: false })
      .limit(60),
    supabase
      .from("prospects")
      .select("outreach_status"),
  ])

  const countBy = (status: string) =>
    statusCounts?.filter((s) => s.outreach_status === status).length || 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-dark">Lead Hunter — B2B Dokter</h1>
        <p className="text-sm text-gray-500">Pipeline scraping → enrichment → outreach → qualified</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <KpiCard title="Prospek baru" value={String(countBy("new") + countBy("enriched"))} icon={<Sparkles className="h-5 w-5" />} />
        <KpiCard title="Dalam antrian" value={String(countBy("queued"))} icon={<Send className="h-5 w-5" />} />
        <KpiCard title="Hot replies" value={String(countBy("replied_hot") + countBy("qualified"))} icon={<Flame className="h-5 w-5" />} />
        <KpiCard title="Converted" value={String(countBy("converted"))} icon={<CheckCircle2 className="h-5 w-5" />} />
      </div>

      <Card>
        <CardHeader><CardTitle>Top Prospek (by ICP score)</CardTitle></CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-4 py-3 text-left font-medium text-gray-500">Handle</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Nama</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Spesialisasi</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Kota</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Follower</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Score</th>
                <th className="px-4 py-3 text-center font-medium text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody>
              {prospects?.map((p) => (
                <tr key={p.id} className="border-b border-gray-50">
                  <td className="px-4 py-3 font-mono text-xs">@{p.handle}</td>
                  <td className="px-4 py-3 text-navy-dark">{p.full_name}</td>
                  <td className="px-4 py-3 text-gray-600 capitalize">{p.specialty ?? "-"}</td>
                  <td className="px-4 py-3 text-gray-600">{p.city ?? "-"}</td>
                  <td className="px-4 py-3 text-right">{p.follower_count?.toLocaleString("id-ID") ?? "-"}</td>
                  <td className="px-4 py-3 text-right font-semibold">{p.icp_score}</td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={
                      p.outreach_status === "replied_hot" ? "success" :
                      p.outreach_status === "opted_out" ? "danger" :
                      "secondary"
                    }>
                      {p.outreach_status}
                    </Badge>
                  </td>
                </tr>
              ))}
              {(!prospects || prospects.length === 0) && (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">Belum ada prospek</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
