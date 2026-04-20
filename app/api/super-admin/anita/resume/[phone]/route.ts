import { NextResponse } from "next/server"
import { anitaPost, requireAdmin } from "@/lib/anita/proxy"

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ phone: string }> }
) {
  const auth = await requireAdmin()
  if ("error" in auth) return auth.error

  const { phone } = await params
  const res = await anitaPost(`/admin/resume/${encodeURIComponent(phone)}`)
  const data = await res.json().catch(() => ({}))
  return NextResponse.json(data, { status: res.status })
}
