"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"
import { Calendar } from "lucide-react"
import Link from "next/link"

type ContentItem = {
  id: string
  doctor_id: string
  topic_title: string | null
  platform: string
  content_type: string | null
  status: string
  planned_date: string | null
  funnel_stage: string | null
}

const statusBadge: Record<string, "success" | "warning" | "danger" | "info" | "secondary"> = {
  drafted: "secondary",
  pending_review: "warning",
  approved: "info",
  scheduled: "info",
  posted: "success",
  rejected: "danger",
  failed: "danger",
}

const platformColors: Record<string, string> = {
  instagram: "bg-pink-100 text-pink-700",
  tiktok: "bg-gray-100 text-gray-800",
  linkedin: "bg-blue-100 text-blue-700",
}

export function ContentList({ content }: { content: ContentItem[] }) {
  const [activeStatus, setActiveStatus] = useState<string | null>(null)

  const statusCounts: Record<string, number> = {}
  content.forEach((c) => {
    statusCounts[c.status] = (statusCounts[c.status] || 0) + 1
  })

  const filtered = activeStatus
    ? content.filter((c) => c.status === activeStatus)
    : content

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-dark">Konten</h1>
          <p className="text-sm text-gray-500">Semua konten di seluruh dokter</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/konten/kalender"
            className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-navy-dark hover:bg-gray-50"
          >
            <Calendar className="h-4 w-4" />
            Kalender
          </Link>
          <Link
            href="/konten/publish-kalender"
            className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-navy-dark hover:bg-gray-50"
          >
            <Calendar className="h-4 w-4" />
            Publish Calendar
          </Link>
        </div>
      </div>

      {/* Status filters — client-side, instant switching */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(statusCounts)
          .sort((a, b) => b[1] - a[1])
          .map(([status, count]) => (
            <button
              key={status}
              onClick={() => setActiveStatus(activeStatus === status ? null : status)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                activeStatus === status
                  ? "bg-teal-dark text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {status.replace("_", " ")} ({count})
            </button>
          ))}
        {activeStatus && (
          <button
            onClick={() => setActiveStatus(null)}
            className="rounded-full px-3 py-1 text-xs font-medium text-gray-400 hover:text-gray-600"
          >
            Hapus filter
          </button>
        )}
      </div>

      {/* Content table */}
      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-4 py-3 text-left font-medium text-gray-500">Judul</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Dokter</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Platform</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Tipe</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Tanggal</th>
                <th className="px-4 py-3 text-center font-medium text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="max-w-xs truncate px-4 py-3 font-medium text-navy-dark">
                    <Link href={`/persetujuan/${item.id}`} className="hover:text-teal-dark">
                      {item.topic_title || "Untitled"}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{item.doctor_id}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                        platformColors[item.platform] || "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {item.platform}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{item.content_type || "-"}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {item.planned_date ? formatDate(item.planned_date) : "-"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={statusBadge[item.status] || "secondary"}>
                      {item.status.replace("_", " ")}
                    </Badge>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                    Tidak ada konten
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </>
  )
}
