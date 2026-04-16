"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Check } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

const packages = [
  {
    key: "starter",
    name: "Starter",
    price: "299.000",
    priceNum: 299000,
    platforms: "Instagram",
    posts: "22 post/bulan",
    videos: "5 video standar",
    features: ["Konten oleh tim profesional", "Riset topik mingguan", "Carousel & single image", "Jadwal posting otomatis", "Approval via web/WhatsApp"],
  },
  {
    key: "growth",
    name: "Growth",
    price: "649.000",
    priceNum: 649000,
    platforms: "Instagram + TikTok",
    posts: "40 post/bulan",
    videos: "12 video (4 dengan lip-sync)",
    features: ["Semua fitur Starter", "TikTok content", "8 personal upload/bulan", "Validasi hook oleh editor", "Performa analytics"],
  },
  {
    key: "pro",
    name: "Pro",
    price: "1.299.000",
    priceNum: 1299000,
    platforms: "IG + TikTok + LinkedIn",
    posts: "60 post/bulan",
    videos: "20 video (12 dengan lip-sync)",
    popular: true,
    features: ["Semua fitur Growth", "LinkedIn professional content", "15 personal upload/bulan", "Brand positioning document", "Riset akademik & referensi", "Priority support"],
  },
  {
    key: "elite",
    name: "Elite",
    price: "2.499.000",
    priceNum: 2499000,
    platforms: "Semua Platform",
    posts: "100 post/bulan",
    videos: "40 video (25 lip-sync + expression)",
    features: ["Semua fitur Pro", "Expression-controlled video", "30 personal upload/bulan", "Dedicated account manager", "Custom brand strategy", "Analisis kompetitor mingguan"],
  },
]

export function PackageSelection() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [selected, setSelected] = useState(searchParams.get("paket") || "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSelect(tier: string) {
    setSelected(tier)
    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/payment/create-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Gagal membuat tagihan. Silakan coba lagi.")
        setLoading(false)
        return
      }

      // Redirect to Xendit payment page
      if (data.invoiceUrl) {
        window.location.href = data.invoiceUrl
      } else {
        router.push("/dashboard?pembayaran=pending")
      }
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl px-6 py-12">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <Link href="/">
            <Image src="/logo.png" alt="MedPersona" width={120} height={40} />
          </Link>
          <Link href="/masuk" className="text-sm text-gray-500 hover:text-teal-dark">
            Sudah punya akun? Masuk
          </Link>
        </div>

        <div className="text-center">
          <h1 className="text-3xl font-bold text-navy-dark">Pilih Paket Anda</h1>
          <p className="mt-3 text-gray-500">
            Semua paket termasuk pembuatan konten oleh tim berpengalaman, riset topik, dan jadwal posting otomatis.
          </p>
          <div className="mt-2 flex items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-light px-3 py-1 text-xs font-medium text-teal-dark">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-dark" />
              Bank Transfer, QRIS, OVO, DANA, ShopeePay
            </span>
          </div>
        </div>

        {error && (
          <div className="mx-auto mt-6 max-w-lg rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-10 grid gap-6 lg:grid-cols-4">
          {packages.map((pkg) => (
            <div
              key={pkg.key}
              className={`relative rounded-2xl border p-6 transition-all ${
                selected === pkg.key
                  ? "border-teal-dark bg-white shadow-xl ring-2 ring-teal-dark"
                  : pkg.popular
                  ? "border-teal-dark bg-white shadow-lg ring-2 ring-teal-dark"
                  : "border-gray-200 bg-white shadow-sm hover:shadow-md"
              }`}
            >
              {pkg.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-teal-dark px-4 py-1 text-xs font-bold text-white">
                  Paling Populer
                </span>
              )}
              <h3 className="text-xl font-bold text-navy-dark">{pkg.name}</h3>
              <div className="mt-3">
                <span className="text-3xl font-bold text-navy-dark">Rp {pkg.price}</span>
                <span className="text-sm text-gray-500">/bulan</span>
              </div>
              <p className="mt-1.5 text-sm text-gray-500">{pkg.platforms}</p>
              <div className="mt-3 rounded-lg bg-teal-light/50 px-3 py-2 text-sm font-medium text-teal-dark">
                {pkg.posts} + {pkg.videos}
              </div>
              <ul className="mt-5 space-y-2.5">
                {pkg.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-gray-600">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-teal-dark" />
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleSelect(pkg.key)}
                disabled={loading}
                className={`mt-6 block w-full rounded-lg py-3 text-center text-sm font-semibold transition-colors ${
                  pkg.popular || selected === pkg.key
                    ? "bg-teal-dark text-white hover:bg-teal"
                    : "border-2 border-teal-dark text-teal-dark hover:bg-teal-dark hover:text-white"
                } ${loading && selected === pkg.key ? "opacity-50" : ""}`}
              >
                {loading && selected === pkg.key ? "Memproses..." : "Pilih Paket Ini"}
              </button>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-gray-400">
          Anda dapat membayar dengan transfer bank (BCA, BNI, BSI, Mandiri, BRI), QRIS, OVO, DANA, atau ShopeePay.
          <br />
          Tidak perlu kartu kredit.
        </p>
      </div>
    </div>
  )
}
