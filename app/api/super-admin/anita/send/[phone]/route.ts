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
  const text = (body?.text || "").trim()
  if (!text) {
    return NextResponse.json({ error: "text required" }, { status: 400 })
  }
  const res = await anitaPost(`/admin/send/${encodeURIComponent(phone)}`, { text })
  const data = await res.json().catch(() => ({}))
  return NextResponse.json(data, { status: res.status })
}
