import { NextResponse } from "next/server"
import { anitaGet, requireAdmin } from "@/lib/anita/proxy"

export async function GET() {
  const auth = await requireAdmin()
  if ("error" in auth) return auth.error

  const res = await anitaGet("/admin/api/conversations")
  const data = await res.json().catch(() => ({ error: "invalid json from anita" }))
  return NextResponse.json(data, { status: res.status })
}
