import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getAuthProfile } from "@/lib/supabase/auth"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export const metadata = { title: "Manajemen Tim — MedPersona" }

export const revalidate = 60

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  staff: "Staff",
  doctor: "Dokter",
}

const ROLE_COLORS: Record<string, "success" | "info" | "warning" | "secondary"> = {
  super_admin: "success",
  admin: "info",
  staff: "warning",
  doctor: "secondary",
}

export default async function TeamPage() {
  const { user, profile } = await getAuthProfile()
  if (!user) redirect("/masuk")
  if (!["super_admin", "admin"].includes(profile?.role || "")) redirect("/dashboard?akses=ditolak")

  const supabase = await createClient()
  const { data: members } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, created_at")
    .order("created_at", { ascending: true })
    .limit(100)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-dark">Manajemen Tim</h1>
        <p className="text-sm text-gray-500">Daftar anggota tim dan hak akses mereka</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Anggota Tim ({members?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-4 py-3 text-left font-medium text-gray-500">Nama</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Email</th>
                <th className="px-4 py-3 text-center font-medium text-gray-500">Role</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Bergabung</th>
              </tr>
            </thead>
            <tbody>
              {members?.map((m) => (
                <tr key={m.id} className="border-b border-gray-50">
                  <td className="px-4 py-3 font-medium text-navy-dark">
                    {m.full_name || "—"}
                    {m.id === user.id && <span className="ml-2 text-xs text-gray-400">(Anda)</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{m.email}</td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={ROLE_COLORS[m.role] || "secondary"}>
                      {ROLE_LABELS[m.role] || m.role}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {m.created_at ? new Date(m.created_at).toLocaleDateString("id-ID") : "-"}
                  </td>
                </tr>
              ))}
              {(!members || members.length === 0) && (
                <tr><td colSpan={4} className="px-4 py-12 text-center text-gray-400">Tidak ada anggota tim</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
