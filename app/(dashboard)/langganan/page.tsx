import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getAuthProfile } from "@/lib/supabase/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export const metadata = {
  title: "Langganan — MedPersona",
}

export const revalidate = 60

const TIER_DETAILS: Record<string, { label: string; posts: number; videos: number; revisions: number; platforms: string }> = {
  starter: { label: "Starter", posts: 22, videos: 5, revisions: 8, platforms: "Instagram" },
  growth: { label: "Growth", posts: 40, videos: 12, revisions: 15, platforms: "Instagram + TikTok" },
  pro: { label: "Pro", posts: 60, videos: 20, revisions: 30, platforms: "IG + TikTok + LinkedIn" },
  elite: { label: "Elite", posts: 100, videos: 40, revisions: 75, platforms: "Semua Platform" },
}

const TIER_PRICING: Record<string, number> = {
  starter: 299000,
  growth: 649000,
  pro: 1299000,
  elite: 2499000,
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount)
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
}

export default async function SubscriptionPage() {
  const { user, profile } = await getAuthProfile()
  if (!user) redirect("/masuk")

  const supabase = await createClient()

  if (!profile?.doctor_id) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <h2 className="text-xl font-bold text-navy-dark">Akun belum terhubung</h2>
          <p className="mt-2 text-gray-500">Hubungi admin untuk menghubungkan akun Anda.</p>
        </div>
      </div>
    )
  }

  const [
    { data: doctor },
    { data: invoices },
    { data: usage },
  ] = await Promise.all([
    supabase.from("doctors").select("id, full_name, tier, subscription_status, subscription_expires, monthly_cost_idr").eq("id", profile.doctor_id).single(),
    supabase.from("invoices").select("id, period, tier, amount_idr, status, invoice_url, paid_at, created_at").eq("doctor_id", profile.doctor_id).order("created_at", { ascending: false }).limit(10),
    supabase.from("monthly_usage").select("doctor_id, month, posts_published, videos_published, revisions_used").eq("doctor_id", profile.doctor_id).order("month", { ascending: false }).limit(1),
  ])

  const tier = doctor?.tier || "starter"
  const tierInfo = TIER_DETAILS[tier] || TIER_DETAILS.starter
  const currentUsage = usage?.[0]
  const isActive = doctor?.subscription_status === "active"
  const isPending = doctor?.subscription_status === "pending"
  const isExpired = doctor?.subscription_status === "expired"

  // Find pending invoice
  const pendingInvoice = invoices?.find((inv) => inv.status === "pending")

  const statusBadge = isActive
    ? <Badge variant="success">Aktif</Badge>
    : isPending
    ? <Badge variant="warning">Menunggu Pembayaran</Badge>
    : <Badge variant="danger">Expired</Badge>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-dark">Langganan</h1>
        <p className="text-sm text-gray-500">Kelola paket dan status langganan Anda</p>
      </div>

      {/* Subscription Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Paket Saat Ini</span>
            {statusBadge}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="text-2xl font-bold text-navy-dark">{tierInfo.label}</h3>
              <p className="mt-1 text-3xl font-bold text-teal-dark">
                {formatCurrency(TIER_PRICING[tier] || 0)}
                <span className="text-sm font-normal text-gray-500">/bulan</span>
              </p>
              <p className="mt-2 text-sm text-gray-500">{tierInfo.platforms}</p>
              {doctor?.subscription_expires && (
                <p className="mt-3 text-sm text-gray-600">
                  Berlaku hingga: <strong>{formatDate(doctor.subscription_expires)}</strong>
                </p>
              )}
            </div>
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-500">Kuota Bulanan</h4>
              <div className="space-y-2">
                <QuotaBar
                  label="Post"
                  used={currentUsage?.posts_published || 0}
                  total={tierInfo.posts}
                />
                <QuotaBar
                  label="Video"
                  used={currentUsage?.videos_published || 0}
                  total={tierInfo.videos}
                />
                <QuotaBar
                  label="Revisi"
                  used={currentUsage?.revisions_used || 0}
                  total={tierInfo.revisions}
                />
              </div>
            </div>
          </div>

          {/* CTA for pending/expired */}
          {(isPending || isExpired) && (
            <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-medium text-amber-800">
                {isPending
                  ? "Langganan Anda belum aktif. Silakan selesaikan pembayaran."
                  : "Langganan Anda sudah expired. Perpanjang untuk melanjutkan layanan."}
              </p>
              {pendingInvoice?.invoice_url ? (
                <a
                  href={pendingInvoice.invoice_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-block rounded-lg bg-teal-dark px-6 py-2.5 text-sm font-semibold text-white hover:bg-teal"
                >
                  Bayar Sekarang
                </a>
              ) : (
                <Link
                  href="/daftar/paket"
                  className="mt-3 inline-block rounded-lg bg-teal-dark px-6 py-2.5 text-sm font-semibold text-white hover:bg-teal"
                >
                  Pilih Paket
                </Link>
              )}
            </div>
          )}

          {/* Upgrade option for active */}
          {isActive && tier !== "elite" && (
            <div className="mt-6">
              <Link
                href="/daftar/paket"
                className="text-sm font-medium text-teal-dark hover:underline"
              >
                Upgrade paket →
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Pembayaran</CardTitle>
        </CardHeader>
        <CardContent>
          {invoices && invoices.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-gray-500">
                    <th className="pb-3 font-medium">Periode</th>
                    <th className="pb-3 font-medium">Paket</th>
                    <th className="pb-3 font-medium">Jumlah</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Tanggal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {invoices.map((inv) => (
                    <tr key={inv.id}>
                      <td className="py-3 text-navy-dark">{inv.period}</td>
                      <td className="py-3 capitalize">{inv.tier}</td>
                      <td className="py-3 font-medium">{formatCurrency(inv.amount_idr)}</td>
                      <td className="py-3">
                        <Badge
                          variant={
                            inv.status === "paid" ? "success"
                              : inv.status === "pending" ? "warning"
                              : "danger"
                          }
                        >
                          {inv.status === "paid" ? "Lunas" : inv.status === "pending" ? "Pending" : "Expired"}
                        </Badge>
                      </td>
                      <td className="py-3 text-gray-500">
                        {inv.paid_at ? formatDate(inv.paid_at) : formatDate(inv.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="py-8 text-center text-gray-400">Belum ada riwayat pembayaran</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function QuotaBar({ label, used, total }: { label: string; used: number; total: number }) {
  const pct = total > 0 ? Math.min((used / total) * 100, 100) : 0
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium text-navy-dark">{used}/{total}</span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-100">
        <div
          className={`h-full rounded-full transition-all ${pct > 90 ? "bg-red-500" : pct > 70 ? "bg-amber-500" : "bg-teal"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
