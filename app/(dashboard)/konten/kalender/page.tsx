import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getAuthProfile } from "@/lib/supabase/auth"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export const metadata = { title: "Kalender Konten — MedPersona" }

export const revalidate = 30

const STATUS_COLORS: Record<string, "secondary" | "info" | "warning" | "success" | "danger"> = {
  planned: "secondary",
  drafted: "info",
  pending_review: "warning",
  approved: "success",
  scheduled: "success",
  posted: "success",
  rejected: "danger",
  revision: "warning",
}

const DAYS_ID = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"]
const MONTHS_ID = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
]

function getCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startOffset = (firstDay.getDay() + 6) % 7 // Monday-start
  const days: (number | null)[] = []
  for (let i = 0; i < startOffset; i++) days.push(null)
  for (let d = 1; d <= lastDay.getDate(); d++) days.push(d)
  while (days.length % 7 !== 0) days.push(null)
  return days
}

export default async function ContentCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>
}) {
  const sp = await searchParams
  const now = new Date()
  const year = sp.year ? parseInt(sp.year) : now.getFullYear()
  const month = sp.month ? parseInt(sp.month) - 1 : now.getMonth()

  const { user } = await getAuthProfile()
  if (!user) redirect("/masuk")

  const supabase = await createClient()

  const startDate = `${year}-${String(month + 1).padStart(2, "0")}-01`
  const endDate = `${year}-${String(month + 1).padStart(2, "0")}-${new Date(year, month + 1, 0).getDate()}`

  const { data: items } = await supabase
    .from("content_items")
    .select("id, topic_title, platform, status, planned_date, content_type")
    .gte("planned_date", startDate)
    .lte("planned_date", endDate)
    .order("planned_date")

  const byDay: Record<number, typeof items> = {}
  items?.forEach((item) => {
    const day = new Date(item.planned_date).getDate()
    if (!byDay[day]) byDay[day] = []
    byDay[day]!.push(item)
  })

  const calendarDays = getCalendarDays(year, month)
  const prevMonth = month === 0 ? 12 : month
  const prevYear = month === 0 ? year - 1 : year
  const nextMonth = month === 11 ? 1 : month + 2
  const nextYear = month === 11 ? year + 1 : year

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-dark">Kalender Konten</h1>
        <p className="text-sm text-gray-500">Visualisasi jadwal konten bulanan</p>
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <a
          href={`/konten/kalender?month=${prevMonth}&year=${prevYear}`}
          className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
        >
          &larr; Sebelumnya
        </a>
        <h2 className="text-lg font-semibold text-navy-dark">
          {MONTHS_ID[month]} {year}
        </h2>
        <a
          href={`/konten/kalender?month=${nextMonth}&year=${nextYear}`}
          className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
        >
          Berikutnya &rarr;
        </a>
      </div>

      {/* Calendar grid */}
      <Card>
        <CardHeader><CardTitle>Jadwal</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-7 border-b bg-gray-50">
            {DAYS_ID.map((d) => (
              <div key={d} className="px-2 py-3 text-center text-xs font-medium text-gray-500">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {calendarDays.map((day, i) => (
              <div
                key={i}
                className={`min-h-[100px] border-b border-r p-2 ${day === null ? "bg-gray-50/50" : ""}`}
              >
                {day !== null && (
                  <>
                    <span className={`text-xs font-medium ${
                      day === now.getDate() && month === now.getMonth() && year === now.getFullYear()
                        ? "inline-flex h-6 w-6 items-center justify-center rounded-full bg-teal-dark text-white"
                        : "text-gray-500"
                    }`}>
                      {day}
                    </span>
                    <div className="mt-1 space-y-1">
                      {byDay[day]?.slice(0, 3).map((item) => (
                        <div
                          key={item.id}
                          className="truncate rounded bg-teal-light/50 px-1.5 py-0.5 text-[10px] font-medium text-teal-dark"
                          title={item.topic_title || ""}
                        >
                          <Badge variant={STATUS_COLORS[item.status] || "secondary"} className="mr-1 px-1 py-0 text-[8px]">
                            {item.platform}
                          </Badge>
                          {item.topic_title?.slice(0, 20)}
                        </div>
                      ))}
                      {(byDay[day]?.length || 0) > 3 && (
                        <p className="text-[10px] text-gray-400">+{(byDay[day]?.length || 0) - 3} lainnya</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Status legend */}
      <div className="flex flex-wrap gap-3">
        {Object.entries(STATUS_COLORS).map(([status, color]) => (
          <div key={status} className="flex items-center gap-1.5">
            <Badge variant={color} className="px-1.5 py-0 text-[10px]">{status}</Badge>
          </div>
        ))}
      </div>
    </div>
  )
}
