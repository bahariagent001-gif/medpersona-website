import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: NextRequest) {
  try {
    const { fullName, email, phone, specialty, password } = await request.json()

    // Validate required fields
    if (!fullName || !email || !phone || !specialty || !password) {
      return NextResponse.json(
        { error: "Semua field wajib diisi." },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password minimal 6 karakter." },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Generate doctor_id slug from name
    const slug = fullName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")

    // Check for existing doctor_id collision
    let doctorId = slug
    const { data: existingDoctor } = await supabase
      .from("doctors")
      .select("id")
      .eq("id", slug)
      .single()

    if (existingDoctor) {
      doctorId = `${slug}-${Date.now().toString(36).slice(-4)}`
    }

    // Check if email already registered
    const { data: existingUsers } = await supabase.auth.admin.listUsers()
    const emailExists = existingUsers?.users?.some((u) => u.email === email)
    if (emailExists) {
      return NextResponse.json(
        { error: "Email sudah terdaftar. Silakan masuk." },
        { status: 409 }
      )
    }

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role: "doctor",
      },
    })

    if (authError) {
      console.error("Auth create error:", authError)
      return NextResponse.json(
        { error: "Gagal membuat akun. Silakan coba lagi." },
        { status: 500 }
      )
    }

    // Insert doctor record
    const { error: doctorError } = await supabase.from("doctors").insert({
      id: doctorId,
      full_name: fullName,
      title: fullName.startsWith("dr.") ? "dr." : "",
      whatsapp_number: phone,
      specialty,
      tier: "starter",
      subscription_status: "pending",
    })

    if (doctorError) {
      console.error("Doctor insert error:", doctorError)
      // Cleanup: delete the auth user if doctor insert fails
      if (authData.user) {
        await supabase.auth.admin.deleteUser(authData.user.id)
      }
      return NextResponse.json(
        { error: "Gagal membuat profil. Silakan coba lagi." },
        { status: 500 }
      )
    }

    // Update the auto-created profile with doctor_id and phone
    if (authData.user) {
      await supabase
        .from("profiles")
        .update({ doctor_id: doctorId, phone })
        .eq("id", authData.user.id)
    }

    return NextResponse.json(
      { success: true, doctorId },
      { status: 201 }
    )
  } catch (err) {
    console.error("Registration error:", err)
    return NextResponse.json(
      { error: "Terjadi kesalahan internal." },
      { status: 500 }
    )
  }
}
