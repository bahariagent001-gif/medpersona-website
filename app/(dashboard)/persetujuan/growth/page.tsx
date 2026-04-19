import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getAuthProfile } from "@/lib/supabase/auth"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { GrowthApprovalActions } from "./growth-approval-actions"

export const metadata = { title: "Growth Approvals — MedPersona" }
export const revalidate = 15

export default async function GrowthApprovalsPage() {
  const { user, profile } = await getAuthProfile()
  if (!user) redirect("/masuk")
  if (!["super_admin", "admin"].includes(profile?.role || "")) redirect("/dashboard?akses=ditolak")

  const supabase = await createClient()
  const { data } = await supabase
    .from("approvals_pending")
    .select("id, type, title, summary, payload, risk_level, proposed_by, status, created_at, expires_at, wa_sent_at")
    .in("status", ["pending", "notified"])
    .order("created_at", { ascending: false })
    .limit(100)

  const rows = data || []

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-dark">Growth Approvals</h1>
          <p className="text-sm text-gray-500">
            Keputusan otonomi iklan, kreatif, SEO, dan outreach yang menunggu persetujuan
          </p>
        </div>
        <Badge variant="outline">{rows.length} pending</Badge>
      </div>

      <div className="grid gap-4">
        {rows.map((a) => (
          <Card key={a.id}>
            <CardHeader className="flex-row items-start justify-between space-y-0 gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="capitalize">{a.type.replace("_", " ")}</Badge>
                  <Badge variant={
                    a.risk_level === "high" ? "danger" :
                    a.risk_level === "low" ? "success" : "secondary"
                  }>{a.risk_level}</Badge>
                  <span className="text-xs text-gray-400">{new Date(a.created_at).toLocaleString("id-ID")}</span>
                </div>
                <CardTitle className="text-base">{a.title}</CardTitle>
                {a.summary && <p className="text-sm text-gray-600 mt-1">{a.summary}</p>}
              </div>
            </CardHeader>
            <CardContent>
              <details className="mb-4">
                <summary className="cursor-pointer text-xs font-medium text-gray-500 hover:text-gray-700">
                  Lihat payload lengkap
                </summary>
                <pre className="mt-2 overflow-auto rounded bg-gray-50 p-3 text-xs">
                  {JSON.stringify(a.payload, null, 2)}
                </pre>
              </details>
              <GrowthApprovalActions approvalId={a.id} />
            </CardContent>
          </Card>
        ))}
        {rows.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-gray-400">
              Tidak ada persetujuan yang tertunda
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
