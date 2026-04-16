"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"

const specialties = [
  "Dokter Umum",
  "Dokter Gigi",
  "Dermatologi",
  "Kardiologi",
  "Bedah",
  "Anak",
  "THT",
  "Mata",
  "Ortopedi",
  "Paru",
  "Saraf",
  "Obstetri & Ginekologi",
  "Lainnya",
]

export function RegisterForm({ defaultPaket }: { defaultPaket?: string }) {
  const [fullName, setFullName] = useState("")
  const [useTitle, setUseTitle] = useState(true)
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [specialty, setSpecialty] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (password.length < 6) {
      setError("Password minimal 6 karakter")
      setLoading(false)
      return
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: useTitle ? `dr. ${fullName}` : fullName,
          email,
          phone,
          specialty,
          password,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Pendaftaran gagal. Silakan coba lagi.")
        setLoading(false)
        return
      }

      // Registration successful — redirect to package selection
      const paketParam = defaultPaket ? `?paket=${defaultPaket}` : ""
      router.push(`/daftar/paket${paketParam}`)
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.")
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <div>
        <label htmlFor="fullName" className="mb-1.5 block text-sm font-medium text-navy-dark">
          Nama Lengkap
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setUseTitle(!useTitle)}
            className={`shrink-0 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
              useTitle
                ? "border-teal-dark bg-teal-light text-teal-dark"
                : "border-gray-300 text-gray-400 hover:border-gray-400"
            }`}
          >
            dr.
          </button>
          <Input
            id="fullName"
            type="text"
            placeholder="Nama lengkap Anda"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </div>
      </div>

      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-navy-dark">
          Email
        </label>
        <Input
          id="email"
          type="email"
          placeholder="anda@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div>
        <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-navy-dark">
          Nomor WhatsApp
        </label>
        <Input
          id="phone"
          type="tel"
          placeholder="08xxxxxxxxxx"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
      </div>

      <div>
        <label htmlFor="specialty" className="mb-1.5 block text-sm font-medium text-navy-dark">
          Spesialisasi
        </label>
        <select
          id="specialty"
          value={specialty}
          onChange={(e) => setSpecialty(e.target.value)}
          required
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-navy-dark focus:border-teal-dark focus:outline-none focus:ring-1 focus:ring-teal-dark"
        >
          <option value="">Pilih spesialisasi...</option>
          {specialties.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-navy-dark">
          Password
        </label>
        <Input
          id="password"
          type="password"
          placeholder="Minimal 6 karakter"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Mendaftar..." : "Daftar Sekarang"}
      </Button>

      <p className="text-center text-xs text-gray-400">
        Dengan mendaftar, Anda menyetujui syarat dan ketentuan MedPersona.
      </p>
    </form>
  )
}
