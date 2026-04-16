import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getAuthProfile } from "@/lib/supabase/auth"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { ArrowLeft, ArrowUpRight, ArrowDownRight } from "lucide-react"
import Link from "next/link"

export const metadata = {
  title: "Arus Kas — MedPersona",
}

export const revalidate = 60

export default async function CashFlowPage({
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

  // Fetch data
  const { data: report } = await supabase
    .from("financial_reports")
    .select("data, notes")
    .eq("report_type", "cash_flow")
    .eq("period", period)
    .single()

  const { data: invoices } = await supabase.from("invoices").select("amount_idr, type").eq("status", "paid").eq("period", period)
  const { data: expenses } = await supabase.from("expenses").select("amount_idr, category").eq("month", period)

  const totalIncome = invoices?.reduce((s, i) => s + (i.amount_idr || 0), 0) || 0
  const totalExpense = expenses?.reduce((s, e) => s + (e.amount_idr || 0), 0) || 0

  const cf = report?.data || {
    opening_balance: 0,
    // Operating
    cash_from_subscriptions: totalIncome,
    cash_paid_to_vendors: totalExpense,
    net_operating: totalIncome - totalExpense,
    // Investing
    equipment_purchases: 0,
    net_investing: 0,
    // Financing
    owner_injection: 0,
    owner_withdrawal: 0,
    net_financing: 0,
    // Total
    net_change: totalIncome - totalExpense,
    closing_balance: totalIncome - totalExpense,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/keuangan" className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-navy-dark">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-navy-dark">Laporan Arus Kas</h1>
          <p className="text-sm text-gray-500">Cash Flow Statement — {period}</p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Saldo Awal</p>
            <p className="mt-1 text-xl font-bold text-navy-dark">{formatCurrency(cf.opening_balance)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Perubahan Bersih</p>
            <p className={`mt-1 text-xl font-bold ${cf.net_change >= 0 ? "text-emerald-700" : "text-red-700"}`}>
              {cf.net_change >= 0 ? "+" : ""}{formatCurrency(cf.net_change)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-teal-dark bg-teal-light/30">
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Saldo Akhir</p>
            <p className="mt-1 text-xl font-bold text-navy-dark">{formatCurrency(cf.closing_balance)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Operating Activities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowUpRight className="h-5 w-5 text-emerald-600" />
            Aktivitas Operasi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <CashFlowLine label="Penerimaan dari Subscription" value={cf.cash_from_subscriptions} inflow />
            <CashFlowLine label="Pembayaran ke Vendor/API" value={cf.cash_paid_to_vendors} />
            <div className="border-t border-gray-200 pt-2">
              <CashFlowLine label="Arus Kas Bersih dari Operasi" value={cf.net_operating} bold />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Investing Activities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowDownRight className="h-5 w-5 text-blue-600" />
            Aktivitas Investasi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <CashFlowLine label="Pembelian Peralatan" value={cf.equipment_purchases} />
            <div className="border-t border-gray-200 pt-2">
              <CashFlowLine label="Arus Kas Bersih dari Investasi" value={cf.net_investing} bold />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financing Activities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowUpRight className="h-5 w-5 text-purple-600" />
            Aktivitas Pendanaan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <CashFlowLine label="Setoran Modal Pemilik" value={cf.owner_injection} inflow />
            <CashFlowLine label="Penarikan oleh Pemilik" value={cf.owner_withdrawal} />
            <div className="border-t border-gray-200 pt-2">
              <CashFlowLine label="Arus Kas Bersih dari Pendanaan" value={cf.net_financing} bold />
            </div>
          </div>
        </CardContent>
      </Card>

      {report?.notes && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Catatan</CardTitle></CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm text-gray-700">{report.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function CashFlowLine({ label, value, bold, inflow }: { label: string; value: number; bold?: boolean; inflow?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className={bold ? "font-semibold text-navy-dark" : "text-sm text-gray-600"}>{label}</span>
      <span className={`${bold ? "font-semibold" : "text-sm"} ${
        value > 0 ? "text-emerald-700" : value < 0 ? "text-red-700" : "text-gray-500"
      }`}>
        {inflow && value > 0 ? "+" : ""}{formatCurrency(value)}
      </span>
    </div>
  )
}
