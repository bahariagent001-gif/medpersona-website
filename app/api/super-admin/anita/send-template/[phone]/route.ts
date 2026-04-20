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
  const template = (body?.template || "").trim()
  if (!template) {
    return NextResponse.json({ error: "template name required" }, { status: 400 })
  }
  const res = await anitaPost(`/admin/send-template/${encodeURIComponent(phone)}`, {
    template,
    lang: body?.lang || "id",
    body_params: Array.isArray(body?.body_params) ? body.body_params : [],
  })
  const data = await res.json().catch(() => ({}))
  return NextResponse.json(data, { status: res.status })
}
