import { LoginForm } from "./login-form"
import Image from "next/image"
import Link from "next/link"

export const metadata = {
  title: "Masuk — MedPersona",
  description: "Masuk ke dashboard MedPersona",
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; error?: string }>
}) {
  const params = await searchParams

  return (
    <div className="flex min-h-screen">
      {/* Left panel - branding */}
      <div className="hidden w-1/2 flex-col justify-between bg-navy-dark p-12 lg:flex">
        <Link href="/">
          <Image src="/logo.png" alt="MedPersona" width={140} height={48} className="brightness-0 invert" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white">
            Turn Expertise Into Influence
          </h1>
          <p className="mt-4 text-lg text-gray-400">
            Kelola konten media sosial, setujui postingan, dan lacak performa — semua dalam satu platform.
          </p>
        </div>
        <div>
          <Image src="/logo.png" alt="MedPersona" width={100} height={34} className="brightness-0 invert mb-2" />
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} PT Apexa Buana Hospita
          </p>
        </div>
      </div>

      {/* Right panel - login form */}
      <div className="flex w-full items-center justify-center px-6 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Image src="/logo.png" alt="MedPersona" width={140} height={48} />
          </div>
          <h2 className="text-2xl font-bold text-navy-dark">Masuk</h2>
          <p className="mt-2 text-sm text-gray-500">
            Masukkan email Anda untuk mengakses dashboard
          </p>

          {params.error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              Autentikasi gagal. Silakan coba lagi.
            </div>
          )}

          <LoginForm redirectTo={params.redirect} />

          <p className="mt-8 text-center text-xs text-gray-400">
            Belum punya akun?{" "}
            <Link href="/daftar" className="font-medium text-teal-dark hover:underline">
              Daftar di sini
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
