import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if profile already has a doctor_id
    const admin = createAdminClient()
    const { data: profile } = await admin
      .from("profiles")
      .select("doctor_id")
      .eq("id", user.id)
      .single()

    if (profile?.doctor_id) {
      return NextResponse.json(
        { error: "Akun sudah terhubung dengan profil dokter." },
        { status: 409 }
      )
    }

    const { fullName, specialty, institution, whatsappNumber } =
      await request.json()

    if (!fullName || !specialty) {
      return NextResponse.json(
        { error: "Nama lengkap dan spesialisasi wajib diisi." },
        { status: 400 }
      )
    }

    // Generate doctor_id slug from name
    const slug = fullName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")

    let doctorId = slug
    const { data: existing } = await admin
      .from("doctors")
      .select("id")
      .eq("id", slug)
      .single()

    if (existing) {
      doctorId = `${slug}-${Date.now().toString(36).slice(-4)}`
    }

    // Create doctor record
    const { error: doctorError } = await admin.from("doctors").insert({
      id: doctorId,
      full_name: fullName,
      title: fullName.toLowerCase().startsWith("dr.") ? "dr." : "",
      specialty,
      institution: institution || null,
      whatsapp_number: whatsappNumber || null,
      tier: "starter",
      subscription_status: "pending",
    })

    if (doctorError) {
      console.error("Doctor insert error:", doctorError)
      return NextResponse.json(
        { error: "Gagal membuat profil dokter. Silakan coba lagi." },
        { status: 500 }
      )
    }

    // Link doctor to user profile
    const { error: linkError } = await admin
      .from("profiles")
      .update({
        doctor_id: doctorId,
        full_name: fullName,
        phone: whatsappNumber || null,
      })
      .eq("id", user.id)

    if (linkError) {
      console.error("Profile link error:", linkError)
      // Cleanup doctor record
      await admin.from("doctors").delete().eq("id", doctorId)
      return NextResponse.json(
        { error: "Gagal menghubungkan profil. Silakan coba lagi." },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, doctorId }, { status: 201 })
  } catch (err) {
    console.error("Setup doctor error:", err)
    return NextResponse.json(
      { error: "Terjadi kesalahan internal." },
      { status: 500 }
    )
  }
}
