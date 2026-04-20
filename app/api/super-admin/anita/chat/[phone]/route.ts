import { NextResponse } from "next/server"
import { anitaGet, requireAdmin } from "@/lib/anita/proxy"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ phone: string }> }
) {
  const auth = await requireAdmin()
  if ("error" in auth) return auth.error

  const { phone } = await params
  const res = await anitaGet(`/admin/api/chat/${encodeURIComponent(phone)}`)
  const data = await res.json().catch(() => ({ error: "invalid json from anita" }))
  return NextResponse.json(data, { status: res.status })
}
