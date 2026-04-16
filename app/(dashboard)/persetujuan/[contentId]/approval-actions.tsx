"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Check, X, RotateCcw } from "lucide-react"

const REVISION_TEMPLATES = [
  "Ganti gambar — kurang relevan",
  "Ubah hook — terlalu formal",
  "Perbaiki caption — kurang personal",
  "Tambahkan data/statistik",
  "Ganti warna/tone visual",
]

export function ApprovalActions({
  contentId,
  currentStatus,
}: {
  contentId: string
  currentStatus: string
}) {
  const [loading, setLoading] = useState(false)
  const [showRevision, setShowRevision] = useState(false)
  const [notes, setNotes] = useState("")
  const router = useRouter()

  async function handleAction(action: "approved" | "rejected" | "revision") {
    setLoading(true)
    const supabase = createClient()

    const updateData: Record<string, unknown> = {
      status: action,
      updated_at: new Date().toISOString(),
    }

    if (action === "approved") {
      updateData.approved_at = new Date().toISOString()
    }

    if (notes.trim()) {
      updateData.approval_notes = notes.trim()
    }

    const { error } = await supabase
      .from("content_items")
      .update(updateData)
      .eq("id", contentId)

    setLoading(false)

    if (error) {
      alert("Gagal: " + error.message)
      return
    }

    router.push("/persetujuan")
    router.refresh()
  }

  return (
    <div className="space-y-4">
      {showRevision && (
        <div className="space-y-3">
          {/* Quick templates */}
          <div className="flex flex-wrap gap-2">
            {REVISION_TEMPLATES.map((tmpl) => (
              <button
                key={tmpl}
                onClick={() => setNotes(notes ? `${notes}\n${tmpl}` : tmpl)}
                className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-600 transition-colors hover:border-teal hover:bg-teal-light hover:text-teal-dark"
              >
                {tmpl}
              </button>
            ))}
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Tulis catatan revisi Anda..."
            className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20"
            rows={3}
          />
        </div>
      )}

      <div className="flex gap-3">
        <Button
          onClick={() => handleAction("approved")}
          disabled={loading}
          variant="success"
          size="lg"
          className="flex-1"
        >
          <Check className="h-5 w-5" />
          Setujui
        </Button>

        <Button
          onClick={() => {
            if (showRevision && notes.trim()) {
              handleAction("revision")
            } else {
              setShowRevision(!showRevision)
            }
          }}
          disabled={loading}
          variant="warning"
          size="lg"
          className="flex-1"
        >
          <RotateCcw className="h-5 w-5" />
          {showRevision && notes.trim() ? "Kirim Revisi" : "Revisi"}
        </Button>

        <Button
          onClick={() => {
            if (confirm("Tolak konten ini?")) handleAction("rejected")
          }}
          disabled={loading}
          variant="destructive"
          size="lg"
          className="flex-1"
        >
          <X className="h-5 w-5" />
          Tolak
        </Button>
      </div>
    </div>
  )
}
