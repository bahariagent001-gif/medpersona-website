"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { UserPlus } from "lucide-react"

export function DoctorSetupForm({ userName }: { userName?: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const form = new FormData(e.currentTarget)
    const body = {
      fullName: form.get("fullName"),
      specialty: form.get("specialty"),
      institution: form.get("institution"),
      whatsappNumber: form.get("whatsappNumber"),
    }

    try {
      const res = await fetch("/api/profile/setup-doctor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Terjadi kesalahan.")
        setLoading(false)
        return
      }

      router.refresh()
    } catch {
      setError("Gagal menghubungi server. Coba lagi.")
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg py-12">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-teal-light">
          <UserPlus className="h-8 w-8 text-teal-dark" />
        </div>
        <h1 className="text-2xl font-bold text-navy-dark">Lengkapi Profil Anda</h1>
        <p className="mt-2 text-sm text-gray-500">
          Isi data berikut untuk mengaktifkan akun dokter Anda di MedPersona.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Data Dokter</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="fullName" className="mb-1 block text-sm font-medium text-gray-700">
                Nama Lengkap <span className="text-red-500">*</span>
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                required
                defaultValue={userName || ""}
                placeholder="dr. Nama Lengkap, Sp.XX"
                className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-navy-dark placeholder:text-gray-400 focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal"
              />
            </div>

            <div>
              <label htmlFor="specialty" className="mb-1 block text-sm font-medium text-gray-700">
                Spesialisasi <span className="text-red-500">*</span>
              </label>
              <input
                id="specialty"
                name="specialty"
                type="text"
                required
                placeholder="Contoh: Dermatologi, Kardiologi, Umum"
                className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-navy-dark placeholder:text-gray-400 focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal"
              />
            </div>

            <div>
              <label htmlFor="institution" className="mb-1 block text-sm font-medium text-gray-700">
                Institusi / Klinik
              </label>
              <input
                id="institution"
                name="institution"
                type="text"
                placeholder="Contoh: RS Pondok Indah, Klinik Pratama"
                className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-navy-dark placeholder:text-gray-400 focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal"
              />
            </div>

            <div>
              <label htmlFor="whatsappNumber" className="mb-1 block text-sm font-medium text-gray-700">
                Nomor WhatsApp
              </label>
              <input
                id="whatsappNumber"
                name="whatsappNumber"
                type="tel"
                placeholder="08xxxxxxxxxx"
                className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-navy-dark placeholder:text-gray-400 focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal"
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-teal-dark px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-teal disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Menyimpan..." : "Simpan & Lanjutkan"}
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
