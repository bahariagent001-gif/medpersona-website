import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getAuthProfile } from "@/lib/supabase/auth"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export const metadata = { title: "Publish Calendar — MedPersona" }
export const revalidate = 30

// Local type for scheduled_posts row — the generic Supabase client doesn't
// know this table because schemas haven't been regenerated via `supabase gen
// types`. Defining it here keeps the build strict without disabling TS.
type ScheduledPost = {
  id: string
  platform: string
  target_account: string | null
  caption: string | null
  visual_url: string | null
  carousel_slide_urls: string[] | null
  scheduled_for: string | null
  published_at: string | null
  status: string
  error_message: string | null
  platform_permalink: string | null
  platform_post_id: string | null
  created_at: string
}

const STATUS_COLORS: Record<string, "secondary" | "info" | "warning" | "success" | "danger"> = {
  scheduled: "info",
  publishing: "warning",
  published: "success",
  manual_required: "warning",
  failed: "danger",
  cancelled: "secondary",
}

const PLATFORM_LABELS: Record<string, string> = {
  instagram: "IG",
  tiktok: "TT",
  linkedin: "LI",
  website: "WEB",
}

export default async function PublishCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>
}) {
  const sp = await searchParams
  const filter = sp.filter || "all"

  const { user, profile } = await getAuthProfile()
  if (!user) redirect("/masuk")
  if (!["super_admin", "admin", "staff"].includes(profile?.role || "")) {
    redirect("/dashboard?akses=ditolak")
  }

  const supabase = await createClient()
  const { data: posts } = await supabase
    .from("scheduled_posts")
    .select(
      "id, platform, target_account, caption, visual_url, carousel_slide_urls, " +
        "scheduled_for, published_at, status, error_message, platform_permalink, " +
        "platform_post_id, created_at",
    )
    .order("scheduled_for", { ascending: false })
    .limit(200)
    .returns<ScheduledPost[]>()

  const all = posts || []
  const filtered = filter === "all"
    ? all
    : filter === "upcoming"
    ? all.filter((p) => ["scheduled", "manual_required"].includes(p.status))
    : filter === "published"
    ? all.filter((p) => p.status === "published")
    : filter === "failed"
    ? all.filter((p) => p.status === "failed")
    : all

  const counts = {
    all: all.length,
    upcoming: all.filter((p) => ["scheduled", "manual_required"].includes(p.status)).length,
    published: all.filter((p) => p.status === "published").length,
    failed: all.filter((p) => p.status === "failed").length,
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-dark">Publish Calendar</h1>
        <p className="text-sm text-gray-500">
          Jadwal publish + riwayat post di semua akun sosmed &amp; website MedPersona
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["all", "upcoming", "published", "failed"] as const).map((k) => (
          <a
            key={k}
            href={`/konten/publish-kalender?filter=${k}`}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
              filter === k
                ? "border-teal-dark bg-teal-dark text-white"
                : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            {k === "all"
              ? "Semua"
              : k === "upcoming"
              ? "Akan publish"
              : k === "published"
              ? "Sudah publish"
              : "Gagal"}{" "}
            <span className="ml-1 opacity-60">({counts[k]})</span>
          </a>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{filtered.length} post</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <p className="px-4 py-6 text-sm text-gray-500">
              Belum ada post dalam filter ini.
            </p>
          ) : (
            <div className="divide-y">
              {filtered.map((p) => {
                const slides = Array.isArray(p.carousel_slide_urls)
                  ? p.carousel_slide_urls
                  : []
                const thumb = slides[0] || p.visual_url
                const when = p.published_at || p.scheduled_for
                const whenLabel = when
                  ? new Date(when as string).toLocaleString("id-ID", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "—"
                return (
                  <div key={p.id} className="flex gap-3 px-4 py-3">
                    {thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={thumb as string}
                        alt=""
                        className="h-20 w-20 flex-shrink-0 rounded object-cover"
                      />
                    ) : (
                      <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded bg-gray-100 text-xs text-gray-400">
                        no visual
                      </div>
                    )}
                    <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <Badge
                          variant={STATUS_COLORS[p.status] || "secondary"}
                          className="px-1.5 py-0 text-[10px]"
                        >
                          {p.status}
                        </Badge>
                        <span className="font-medium text-gray-700">
                          {PLATFORM_LABELS[p.platform] || p.platform?.toUpperCase()}
                        </span>
                        {p.target_account && (
                          <span className="text-gray-500">@{p.target_account}</span>
                        )}
                        <span className="text-gray-400">·</span>
                        <span className="text-gray-500">{whenLabel}</span>
                        {slides.length > 1 && (
                          <span className="text-gray-500">· {slides.length} slides</span>
                        )}
                      </div>
                      <p className="truncate text-sm text-gray-900">
                        {(p.caption as string)?.slice(0, 140) || "(no caption)"}
                      </p>
                      {p.error_message && (
                        <p className="truncate text-xs text-red-600">
                          ⚠ {p.error_message}
                        </p>
                      )}
                      {p.platform_permalink && (
                        <a
                          href={p.platform_permalink as string}
                          target="_blank"
                          rel="noreferrer"
                          className="truncate text-xs text-teal-dark underline-offset-2 hover:underline"
                        >
                          {p.platform_permalink}
                        </a>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
