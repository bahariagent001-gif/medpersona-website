import { anitaGet, requireAdmin } from "@/lib/anita/proxy"
import { NextResponse } from "next/server"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ mediaId: string }> }
) {
  const auth = await requireAdmin()
  if ("error" in auth) return auth.error
  const { mediaId } = await params
  const res = await anitaGet(`/admin/api/media/${encodeURIComponent(mediaId)}`)
  if (!res.ok) {
    return NextResponse.json(
      { error: `upstream ${res.status}` },
      { status: res.status }
    )
  }
  const contentType = res.headers.get("content-type") || "application/octet-stream"
  const buf = await res.arrayBuffer()
  return new Response(buf, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "private, max-age=3600",
    },
  })
}
