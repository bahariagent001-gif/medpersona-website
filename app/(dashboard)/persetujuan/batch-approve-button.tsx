"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { CheckSquare, AlertCircle, Check } from "lucide-react"

export function BatchApproveButton({
  contentIds,
  count,
}: {
  contentIds: string[]
  count: number
}) {
  const [loading, setLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  async function handleBatchApprove() {
    setLoading(true)
    setError("")
    const supabase = createClient()

    const { error: updateError } = await supabase
      .from("content_items")
      .update({
        status: "approved",
        approved_at: new Date().toISOString(),
        approval_notes: "Batch approved",
      })
      .in("id", contentIds)

    setLoading(false)

    if (updateError) {
      setError("Gagal menyetujui: " + updateError.message)
      return
    }

    setSuccess(true)
    setShowConfirm(false)
    router.refresh()
  }

  if (success) {
    return (
      <div className="flex items-center gap-2 text-sm text-emerald-700">
        <Check className="h-4 w-4" />
        {count} konten disetujui
      </div>
    )
  }

  if (showConfirm) {
    return (
      <div className="flex items-center gap-2">
        {error && (
          <span className="text-sm text-red-600">{error}</span>
        )}
        <span className="text-sm text-gray-600">Setujui {count} konten?</span>
        <Button onClick={handleBatchApprove} disabled={loading} variant="success" size="sm">
          {loading ? "Memproses..." : "Ya, Setujui"}
        </Button>
        <Button onClick={() => setShowConfirm(false)} variant="outline" size="sm">
          Batal
        </Button>
      </div>
    )
  }

  return (
    <Button onClick={() => setShowConfirm(true)} variant="success" size="lg">
      <CheckSquare className="h-4 w-4" />
      Setujui Semua ({count})
    </Button>
  )
}
