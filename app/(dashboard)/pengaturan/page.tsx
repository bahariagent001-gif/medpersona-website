import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getAuthProfile } from "@/lib/supabase/auth"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"


export const metadata = { title: "Pengaturan — MedPersona" }

export const revalidate = 60

export default async function SettingsPage() {
  const { user, profile } = await getAuthProfile()
  if (!user) redirect("/masuk")

  // Fetch doctor details only if linked — single query instead of full profile refetch
  let doctor: { full_name: string; title: string; specialty: string } | null = null
  if (profile?.doctor_id) {
    const supabase = await createClient()
    const { data } = await supabase
      .from("doctors")
      .select("full_name, title, specialty")
      .eq("id", profile.doctor_id)
      .single()
    doctor = data
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-dark">Pengaturan</h1>
        <p className="text-sm text-gray-500">Kelola akun dan preferensi Anda</p>
      </div>

      {/* Account info */}
      <Card>
        <CardHeader><CardTitle>Informasi Akun</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-gray-500">Nama</label>
              <p className="mt-1 text-navy-dark">{doctor?.full_name || profile?.full_name || "-"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Email</label>
              <p className="mt-1 text-navy-dark">{user.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Role</label>
              <div className="mt-1">
                <Badge variant="info">{profile?.role || "user"}</Badge>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">User ID</label>
              <p className="mt-1 font-mono text-xs text-gray-400">{user.id}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Doctor profile link */}
      {profile?.doctor_id && doctor && (
        <Card>
          <CardHeader><CardTitle>Profil Dokter</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">Akun ini terhubung dengan profil dokter:</p>
            <p className="mt-2 font-semibold text-navy-dark">
              {doctor.full_name || profile.doctor_id}
            </p>
            <p className="text-sm text-gray-500">
              {doctor.specialty}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Session info */}
      <Card>
        <CardHeader><CardTitle>Sesi</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">Login terakhir: {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString("id-ID") : "-"}</p>
          <form action="/api/auth/signout" method="POST" className="mt-4">
            <button
              type="submit"
              className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              Keluar dari Akun
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
