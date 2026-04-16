import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getAuthProfile } from "@/lib/supabase/auth"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { ArrowLeft, Download, TrendingUp, TrendingDown } from "lucide-react"
import Link from "next/link"

export const metadata = {
  title: "Laporan Laba Rugi — MedPersona",
}

export const revalidate = 60

export default async function PnLPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>
}) {
  const params = await searchParams
  const { user, profile } = await getAuthProfile()
  if (!user) redirect("/masuk")
  if (!["super_admin", "admin"].includes(profile?.role || "")) redirect("/dashboard")
  const supabase = await createClient()

  const period = params.period || new Date().toISOString().slice(0, 7)
  const prevMonth = getPrevMonth(period)

  // Fetch current and previous month data
  const [currentData, prevData] = await Promise.all([
    fetchPnLData(supabase, period),
    fetchPnLData(supabase, prevMonth),
  ])

  // Check for stored report
  const { data: storedReport } = await supabase
    .from("financial_reports")
    .select("data, notes")
    .eq("report_type", "pnl")
    .eq("period", period)
    .eq("period_type", "monthly")
    .single()

  const pnl = storedReport?.data || currentData

  const sections = [
    {
      title: "PENDAPATAN",
      items: [
        { label: "Subscription Revenue", current: pnl.subscription_revenue || 0, prev: prevData.subscription_revenue || 0 },
        { label: "Add-on Revenue", current: pnl.addon_revenue || 0, prev: prevData.addon_revenue || 0 },
      ],
      total: { label: "Total Pendapatan", current: (pnl.subscription_revenue || 0) + (pnl.addon_revenue || 0), prev: (prevData.subscription_revenue || 0) + (prevData.addon_revenue || 0) },
    },
    {
      title: "BIAYA LANGSUNG (COGS)",
      items: [
        { label: "AI/LLM API (Claude, Gemini)", current: pnl.cost_ai || 0, prev: prevData.cost_ai || 0 },
        { label: "Image Generation (Flux, DALL-E)", current: pnl.cost_image || 0, prev: prevData.cost_image || 0 },
        { label: "Video/Voice (ElevenLabs, Hedra)", current: pnl.cost_video || 0, prev: prevData.cost_video || 0 },
        { label: "Stock Content (Pexels, Unsplash)", current: pnl.cost_stock || 0, prev: prevData.cost_stock || 0 },
        { label: "Research APIs (Perplexity, NewsAPI)", current: pnl.cost_research || 0, prev: prevData.cost_research || 0 },
      ],
      total: { label: "Total COGS", current: pnl.total_cogs || 0, prev: prevData.total_cogs || 0 },
    },
    {
      title: "BIAYA OPERASIONAL (OPEX)",
      items: [
        { label: "Infrastructure (Vercel, Railway, Supabase)", current: pnl.cost_infra || 0, prev: prevData.cost_infra || 0 },
        { label: "Marketing & Ads", current: pnl.cost_marketing || 0, prev: prevData.cost_marketing || 0 },
        { label: "Tools & Subscriptions", current: pnl.cost_tools || 0, prev: prevData.cost_tools || 0 },
        { label: "Biaya Lainnya", current: pnl.cost_other || 0, prev: prevData.cost_other || 0 },
      ],
      total: { label: "Total OPEX", current: pnl.total_opex || 0, prev: prevData.total_opex || 0 },
    },
  ]

  const totalRevenue = (pnl.subscription_revenue || 0) + (pnl.addon_revenue || 0)
  const totalCosts = (pnl.total_cogs || 0) + (pnl.total_opex || 0)
  const grossProfit = totalRevenue - (pnl.total_cogs || 0)
  const netProfit = totalRevenue - totalCosts
  const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue * 100) : 0
  const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue * 100) : 0

  // Generate month selector
  const months = getLast12Months()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/keuangan" className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-navy-dark">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-navy-dark">Laporan Laba Rugi</h1>
          <p className="text-sm text-gray-500">Profit & Loss Statement</p>
        </div>
        <select
          defaultValue={period}
          onChange={(e) => {
            if (typeof window !== "undefined") {
              window.location.href = `/keuangan/laba-rugi?period=${e.target.value}`
            }
          }}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
        >
          {months.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard label="Total Pendapatan" value={totalRevenue} />
        <SummaryCard label="Laba Kotor" value={grossProfit} suffix={`(${grossMargin.toFixed(1)}%)`} />
        <SummaryCard label="Total Biaya" value={totalCosts} negative />
        <SummaryCard label="Laba Bersih" value={netProfit} suffix={`(${netMargin.toFixed(1)}%)`} highlight />
      </div>

      {/* P&L table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Rincian Laba Rugi — {period}</span>
            <span className="text-sm font-normal text-gray-400">vs {prevMonth}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="py-3 text-left font-medium text-gray-500">Item</th>
                  <th className="py-3 text-right font-medium text-gray-500">{period}</th>
                  <th className="py-3 text-right font-medium text-gray-500">{prevMonth}</th>
                  <th className="py-3 text-right font-medium text-gray-500">Perubahan</th>
                </tr>
              </thead>
              <tbody>
                {sections.map((section) => (
                  <PnLSection key={section.title} {...section} />
                ))}

                {/* Gross Profit */}
                <tr className="border-t-2 border-navy-dark bg-gray-50">
                  <td className="py-3 font-bold text-navy-dark">LABA KOTOR</td>
                  <td className="py-3 text-right font-bold text-navy-dark">{formatCurrency(grossProfit)}</td>
                  <td className="py-3 text-right text-gray-500">
                    {formatCurrency((prevData.subscription_revenue || 0) + (prevData.addon_revenue || 0) - (prevData.total_cogs || 0))}
                  </td>
                  <td className="py-3 text-right font-medium">
                    <span className="text-gray-400">{grossMargin.toFixed(1)}% margin</span>
                  </td>
                </tr>

                {/* Net Profit */}
                <tr className="border-t-2 border-navy-dark bg-teal-light/50">
                  <td className="py-3 font-bold text-navy-dark">LABA BERSIH</td>
                  <td className={`py-3 text-right font-bold ${netProfit >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                    {formatCurrency(netProfit)}
                  </td>
                  <td className="py-3 text-right text-gray-500">-</td>
                  <td className="py-3 text-right font-medium">
                    <span className="text-gray-400">{netMargin.toFixed(1)}% margin</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      {storedReport?.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Catatan</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm text-gray-700">{storedReport.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function SummaryCard({ label, value, suffix, negative, highlight }: {
  label: string; value: number; suffix?: string; negative?: boolean; highlight?: boolean
}) {
  return (
    <Card className={highlight ? "border-teal-dark bg-teal-light/30" : ""}>
      <CardContent className="p-4">
        <p className="text-sm text-gray-500">{label}</p>
        <p className={`mt-1 text-xl font-bold ${
          highlight ? (value >= 0 ? "text-emerald-700" : "text-red-700") :
          negative ? "text-red-700" : "text-navy-dark"
        }`}>
          {formatCurrency(value)}
        </p>
        {suffix && <p className="text-xs text-gray-400">{suffix}</p>}
      </CardContent>
    </Card>
  )
}

function PnLSection({ title, items, total }: {
  title: string
  items: { label: string; current: number; prev: number }[]
  total: { label: string; current: number; prev: number }
}) {
  return (
    <>
      <tr>
        <td colSpan={4} className="pb-1 pt-4 text-xs font-bold uppercase tracking-wider text-gray-400">
          {title}
        </td>
      </tr>
      {items.map((item) => {
        const change = item.prev > 0 ? ((item.current - item.prev) / item.prev * 100) : 0
        return (
          <tr key={item.label} className="border-b border-gray-50">
            <td className="py-2 text-gray-700">{item.label}</td>
            <td className="py-2 text-right text-navy-dark">{formatCurrency(item.current)}</td>
            <td className="py-2 text-right text-gray-400">{formatCurrency(item.prev)}</td>
            <td className="py-2 text-right">
              {item.prev > 0 ? (
                <span className={change > 0 ? "text-emerald-600" : change < 0 ? "text-red-600" : "text-gray-400"}>
                  {change > 0 ? "+" : ""}{change.toFixed(1)}%
                </span>
              ) : <span className="text-gray-300">-</span>}
            </td>
          </tr>
        )
      })}
      <tr className="border-b border-gray-200 bg-gray-50/50">
        <td className="py-2 font-semibold text-navy-dark">{total.label}</td>
        <td className="py-2 text-right font-semibold text-navy-dark">{formatCurrency(total.current)}</td>
        <td className="py-2 text-right font-medium text-gray-500">{formatCurrency(total.prev)}</td>
        <td className="py-2 text-right">
          {total.prev > 0 ? (
            <span className={((total.current - total.prev) / total.prev * 100) > 0 ? "text-emerald-600" : "text-red-600"}>
              {((total.current - total.prev) / total.prev * 100) > 0 ? "+" : ""}
              {((total.current - total.prev) / total.prev * 100).toFixed(1)}%
            </span>
          ) : <span className="text-gray-300">-</span>}
        </td>
      </tr>
    </>
  )
}

async function fetchPnLData(supabase: Awaited<ReturnType<typeof createClient>>, month: string) {
  const { data: invoices } = await supabase.from("invoices").select("amount_idr, type").eq("status", "paid").eq("period", month)
  const { data: expenses } = await supabase.from("expenses").select("amount_idr, category").eq("month", month)

  const subscription_revenue = invoices?.filter(i => i.type === "subscription").reduce((s, i) => s + (i.amount_idr || 0), 0) || 0
  const addon_revenue = invoices?.filter(i => i.type === "addon").reduce((s, i) => s + (i.amount_idr || 0), 0) || 0

  const byCategory = (cat: string) => expenses?.filter(e => e.category === cat).reduce((s, e) => s + (e.amount_idr || 0), 0) || 0

  const cost_ai = byCategory("variable_ai")
  const cost_image = byCategory("variable_image")
  const cost_video = byCategory("variable_video")
  const cost_stock = byCategory("variable_stock")
  const cost_research = byCategory("variable_research")
  const cost_infra = byCategory("fixed_infra")
  const cost_marketing = byCategory("marketing")
  const cost_tools = byCategory("fixed_tools")
  const cost_other = byCategory("other")

  const total_cogs = cost_ai + cost_image + cost_video + cost_stock + cost_research
  const total_opex = cost_infra + cost_marketing + cost_tools + cost_other

  return {
    subscription_revenue, addon_revenue,
    cost_ai, cost_image, cost_video, cost_stock, cost_research,
    cost_infra, cost_marketing, cost_tools, cost_other,
    total_cogs, total_opex,
  }
}

function getPrevMonth(period: string): string {
  const [year, month] = period.split("-").map(Number)
  const d = new Date(year, month - 2, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

function getLast12Months() {
  const months = []
  const now = new Date()
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    const label = d.toLocaleDateString("id-ID", { month: "long", year: "numeric" })
    months.push({ value, label })
  }
  return months
}
