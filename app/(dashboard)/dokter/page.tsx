import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getAuthProfile } from "@/lib/supabase/auth"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"
import { Users } from "lucide-react"
import Link from "next/link"

export const metadata = { title: "Dokter — MedPersona" }

export const revalidate = 60

export default async function DoctorsPage() {
  const { user, profile } = await getAuthProfile()
  if (!user) redirect("/masuk")
  if (!["super_admin", "admin", "staff"].includes(profile?.role || "")) redirect("/dashboard")

  const supabase = await createClient()
  const { data: doctors } = await supabase
    .from("doctors")
    .select("id, full_name, specialty, tier, subscription_status, monthly_cost_idr, institution, location")
    .order("created_at", { ascending: false })
    .limit(100)

  const tierColors: Record<string, "default" | "info" | "warning" | "success"> = {
    starter: "secondary" as "default", growth: "info", pro: "warning", elite: "success",
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-dark">Dokter</h1>
        <p className="text-sm text-gray-500">{doctors?.length || 0} dokter terdaftar</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {doctors?.map((doc) => (
          <Link key={doc.id} href={`/dokter/${doc.id}`}>
            <Card className="h-full transition-all hover:border-teal/30 hover:shadow-md">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-dark text-lg font-bold text-white">
                    {doc.full_name?.charAt(0) || "D"}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-navy-dark">{doc.full_name}</h3>
                    <p className="text-sm text-gray-500">{doc.specialty || "Spesialis"}</p>
                    <p className="text-xs text-gray-400">{doc.institution || doc.location}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex gap-2">
                    <Badge variant={tierColors[doc.tier] || "secondary"} className="capitalize">{doc.tier}</Badge>
                    <Badge variant={doc.subscription_status === "active" ? "success" : "warning"}>
                      {doc.subscription_status}
                    </Badge>
                  </div>
                  <span className="text-sm font-medium text-navy-dark">
                    {formatCurrency(doc.monthly_cost_idr || 0)}/bln
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
        {(!doctors || doctors.length === 0) && (
          <div className="col-span-full py-20 text-center">
            <Users className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-4 text-gray-500">Belum ada dokter terdaftar</p>
          </div>
        )}
      </div>
    </div>
  )
}
