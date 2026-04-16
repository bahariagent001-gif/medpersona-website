import type { Metadata } from "next"
import { Mail, Phone, MapPin } from "lucide-react"
import { ContactForm } from "./contact-form"

export const metadata: Metadata = {
  title: "Kontak — MedPersona",
  description: "Hubungi MedPersona untuk konsultasi gratis tentang personal branding dokter.",
}

export default function ContactPage() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-navy-dark">Hubungi Kami</h1>
          <p className="mx-auto mt-3 max-w-xl text-gray-500">
            Konsultasikan kebutuhan media sosial Anda. Kami siap membantu.
          </p>
        </div>

        <div className="mt-14 grid gap-12 lg:grid-cols-2">
          {/* Contact info */}
          <div className="space-y-8">
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-teal-light p-3 text-teal-dark"><Mail className="h-5 w-5" /></div>
              <div>
                <h3 className="font-semibold text-navy-dark">Email</h3>
                <a href="mailto:info@medpersona.id" className="text-teal-dark hover:underline">info@medpersona.id</a>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-teal-light p-3 text-teal-dark"><Phone className="h-5 w-5" /></div>
              <div>
                <h3 className="font-semibold text-navy-dark">WhatsApp</h3>
                <a href="https://wa.me/6285121564154" className="text-teal-dark hover:underline">085-1215-64154</a>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-teal-light p-3 text-teal-dark"><MapPin className="h-5 w-5" /></div>
              <div>
                <h3 className="font-semibold text-navy-dark">Alamat</h3>
                <p className="text-gray-600">
                  PT Apexa Buana Hospita<br />
                  Lavon 2, Viridia 9, Blok H2, No. 28<br />
                  Sindang Jaya, Kabupaten Tangerang<br />
                  Banten, 15560
                </p>
              </div>
            </div>

            <div className="mt-8 rounded-2xl bg-gradient-to-br from-teal-dark to-teal p-8 text-white">
              <h3 className="text-xl font-bold">Konsultasi Gratis</h3>
              <p className="mt-2 text-white/80">
                Dapatkan analisis gratis strategi media sosial untuk praktik Anda. Tanpa komitmen.
              </p>
              <a
                href="https://wa.me/6285121564154"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-block rounded-full bg-white px-6 py-3 text-sm font-semibold text-teal-dark hover:bg-gold-light"
              >
                Chat via WhatsApp
              </a>
            </div>
          </div>

          {/* Contact form */}
          <ContactForm />
        </div>
      </div>
    </section>
  )
}
