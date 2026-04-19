import Link from "next/link"

export default function DashboardNotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 text-6xl font-bold text-gray-200">404</div>
      <h1 className="text-xl font-bold text-navy-dark">Halaman Tidak Ditemukan</h1>
      <p className="mt-2 max-w-sm text-sm text-gray-500">
        Halaman yang Anda cari tidak ada atau sudah dipindahkan.
      </p>
      <Link
        href="/dashboard"
        className="mt-6 rounded-lg bg-teal-dark px-6 py-2.5 text-sm font-semibold text-white hover:bg-teal"
      >
        Kembali ke Dashboard
      </Link>
    </div>
  )
}
