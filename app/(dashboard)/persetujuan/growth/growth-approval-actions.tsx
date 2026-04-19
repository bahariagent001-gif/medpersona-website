"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Check, X, Edit3 } from "lucide-react"

export function GrowthApprovalActions({ approvalId }: { approvalId: string }) {
  const [isPending, startTransition] = useTransition()
  const [editMode, setEditMode] = useState(false)
  const [note, setNote] = useState("")
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function decide(decision: "approve" | "reject" | "edit") {
    setError(null)
    try {
      const res = await fetch("/api/approval/growth/decide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approvalId, decision, note: note || null }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `Gagal: ${res.status}`)
      }
      startTransition(() => router.refresh())
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memproses")
    }
  }

  if (editMode) {
    return (
      <div className="space-y-2">
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Contoh: budget=75000 atau ubah headline"
          className="w-full rounded border border-gray-200 p-2 text-sm"
          rows={3}
        />
        <div className="flex gap-2">
          <Button size="sm" onClick={() => decide("edit")} disabled={isPending || !note}>
            Kirim edit
          </Button>
          <Button size="sm" variant="outline" onClick={() => { setEditMode(false); setNote("") }}>
            Batal
          </Button>
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" onClick={() => decide("approve")} disabled={isPending}>
        <Check className="mr-1 h-4 w-4" /> Approve
      </Button>
      <Button size="sm" variant="outline" onClick={() => setEditMode(true)} disabled={isPending}>
        <Edit3 className="mr-1 h-4 w-4" /> Edit
      </Button>
      <Button size="sm" variant="destructive" onClick={() => decide("reject")} disabled={isPending}>
        <X className="mr-1 h-4 w-4" /> Reject
      </Button>
      {error && <p className="mt-2 w-full text-xs text-red-600">{error}</p>}
    </div>
  )
}
