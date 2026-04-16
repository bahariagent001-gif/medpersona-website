"use client"

import { useState } from "react"
import { Check } from "lucide-react"

export function ContactForm() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const form = e.currentTarget
    const formData = new FormData(form)

    try {
      const res = await fetch("/api/webhooks/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          specialty: formData.get("specialty"),
          email: formData.get("email"),
          phone: formData.get("phone"),
          interest: formData.get("interest"),
          source: "website",
        }),
      })

      if (!res.ok) {
        throw new Error("Gagal mengirim pesan")
      }

      setSuccess(true)
      form.reset()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white p-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <Check className="h-8 w-8 text-emerald-600" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-navy-dark">Pesan Terkirim!</h3>
        <p className="mt-2 text-sm text-gray-500">
          Terima kasih telah menghubungi kami. Tim kami akan segera merespons.
        </p>
        <button
          onClick={() => setSuccess(false)}
          className="mt-6 text-sm font-medium text-teal-dark hover:underline"
        >
          Kirim pesan lain
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-8">
      <h3 className="text-lg font-semibold text-navy-dark">Kirim Pesan</h3>
      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="mb-1 block text-sm font-medium text-navy-dark">Nama Lengkap</label>
          <input name="name" type="text" required className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20" placeholder="Dr. ..." />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-navy-dark">Spesialisasi</label>
          <input name="specialty" type="text" className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20" placeholder="Spesialis Kulit, Anak, dll." />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-navy-dark">Email</label>
          <input name="email" type="email" required className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20" placeholder="anda@email.com" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-navy-dark">Nomor WhatsApp</label>
          <input name="phone" type="tel" className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20" placeholder="08xx-xxxx-xxxx" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-navy-dark">Pesan</label>
          <textarea name="interest" rows={4} className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20" placeholder="Ceritakan kebutuhan Anda..." />
        </div>

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-teal-dark py-3 text-sm font-semibold text-white transition-colors hover:bg-teal disabled:opacity-50"
        >
          {loading ? "Mengirim..." : "Kirim Pesan"}
        </button>
      </form>
    </div>
  )
}
