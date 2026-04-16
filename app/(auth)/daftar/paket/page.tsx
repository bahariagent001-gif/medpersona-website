import { Suspense } from "react"
import { PackageSelection } from "./package-selection"

export const metadata = {
  title: "Pilih Paket — MedPersona",
  description: "Pilih paket langganan MedPersona untuk memulai.",
}

export default function PackageSelectionPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Memuat...</p>
      </div>
    }>
      <PackageSelection />
    </Suspense>
  )
}
