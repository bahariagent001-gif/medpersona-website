"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

type Plan = {
  id: string
  status: string
  method_type: string | null
  method_mask: string | null
  next_charge_at: string | null
  amount_idr: number
  tier: string
  failure_reason: string | null
}

export function AutoRenewalSection({
  currentTier,
  existingPlan,
}: {
  currentTier: string
  existingPlan: Plan | null
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Gated by env: Xendit Recurring product must be activated via Xendit
  // support before auto-renewal API calls stop returning REQUEST_FORBIDDEN_ERROR.
  // Flip NEXT_PUBLIC_AUTO_RENEWAL_ENABLED=true once support confirms activation.
  const enabled = process.env.NEXT_PUBLIC_AUTO_RENEWAL_ENABLED === "true"
  if (!enabled && !existingPlan) {
    return (
      <Card id="auto-renewal" className="border-gray-200 bg-gray-50/50">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Auto-Renewal</span>
            <Badge variant="secondary">Segera Hadir</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-700">
            Auto-renewal via kartu kredit &amp; e-wallet sedang dalam proses aktivasi
            dengan payment gateway. Sementara itu, kami akan mengirim reminder
            WhatsApp 7 hari sebelum langganan expired agar Anda bisa perpanjang
            dengan 1 klik.
          </p>
        </CardContent>
      </Card>
    )
  }

  async function handleEnable() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/payment/setup-recurring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: currentTier }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json?.error || `HTTP ${res.status}`)
        setLoading(false)
        return
      }
      if (json.authUrl) {
        window.location.href = json.authUrl
        return
      }
      setError("Setup selesai tapi tidak ada URL otorisasi. Coba lagi.")
    } catch (e: unknown) {
      setError((e as Error).message || "Network error")
    } finally {
      setLoading(false)
    }
  }

  async function handleCancel(planId: string) {
    if (!confirm("Yakin cancel auto-renewal? Anda akan perlu perpanjang manual setiap bulan.")) return
    setLoading(true)
    try {
      const res = await fetch(`/api/payment/cancel-recurring/${encodeURIComponent(planId)}`, {
        method: "POST",
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`)
      window.location.reload()
    } catch (e: unknown) {
      setError((e as Error).message || "Gagal cancel")
    } finally {
      setLoading(false)
    }
  }

  if (existingPlan && existingPlan.status === "active") {
    const methodLabel =
      existingPlan.method_type === "CARD" ? `Kartu Kredit${existingPlan.method_mask ? ` •••• ${existingPlan.method_mask.slice(-4)}` : ""}` :
      existingPlan.method_type === "EWALLET" ? "E-Wallet Terkait" :
      existingPlan.method_type || "Metode tersimpan"

    return (
      <Card id="auto-renewal" className="border-green-200 bg-green-50/50">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Auto-Renewal Aktif</span>
            <Badge variant="success">Active</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm space-y-1">
            <div><span className="text-gray-500">Metode:</span> <b>{methodLabel}</b></div>
            {existingPlan.next_charge_at && (
              <div>
                <span className="text-gray-500">Charge berikutnya:</span>{" "}
                <b>{new Date(existingPlan.next_charge_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</b>
              </div>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={loading}
            onClick={() => handleCancel(existingPlan.id)}
            className="text-red-700 border-red-300"
          >
            Cancel Auto-Renewal
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (existingPlan && existingPlan.status === "pending_auth") {
    return (
      <Card id="auto-renewal" className="border-amber-200 bg-amber-50/50">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Auto-Renewal Menunggu Otorisasi</span>
            <Badge variant="warning">Pending</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-amber-900">
            Setup auto-renewal sudah dibuat tapi belum selesai. Cek email/WA
            Anda untuk link otorisasi dari Xendit, atau klik di bawah untuk
            setup ulang.
          </p>
          <Button
            onClick={handleEnable}
            disabled={loading}
            size="sm"
            className="mt-3"
          >
            {loading ? "Memproses..." : "Setup Ulang"}
          </Button>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </CardContent>
      </Card>
    )
  }

  // Default: no plan yet, show activation CTA
  return (
    <Card id="auto-renewal">
      <CardHeader>
        <CardTitle>Auto-Renewal</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-gray-700">
          Aktifkan auto-renewal supaya langganan diperpanjang otomatis setiap bulan.
          Anda bisa pilih:
        </div>
        <ul className="ml-5 list-disc space-y-1 text-sm text-gray-700">
          <li><b>Kartu Kredit</b> (Visa, Mastercard, JCB) — bisa 3DS, tersimpan di Xendit.</li>
          <li><b>E-Wallet Terkait</b> (OVO, DANA, ShopeePay) — otorisasi sekali, auto-debit setiap bulan.</li>
        </ul>
        <div className="rounded-md bg-gray-50 p-3 text-xs text-gray-600">
          Kami tidak menyimpan data kartu di server MedPersona. Xendit (PCI-DSS Level 1) yang mengelola. Anda bisa batalkan auto-renewal kapan saja.
        </div>
        <Button onClick={handleEnable} disabled={loading}>
          {loading ? "Memproses..." : "Aktifkan Auto-Renewal"}
        </Button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </CardContent>
    </Card>
  )
}
