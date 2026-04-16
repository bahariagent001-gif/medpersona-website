import type { Metadata } from "next"
import { Users, Brain, Zap, Shield } from "lucide-react"

export const metadata: Metadata = {
  title: "Tentang — MedPersona",
  description: "MedPersona oleh PT Apexa Buana Hospita — agensi media sosial profesional untuk dokter Indonesia.",
}

const values = [
  {
    icon: Brain,
    title: "Kualitas Utama",
    desc: "Konten dibuat oleh tim kreatif yang memahami dunia medis, memastikan akurasi dan relevansi setiap postingan.",
  },
  {
    icon: Zap,
    title: "Efisien & Terstruktur",
    desc: "Dari riset topik hingga posting — sistem kerja terstruktur memastikan konten Anda terbit tepat waktu.",
  },
  {
    icon: Shield,
    title: "Evidence-Based",
    desc: "Setiap klaim didukung riset PubMed dan referensi akademik. Tidak ada clickbait tanpa dasar.",
  },
  {
    icon: Users,
    title: "Doctor-Centric",
    desc: "Didesain khusus untuk tenaga medis. Brand voice, gaya visual, dan strategi disesuaikan per dokter.",
  },
]

export default function AboutPage() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-6xl px-6">
        {/* Hero */}
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-gold">Tentang Kami</p>
          <h1 className="mt-3 text-4xl font-bold text-navy-dark">
            Membangun Personal Brand Dokter Bersama Tim Ahli
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-500">
            MedPersona adalah agensi media sosial yang dibangun khusus untuk dokter Indonesia.
            Kami menggabungkan teknologi modern dengan pemahaman mendalam tentang dunia medis.
          </p>
        </div>

        {/* Story */}
        <div className="mt-20 grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="text-2xl font-bold text-navy-dark">Cerita Kami</h2>
            <div className="mt-4 space-y-4 text-gray-600 leading-relaxed">
              <p>
                Dokter adalah salah satu profesi paling dipercaya di masyarakat. Tapi di era digital,
                kepercayaan itu perlu dibangun secara online — di mana pasien pertama kali mencari informasi
                kesehatan.
              </p>
              <p>
                Masalahnya, dokter tidak punya waktu untuk membuat konten secara konsisten.
                Antara praktik, riset, dan kehidupan pribadi, media sosial sering menjadi prioritas terakhir.
              </p>
              <p>
                MedPersona hadir untuk menyelesaikan masalah itu. Dengan pipeline otomatis dari riset topik,
                pembuatan konten, hingga posting — dokter hanya perlu menyetujui konten dan fokus pada pasien mereka.
              </p>
            </div>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-navy-dark to-navy p-10 text-white">
            <h3 className="text-xl font-bold">PT Apexa Buana Hospita</h3>
            <p className="mt-3 text-white/80">
              Perusahaan teknologi yang berfokus pada solusi digital untuk industri kesehatan Indonesia.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-6">
              <div>
                <p className="text-3xl font-bold text-gold">10+</p>
                <p className="mt-1 text-sm text-white/60">Spesialisasi Dilayani</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-gold">100+</p>
                <p className="mt-1 text-sm text-white/60">Konten/Bulan per Dokter</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-gold">3</p>
                <p className="mt-1 text-sm text-white/60">Platform Sosmed</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-gold">24/7</p>
                <p className="mt-1 text-sm text-white/60">Dukungan Tim</p>
              </div>
            </div>
          </div>
        </div>

        {/* Values */}
        <div className="mt-20">
          <h2 className="text-center text-2xl font-bold text-navy-dark">Nilai Kami</h2>
          <div className="mt-10 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {values.map((v) => (
              <div key={v.title} className="rounded-2xl border border-gray-200 bg-white p-6">
                <div className="inline-flex rounded-lg bg-teal-light p-3 text-teal-dark">
                  <v.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-navy-dark">{v.title}</h3>
                <p className="mt-2 text-sm text-gray-500 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-20 rounded-2xl bg-gradient-to-br from-teal-dark to-teal p-12 text-center text-white">
          <h2 className="text-3xl font-bold">Siap Membangun Personal Brand?</h2>
          <p className="mx-auto mt-3 max-w-lg text-white/80">
            Konsultasi gratis — kami analisis profil media sosial Anda dan berikan rekomendasi strategi.
          </p>
          <a
            href="https://wa.me/6285121564154"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-block rounded-full bg-white px-8 py-3 text-sm font-semibold text-teal-dark hover:bg-gold-light"
          >
            Konsultasi Gratis
          </a>
        </div>
      </div>
    </section>
  )
}
