import { RegisterForm } from "./register-form"
import Image from "next/image"
import Link from "next/link"

export const metadata = {
  title: "Daftar — MedPersona",
  description: "Bergabung dengan MedPersona — agensi media sosial untuk dokter Indonesia.",
}

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ paket?: string; error?: string }>
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
            Bergabung dengan MedPersona
          </h1>
          <p className="mt-4 text-lg text-gray-400">
            Kelola media sosial Anda tanpa repot. Tim profesional kami
            membuat konten, menjadwalkan posting, dan membantu Anda
            menjangkau lebih banyak pasien.
          </p>
          <ul className="mt-6 space-y-3 text-gray-400">
            <li className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-dark text-xs text-white">✓</span>
              Konten dibuat oleh tim berpengalaman
            </li>
            <li className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-dark text-xs text-white">✓</span>
              Posting otomatis ke Instagram, TikTok, LinkedIn
            </li>
            <li className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-dark text-xs text-white">✓</span>
              Anda cukup setujui — kami yang mengerjakan sisanya
            </li>
          </ul>
        </div>
        <div>
          <Image src="/logo.png" alt="MedPersona" width={100} height={34} className="brightness-0 invert mb-2" />
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} PT Apexa Buana Hospita
          </p>
        </div>
      </div>

      {/* Right panel - register form */}
      <div className="flex w-full items-center justify-center px-6 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Image src="/logo.png" alt="MedPersona" width={140} height={48} />
          </div>
          <h2 className="text-2xl font-bold text-navy-dark">Buat Akun</h2>
          <p className="mt-2 text-sm text-gray-500">
            Daftarkan diri Anda untuk mulai menggunakan MedPersona
          </p>

          {params.error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {params.error === "email_taken"
                ? "Email sudah terdaftar. Silakan masuk."
                : params.error === "validation"
                ? "Data tidak lengkap. Periksa kembali formulir."
                : "Pendaftaran gagal. Silakan coba lagi."}
            </div>
          )}

          <RegisterForm defaultPaket={params.paket} />

          <p className="mt-8 text-center text-xs text-gray-400">
            Sudah punya akun?{" "}
            <Link href="/masuk" className="font-medium text-teal-dark hover:underline">
              Masuk di sini
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
