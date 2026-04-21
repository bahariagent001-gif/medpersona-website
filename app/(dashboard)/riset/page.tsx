import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getAuthProfile } from "@/lib/supabase/auth"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { Badge } from "@/components/ui/badge"
import { Markdown } from "@/components/ui/markdown"
import { formatDate } from "@/lib/utils"
import Link from "next/link"
import { Sparkles, Calendar, Lock, AlertTriangle } from "lucide-react"

export const metadata = { title: "Riset Mingguan — MedPersona" }
export const revalidate = 300

type Brief = {
  id: string
  doctor_id: string
  cycle_date: string
  specialty: string | null
  tier_required: "pro" | "elite"
  brief_markdown: string
  viral_alerts: ViralAlert[] | null
  hashtags: string[] | null
  topics_to_avoid: string[] | null
  created_at: string
}

type ViralAlert = {
  title?: string
  why_urgent?: string
  angle?: string
  format?: string
  urgency?: string
}

type DoctorLite = {
  id: string
  full_name: string | null
  specialty: string | null
  tier: string | null
}

const TIER_RANK: Record<string, number> = { starter: 1, growth: 2, pro: 3, elite: 4 }

export default async function RisetPage({
  searchParams,
}: {
  searchParams: Promise<{ doctor?: string; cycle?: string }>
}) {
  const { user, profile } = await getAuthProfile()
  if (!user) redirect("/masuk")

  const params = await searchParams
  const isAdmin = ["super_admin", "admin", "staff"].includes(profile?.role || "")

  if (isAdmin) return <AdminView selectedDoctorId={params.doctor} selectedCycle={params.cycle} />
  if (!profile?.doctor_id) redirect("/dashboard")
  return <DoctorView doctorId={profile.doctor_id} selectedCycle={params.cycle} />
}

async function DoctorView({ doctorId, selectedCycle }: { doctorId: string; selectedCycle?: string }) {
  const supabase = await createClient()

  const { data: doctor } = await supabase
    .from("doctors")
    .select("id, full_name, specialty, tier")
    .eq("id", doctorId)
    .single<DoctorLite>()

  const tierRank = TIER_RANK[doctor?.tier || "starter"] || 0
  if (tierRank < TIER_RANK.pro) {
    return <UpsellView currentTier={doctor?.tier || "starter"} />
  }

  // Doctor reads own — RLS enforces tier gate too
  const { data: briefs } = await supabase
    .from("research_briefs")
    .select("*")
    .eq("doctor_id", doctorId)
    .order("cycle_date", { ascending: false })
    .returns<Brief[]>()

  const list = briefs ?? []
  const active = selectedCycle
    ? list.find((b) => b.cycle_date === selectedCycle) ?? list[0]
    : list[0]

  return (
    <div className="space-y-6">
      <HeaderBlock doctorName={doctor?.full_name || "Dokter"} specialty={doctor?.specialty} tier={doctor?.tier} />
      {list.length === 0 ? (
        <EmptyState
          title="Riset mingguan belum tersedia"
          description="Tim riset akan menyiapkan brief pertama Anda. Biasanya update setiap Senin."
        />
      ) : (
        <BriefLayout list={list} active={active!} doctorId={doctorId} basePath="/riset" />
      )}
    </div>
  )
}

async function AdminView({ selectedDoctorId, selectedCycle }: { selectedDoctorId?: string; selectedCycle?: string }) {
  const supabase = await createClient()

  const { data: doctors } = await supabase
    .from("doctors")
    .select("id, full_name, specialty, tier")
    .in("tier", ["pro", "elite"])
    .order("full_name")
    .returns<DoctorLite[]>()

  const doctorId = selectedDoctorId || doctors?.[0]?.id

  const { data: briefs } = doctorId
    ? await supabase
        .from("research_briefs")
        .select("*")
        .eq("doctor_id", doctorId)
        .order("cycle_date", { ascending: false })
        .returns<Brief[]>()
    : { data: [] as Brief[] }

  const list = briefs ?? []
  const active = selectedCycle ? list.find((b) => b.cycle_date === selectedCycle) ?? list[0] : list[0]
  const currentDoctor = doctors?.find((d) => d.id === doctorId)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-dark">Riset Mingguan (Admin)</h1>
        <p className="text-sm text-gray-500">Lihat brief riset untuk dokter Pro / Elite mana pun.</p>
      </div>

      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-gray-600">Pilih dokter:</span>
            <div className="flex flex-wrap gap-2">
              {(doctors ?? []).map((d) => (
                <Link
                  key={d.id}
                  href={`/riset?doctor=${d.id}`}
                  className={`rounded-md px-3 py-1 text-xs font-medium ${d.id === doctorId ? "bg-teal-dark text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                >
                  {d.full_name} <span className="opacity-60">({d.tier})</span>
                </Link>
              ))}
            </div>
          </div>
          {(doctors ?? []).length === 0 && (
            <p className="mt-2 text-sm text-gray-500">Belum ada dokter di tier Pro / Elite.</p>
          )}
        </CardContent>
      </Card>

      {currentDoctor && (
        <HeaderBlock doctorName={currentDoctor.full_name || "Dokter"} specialty={currentDoctor.specialty} tier={currentDoctor.tier} />
      )}

      {doctorId && list.length === 0 ? (
        <EmptyState
          title="Belum ada brief untuk dokter ini"
          description="Jalankan `python3 tools/sync_research_to_supabase.py --doctor-id <id>` untuk upload brief terakhir."
        />
      ) : doctorId && active ? (
        <BriefLayout list={list} active={active} doctorId={doctorId} basePath={`/riset?doctor=${doctorId}&`} useCycleParam="cycle" />
      ) : null}
    </div>
  )
}

function BriefLayout({
  list,
  active,
  doctorId,
  basePath,
  useCycleParam,
}: {
  list: Brief[]
  active: Brief
  doctorId: string
  basePath: string
  useCycleParam?: string
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
      <aside className="space-y-1">
        <p className="mb-2 px-2 text-xs font-medium uppercase tracking-wide text-gray-500">Riwayat siklus</p>
        {list.map((b) => {
          const isActive = b.cycle_date === active.cycle_date
          const href = useCycleParam
            ? `${basePath}${useCycleParam}=${b.cycle_date}`
            : `${basePath}?cycle=${b.cycle_date}`
          return (
            <Link
              key={b.id}
              href={href}
              className={`flex items-center gap-2 rounded-md px-2 py-2 text-sm ${isActive ? "bg-teal-light text-teal-dark font-medium" : "text-gray-600 hover:bg-gray-50"}`}
            >
              <Calendar className="h-3.5 w-3.5" />
              {formatDate(b.cycle_date)}
            </Link>
          )
        })}
      </aside>

      <div className="space-y-6 min-w-0">
        {active.viral_alerts && active.viral_alerts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-700">
                <AlertTriangle className="h-4 w-4" />
                Viral Alerts — aksi dalam 24-48 jam
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {active.viral_alerts.map((a, idx) => (
                <div key={idx} className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  {a.title && <p className="font-semibold text-amber-900">{a.title}</p>}
                  {a.urgency && <Badge variant="warning" className="mt-1">{a.urgency}</Badge>}
                  {a.why_urgent && <p className="mt-2 text-sm text-gray-700"><span className="font-medium">Kenapa mendesak:</span> {a.why_urgent}</p>}
                  {a.angle && <p className="mt-1 text-sm text-gray-700"><span className="font-medium">Angle:</span> {a.angle}</p>}
                  {a.format && <p className="mt-1 text-sm text-gray-700"><span className="font-medium">Format:</span> {a.format}</p>}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Brief lengkap</CardTitle>
            <Badge variant="secondary">{formatDate(active.cycle_date)}</Badge>
          </CardHeader>
          <CardContent>
            <Markdown>{active.brief_markdown}</Markdown>
          </CardContent>
        </Card>

        {active.hashtags && active.hashtags.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Hashtag yang direkomendasikan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {active.hashtags.map((h, i) => (
                  <Badge key={i} variant="info">#{h.replace(/^#/, "")}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {active.topics_to_avoid && active.topics_to_avoid.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-red-700">Topik untuk dihindari</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="ml-5 list-disc space-y-1 text-sm text-gray-700">
                {active.topics_to_avoid.map((t, i) => <li key={i}>{t}</li>)}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

function HeaderBlock({ doctorName, specialty, tier }: { doctorName: string; specialty: string | null | undefined; tier: string | null | undefined }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-navy-dark flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-teal-dark" />
          Riset Mingguan {doctorName !== "Dokter" ? `— ${doctorName}` : ""}
        </h1>
        <p className="text-sm text-gray-500">
          Tren medis + ide konten mingguan yang disesuaikan dengan spesialisasi Anda{specialty ? ` (${specialty})` : ""}.
        </p>
      </div>
      {tier && <Badge variant={tier === "elite" ? "default" : "info"}>{tier.toUpperCase()}</Badge>}
    </div>
  )
}

function UpsellView({ currentTier }: { currentTier: string }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-dark flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-teal-dark" />
          Riset Mingguan
        </h1>
        <p className="text-sm text-gray-500">Insight tren medis + ide konten yang disesuaikan dengan spesialisasi Anda.</p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <Lock className="h-7 w-7" />
          </div>
          <div className="max-w-md">
            <p className="text-lg font-semibold text-navy-dark">Fitur eksklusif Pro &amp; Elite</p>
            <p className="mt-1 text-sm text-gray-600">
              Riset mingguan berisi: (1) Viral alerts yang harus di-publish dalam 24-48 jam,
              (2) Rencana pillar konten khusus spesialisasi Anda, (3) Hashtag intelligence,
              dan (4) Citation dari jurnal PubMed terbaru.
            </p>
            <p className="mt-2 text-xs text-gray-500">Paket Anda saat ini: <strong className="text-navy-dark">{currentTier.toUpperCase()}</strong></p>
          </div>
          <Link
            href="/langganan"
            className="rounded-lg bg-teal-dark px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal"
          >
            Upgrade ke Pro
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
