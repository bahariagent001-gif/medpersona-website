import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { getAuthProfile } from "@/lib/supabase/auth"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate } from "@/lib/utils"
import { KpiCard } from "@/components/dashboard/kpi-card"
import { ArrowLeft, Calendar, FileText, TrendingUp, Users } from "lucide-react"
import Link from "next/link"

export async function generateMetadata({ params }: { params: Promise<{ doctorId: string }> }) {
  return { title: "Detail Dokter — MedPersona" }
}

export default async function DoctorDetailPage({ params }: { params: Promise<{ doctorId: string }> }) {
  const { doctorId } = await params
  const { user } = await getAuthProfile()
  if (!user) redirect("/masuk")
  const supabase = await createClient()

  const { data: doctor } = await supabase.from("doctors").select("*").eq("id", doctorId).single()
  if (!doctor) notFound()

  const [
    { count: totalContent },
    { count: pendingReview },
    { count: posted },
    { data: recentContent },
    { data: invoices },
  ] = await Promise.all([
    supabase.from("content_items").select("*", { count: "exact", head: true }).eq("doctor_id", doctorId),
    supabase.from("content_items").select("*", { count: "exact", head: true }).eq("doctor_id", doctorId).eq("status", "pending_review"),
    supabase.from("content_items").select("*", { count: "exact", head: true }).eq("doctor_id", doctorId).eq("status", "posted"),
    supabase.from("content_items").select("id, topic_title, platform, status, planned_date").eq("doctor_id", doctorId).order("created_at", { ascending: false }).limit(10),
    supabase.from("invoices").select("*").eq("doctor_id", doctorId).order("created_at", { ascending: false }).limit(5),
  ])

  const platformList = Object.keys(doctor.platforms || {}).join(", ") || "-"

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dokter" className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"><ArrowLeft className="h-5 w-5" /></Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-navy-dark">{doctor.full_name}</h1>
          <p className="text-sm text-gray-500">{doctor.specialty} — {doctor.institution || doctor.location}</p>
        </div>
        <Badge variant={doctor.subscription_status === "active" ? "success" : "warning"} className="capitalize">
          {doctor.subscription_status}
        </Badge>
        <Badge variant="info" className="capitalize">{doctor.tier}</Badge>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <KpiCard title="Total Konten" value={String(totalContent || 0)} icon={<FileText className="h-5 w-5" />} />
        <KpiCard title="Menunggu Review" value={String(pendingReview || 0)} icon={<Calendar className="h-5 w-5" />} />
        <KpiCard title="Diposting" value={String(posted || 0)} icon={<TrendingUp className="h-5 w-5" />} />
        <KpiCard title="MRR" value={formatCurrency(doctor.monthly_cost_idr || 0)} icon={<Users className="h-5 w-5" />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Profile */}
        <Card>
          <CardHeader><CardTitle>Profil</CardTitle></CardHeader>
          <CardContent>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between"><dt className="text-gray-500">Nama</dt><dd className="text-navy-dark">{doctor.full_name}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Spesialisasi</dt><dd className="text-navy-dark">{doctor.specialty}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Institusi</dt><dd className="text-navy-dark">{doctor.institution || "-"}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">WhatsApp</dt><dd className="text-navy-dark">{doctor.whatsapp_number || "-"}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Platform</dt><dd className="text-navy-dark">{platformList}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Paket</dt><dd className="capitalize text-navy-dark">{doctor.tier} — {formatCurrency(doctor.monthly_cost_idr || 0)}/bln</dd></div>
            </dl>
          </CardContent>
        </Card>

        {/* Recent content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Konten Terbaru</span>
              <Link href={`/dokter/${doctorId}/konten`} className="text-sm font-normal text-teal-dark hover:underline">Lihat semua</Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentContent?.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-lg border border-gray-50 px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-navy-dark">{item.topic_title || "Untitled"}</p>
                    <p className="text-xs text-gray-400">{item.platform} &middot; {item.planned_date ? formatDate(item.planned_date) : "-"}</p>
                  </div>
                  <Badge variant={item.status === "posted" ? "success" : item.status === "pending_review" ? "warning" : "secondary"} className="ml-2">
                    {item.status.replace("_", " ")}
                  </Badge>
                </div>
              ))}
              {(!recentContent || recentContent.length === 0) && (
                <p className="py-4 text-center text-sm text-gray-400">Belum ada konten</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Invoices */}
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Riwayat Tagihan</CardTitle></CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-gray-50">
                <th className="px-4 py-3 text-left font-medium text-gray-500">Periode</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Tipe</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Jumlah</th>
                <th className="px-4 py-3 text-center font-medium text-gray-500">Status</th>
              </tr></thead>
              <tbody>
                {invoices?.map((inv) => (
                  <tr key={inv.id} className="border-b border-gray-50">
                    <td className="px-4 py-3 text-gray-700">{inv.period || "-"}</td>
                    <td className="px-4 py-3 capitalize text-gray-600">{inv.type}</td>
                    <td className="px-4 py-3 text-right font-medium">{formatCurrency(inv.amount_idr)}</td>
                    <td className="px-4 py-3 text-center"><Badge variant={inv.status === "paid" ? "success" : "warning"}>{inv.status}</Badge></td>
                  </tr>
                ))}
                {(!invoices || invoices.length === 0) && (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">Tidak ada tagihan</td></tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
