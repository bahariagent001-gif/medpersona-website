"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

type HistoryItem = {
  role: string
  text: string
  ts: string
  meta?: { origin?: string } | null
  media_id?: string | null
  media_type?: string | null
}

const FMT_JKT = new Intl.DateTimeFormat("id-ID", {
  timeZone: "Asia/Jakarta",
  year: "numeric", month: "2-digit", day: "2-digit",
  hour: "2-digit", minute: "2-digit", second: "2-digit",
  hour12: false,
})
function fmtJakarta(iso: string): string {
  if (!iso) return ""
  try { return FMT_JKT.format(new Date(iso)) + " WIB" }
  catch { return iso.slice(0, 19).replace("T", " ") }
}

type ChatData = {
  phone: string
  state: string
  ext_flow: string | null
  selected_package: string | null
  anita_paused: boolean
  pause_reason: string | null
  doctor_id: string | null
  profile_data: Record<string, unknown>
  history: HistoryItem[]
  updated_at: string
  hours_since_last_inbound: number | null
  outside_24h_window: boolean
}

const REFRESH_MS = 4000

export function AnitaChatView({ phone }: { phone: string }) {
  const [data, setData] = useState<ChatData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [text, setText] = useState("")
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  async function load() {
    try {
      const res = await fetch(`/api/super-admin/anita/chat/${encodeURIComponent(phone)}`, {
        cache: "no-store",
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json?.error || `HTTP ${res.status}`)
        return
      }
      setData(json)
      setError(null)
    } catch (e: unknown) {
      setError((e as Error).message || "network error")
    }
  }

  useEffect(() => {
    load()
    const t = setInterval(load, REFRESH_MS)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phone])

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [data?.history?.length])

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 2500)
  }

  async function doSend(force = false) {
    if (!text.trim()) return
    setSending(true)
    try {
      const res = await fetch(`/api/super-admin/anita/send/${encodeURIComponent(phone)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim(), force }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        if (json?.error === "outside_24h_window") {
          const ok = confirm(
            `${json.message}\n\nPaksa kirim? (Pesan mungkin tidak sampai).`
          )
          if (ok) {
            setSending(false)
            return doSend(true)
          }
          throw new Error("Dibatalkan — di luar 24h window")
        }
        throw new Error(json?.error || `HTTP ${res.status}`)
      }
      setText("")
      showToast(force ? "Terkirim (force) — mungkin tidak sampai" : "Terkirim ✓", true)
      load()
    } catch (e: unknown) {
      showToast(`Gagal: ${(e as Error).message}`, false)
    } finally {
      setSending(false)
    }
  }

  async function doPause() {
    const reason = prompt("Alasan pause? (opsional)", "manual takeover") || "manual takeover"
    try {
      const res = await fetch(`/api/super-admin/anita/pause/${encodeURIComponent(phone)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      showToast("Anita paused ⏸", true)
      load()
    } catch (e: unknown) {
      showToast(`Gagal: ${(e as Error).message}`, false)
    }
  }

  async function doSendTemplate() {
    const template = prompt(
      "Nama template (harus sudah approved di Meta Business Manager):\n\nContoh: anita_review_reminder, hello_world",
      "hello_world"
    )
    if (!template) return
    const paramsRaw = prompt(
      `Parameter body (pisahkan dengan "|", kosongkan kalau tidak ada).\n\nContoh: Dokter Michelle | paket Growth`,
      ""
    )
    const body_params = paramsRaw
      ? paramsRaw.split("|").map((p) => p.trim()).filter(Boolean)
      : []
    try {
      const res = await fetch(`/api/super-admin/anita/send-template/${encodeURIComponent(phone)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template, body_params }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`)
      showToast(`Template "${template}" terkirim ✓`, true)
      load()
    } catch (e: unknown) {
      showToast(`Gagal: ${(e as Error).message}`, false)
    }
  }

  async function doResume() {
    try {
      const res = await fetch(`/api/super-admin/anita/resume/${encodeURIComponent(phone)}`, {
        method: "POST",
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      showToast("Anita resumed ▶", true)
      load()
    } catch (e: unknown) {
      showToast(`Gagal: ${(e as Error).message}`, false)
    }
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Link href="/anita" className="text-sm text-sky-700 hover:underline">
          ← Semua conversations
        </Link>
        <Card className="p-6 text-sm text-red-600">Gagal memuat: {error}</Card>
      </div>
    )
  }
  if (!data) return <Card className="p-6 text-sm">Memuat...</Card>

  return (
    <div className="space-y-4">
      <Link href="/anita" className="text-sm text-sky-700 hover:underline">
        ← Semua conversations
      </Link>

      <div>
        <h1 className="text-xl font-semibold">
          {(data.profile_data?.full_name as string) || "(belum daftar)"}
        </h1>
        <div className="text-xs text-muted-foreground">{phone}</div>
        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          <Badge variant="secondary">State: {data.state}</Badge>
          {data.selected_package && <Badge variant="outline">Paket: {data.selected_package}</Badge>}
          {data.doctor_id && <Badge variant="outline">doctor_id: {data.doctor_id}</Badge>}
          {data.anita_paused ? (
            <Badge className="bg-orange-100 text-orange-800">
              ⏸ PAUSED {data.pause_reason && `— ${data.pause_reason}`}
            </Badge>
          ) : (
            <Badge className="bg-green-100 text-green-800">● ACTIVE</Badge>
          )}
        </div>
      </div>

      {data.outside_24h_window && (
        <Card className="space-y-2 border-orange-300 bg-orange-50 p-3 text-sm text-orange-900">
          <div>
            ⚠ <b>Meta 24-hour window tertutup.</b> Dokter terakhir membalas{" "}
            {data.hours_since_last_inbound?.toFixed(1)} jam lalu. Pesan free-text
            mungkin tidak terkirim. Pakai <b>template approved</b> untuk
            re-engage (tombol di bawah).
          </div>
          <Button size="sm" variant="outline" onClick={doSendTemplate}>
            📨 Kirim Template
          </Button>
        </Card>
      )}

      <Card className="bg-[#f5f5f7] p-4">
        <div ref={scrollRef} className="max-h-[55vh] overflow-y-auto space-y-2 pr-2">
          {data.history.map((m, i) => {
            const isAnita = m.role === "anita"
            const isTakeover = m.meta?.origin === "admin_takeover"
            const bg = isTakeover
              ? "bg-sky-100 border-sky-300"
              : isAnita
              ? "bg-[#dcf8c6] border-[#c5e7a4]"
              : "bg-white border-gray-200"
            return (
              <div key={i} className={`flex ${isAnita ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] rounded-2xl border px-3 py-2 text-sm ${bg}`}>
                  {isTakeover && (
                    <span className="mr-1 inline-block rounded bg-sky-700 px-1.5 py-0.5 text-[10px] text-white">
                      ADMIN
                    </span>
                  )}
                  {m.media_id && m.media_type === "image" && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`/api/super-admin/anita/media/${encodeURIComponent(m.media_id)}`}
                      alt="foto dari dokter"
                      className="mb-1 max-h-80 max-w-full rounded"
                    />
                  )}
                  {m.media_id && ["document", "audio", "video"].includes(m.media_type || "") && (
                    <a
                      href={`/api/super-admin/anita/media/${encodeURIComponent(m.media_id)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mb-1 inline-block rounded bg-white/60 px-2 py-1 text-xs text-sky-700 underline"
                    >
                      📎 Buka {m.media_type} ({m.media_id.slice(0, 8)}...)
                    </a>
                  )}
                  <span className="whitespace-pre-wrap break-words">{m.text}</span>
                  <div className="mt-1 text-[10px] text-gray-500">
                    {fmtJakarta(m.ts)}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      <Card className="p-4 space-y-3">
        <div className="text-sm font-medium">⚡ Takeover panel</div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ketik pesan untuk dikirim AS Anita..."
          rows={3}
          className="w-full rounded-md border p-2 text-sm focus:outline-none focus:ring-1"
        />
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => doSend(false)} disabled={sending || !text.trim()}>
            {sending ? "Mengirim..." : "Kirim sebagai Anita"}
          </Button>
          {data.anita_paused ? (
            <Button variant="outline" onClick={doResume} className="text-green-700 border-green-600">
              ▶ Resume Anita
            </Button>
          ) : (
            <Button variant="outline" onClick={doPause} className="text-orange-700 border-orange-600">
              ⏸ Pause Anita
            </Button>
          )}
        </div>
      </Card>

      {toast && (
        <div
          className={`fixed bottom-6 right-6 rounded-md px-4 py-2 text-sm text-white shadow-lg ${
            toast.ok ? "bg-green-700" : "bg-red-700"
          }`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  )
}
