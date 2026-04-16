import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getAuthProfile } from "@/lib/supabase/auth"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { InvoiceList } from "./invoice-list"

export const metadata = {
  title: "Tagihan — MedPersona",
}

export const revalidate = 60

export default async function InvoicesPage() {
  const { user, profile } = await getAuthProfile()
  if (!user) redirect("/masuk")
  if (!["super_admin", "admin"].includes(profile?.role || "")) redirect("/dashboard")
  const supabase = await createClient()

  const { data: invoices } = await supabase
    .from("invoices")
    .select("id, doctor_id, type, period, amount_idr, status, paid_at, created_at, doctors(full_name)")
    .order("created_at", { ascending: false })
    .limit(200)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/keuangan" className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-navy-dark">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-navy-dark">Tagihan</h1>
          <p className="text-sm text-gray-500">Invoice & Accounts Receivable</p>
        </div>
      </div>

      <InvoiceList invoices={(invoices as any) || []} />
    </div>
  )
}
