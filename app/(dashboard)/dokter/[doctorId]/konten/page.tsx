import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { getAuthProfile } from "@/lib/supabase/auth"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatShortDate } from "@/lib/utils"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

const STATUS_VARIANT: Record<string, "secondary" | "info" | "warning" | "success" | "danger"> = {
  planned: "secondary",
  drafted: "info",
  pending_review: "warning",
  approved: "success",
  scheduled: "success",
  posted: "success",
  rejected: "danger",
  revision: "warning",
}

export default async function DoctorContentPage({
  params,
}: {
  params: Promise<{ doctorId: string }>
}) {
  const { doctorId } = await params
  const { user } = await getAuthProfile()
  if (!user) redirect("/masuk")
  const supabase = await createClient()

  const { data: doctor } = await supabase
    .from("doctors")
    .select("id, full_name, title")
    .eq("id", doctorId)
    .single()
  if (!doctor) notFound()

  const { data: items } = await supabase
    .from("content_items")
    .select("id, topic_title, platform, status, planned_date, content_type")
    .eq("doctor_id", doctorId)
    .order("planned_date", { ascending: false })
    .limit(100)

  const statusCounts: Record<string, number> = {}
  items?.forEach((item) => {
    statusCounts[item.status] = (statusCounts[item.status] || 0) + 1
  })

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/dokter/${doctorId}`} className="mb-2 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-teal-dark">
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Profil
        </Link>
        <h1 className="text-2xl font-bold text-navy-dark">Konten — {doctor.full_name}</h1>
        <p className="text-sm text-gray-500">{doctor.title}</p>
      </div>

      {/* Status summary */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(statusCounts).map(([status, count]) => (
          <Badge key={status} variant={STATUS_VARIANT[status] || "secondary"}>
            {status}: {count}
          </Badge>
        ))}
      </div>

      {/* Content table */}
      <Card>
        <CardHeader><CardTitle>Semua Konten</CardTitle></CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-4 py-3 text-left font-medium text-gray-500">Judul</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Platform</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Tipe</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Tanggal</th>
                <th className="px-4 py-3 text-center font-medium text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody>
              {items?.map((item) => (
                <tr key={item.id} className="border-b border-gray-50">
                  <td className="px-4 py-3 font-medium text-navy-dark">
                    <Link href={`/persetujuan/${item.id}`} className="hover:text-teal-dark hover:underline">
                      {item.topic_title || "Untitled"}
                    </Link>
                  </td>
                  <td className="px-4 py-3 capitalize text-gray-600">{item.platform}</td>
                  <td className="px-4 py-3 capitalize text-gray-600">{item.content_type}</td>
                  <td className="px-4 py-3 text-gray-500">{item.planned_date ? formatShortDate(item.planned_date) : "-"}</td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={STATUS_VARIANT[item.status] || "secondary"}>{item.status}</Badge>
                  </td>
                </tr>
              ))}
              {(!items || items.length === 0) && (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-400">Belum ada konten</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
