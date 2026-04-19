import Link from "next/link"
import Image from "next/image"

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-6 text-center">
      <Image src="/logo.png" alt="MedPersona" width={48} height={48} className="mb-8 h-12 w-12 object-contain" />
      <div className="mb-4 text-6xl font-bold text-gray-200">404</div>
      <h1 className="text-xl font-bold text-navy-dark">Halaman Tidak Ditemukan</h1>
      <p className="mt-2 max-w-sm text-sm text-gray-500">
        Halaman yang Anda cari tidak ada atau sudah dipindahkan.
      </p>
      <div className="mt-6 flex gap-3">
        <Link
          href="/"
          className="rounded-lg border border-gray-200 px-6 py-2.5 text-sm font-semibold text-navy-dark hover:bg-gray-100"
        >
          Beranda
        </Link>
        <Link
          href="/masuk"
          className="rounded-lg bg-teal-dark px-6 py-2.5 text-sm font-semibold text-white hover:bg-teal"
        >
          Masuk
        </Link>
      </div>
    </div>
  )
}
