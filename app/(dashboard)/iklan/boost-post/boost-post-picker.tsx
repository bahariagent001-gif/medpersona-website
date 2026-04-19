"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Flame, ExternalLink, Zap } from "lucide-react"

type IgPost = {
  id: string
  caption?: string
  media_type?: string
  media_url?: string
  thumbnail_url?: string
  permalink?: string
  timestamp?: string
  like_count?: number
  comments_count?: number
}

export function BoostPostPicker() {
  const [posts, setPosts] = useState<IgPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<IgPost | null>(null)
  const [budget, setBudget] = useState<number>(20000)
  const [duration, setDuration] = useState<number>(3)
  const [queued, setQueued] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  useEffect(() => {
    fetch("/api/ads/ig-recent-posts?limit=30")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error)
        setPosts(d.posts || [])
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  async function queueBoost() {
    if (!selected) return
    try {
      const res = await fetch("/api/ads/queue-boost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mediaId: selected.id,
          caption: selected.caption,
          permalink: selected.permalink,
          thumbnailUrl: selected.thumbnail_url || selected.media_url,
          budgetDailyIdr: budget,
          durationDays: duration,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "queue failed")
      setQueued(data.approval_id)
      startTransition(() => router.refresh())
    } catch (e) {
      setError(e instanceof Error ? e.message : "failed")
    }
  }

  if (loading) return <p className="text-sm text-gray-500">Memuat post IG…</p>
  if (error) return <p className="text-sm text-red-600">Error: {error}</p>
  if (posts.length === 0)
    return (
      <Card>
        <CardContent className="py-6 text-center text-sm text-gray-400">
          Belum ada post di IG @medpersona.id. Posting minimal 1 konten dulu.
        </CardContent>
      </Card>
    )

  return (
    <div className="space-y-4">
      {queued && (
        <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-900">
          ✅ Boost queued: <code className="text-xs">{queued}</code>. Review di{" "}
          <a href="/persetujuan/growth" className="underline">persetujuan</a> atau reply APPROVE di WA.
        </div>
      )}

      {/* Configurator */}
      {selected && (
        <Card>
          <CardContent className="space-y-3 p-4">
            <div className="flex items-start gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selected.thumbnail_url || selected.media_url}
                alt=""
                className="h-20 w-20 flex-shrink-0 rounded object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-500">
                  {selected.timestamp?.slice(0, 10)} · 👍 {selected.like_count} · 💬{" "}
                  {selected.comments_count}
                </p>
                <p className="line-clamp-3 text-sm">{selected.caption}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600">Budget/hari (IDR)</label>
                <input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(parseInt(e.target.value) || 0)}
                  step={5000}
                  min={10000}
                  max={500000}
                  className="mt-1 w-full rounded border border-gray-200 px-2 py-1 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Durasi (hari)</label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
                  min={1}
                  max={14}
                  className="mt-1 w-full rounded border border-gray-200 px-2 py-1 text-sm"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Total spend: Rp {(budget * duration).toLocaleString("id-ID")}
            </p>

            <div className="flex gap-2">
              <Button onClick={queueBoost} disabled={isPending || budget < 10000}>
                <Zap className="mr-1 h-4 w-4" /> Queue boost
              </Button>
              <Button variant="outline" onClick={() => setSelected(null)}>
                Batal
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Post grid */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((p) => {
          const engaged = (p.like_count || 0) + (p.comments_count || 0) * 5
          const topQuartile = posts.filter(x => ((x.like_count || 0) + (x.comments_count || 0) * 5) >= engaged).length <= posts.length / 4
          const isSelected = selected?.id === p.id
          return (
            <button
              key={p.id}
              onClick={() => setSelected(p)}
              className={`relative overflow-hidden rounded-lg border-2 text-left transition ${
                isSelected ? "border-teal-600 ring-2 ring-teal-200" : "border-gray-200 hover:border-gray-400"
              }`}
            >
              {(p.thumbnail_url || p.media_url) && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.thumbnail_url || p.media_url}
                  alt=""
                  className="aspect-square w-full object-cover"
                  loading="lazy"
                />
              )}
              {topQuartile && (
                <Badge variant="warning" className="absolute left-2 top-2 text-[10px]">
                  <Flame className="mr-0.5 h-2.5 w-2.5" /> top
                </Badge>
              )}
              <div className="space-y-1 p-3">
                <p className="line-clamp-2 text-xs">{p.caption || "(no caption)"}</p>
                <div className="flex items-center justify-between text-[11px] text-gray-500">
                  <span>👍 {p.like_count || 0} · 💬 {p.comments_count || 0}</span>
                  {p.permalink && (
                    <a
                      href={p.permalink}
                      target="_blank"
                      rel="noopener"
                      className="flex items-center gap-0.5 text-teal-700"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
