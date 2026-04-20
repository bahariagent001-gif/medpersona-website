"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

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

type Filter = "all" | "inbox" | "active" | "paused" | "paid"

// "Inbox" = needs admin attention: paused OR doctor's last message was unanswered
// OR session updated in last 5 minutes (fresh activity).
function matchesFilter(c: Conversation, f: Filter): boolean {
  if (f === "all") return true
  if (f === "paused") return c.anita_paused
  if (f === "paid") return Boolean(c.doctor_id) || Boolean(c.selected_package)
  if (f === "active") return !c.anita_paused && c.state !== "onboarding_complete"
  if (f === "inbox") {
    // Needs attention: paused, or doctor's last msg is unanswered, or fresh activity
    if (c.anita_paused) return true
    if (c.last_role === "doctor") return true
    try {
      const freshness = Date.now() - new Date(c.updated_at).getTime()
      if (freshness < 5 * 60 * 1000) return true
    } catch {}
    return false
  }
  return true
}

export function AnitaConversationsList() {
  const [items, setItems] = useState<Conversation[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [lastFetch, setLastFetch] = useState<Date | null>(null)
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<Filter>("all")

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

  // Apply search + filter. Counts shown in tabs reflect the FILTER only,
  // search further narrows whatever tab is active.
  const { filtered, counts } = useMemo(() => {
    const source = items || []
    const filterCount = (f: Filter) => source.filter((c) => matchesFilter(c, f)).length
    const q = query.trim().toLowerCase()
    const afterFilter = source.filter((c) => matchesFilter(c, filter))
    const afterSearch = q
      ? afterFilter.filter((c) => {
          const hay = `${c.phone} ${c.doctor_name || ""} ${c.specialty || ""} ${c.last_text || ""}`.toLowerCase()
          return hay.includes(q)
        })
      : afterFilter
    return {
      filtered: afterSearch,
      counts: {
        all: source.length,
        inbox: filterCount("inbox"),
        active: filterCount("active"),
        paused: filterCount("paused"),
        paid: filterCount("paid"),
      },
    }
  }, [items, filter, query])

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

  const now = Date.now()

  const filterTabs: { key: Filter; label: string; count: number }[] = [
    { key: "all", label: "Semua", count: counts.all },
    { key: "inbox", label: "📥 Inbox", count: counts.inbox },
    { key: "active", label: "🟢 Aktif", count: counts.active },
    { key: "paused", label: "⏸ Paused", count: counts.paused },
    { key: "paid", label: "💎 Paid", count: counts.paid },
  ]

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {filterTabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                filter === t.key
                  ? "bg-sky-700 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {t.label} <span className="opacity-70">({t.count})</span>
            </button>
          ))}
        </div>
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari nama, nomor, spesialisasi, atau pesan..."
          className="sm:max-w-sm"
        />
      </div>

      <div className="text-xs text-muted-foreground">
        {filtered.length} dari {items.length} · Auto-refresh tiap {REFRESH_MS / 1000}s
        {lastFetch && ` · Last fetched ${lastFetch.toLocaleTimeString("id-ID")}`}
      </div>

      {filtered.length === 0 ? (
        <Card className="p-6 text-sm text-muted-foreground">
          Tidak ada conversation yang cocok filter/pencarian.
        </Card>
      ) : (
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
                {filtered.map((c) => {
                  let recent = false
                  try {
                    const t = new Date(c.updated_at).getTime()
                    recent = now - t < 2 * 60 * 1000
                  } catch {}
                  const unread = c.last_role === "doctor"
                  return (
                    <tr
                      key={c.phone}
                      className={`border-t ${recent ? "bg-yellow-50" : ""} ${
                        unread ? "font-medium" : ""
                      } hover:bg-muted/30`}
                    >
                      <td className="px-3 py-2">
                        <Link
                          href={`/anita/${encodeURIComponent(c.phone)}`}
                          className="font-medium text-sky-700 hover:underline"
                        >
                          {unread && <span className="mr-1 text-sky-500">●</span>}
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
      )}
    </div>
  )
}
