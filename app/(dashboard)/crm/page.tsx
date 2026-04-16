import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getAuthProfile } from "@/lib/supabase/auth"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"
import { Target, User, Phone, Mail } from "lucide-react"

export const metadata = { title: "CRM — MedPersona" }

export const revalidate = 60

const STAGES = [
  { value: "new", label: "Baru", color: "bg-gray-100" },
  { value: "contacted", label: "Dihubungi", color: "bg-blue-50" },
  { value: "qualified", label: "Qualified", color: "bg-amber-50" },
  { value: "demo_sent", label: "Demo Terkirim", color: "bg-purple-50" },
  { value: "negotiating", label: "Negosiasi", color: "bg-orange-50" },
  { value: "won", label: "Won", color: "bg-emerald-50" },
  { value: "lost", label: "Lost", color: "bg-red-50" },
]

export default async function CRMPage() {
  const { user, profile } = await getAuthProfile()
  if (!user) redirect("/masuk")
  if (!["super_admin", "admin", "staff"].includes(profile?.role || "")) redirect("/dashboard")

  const supabase = await createClient()
  const { data: leads } = await supabase
    .from("leads")
    .select("id, name, specialty, source, stage, score, tier_interest, phone, created_at")
    .order("created_at", { ascending: false })
    .limit(200)

  const leadsByStage = STAGES.map((stage) => ({
    ...stage,
    leads: leads?.filter((l) => l.stage === stage.value) || [],
  }))

  const sourceColors: Record<string, "default" | "info" | "warning" | "success"> = {
    website: "info",
    whatsapp: "success",
    ads: "warning",
    referral: "default",
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-dark">CRM Pipeline</h1>
        <p className="text-sm text-gray-500">{leads?.length || 0} total leads</p>
      </div>

      {/* Kanban board */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4" style={{ minWidth: `${STAGES.length * 280}px` }}>
          {leadsByStage.map((stage) => (
            <div key={stage.value} className="w-[280px] flex-shrink-0">
              <div className={`rounded-t-lg ${stage.color} px-4 py-3`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-navy-dark">{stage.label}</h3>
                  <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-gray-600">
                    {stage.leads.length}
                  </span>
                </div>
              </div>
              <div className="space-y-3 rounded-b-lg border border-t-0 border-gray-200 bg-gray-50/50 p-3" style={{ minHeight: "200px" }}>
                {stage.leads.map((lead) => (
                  <Card key={lead.id} className="shadow-sm">
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between">
                        <h4 className="font-medium text-navy-dark">{lead.name}</h4>
                        {lead.score > 0 && (
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            lead.score >= 60 ? "bg-emerald-100 text-emerald-800" :
                            lead.score >= 30 ? "bg-amber-100 text-amber-800" :
                            "bg-gray-100 text-gray-600"
                          }`}>
                            {lead.score}
                          </span>
                        )}
                      </div>
                      {lead.specialty && (
                        <p className="mt-1 text-xs text-gray-500">{lead.specialty}</p>
                      )}
                      <div className="mt-2 flex flex-wrap gap-1">
                        <Badge variant={sourceColors[lead.source] || "secondary"} className="text-[10px]">
                          {lead.source}
                        </Badge>
                        {lead.tier_interest && (
                          <Badge variant="outline" className="text-[10px] capitalize">
                            {lead.tier_interest}
                          </Badge>
                        )}
                      </div>
                      {lead.phone && (
                        <div className="mt-2 flex items-center gap-1 text-[11px] text-gray-400">
                          <Phone className="h-3 w-3" />
                          {lead.phone}
                        </div>
                      )}
                      <p className="mt-1 text-[10px] text-gray-300">
                        {formatDate(lead.created_at)}
                      </p>
                    </CardContent>
                  </Card>
                ))}
                {stage.leads.length === 0 && (
                  <p className="py-8 text-center text-xs text-gray-400">Kosong</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
