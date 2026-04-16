import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getAuthProfile } from "@/lib/supabase/auth"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"
import { ArrowLeft, TrendingUp } from "lucide-react"
import Link from "next/link"

export const metadata = { title: "Pendapatan — MedPersona" }

export const revalidate = 60

export default async function RevenuePage() {
  const { user, profile } = await getAuthProfile()
  if (!user) redirect("/masuk")
  if (!["super_admin", "admin"].includes(profile?.role || "")) redirect("/dashboard")
  const supabase = await createClient()

  const { data: doctors } = await supabase
    .from("doctors")
    .select("id, full_name, tier, monthly_cost_idr, subscription_status, subscription_started")
    .order("monthly_cost_idr", { ascending: false })
    .limit(100)

  const activeDoctors = doctors?.filter(d => d.subscription_status === "active") || []
  const mrr = activeDoctors.reduce((s, d) => s + (d.monthly_cost_idr || 0), 0)
  const arr = mrr * 12

  const tierBreakdown = activeDoctors.reduce((acc, d) => {
    acc[d.tier] = (acc[d.tier] || 0) + (d.monthly_cost_idr || 0)
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/keuangan" className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"><ArrowLeft className="h-5 w-5" /></Link>
        <div>
          <h1 className="text-2xl font-bold text-navy-dark">Pendapatan</h1>
          <p className="text-sm text-gray-500">Revenue per Dokter & MRR Tracking</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="p-4"><p className="text-sm text-gray-500">MRR</p><p className="mt-1 text-2xl font-bold text-navy-dark">{formatCurrency(mrr)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-gray-500">ARR (Proyeksi Tahunan)</p><p className="mt-1 text-2xl font-bold text-navy-dark">{formatCurrency(arr)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-gray-500">Dokter Aktif</p><p className="mt-1 text-2xl font-bold text-navy-dark">{activeDoctors.length}</p></CardContent></Card>
      </div>

      {/* Tier breakdown */}
      <Card>
        <CardHeader><CardTitle>Revenue per Tier</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(tierBreakdown).map(([tier, amount]) => (
              <div key={tier} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant="info" className="capitalize">{tier}</Badge>
                  <span className="text-sm text-gray-600">
                    {activeDoctors.filter(d => d.tier === tier).length} dokter
                  </span>
                </div>
                <span className="font-semibold text-navy-dark">{formatCurrency(amount)}/bln</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Per doctor */}
      <Card>
        <CardHeader><CardTitle>Detail per Dokter</CardTitle></CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-4 py-3 text-left font-medium text-gray-500">Dokter</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Tier</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">MRR</th>
              </tr>
            </thead>
            <tbody>
              {(doctors || []).map((doc) => (
                <tr key={doc.id} className="border-b border-gray-50">
                  <td className="px-4 py-3 font-medium text-navy-dark">{doc.full_name}</td>
                  <td className="px-4 py-3"><Badge variant="secondary" className="capitalize">{doc.tier}</Badge></td>
                  <td className="px-4 py-3"><Badge variant={doc.subscription_status === "active" ? "success" : "warning"}>{doc.subscription_status}</Badge></td>
                  <td className="px-4 py-3 text-right font-medium">{formatCurrency(doc.monthly_cost_idr || 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
