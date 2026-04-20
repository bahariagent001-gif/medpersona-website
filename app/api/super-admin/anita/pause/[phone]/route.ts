import { NextResponse } from "next/server"
import { anitaPost, requireAdmin } from "@/lib/anita/proxy"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ phone: string }> }
) {
  const auth = await requireAdmin()
  if ("error" in auth) return auth.error

  const { phone } = await params
  const body = await req.json().catch(() => ({}))
  const res = await anitaPost(`/admin/pause/${encodeURIComponent(phone)}`, {
    reason: body?.reason || "manual takeover via medpersona.id",
  })
  const data = await res.json().catch(() => ({}))
  return NextResponse.json(data, { status: res.status })
}
