import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  try {
    const { invoiceId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's doctor_id
    const { data: profile } = await supabase
      .from("profiles")
      .select("doctor_id")
      .eq("id", user.id)
      .single()

    if (!profile?.doctor_id) {
      return NextResponse.json({ error: "Profil tidak ditemukan." }, { status: 404 })
    }

    // Get invoice (RLS ensures doctor can only see own)
    const { data: invoice, error } = await supabase
      .from("invoices")
      .select("id, status, invoice_url, paid_at, tier, amount_idr, period")
      .eq("id", invoiceId)
      .eq("doctor_id", profile.doctor_id)
      .single()

    if (error || !invoice) {
      return NextResponse.json({ error: "Tagihan tidak ditemukan." }, { status: 404 })
    }

    return NextResponse.json(invoice)
  } catch (err) {
    console.error("Payment status error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
