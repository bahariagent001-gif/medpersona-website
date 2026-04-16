import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getAuthProfile } from "@/lib/supabase/auth"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export const metadata = {
  title: "Neraca — MedPersona",
}

export const revalidate = 60

export default async function BalanceSheetPage({
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

  // Fetch stored report + transaction data in parallel
  const [{ data: report }, { data: paidInvoices }, { data: pendingInvoices }, { data: allExpenses }] = await Promise.all([
    supabase.from("financial_reports").select("data, notes").eq("report_type", "balance_sheet").eq("period", period).single(),
    supabase.from("invoices").select("amount_idr").eq("status", "paid").limit(1000),
    supabase.from("invoices").select("amount_idr").eq("status", "pending").limit(1000),
    supabase.from("expenses").select("amount_idr").limit(1000),
  ])

  const totalRevenue = paidInvoices?.reduce((s, i) => s + (i.amount_idr || 0), 0) || 0
  const totalExpenses = allExpenses?.reduce((s, e) => s + (e.amount_idr || 0), 0) || 0
  const accountsReceivable = pendingInvoices?.reduce((s, i) => s + (i.amount_idr || 0), 0) || 0

  const bs = report?.data || {
    // Aset
    kas: totalRevenue - totalExpenses,
    piutang_usaha: accountsReceivable,
    aset_tetap: 0,
    total_aset: (totalRevenue - totalExpenses) + accountsReceivable,
    // Liabilitas
    hutang_usaha: 0,
    hutang_pajak: 0,
    total_liabilitas: 0,
    // Ekuitas
    modal_disetor: 0,
    laba_ditahan: totalRevenue - totalExpenses,
    total_ekuitas: totalRevenue - totalExpenses,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/keuangan" className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-navy-dark">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-navy-dark">Neraca</h1>
          <p className="text-sm text-gray-500">Balance Sheet — Per {period}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Aset */}
        <Card>
          <CardHeader>
            <CardTitle className="text-teal-dark">ASET</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-400">Aset Lancar</h4>
              <LineItem label="Kas & Setara Kas" value={bs.kas} />
              <LineItem label="Piutang Usaha" value={bs.piutang_usaha} />
              <div className="border-t border-gray-200 pt-2">
                <LineItem label="Total Aset Lancar" value={(bs.kas || 0) + (bs.piutang_usaha || 0)} bold />
              </div>

              <h4 className="mb-2 mt-4 text-xs font-bold uppercase tracking-wider text-gray-400">Aset Tetap</h4>
              <LineItem label="Peralatan & Perangkat Lunak" value={bs.aset_tetap || 0} />
              <div className="border-t border-gray-200 pt-2">
                <LineItem label="Total Aset Tetap" value={bs.aset_tetap || 0} bold />
              </div>

              <div className="mt-4 border-t-2 border-navy-dark pt-3">
                <LineItem label="TOTAL ASET" value={bs.total_aset || 0} bold large />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Liabilitas & Ekuitas */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">LIABILITAS</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-400">Liabilitas Jangka Pendek</h4>
                <LineItem label="Hutang Usaha" value={bs.hutang_usaha || 0} />
                <LineItem label="Hutang Pajak" value={bs.hutang_pajak || 0} />
                <div className="border-t border-gray-200 pt-2">
                  <LineItem label="TOTAL LIABILITAS" value={bs.total_liabilitas || 0} bold />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-emerald-700">EKUITAS</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <LineItem label="Modal Disetor" value={bs.modal_disetor || 0} />
                <LineItem label="Laba Ditahan" value={bs.laba_ditahan || 0} />
                <div className="border-t border-gray-200 pt-2">
                  <LineItem label="TOTAL EKUITAS" value={bs.total_ekuitas || 0} bold />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-navy-dark bg-navy-dark/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-navy-dark">TOTAL LIABILITAS + EKUITAS</span>
                <span className="text-lg font-bold text-navy-dark">
                  {formatCurrency((bs.total_liabilitas || 0) + (bs.total_ekuitas || 0))}
                </span>
              </div>
              {/* Balance check */}
              {Math.abs((bs.total_aset || 0) - ((bs.total_liabilitas || 0) + (bs.total_ekuitas || 0))) > 1 && (
                <p className="mt-2 text-xs text-red-600">
                  Neraca tidak seimbang. Selisih: {formatCurrency(Math.abs((bs.total_aset || 0) - ((bs.total_liabilitas || 0) + (bs.total_ekuitas || 0))))}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

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

function LineItem({ label, value, bold, large }: { label: string; value: number; bold?: boolean; large?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className={`${bold ? "font-semibold text-navy-dark" : "text-gray-600"} ${large ? "text-base" : "text-sm"}`}>
        {label}
      </span>
      <span className={`${bold ? "font-semibold text-navy-dark" : "text-gray-700"} ${large ? "text-lg" : "text-sm"}`}>
        {formatCurrency(value)}
      </span>
    </div>
  )
}
