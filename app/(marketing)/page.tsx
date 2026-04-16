import Link from "next/link"
import { Check } from "lucide-react"

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="flex flex-1 items-center bg-gradient-to-br from-white via-teal-light to-white">
        <div className="mx-auto max-w-6xl px-6 py-20 text-center md:py-32">
          <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-gold">
            Turn Expertise Into Influence
          </p>
          <h1 className="mx-auto max-w-3xl text-4xl font-bold leading-tight text-navy-dark md:text-5xl lg:text-6xl">
            Agensi Media Sosial Khusus untuk{" "}
            <span className="text-teal-dark">Dokter & Tenaga Medis</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-600">
            MedPersona membantu dokter dan profesional kesehatan membangun personal
            branding dan kehadiran digital yang profesional — sehingga keahlian Anda
            menjangkau lebih banyak pasien yang membutuhkan.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <a
              href="https://wa.me/6285121564154"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-teal-dark px-8 py-3.5 text-base font-semibold text-white shadow-lg transition-all hover:bg-teal hover:shadow-xl"
            >
              Konsultasi Gratis
            </a>
            <Link
              href="/harga"
              className="rounded-full border-2 border-teal-dark px-8 py-3.5 text-base font-semibold text-teal-dark transition-colors hover:bg-teal-dark hover:text-white"
            >
              Lihat Harga
            </Link>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-3xl font-bold text-navy-dark">
            Layanan Kami
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-gray-500">
            Solusi lengkap untuk membangun kehadiran digital profesional Anda
          </p>
          <div className="mt-14 grid gap-8 md:grid-cols-3">
            <ServiceCard
              title="Manajemen Media Sosial"
              description="Pengelolaan konten harian untuk Instagram, TikTok, dan LinkedIn — dirancang khusus untuk audiens kesehatan."
              icon={
                <svg className="h-8 w-8 text-teal-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                </svg>
              }
            />
            <ServiceCard
              title="Personal Branding"
              description="Strategi dan konten yang memposisikan Anda sebagai pemimpin opini di bidang spesialisasi Anda."
              icon={
                <svg className="h-8 w-8 text-teal-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
              }
            />
            <ServiceCard
              title="Konten Edukasi Kesehatan"
              description="Carousel, video, dan artikel yang mengedukasi pasien sekaligus meningkatkan kredibilitas praktik Anda."
              icon={
                <svg className="h-8 w-8 text-teal-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
              }
            />
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-3xl font-bold text-navy-dark">
            Paket yang Terjangkau
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-gray-500">
            Pilih paket yang sesuai dengan kebutuhan praktik Anda
          </p>
          <div className="mt-14 grid gap-6 md:grid-cols-4">
            {[
              { name: "Starter", price: "299K", platform: "Instagram", posts: "22 post/bln" },
              { name: "Growth", price: "649K", platform: "IG + TikTok", posts: "40 post/bln" },
              { name: "Pro", price: "1.299K", platform: "IG + TT + LinkedIn", posts: "60 post/bln", popular: true },
              { name: "Elite", price: "2.499K", platform: "Semua Platform", posts: "100 post/bln" },
            ].map((pkg) => (
              <div
                key={pkg.name}
                className={`rounded-2xl border p-6 ${
                  pkg.popular
                    ? "border-teal-dark bg-white shadow-lg ring-2 ring-teal-dark"
                    : "border-gray-200 bg-white"
                }`}
              >
                {pkg.popular && (
                  <span className="mb-4 inline-block rounded-full bg-teal-dark px-3 py-1 text-xs font-semibold text-white">
                    Populer
                  </span>
                )}
                <h3 className="text-lg font-bold text-navy-dark">{pkg.name}</h3>
                <div className="mt-2">
                  <span className="text-3xl font-bold text-navy-dark">Rp {pkg.price}</span>
                  <span className="text-sm text-gray-500">/bulan</span>
                </div>
                <ul className="mt-6 space-y-2.5">
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <Check className="h-4 w-4 text-teal-dark" />
                    {pkg.platform}
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <Check className="h-4 w-4 text-teal-dark" />
                    {pkg.posts}
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <Check className="h-4 w-4 text-teal-dark" />
                    Konten profesional
                  </li>
                </ul>
                <a
                  href={`/daftar?paket=${pkg.name.toLowerCase()}`}
                  className={`mt-6 block rounded-lg py-2.5 text-center text-sm font-semibold transition-colors ${
                    pkg.popular
                      ? "bg-teal-dark text-white hover:bg-teal"
                      : "border border-teal-dark text-teal-dark hover:bg-teal-dark hover:text-white"
                  }`}
                >
                  Mulai Sekarang
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section className="bg-navy-dark py-20 text-white">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div>
              <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-gold">
                Tentang Kami
              </p>
              <h2 className="text-3xl font-bold">
                MedPersona oleh PT Apexa Buana Hospita
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-gray-300">
                Kami memahami bahwa dokter dan tenaga medis memiliki keahlian luar biasa
                yang layak diketahui lebih banyak orang. Misi kami: membantu para profesional
                kesehatan mengubah keahlian menjadi pengaruh positif.
              </p>
            </div>
            <div className="rounded-2xl bg-white/10 p-8 backdrop-blur-sm">
              <h3 className="text-xl font-semibold text-gold">Informasi Perusahaan</h3>
              <dl className="mt-6 space-y-4 text-gray-300">
                <div>
                  <dt className="text-sm font-medium text-gray-400">Nama Perusahaan</dt>
                  <dd className="mt-1 text-white">PT Apexa Buana Hospita</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-400">Alamat</dt>
                  <dd className="mt-1">Lavon 2, Viridia 9, Blok H2, No. 28, Sindang Jaya, Kab. Tangerang, Banten 15560</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-400">Email</dt>
                  <dd className="mt-1"><a href="mailto:info@medpersona.id" className="text-teal hover:text-teal-light">info@medpersona.id</a></dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-teal-dark to-teal py-16">
        <div className="mx-auto max-w-3xl px-6 text-center text-white">
          <h2 className="text-3xl font-bold">Siap Membangun Kehadiran Digital Anda?</h2>
          <p className="mt-4 text-lg text-white/80">
            Konsultasikan kebutuhan media sosial Anda — gratis, tanpa komitmen.
          </p>
          <a
            href="https://wa.me/6285121564154"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-block rounded-full bg-white px-8 py-3.5 text-base font-semibold text-teal-dark shadow-lg transition-all hover:bg-gold-light hover:shadow-xl"
          >
            Hubungi via WhatsApp
          </a>
        </div>
      </section>
    </>
  )
}

function ServiceCard({
  title,
  description,
  icon,
}: {
  title: string
  description: string
  icon: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-teal-light">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-navy-dark">{title}</h3>
      <p className="mt-3 leading-relaxed text-gray-500">{description}</p>
    </div>
  )
}
