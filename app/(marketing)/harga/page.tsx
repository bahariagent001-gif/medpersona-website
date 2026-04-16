import { Check } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Harga — MedPersona",
  description: "Paket harga MedPersona untuk dokter. Mulai dari Rp 299.000/bulan.",
}

const packages = [
  {
    name: "Starter",
    price: "299.000",
    platforms: "Instagram",
    posts: "22 post/bulan",
    videos: "5 video standar",
    features: ["Konten oleh tim profesional", "Riset topik mingguan", "Carousel & single image", "Jadwal posting otomatis", "Approval via web/WhatsApp"],
  },
  {
    name: "Growth",
    price: "649.000",
    platforms: "Instagram + TikTok",
    posts: "40 post/bulan",
    videos: "12 video (4 dengan lip-sync)",
    features: ["Semua fitur Starter", "TikTok content", "8 personal upload/bulan", "Validasi hook oleh editor", "Performa analytics"],
  },
  {
    name: "Pro",
    price: "1.299.000",
    platforms: "IG + TikTok + LinkedIn",
    posts: "60 post/bulan",
    videos: "20 video (12 dengan lip-sync)",
    popular: true,
    features: ["Semua fitur Growth", "LinkedIn professional content", "15 personal upload/bulan", "Brand positioning document", "Riset PubMed & akademik", "Priority support"],
  },
  {
    name: "Elite",
    price: "2.499.000",
    platforms: "Semua Platform",
    posts: "100 post/bulan",
    videos: "40 video (25 lip-sync + expression)",
    features: ["Semua fitur Pro", "Expression-controlled video", "30 personal upload/bulan", "Dedicated account manager", "Custom brand strategy", "Competitor analysis mingguan"],
  },
]

export default function PricingPage() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-gold">Harga Transparan</p>
          <h1 className="mt-3 text-4xl font-bold text-navy-dark">Pilih Paket yang Tepat</h1>
          <p className="mx-auto mt-4 max-w-xl text-gray-500">
            Semua paket termasuk pembuatan konten oleh tim berpengalaman, riset topik, dan jadwal posting otomatis.
            Tidak ada biaya tersembunyi.
          </p>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-4">
          {packages.map((pkg) => (
            <div
              key={pkg.name}
              className={`relative rounded-2xl border p-8 ${
                pkg.popular
                  ? "border-teal-dark bg-white shadow-xl ring-2 ring-teal-dark"
                  : "border-gray-200 bg-white shadow-sm"
              }`}
            >
              {pkg.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-teal-dark px-4 py-1 text-xs font-bold text-white">
                  Paling Populer
                </span>
              )}
              <h3 className="text-xl font-bold text-navy-dark">{pkg.name}</h3>
              <div className="mt-4">
                <span className="text-4xl font-bold text-navy-dark">Rp {pkg.price}</span>
                <span className="text-sm text-gray-500">/bulan</span>
              </div>
              <p className="mt-2 text-sm text-gray-500">{pkg.platforms}</p>
              <div className="mt-4 rounded-lg bg-teal-light/50 px-3 py-2 text-sm font-medium text-teal-dark">
                {pkg.posts} + {pkg.videos}
              </div>
              <ul className="mt-6 space-y-3">
                {pkg.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-gray-600">
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-teal-dark" />
                    {feature}
                  </li>
                ))}
              </ul>
              <a
                href={`/daftar?paket=${pkg.name.toLowerCase()}`}
                className={`mt-8 block rounded-lg py-3 text-center text-sm font-semibold transition-colors ${
                  pkg.popular
                    ? "bg-teal-dark text-white hover:bg-teal"
                    : "border-2 border-teal-dark text-teal-dark hover:bg-teal-dark hover:text-white"
                }`}
              >
                Mulai Sekarang
              </a>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-sm text-gray-500">
            Butuh paket khusus? <a href="https://wa.me/6285121564154" className="text-teal-dark hover:underline">Hubungi kami</a> untuk penawaran custom.
          </p>
        </div>
      </div>
    </section>
  )
}
