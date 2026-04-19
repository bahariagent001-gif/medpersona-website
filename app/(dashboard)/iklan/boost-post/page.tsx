import { redirect } from "next/navigation"
import { getAuthProfile } from "@/lib/supabase/auth"
import { BoostPostPicker } from "./boost-post-picker"

export const metadata = { title: "Boost Post Existing — Ads" }

export default async function BoostPostPage() {
  const { user, profile } = await getAuthProfile()
  if (!user) redirect("/masuk")
  if (!["super_admin", "admin"].includes(profile?.role || "")) {
    redirect("/dashboard?akses=ditolak")
  }
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-dark">Boost Post Existing</h1>
        <p className="text-sm text-gray-500">
          Ubah post organik MedPersona yang sudah ada menjadi iklan berbayar.
          Pilih post, set budget, lalu approve via WA atau halaman persetujuan.
        </p>
      </div>
      <BoostPostPicker />
    </div>
  )
}
