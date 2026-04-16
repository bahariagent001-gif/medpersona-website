import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getAuthProfile } from "@/lib/supabase/auth"
import { KpiCard } from "@/components/dashboard/kpi-card"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate } from "@/lib/utils"
import Link from "next/link"
import {
  Users,
  DollarSign,
  Target,
  FileText,
  Calendar,
  TrendingUp,
  AlertCircle,
  CreditCard,
} from "lucide-react"

export const metadata = {
  title: "Dashboard — MedPersona",
}

export const revalidate = 60

export default async function DashboardPage() {
  const { user, profile } = await getAuthProfile()
  if (!user) redirect("/masuk")

  const isAdmin = ["super_admin", "admin"].includes(profile?.role || "")

  if (isAdmin) {
    return <AdminDashboard />
  }

  return <DoctorDashboard doctorId={profile?.doctor_id} />
}

async function AdminDashboard() {
  const supabase = await createClient()

  // Fetch KPIs
  const [
    { count: activeDoctors },
    { count: activeLeads },
    { count: pendingApprovals },
    { count: postsThisMonth },
    { data: doctors },
    { data: recentLeads },
    { data: recentContent },
  ] = await Promise.all([
    supabase.from("doctors").select("*", { count: "exact", head: true }).eq("subscription_status", "active"),
    supabase.from("leads").select("*", { count: "exact", head: true }).not("stage", "in", '("won","lost")'),
    supabase.from("content_items").select("*", { count: "exact", head: true }).eq("status", "pending_review"),
    supabase.from("content_items").select("*", { count: "exact", head: true }).eq("status", "posted"),
    supabase.from("doctors").select("id, full_name, specialty, tier, subscription_status, monthly_cost_idr").order("created_at", { ascending: false }).limit(10),
    supabase.from("leads").select("*").order("created_at", { ascending: false }).limit(5),
    supabase.from("content_items").select("id, doctor_id, topic_title, platform, status, planned_date").order("created_at", { ascending: false }).limit(10),
  ])

  // Calculate MRR from active doctors
  const mrr = doctors?.reduce((sum, d) => sum + (d.subscription_status === "active" ? (d.monthly_cost_idr || 0) : 0), 0) || 0

  const tierColors: Record<string, "default" | "secondary" | "success" | "warning" | "info"> = {
    starter: "secondary",
    growth: "info",
    pro: "warning",
    elite: "success",
  }

  const statusColors: Record<string, "success" | "warning" | "danger" | "info" | "secondary"> = {
    active: "success",
    pending: "warning",
    expired: "danger",
    paused: "secondary",
  }

  const contentStatusColors: Record<string, "success" | "warning" | "danger" | "info" | "secondary"> = {
    drafted: "secondary",
    pending_review: "warning",
    approved: "info",
    scheduled: "info",
    posted: "success",
    rejected: "danger",
    failed: "danger",
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-navy-dark">Dashboard</h1>
        <p className="text-sm text-gray-500">Ringkasan operasi MedPersona</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Dokter Aktif"
          value={String(activeDoctors || 0)}
          icon={<Users className="h-5 w-5" />}
        />
        <KpiCard
          title="MRR"
          value={formatCurrency(mrr)}
          icon={<DollarSign className="h-5 w-5" />}
        />
        <KpiCard
          title="Lead Aktif"
          value={String(activeLeads || 0)}
          icon={<Target className="h-5 w-5" />}
        />
        <KpiCard
          title="Menunggu Persetujuan"
          value={String(pendingApprovals || 0)}
          icon={<FileText className="h-5 w-5" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Doctor List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4 text-teal-dark" />
              Dokter
            </CardTitle>
          </CardHeader>
          <CardContent>
            {doctors && doctors.length > 0 ? (
              <div className="space-y-3">
                {doctors.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between rounded-lg border border-gray-100 px-4 py-3">
                    <div>
                      <p className="font-medium text-navy-dark">{doc.full_name}</p>
                      <p className="text-xs text-gray-500">{doc.specialty}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={tierColors[doc.tier] || "secondary"}>
                        {doc.tier}
                      </Badge>
                      <Badge variant={statusColors[doc.subscription_status] || "secondary"}>
                        {doc.subscription_status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-gray-400">Belum ada dokter terdaftar</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-4 w-4 text-teal-dark" />
              Konten Terbaru
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentContent && recentContent.length > 0 ? (
              <div className="space-y-3">
                {recentContent.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-lg border border-gray-100 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-navy-dark">{item.topic_title || "Untitled"}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{item.doctor_id}</span>
                        <span>&middot;</span>
                        <span>{item.platform}</span>
                        {item.planned_date && (
                          <>
                            <span>&middot;</span>
                            <span>{formatDate(item.planned_date)}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <Badge variant={contentStatusColors[item.status] || "secondary"}>
                      {item.status.replace("_", " ")}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-gray-400">Belum ada konten</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Leads */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-4 w-4 text-teal-dark" />
              Lead Terbaru
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentLeads && recentLeads.length > 0 ? (
              <div className="space-y-3">
                {recentLeads.map((lead) => (
                  <div key={lead.id} className="flex items-center justify-between rounded-lg border border-gray-100 px-4 py-3">
                    <div>
                      <p className="font-medium text-navy-dark">{lead.name}</p>
                      <p className="text-xs text-gray-500">{lead.specialty} &middot; {lead.source}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500">Score: {lead.score}</span>
                      <Badge variant="info">{lead.stage}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-gray-400">Belum ada lead</p>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertCircle className="h-4 w-4 text-teal-dark" />
              Status Operasi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Post bulan ini</span>
                <span className="font-semibold text-navy-dark">{postsThisMonth || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Konten pending review</span>
                <span className="font-semibold text-amber-600">{pendingApprovals || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Lead pipeline</span>
                <span className="font-semibold text-navy-dark">{activeLeads || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

async function DoctorDashboard({ doctorId }: { doctorId?: string }) {
  const supabase = await createClient()

  if (!doctorId) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <h2 className="text-xl font-bold text-navy-dark">Akun belum terhubung</h2>
          <p className="mt-2 text-gray-500">Hubungi admin untuk menghubungkan akun Anda dengan profil dokter.</p>
        </div>
      </div>
    )
  }

  const [
    { data: doctor },
    { data: pendingContent },
    { count: approvedCount },
    { count: postedCount },
    { data: pendingInvoices },
  ] = await Promise.all([
    supabase.from("doctors").select("*").eq("id", doctorId).single(),
    supabase.from("content_items").select("id, topic_title, platform, status, planned_date").eq("doctor_id", doctorId).eq("status", "pending_review").order("planned_date"),
    supabase.from("content_items").select("*", { count: "exact", head: true }).eq("doctor_id", doctorId).eq("status", "approved"),
    supabase.from("content_items").select("*", { count: "exact", head: true }).eq("doctor_id", doctorId).eq("status", "posted"),
    supabase.from("invoices").select("id, invoice_url, status").eq("doctor_id", doctorId).eq("status", "pending").limit(1),
  ])

  const isSubActive = doctor?.subscription_status === "active"
  const needsPayment = !isSubActive
  const pendingInvoice = pendingInvoices?.[0]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-dark">
          Halo, {doctor?.full_name || "Dokter"}
        </h1>
        <p className="text-sm text-gray-500">Ringkasan konten media sosial Anda</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <KpiCard
          title="Menunggu Review"
          value={String(pendingContent?.length || 0)}
          icon={<FileText className="h-5 w-5" />}
        />
        <KpiCard
          title="Disetujui"
          value={String(approvedCount || 0)}
          icon={<Calendar className="h-5 w-5" />}
        />
        <KpiCard
          title="Sudah Diposting"
          value={String(postedCount || 0)}
          icon={<TrendingUp className="h-5 w-5" />}
        />
      </div>

      {/* Subscription Status */}
      {needsPayment && (
        <Card>
          <CardContent className="flex items-center gap-4 py-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
              <CreditCard className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-navy-dark">
                {doctor?.subscription_status === "pending" ? "Langganan belum aktif" : "Langganan sudah expired"}
              </p>
              <p className="text-sm text-gray-500">
                Paket {doctor?.tier?.charAt(0).toUpperCase()}{doctor?.tier?.slice(1) || "Starter"} — silakan selesaikan pembayaran untuk mengaktifkan layanan.
              </p>
            </div>
            {pendingInvoice?.invoice_url ? (
              <a
                href={pendingInvoice.invoice_url}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 rounded-lg bg-teal-dark px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal"
              >
                Bayar Sekarang
              </a>
            ) : (
              <Link
                href="/daftar/paket"
                className="shrink-0 rounded-lg bg-teal-dark px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal"
              >
                Pilih Paket
              </Link>
            )}
          </CardContent>
        </Card>
      )}

      {isSubActive && doctor?.subscription_expires && (
        <Card>
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <Badge variant="success">Aktif</Badge>
              <span className="text-sm text-gray-600">
                Paket {doctor.tier?.charAt(0).toUpperCase()}{doctor.tier?.slice(1)} — berlaku hingga {formatDate(doctor.subscription_expires)}
              </span>
            </div>
            <Link href="/langganan" className="text-sm font-medium text-teal-dark hover:underline">
              Detail →
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Pending content */}
      <Card>
        <CardHeader>
          <CardTitle>Konten Menunggu Persetujuan Anda</CardTitle>
        </CardHeader>
        <CardContent>
          {pendingContent && pendingContent.length > 0 ? (
            <div className="space-y-3">
              {pendingContent.map((item) => (
                <a
                  key={item.id}
                  href={`/persetujuan/${item.id}`}
                  className="flex items-center justify-between rounded-lg border border-gray-100 px-4 py-3 transition-colors hover:border-teal/30 hover:bg-teal-light/30"
                >
                  <div>
                    <p className="font-medium text-navy-dark">{item.topic_title || "Untitled"}</p>
                    <p className="text-xs text-gray-500">
                      {item.platform} &middot; {item.planned_date ? formatDate(item.planned_date) : "Belum dijadwalkan"}
                    </p>
                  </div>
                  <Badge variant="warning">Review</Badge>
                </a>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-gray-400">
              Tidak ada konten yang menunggu persetujuan Anda saat ini.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
