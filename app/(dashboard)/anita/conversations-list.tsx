"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"

type Conversation = {
  phone: string
  doctor_name: string | null
  specialty: string | null
  state: string
  ext_flow: string | null
  ext_state: string | null
  selected_package: string | null
  anita_paused: boolean
  pause_reason: string | null
  last_role: string
  last_text: string
  updated_at: string
  msg_count: number
  doctor_id: string | null
}

const REFRESH_MS = 5000

const FMT_JKT = new Intl.DateTimeFormat("id-ID", {
  timeZone: "Asia/Jakarta",
  year: "numeric", month: "2-digit", day: "2-digit",
  hour: "2-digit", minute: "2-digit", second: "2-digit",
  hour12: false,
})

function fmtJakarta(iso: string): string {
  if (!iso) return ""
  try {
    return FMT_JKT.format(new Date(iso))
  } catch {
    return iso.slice(0, 19).replace("T", " ")
  }
}

export function AnitaConversationsList() {
  const [items, setItems] = useState<Conversation[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [lastFetch, setLastFetch] = useState<Date | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch("/api/super-admin/anita/conversations", { cache: "no-store" })
        const data = await res.json()
        if (cancelled) return
        if (!res.ok) {
          setError(data?.error || `HTTP ${res.status}`)
          return
        }
        setItems(data.conversations || [])
        setError(null)
        setLastFetch(new Date())
      } catch (e: unknown) {
        if (!cancelled) setError((e as Error).message || "network error")
      }
    }
    load()
    const t = setInterval(load, REFRESH_MS)
    return () => {
      cancelled = true
      clearInterval(t)
    }
  }, [])

  if (error) {
    return (
      <Card className="p-6 text-sm text-red-600">
        Gagal memuat: {error}. Pastikan ANITA_BASE_URL + ANITA_ADMIN_SECRET ada di env.
      </Card>
    )
  }

  if (!items) {
    return <Card className="p-6 text-sm text-muted-foreground">Memuat...</Card>
  }

  if (items.length === 0) {
    return <Card className="p-6 text-sm text-muted-foreground">Belum ada conversation.</Card>
  }

  const now = Date.now()
  return (
    <div className="space-y-2">
      <div className="text-xs text-muted-foreground">
        {items.length} conversation · Auto-refresh tiap {REFRESH_MS / 1000}s
        {lastFetch && ` · Last updated ${lastFetch.toLocaleTimeString("id-ID")}`}
      </div>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="text-left">
                <th className="px-3 py-2 font-medium">Dokter</th>
                <th className="px-3 py-2 font-medium">State</th>
                <th className="px-3 py-2 font-medium">Paket</th>
                <th className="px-3 py-2 font-medium">Last message</th>
                <th className="px-3 py-2 font-medium">Updated (WIB)</th>
                <th className="px-3 py-2 font-medium">#</th>
              </tr>
            </thead>
            <tbody>
              {items.map((c) => {
                let recent = false
                try {
                  const t = new Date(c.updated_at).getTime()
                  recent = now - t < 2 * 60 * 1000
                } catch {}
                return (
                  <tr
                    key={c.phone}
                    className={`border-t ${recent ? "bg-yellow-50" : ""} hover:bg-muted/30`}
                  >
                    <td className="px-3 py-2">
                      <Link
                        href={`/anita/${encodeURIComponent(c.phone)}`}
                        className="font-medium text-sky-700 hover:underline"
                      >
                        {c.doctor_name || "(belum daftar)"}
                      </Link>
                      <div className="text-[11px] text-muted-foreground">
                        {c.phone}
                        {c.specialty && ` · ${c.specialty}`}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <Badge variant="secondary">{c.state}</Badge>
                      {c.anita_paused && (
                        <Badge className="ml-1 bg-orange-100 text-orange-800">⏸ PAUSED</Badge>
                      )}
                    </td>
                    <td className="px-3 py-2 text-xs">{c.selected_package || "—"}</td>
                    <td className="px-3 py-2 text-xs max-w-[400px] truncate">
                      <span className={c.last_role === "anita" ? "text-purple-700" : "text-green-700"}>
                        [{c.last_role}]
                      </span>{" "}
                      {c.last_text}
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">
                      {fmtJakarta(c.updated_at)}
                    </td>
                    <td className="px-3 py-2 text-xs">{c.msg_count}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
