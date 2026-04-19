import { createClient } from "@supabase/supabase-js"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env")
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function main() {
  console.log("=== Step 1: Insert doctor record ===")
  const { error: doctorErr } = await supabase.from("doctors").upsert({
    id: "dr-febri-andika",
    full_name: "Febri Andika",
    title: "dr.",
    specialty: "General Practitioner",
    subspecialty: "Family Medicine",
    whatsapp_number: "08xxxxxxxxxx",
    location: "Batam, Kepulauan Riau",
    institution: "Klinik Sehat Batam",
    years_in_practice: 5,
    tier: "pro",
    subscription_status: "active",
    subscription_started: new Date().toISOString(),
    subscription_expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    monthly_cost_idr: 1299000,
    brand_voice: { tone: "approachable", character_adjectives: ["warm", "trustworthy", "educational", "relatable"], content_style: "practical-tips" },
    visual_style: { color_palette: ["#2E86AB", "#A8DADC", "#F1FAEE", "#E63946"], font_preference: "modern-sans", aesthetic: "clean clinical", template_archetype: "clean-doctor" },
    target_audience: { primary: "Working adults 25-45 in Batam seeking health advice", secondary: "Parents seeking family health guidance", geography: "Batam, Indonesia" },
    platforms: { instagram: { active: true, handle: "@drfebri.sehat" }, linkedin: { active: true, handle: "dr-febri-andika" }, tiktok: { active: false } },
    social_accounts: { instagram: { handle: "@drfebri.sehat" }, linkedin: { handle: "dr-febri-andika" } },
    voice_id: "3mAVBNEqop5UbHtD8oxQ",
  }, { onConflict: "id" })

  if (doctorErr) {
    console.error("Doctor insert failed:", doctorErr.message)
    process.exit(1)
  }
  console.log("Doctor record created: dr-febri-andika (Pro tier)")

  console.log("\n=== Step 2: Create auth user - dr. Febri Andika ===")
  const { data: febriUser, error: febriErr } = await supabase.auth.admin.createUser({
    email: "febri@medpersona.id",
    password: "testpass123",
    email_confirm: true,
    user_metadata: { full_name: "dr. Febri Andika", role: "doctor" },
  })

  if (febriErr) {
    if (febriErr.message.includes("already been registered")) {
      console.log("User febri@medpersona.id already exists, skipping")
    } else {
      console.error("Febri user creation failed:", febriErr.message)
      process.exit(1)
    }
  } else {
    console.log("Auth user created:", febriUser.user.email)
  }

  console.log("\n=== Step 3: Create auth user - Admin ===")
  const { data: adminUser, error: adminErr } = await supabase.auth.admin.createUser({
    email: "bahariagent001@gmail.com",
    password: "admin123456",
    email_confirm: true,
    user_metadata: { full_name: "Admin", role: "super_admin" },
  })

  if (adminErr) {
    if (adminErr.message.includes("already been registered")) {
      console.log("User bahariagent001@gmail.com already exists, skipping")
    } else {
      console.error("Admin user creation failed:", adminErr.message)
      process.exit(1)
    }
  } else {
    console.log("Auth user created:", adminUser.user.email)
  }

  console.log("\n=== Step 4: Link dr. Febri profile to doctor record ===")
  const { error: linkErr } = await supabase
    .from("profiles")
    .update({ doctor_id: "dr-febri-andika", phone: "08xxxxxxxxxx" })
    .eq("email", "febri@medpersona.id")

  if (linkErr) {
    console.error("Profile link failed:", linkErr.message)
    process.exit(1)
  }
  console.log("Profile linked: febri@medpersona.id -> dr-febri-andika")

  console.log("\n=== Step 5: Initialize monthly usage ===")
  const month = new Date().toISOString().slice(0, 7) // "2026-04"
  const { error: usageErr } = await supabase.from("monthly_usage").upsert({
    doctor_id: "dr-febri-andika",
    month,
    posts_published: 12,
    videos_published: 5,
    revisions_used: 8,
    personal_uploads_used: 3,
  }, { onConflict: "doctor_id,month" })

  if (usageErr) {
    console.error("Usage init failed:", usageErr.message)
  } else {
    console.log(`Monthly usage initialized for ${month}`)
  }

  console.log("\n✅ Setup complete!")
  console.log("\nTest accounts:")
  console.log("  Doctor: febri@medpersona.id / testpass123")
  console.log("  Admin:  bahariagent001@gmail.com / admin123456")
}

main().catch(console.error)
