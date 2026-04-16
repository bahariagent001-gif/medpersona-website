import Image from "next/image"
import Link from "next/link"

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/">
            <Image src="/logo.png" alt="MedPersona" width={140} height={48} priority />
          </Link>
          <nav className="hidden items-center gap-8 md:flex">
            <Link href="/harga" className="text-sm font-medium text-gray-600 hover:text-teal-dark">
              Harga
            </Link>
            <Link href="/tentang" className="text-sm font-medium text-gray-600 hover:text-teal-dark">
              Tentang
            </Link>
            <Link href="/blog" className="text-sm font-medium text-gray-600 hover:text-teal-dark">
              Blog
            </Link>
            <Link href="/kontak" className="text-sm font-medium text-gray-600 hover:text-teal-dark">
              Kontak
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/masuk"
              className="hidden text-sm font-medium text-gray-600 hover:text-teal-dark sm:block"
            >
              Masuk
            </Link>
            <Link
              href="/daftar"
              className="rounded-full bg-teal-dark px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal"
            >
              Daftar
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="bg-navy-dark py-10 text-gray-400">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <Image src="/logo.png" alt="MedPersona" width={120} height={40} className="brightness-0 invert" />
              <p className="mt-3 text-sm">Turn Expertise Into Influence</p>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-semibold text-white">Layanan</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/harga" className="hover:text-teal">Paket & Harga</Link></li>
                <li><Link href="/tentang" className="hover:text-teal">Tentang Kami</Link></li>
                <li><Link href="/blog" className="hover:text-teal">Blog</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-semibold text-white">Kontak</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="mailto:info@medpersona.id" className="hover:text-teal">info@medpersona.id</a></li>
                <li><a href="tel:+6285121564154" className="hover:text-teal">085-1215-64154</a></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-semibold text-white">Perusahaan</h4>
              <p className="text-sm text-white">PT Apexa Buana Hospita</p>
              <p className="mt-1 text-sm">
                Lavon 2, Viridia 9, Blok H2 No. 28<br />
                Sindang Jaya, Kab. Tangerang<br />
                Banten 15560
              </p>
            </div>
          </div>
          <div className="mt-8 border-t border-gray-700 pt-6 text-center text-xs">
            &copy; {new Date().getFullYear()} PT Apexa Buana Hospita. All rights reserved.
          </div>
        </div>
      </footer>
    </>
  )
}
