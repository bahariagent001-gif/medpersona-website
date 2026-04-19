"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"

// Daftar spesialisasi mengacu pada nomenklatur KKI/PB IDI & PB PDGI.
// Dikelompokkan agar navigasi dropdown tetap nyaman meski lengkap.
// "Lainnya (isi manual)" memicu input teks bebas — handle di submit.
const MANUAL_OPTION = "__manual__"

const specialtyGroups: { label: string; items: string[] }[] = [
  {
    label: "Layanan Primer",
    items: [
      "Dokter Umum",
      "Dokter Gigi Umum",
      "Dokter Keluarga Layanan Primer (Sp.KKLP)",
    ],
  },
  {
    label: "Spesialis Dasar & Ibu-Anak",
    items: [
      "Penyakit Dalam (Sp.PD)",
      "Ilmu Kesehatan Anak (Sp.A)",
      "Obstetri & Ginekologi (Sp.OG)",
      "Bedah Umum (Sp.B)",
    ],
  },
  {
    label: "Anestesi & Gawat Darurat",
    items: [
      "Anestesiologi & Terapi Intensif (Sp.An)",
      "Emergensi Medik (Sp.EM)",
    ],
  },
  {
    label: "Bedah Sub-Spesialis",
    items: [
      "Bedah Anak (Sp.BA)",
      "Bedah Digestif (Sp.B-KBD)",
      "Bedah Onkologi (Sp.B-KOnk)",
      "Bedah Ortopedi & Traumatologi (Sp.OT)",
      "Bedah Plastik Rekonstruksi & Estetik (Sp.BP-RE)",
      "Bedah Saraf (Sp.BS)",
      "Bedah Thoraks Kardiovaskular (Sp.BTKV)",
      "Bedah Vaskular (Sp.BVE)",
      "Urologi (Sp.U)",
    ],
  },
  {
    label: "Jantung, Paru, Saraf & Indera",
    items: [
      "Kardiologi & Kedokteran Vaskular (Sp.JP)",
      "Pulmonologi & Kedokteran Respirasi (Sp.P)",
      "Neurologi (Sp.N)",
      "Dermatologi & Venereologi / Kulit-Kelamin (Sp.DV / Sp.KK)",
      "Oftalmologi / Mata (Sp.M)",
      "THT-Bedah Kepala Leher (Sp.THT-KL)",
    ],
  },
  {
    label: "Jiwa & Perilaku",
    items: [
      "Kedokteran Jiwa / Psikiatri (Sp.KJ)",
    ],
  },
  {
    label: "Diagnostik, Laboratorium & Onkologi",
    items: [
      "Radiologi (Sp.Rad)",
      "Patologi Anatomik (Sp.PA)",
      "Patologi Klinik (Sp.PK)",
      "Mikrobiologi Klinik (Sp.MK)",
      "Parasitologi Klinik (Sp.Par.K)",
      "Kedokteran Nuklir (Sp.KN)",
      "Onkologi Radiasi (Sp.Onk.Rad)",
      "Hematologi-Onkologi Medik",
    ],
  },
  {
    label: "Rehabilitasi & Kedokteran Khusus",
    items: [
      "Kedokteran Fisik & Rehabilitasi (Sp.KFR)",
      "Gizi Klinik (Sp.GK)",
      "Kedokteran Olahraga (Sp.KO)",
      "Kedokteran Okupasi (Sp.Ok)",
      "Kedokteran Penerbangan (Sp.KP)",
      "Kedokteran Kelautan (Sp.KL)",
      "Akupunktur Medik (Sp.Ak)",
      "Andrologi (Sp.And)",
      "Farmakologi Klinik (Sp.FK)",
      "Forensik & Medikolegal (Sp.FM)",
    ],
  },
  {
    label: "Spesialis Kedokteran Gigi",
    items: [
      "Bedah Mulut & Maksilofasial (Sp.BM)",
      "Ortodonti (Sp.Ort)",
      "Periodonsia (Sp.Perio)",
      "Konservasi Gigi / Endodonsia (Sp.KG)",
      "Prostodonsia (Sp.Pros)",
      "Ilmu Penyakit Mulut (Sp.PM)",
      "Kedokteran Gigi Anak (Sp.KGA)",
      "Radiologi Kedokteran Gigi (Sp.RKG)",
    ],
  },
]

export function RegisterForm({ defaultPaket }: { defaultPaket?: string }) {
  const [fullName, setFullName] = useState("")
  const [useTitle, setUseTitle] = useState(true)
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [specialty, setSpecialty] = useState("")
  const [specialtyManual, setSpecialtyManual] = useState("")
  const [password, setPassword] = useState("")

  const isManual = specialty === MANUAL_OPTION
  const effectiveSpecialty = isManual ? specialtyManual.trim() : specialty
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

    if (!effectiveSpecialty) {
      setError(isManual ? "Tulis spesialisasi Anda." : "Pilih spesialisasi Anda.")
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
          specialty: effectiveSpecialty,
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
          {specialtyGroups.map((group) => (
            <optgroup key={group.label} label={group.label}>
              {group.items.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </optgroup>
          ))}
          <option value={MANUAL_OPTION}>Lainnya — tulis manual</option>
        </select>
        {isManual && (
          <div className="mt-2">
            <Input
              id="specialtyManual"
              type="text"
              placeholder="Tulis spesialisasi Anda (mis. Sp.GK Konsultan Nutrisi Anak)"
              value={specialtyManual}
              onChange={(e) => setSpecialtyManual(e.target.value)}
              required
              autoFocus
            />
            <p className="mt-1 text-xs text-gray-400">
              Tidak menemukan spesialisasi Anda di daftar? Silakan tulis persis seperti yang tercantum di STR/SIP.
            </p>
          </div>
        )}
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
