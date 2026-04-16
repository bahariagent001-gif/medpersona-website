import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getAuthProfile } from "@/lib/supabase/auth"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export const metadata = { title: "Pengeluaran — MedPersona" }

export const revalidate = 60

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>
}) {
  const params = await searchParams
  const { user, profile } = await getAuthProfile()
  if (!user) redirect("/masuk")
  if (!["super_admin", "admin"].includes(profile?.role || "")) redirect("/dashboard")
  const supabase = await createClient()

  const month = params.month || new Date().toISOString().slice(0, 7)
  const { data: expenses } = await supabase.from("expenses").select("id, item, category, description, amount_idr").eq("month", month).order("recorded_at", { ascending: false }).limit(200)

  const byCategory = (expenses || []).reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + (e.amount_idr || 0)
    return acc
  }, {} as Record<string, number>)

  const total = (Object.values(byCategory) as number[]).reduce((s, v) => s + v, 0)

  const categoryLabels: Record<string, string> = {
    variable_ai: "AI/LLM API",
    variable_image: "Image Generation",
    variable_video: "Video/Voice",
    variable_stock: "Stock Content",
    variable_research: "Research APIs",
    fixed_infra: "Infrastructure",
    fixed_tools: "Tools & Subscriptions",
    marketing: "Marketing & Ads",
    other: "Lainnya",
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/keuangan" className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"><ArrowLeft className="h-5 w-5" /></Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-navy-dark">Pengeluaran</h1>
          <p className="text-sm text-gray-500">Rincian biaya operasional — {month}</p>
        </div>
        <p className="text-lg font-bold text-navy-dark">Total: {formatCurrency(total)}</p>
      </div>

      {/* Category breakdown */}
      <div className="grid gap-4 md:grid-cols-3">
        {(Object.entries(byCategory) as [string, number][]).sort((a, b) => b[1] - a[1]).map(([cat, amount]) => (
          <Card key={cat}>
            <CardContent className="p-4">
              <p className="text-sm text-gray-500">{categoryLabels[cat] || cat}</p>
              <p className="mt-1 text-xl font-bold text-navy-dark">{formatCurrency(amount)}</p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
                <div className="h-full rounded-full bg-teal-dark" style={{ width: `${total > 0 ? (amount / total * 100) : 0}%` }} />
              </div>
              <p className="mt-1 text-xs text-gray-400">{total > 0 ? (amount / total * 100).toFixed(1) : 0}% dari total</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detail table */}
      <Card>
        <CardHeader><CardTitle>Detail Pengeluaran</CardTitle></CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-4 py-3 text-left font-medium text-gray-500">Item</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Kategori</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Deskripsi</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Jumlah</th>
              </tr>
            </thead>
            <tbody>
              {(expenses || []).map((e) => (
                <tr key={e.id} className="border-b border-gray-50">
                  <td className="px-4 py-3 font-medium text-navy-dark">{e.item}</td>
                  <td className="px-4 py-3 text-gray-600">{categoryLabels[e.category] || e.category}</td>
                  <td className="px-4 py-3 text-gray-500">{e.description || "-"}</td>
                  <td className="px-4 py-3 text-right font-medium text-navy-dark">{formatCurrency(e.amount_idr)}</td>
                </tr>
              ))}
              {(!expenses || expenses.length === 0) && (
                <tr><td colSpan={4} className="px-4 py-12 text-center text-gray-400">Tidak ada data pengeluaran</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
