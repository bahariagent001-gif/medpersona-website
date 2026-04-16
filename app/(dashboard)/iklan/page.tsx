import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { KpiCard } from "@/components/dashboard/kpi-card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"
import { Megaphone, DollarSign, MousePointerClick, Users } from "lucide-react"

export const metadata = { title: "Iklan — MedPersona" }

export default async function AdsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/masuk")
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  if (!["super_admin", "admin"].includes(profile?.role || "")) redirect("/dashboard")

  const { data: campaigns } = await supabase
    .from("ad_campaigns")
    .select("*")
    .order("created_at", { ascending: false })

  const totalSpend = campaigns?.reduce((s, c) => s + (c.spend_idr || 0), 0) || 0
  const totalLeads = campaigns?.reduce((s, c) => s + (c.leads || 0), 0) || 0
  const totalClicks = campaigns?.reduce((s, c) => s + (c.clicks || 0), 0) || 0
  const blendedCPL = totalLeads > 0 ? totalSpend / totalLeads : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-dark">Kampanye Iklan</h1>
        <p className="text-sm text-gray-500">Performa akuisisi paid ads</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <KpiCard title="Total Spend" value={formatCurrency(totalSpend)} icon={<DollarSign className="h-5 w-5" />} />
        <KpiCard title="Total Leads" value={String(totalLeads)} icon={<Users className="h-5 w-5" />} />
        <KpiCard title="Total Clicks" value={String(totalClicks)} icon={<MousePointerClick className="h-5 w-5" />} />
        <KpiCard title="Blended CPL" value={formatCurrency(blendedCPL)} icon={<Megaphone className="h-5 w-5" />} />
      </div>

      <Card>
        <CardHeader><CardTitle>Kampanye</CardTitle></CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-4 py-3 text-left font-medium text-gray-500">Kampanye</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Platform</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Budget/hari</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Spend</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Clicks</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Leads</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">CPL</th>
                <th className="px-4 py-3 text-center font-medium text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody>
              {campaigns?.map((c) => (
                <tr key={c.id} className="border-b border-gray-50">
                  <td className="px-4 py-3 font-medium text-navy-dark">{c.campaign_name}</td>
                  <td className="px-4 py-3 capitalize text-gray-600">{c.platform}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(c.budget_daily_idr || 0)}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(c.spend_idr || 0)}</td>
                  <td className="px-4 py-3 text-right">{c.clicks || 0}</td>
                  <td className="px-4 py-3 text-right">{c.leads || 0}</td>
                  <td className="px-4 py-3 text-right">{c.leads ? formatCurrency((c.spend_idr || 0) / c.leads) : "-"}</td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={c.status === "active" ? "success" : "secondary"}>{c.status}</Badge>
                  </td>
                </tr>
              ))}
              {(!campaigns || campaigns.length === 0) && (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-400">Tidak ada kampanye</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
