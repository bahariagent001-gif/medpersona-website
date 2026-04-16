"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { CheckSquare } from "lucide-react"

export function BatchApproveButton({
  contentIds,
  count,
}: {
  contentIds: string[]
  count: number
}) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleBatchApprove() {
    if (!confirm(`Setujui ${count} konten standar sekaligus? (Konten personal tidak termasuk)`)) {
      return
    }

    setLoading(true)
    const supabase = createClient()

    const { error } = await supabase
      .from("content_items")
      .update({
        status: "approved",
        approved_at: new Date().toISOString(),
        approval_notes: "Batch approved",
      })
      .in("id", contentIds)

    setLoading(false)

    if (error) {
      alert("Gagal menyetujui: " + error.message)
      return
    }

    router.refresh()
  }

  return (
    <Button onClick={handleBatchApprove} disabled={loading} variant="success" size="lg">
      <CheckSquare className="h-4 w-4" />
      {loading ? "Memproses..." : `Setujui Semua (${count})`}
    </Button>
  )
}
