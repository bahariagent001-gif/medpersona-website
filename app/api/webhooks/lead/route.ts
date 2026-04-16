import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || ""
    let body: Record<string, string>

    if (contentType.includes("application/json")) {
      body = await request.json()
    } else {
      // Form submission from /kontak page
      const formData = await request.formData()
      body = Object.fromEntries(formData.entries()) as Record<string, string>
    }

    const { name, email, phone, specialty, interest, source } = body

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { error } = await supabase.from("leads").insert({
      id: `lead-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name,
      email,
      phone: phone || null,
      specialty: specialty || null,
      source: source || "website",
      stage: "new",
      score: 0,
      notes: interest ? `Pesan: ${interest}` : null,
    })

    if (error) {
      console.error("Lead insert error:", error)
      return NextResponse.json({ error: "Failed to save lead" }, { status: 500 })
    }

    // If form submission, redirect to thank you
    if (contentType.includes("form")) {
      return NextResponse.redirect(new URL("/kontak?success=1", request.url))
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Lead webhook error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
