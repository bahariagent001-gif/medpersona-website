import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { KpiCard } from "@/components/dashboard/kpi-card"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { DollarSign, TrendingUp, TrendingDown, Receipt, CreditCard, PieChart, BarChart3 } from "lucide-react"
import Link from "next/link"

export const metadata = {
  title: "Keuangan — MedPersona",
}

export default async function FinancePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/masuk")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!["super_admin", "admin"].includes(profile?.role || "")) {
    redirect("/dashboard")
  }

  const currentMonth = new Date().toISOString().slice(0, 7)

  const [
    { data: doctors },
    { data: paidInvoices },
    { data: pendingInvoices },
    { data: expenses },
  ] = await Promise.all([
    supabase.from("doctors").select("id, full_name, tier, monthly_cost_idr, subscription_status").eq("subscription_status", "active"),
    supabase.from("invoices").select("amount_idr").eq("status", "paid").gte("paid_at", `${currentMonth}-01`),
    supabase.from("invoices").select("amount_idr").eq("status", "pending"),
    supabase.from("expenses").select("amount_idr, category").eq("month", currentMonth),
  ])

  const mrr = doctors?.reduce((s, d) => s + (d.monthly_cost_idr || 0), 0) || 0
  const revenueThisMonth = paidInvoices?.reduce((s, i) => s + (i.amount_idr || 0), 0) || 0
  const outstandingAR = pendingInvoices?.reduce((s, i) => s + (i.amount_idr || 0), 0) || 0
  const totalExpenses = expenses?.reduce((s, e) => s + (e.amount_idr || 0), 0) || 0
  const netProfit = revenueThisMonth - totalExpenses

  const quickLinks = [
    { label: "Laba Rugi (P&L)", href: "/keuangan/laba-rugi", icon: <BarChart3 className="h-5 w-5" />, desc: "Laporan laba rugi bulanan" },
    { label: "Neraca", href: "/keuangan/neraca", icon: <PieChart className="h-5 w-5" />, desc: "Posisi keuangan perusahaan" },
    { label: "Arus Kas", href: "/keuangan/arus-kas", icon: <TrendingUp className="h-5 w-5" />, desc: "Aliran kas masuk dan keluar" },
    { label: "Pendapatan", href: "/keuangan/pendapatan", icon: <DollarSign className="h-5 w-5" />, desc: "Revenue per dokter & MRR" },
    { label: "Pengeluaran", href: "/keuangan/pengeluaran", icon: <CreditCard className="h-5 w-5" />, desc: "Rincian biaya operasional" },
    { label: "Tagihan", href: "/keuangan/tagihan", icon: <Receipt className="h-5 w-5" />, desc: "Invoice & AR aging" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-dark">Keuangan</h1>
        <p className="text-sm text-gray-500">Ringkasan keuangan bulan {currentMonth}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="MRR" value={formatCurrency(mrr)} icon={<TrendingUp className="h-5 w-5" />} />
        <KpiCard title="Pendapatan Bulan Ini" value={formatCurrency(revenueThisMonth)} icon={<DollarSign className="h-5 w-5" />} />
        <KpiCard title="Pengeluaran Bulan Ini" value={formatCurrency(totalExpenses)} icon={<CreditCard className="h-5 w-5" />} />
        <KpiCard
          title="Laba Bersih"
          value={formatCurrency(netProfit)}
          icon={netProfit >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
        />
      </div>

      {/* Outstanding AR */}
      {outstandingAR > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="font-medium text-amber-800">Tagihan belum dibayar</p>
              <p className="text-sm text-amber-600">{formatCurrency(outstandingAR)} outstanding</p>
            </div>
            <Link href="/keuangan/tagihan" className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700">
              Lihat Tagihan
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Quick links */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {quickLinks.map((link) => (
          <Link key={link.href} href={link.href}>
            <Card className="h-full transition-all hover:border-teal/30 hover:shadow-md">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="rounded-lg bg-teal-light p-3 text-teal-dark">
                  {link.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-navy-dark">{link.label}</h3>
                  <p className="text-sm text-gray-500">{link.desc}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Revenue by doctor */}
      <Card>
        <CardHeader>
          <CardTitle>Pendapatan per Dokter</CardTitle>
        </CardHeader>
        <CardContent>
          {doctors && doctors.length > 0 ? (
            <div className="space-y-3">
              {doctors.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between rounded-lg border border-gray-100 px-4 py-3">
                  <div>
                    <p className="font-medium text-navy-dark">{doc.full_name}</p>
                    <p className="text-xs text-gray-500 capitalize">{doc.tier}</p>
                  </div>
                  <span className="font-semibold text-navy-dark">
                    {formatCurrency(doc.monthly_cost_idr || 0)}/bln
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-gray-400">Belum ada dokter aktif</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
