"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Check, X, Edit3, Save, FileText } from "lucide-react"

type Props = {
  approvalId: string
  /** Current caption (for inline edit) */
  caption?: string
  /** Payload type — determines whether inline caption-patch is available */
  approvalType?: string
}

export function GrowthApprovalActions({ approvalId, caption, approvalType }: Props) {
  const [isPending, startTransition] = useTransition()
  const [mode, setMode] = useState<"idle" | "feedback" | "caption">("idle")
  const [note, setNote] = useState("")
  const [captionDraft, setCaptionDraft] = useState(caption || "")
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const supportsCaptionEdit = approvalType === "organic_post"

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

  async function patchCaption() {
    setError(null)
    try {
      const res = await fetch("/api/approval/growth/patch-caption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approvalId, caption: captionDraft }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `Gagal: ${res.status}`)
      }
      setMode("idle")
      startTransition(() => router.refresh())
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menyimpan caption")
    }
  }

  if (mode === "feedback") {
    return (
      <div className="space-y-2">
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Contoh: ganti hook jadi angka statistik, budget naik ke 50K, tambah CTA daftar webinar"
          className="w-full rounded border border-gray-200 p-2 text-sm"
          rows={3}
        />
        <div className="flex gap-2">
          <Button size="sm" onClick={() => decide("edit")} disabled={isPending || !note}>
            Regenerate dengan feedback
          </Button>
          <Button size="sm" variant="outline" onClick={() => { setMode("idle"); setNote("") }}>
            Batal
          </Button>
        </div>
        <p className="text-[11px] text-gray-500">
          AI akan bikin draft baru dengan feedback ini. Draft lama di-mark superseded.
        </p>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    )
  }

  if (mode === "caption") {
    return (
      <div className="space-y-2">
        <textarea
          value={captionDraft}
          onChange={(e) => setCaptionDraft(e.target.value)}
          className="w-full rounded border border-gray-200 p-2 font-mono text-xs leading-relaxed"
          rows={10}
        />
        <div className="flex gap-2">
          <Button size="sm" onClick={patchCaption} disabled={isPending || !captionDraft.trim()}>
            <Save className="mr-1 h-4 w-4" /> Simpan caption
          </Button>
          <Button size="sm" variant="outline" onClick={() => { setMode("idle"); setCaptionDraft(caption || "") }}>
            Batal
          </Button>
        </div>
        <p className="text-[11px] text-gray-500">
          Direct edit: simpan langsung tanpa regenerate AI. Tidak mengubah visual.
        </p>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" onClick={() => decide("approve")} disabled={isPending}>
        <Check className="mr-1 h-4 w-4" /> Approve
      </Button>
      {supportsCaptionEdit && (
        <Button size="sm" variant="outline" onClick={() => setMode("caption")} disabled={isPending}>
          <FileText className="mr-1 h-4 w-4" /> Edit caption
        </Button>
      )}
      <Button size="sm" variant="outline" onClick={() => setMode("feedback")} disabled={isPending}>
        <Edit3 className="mr-1 h-4 w-4" /> Regenerate
      </Button>
      <Button size="sm" variant="destructive" onClick={() => decide("reject")} disabled={isPending}>
        <X className="mr-1 h-4 w-4" /> Reject
      </Button>
      {error && <p className="mt-2 w-full text-xs text-red-600">{error}</p>}
    </div>
  )
}
