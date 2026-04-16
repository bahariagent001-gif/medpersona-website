import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getAuthProfile } from "@/lib/supabase/auth"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate } from "@/lib/utils"
import { ArrowLeft, Receipt } from "lucide-react"
import Link from "next/link"

export const metadata = {
  title: "Tagihan — MedPersona",
}

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const params = await searchParams
  const { user, profile } = await getAuthProfile()
  if (!user) redirect("/masuk")
  if (!["super_admin", "admin"].includes(profile?.role || "")) redirect("/dashboard")
  const supabase = await createClient()

  let query = supabase
    .from("invoices")
    .select("*, doctors(full_name)")
    .order("created_at", { ascending: false })

  if (params.status && params.status !== "all") {
    query = query.eq("status", params.status)
  }

  const { data: invoices } = await query.limit(100)

  const statusFilter = params.status || "all"
  const statusOptions = [
    { value: "all", label: "Semua" },
    { value: "pending", label: "Pending" },
    { value: "paid", label: "Lunas" },
    { value: "expired", label: "Kadaluarsa" },
    { value: "failed", label: "Gagal" },
  ]

  const statusBadge: Record<string, "success" | "warning" | "danger" | "secondary"> = {
    paid: "success",
    pending: "warning",
    expired: "danger",
    failed: "danger",
  }

  // AR Aging
  const pendingInvoices = invoices?.filter(i => i.status === "pending") || []
  const now = new Date()
  const aging = {
    current: 0,
    d30: 0,
    d60: 0,
    d90: 0,
    over90: 0,
  }
  pendingInvoices.forEach(inv => {
    const created = new Date(inv.created_at)
    const days = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
    if (days <= 7) aging.current += inv.amount_idr
    else if (days <= 30) aging.d30 += inv.amount_idr
    else if (days <= 60) aging.d60 += inv.amount_idr
    else if (days <= 90) aging.d90 += inv.amount_idr
    else aging.over90 += inv.amount_idr
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/keuangan" className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-navy-dark">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-navy-dark">Tagihan</h1>
          <p className="text-sm text-gray-500">Invoice & Accounts Receivable</p>
        </div>
      </div>

      {/* AR Aging Summary */}
      {pendingInvoices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">AR Aging Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-4 text-center">
              <div>
                <p className="text-xs text-gray-500">Current (0-7 hari)</p>
                <p className="mt-1 font-semibold text-emerald-700">{formatCurrency(aging.current)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">8-30 hari</p>
                <p className="mt-1 font-semibold text-amber-600">{formatCurrency(aging.d30)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">31-60 hari</p>
                <p className="mt-1 font-semibold text-orange-600">{formatCurrency(aging.d60)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">61-90 hari</p>
                <p className="mt-1 font-semibold text-red-600">{formatCurrency(aging.d90)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">&gt;90 hari</p>
                <p className="mt-1 font-semibold text-red-800">{formatCurrency(aging.over90)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto">
        {statusOptions.map((opt) => (
          <Link
            key={opt.value}
            href={`/keuangan/tagihan?status=${opt.value}`}
            className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              statusFilter === opt.value
                ? "bg-teal-dark text-white"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            {opt.label}
          </Link>
        ))}
      </div>

      {/* Invoice table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Invoice ID</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Dokter</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Tipe</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Periode</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">Jumlah</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-500">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Tanggal</th>
                </tr>
              </thead>
              <tbody>
                {invoices && invoices.length > 0 ? (
                  invoices.map((inv) => (
                    <tr key={inv.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="px-4 py-3 font-mono text-xs text-gray-600">
                        {inv.id.slice(0, 16)}...
                      </td>
                      <td className="px-4 py-3 text-navy-dark">
                        {(inv.doctors as { full_name: string })?.full_name || inv.doctor_id}
                      </td>
                      <td className="px-4 py-3 capitalize text-gray-600">{inv.type}</td>
                      <td className="px-4 py-3 text-gray-600">{inv.period || "-"}</td>
                      <td className="px-4 py-3 text-right font-medium text-navy-dark">
                        {formatCurrency(inv.amount_idr)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={statusBadge[inv.status] || "secondary"}>
                          {inv.status === "paid" ? "Lunas" : inv.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {inv.paid_at ? formatDate(inv.paid_at) : formatDate(inv.created_at)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                      <Receipt className="mx-auto h-8 w-8 text-gray-300" />
                      <p className="mt-2">Tidak ada tagihan</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
