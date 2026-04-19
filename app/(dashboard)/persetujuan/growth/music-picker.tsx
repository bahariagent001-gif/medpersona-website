"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Music, X, Check, Flame } from "lucide-react"

type Track = {
  id: string
  title: string
  artist: string | null
  duration_sec: number | null
  preview_url: string | null
  tags: string[] | null
  mood: string | null
  source: string | null
  is_trending: boolean | null
  times_used: number | null
}

type Attached = {
  track_id?: string
  title?: string
  artist?: string
  is_trending?: boolean
  requires_manual_selection?: boolean
}

export function MusicPicker({
  approvalId,
  currentAudio,
}: {
  approvalId: string
  currentAudio?: Attached | null
}) {
  const [open, setOpen] = useState(false)
  const [tracks, setTracks] = useState<Track[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  useEffect(() => {
    if (!open || tracks.length > 0) return
    setLoading(true)
    fetch("/api/music/trending?limit=30")
      .then((r) => r.json())
      .then((d) => setTracks(d.tracks || []))
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false))
  }, [open, tracks.length])

  async function attach(trackId: string | null) {
    setError(null)
    try {
      const res = await fetch("/api/approval/growth/attach-music", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approvalId, trackId }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || "Gagal")
      }
      startTransition(() => router.refresh())
      setOpen(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal")
    }
  }

  return (
    <div className="space-y-2">
      {currentAudio?.track_id ? (
        <div className="flex items-center gap-2 rounded-md bg-purple-50 border border-purple-200 px-3 py-2 text-xs">
          <Music className="h-3 w-3 text-purple-700" />
          <span className="font-medium">{currentAudio.title}</span>
          {currentAudio.artist && <span className="text-gray-500">— {currentAudio.artist}</span>}
          {currentAudio.is_trending && (
            <span className="inline-flex items-center gap-0.5 rounded bg-red-100 px-1 text-[10px] text-red-700">
              <Flame className="h-2.5 w-2.5" /> trending
            </span>
          )}
          {currentAudio.requires_manual_selection && (
            <span className="text-[10px] text-amber-700">⚠ pilih manual di IG app</span>
          )}
          <Button size="sm" variant="ghost" onClick={() => attach(null)} disabled={isPending}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <Button
          size="sm"
          variant="outline"
          onClick={() => setOpen(true)}
          disabled={isPending}
        >
          <Music className="mr-1 h-3 w-3" /> Pilih musik
        </Button>
      )}

      {open && (
        <div className="rounded-md border border-gray-200 bg-white p-3 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-xs font-medium">
              🔥 Audio trending untuk Reels / TikTok
            </h4>
            <button
              onClick={() => setOpen(false)}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              tutup
            </button>
          </div>
          {loading && <p className="text-xs text-gray-400">Loading…</p>}
          {error && <p className="text-xs text-red-600">{error}</p>}
          {!loading && tracks.length === 0 && (
            <div className="rounded bg-amber-50 p-2 text-xs text-amber-900">
              Belum ada track. Jalankan:{" "}
              <code className="text-[10px]">python -m tools.organic.trending_audio_tracker</code>
            </div>
          )}
          <ul className="max-h-64 space-y-1 overflow-auto">
            {tracks.map((t) => (
              <li
                key={t.id}
                className="flex items-center gap-2 rounded px-2 py-1.5 text-xs hover:bg-gray-50"
              >
                <Flame className="h-3 w-3 text-orange-500" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{t.title}</p>
                  <p className="text-[10px] text-gray-500">
                    {t.artist || "—"}
                    {t.times_used ? ` · ${t.times_used.toLocaleString()} pakai` : ""}
                  </p>
                </div>
                {t.preview_url && (
                  <a
                    href={t.preview_url}
                    target="_blank"
                    rel="noopener"
                    className="text-[10px] text-teal-700"
                  >
                    preview
                  </a>
                )}
                <Button
                  size="sm"
                  onClick={() => attach(t.id)}
                  disabled={isPending}
                  className="h-6 px-2 text-[10px]"
                >
                  <Check className="mr-0.5 h-3 w-3" /> pakai
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
