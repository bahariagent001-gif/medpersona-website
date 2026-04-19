import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getAuthProfile } from "@/lib/supabase/auth"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { ArrowLeft, FileText } from "lucide-react"
import Link from "next/link"

export const metadata = { title: "Catatan Laporan Keuangan — MedPersona" }

export const revalidate = 60

export default async function FinancialNotesPage() {
  const { user, profile } = await getAuthProfile()
  if (!user) redirect("/masuk")
  if (!["super_admin", "admin"].includes(profile?.role || "")) redirect("/dashboard?akses=ditolak")
  const supabase = await createClient()

  const { data: reports } = await supabase
    .from("financial_reports")
    .select("report_type, period, period_type, notes, generated_at")
    .not("notes", "is", null)
    .order("generated_at", { ascending: false })
    .limit(20)

  const reportTypeLabels: Record<string, string> = {
    pnl: "Laba Rugi",
    balance_sheet: "Neraca",
    cash_flow: "Arus Kas",
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/keuangan" className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"><ArrowLeft className="h-5 w-5" /></Link>
        <div>
          <h1 className="text-2xl font-bold text-navy-dark">Catatan Laporan Keuangan</h1>
          <p className="text-sm text-gray-500">Notes to Financial Statements</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Kebijakan Akuntansi</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none text-gray-700">
          <h4>1. Dasar Penyusunan</h4>
          <p>Laporan keuangan MedPersona (PT Apexa Buana Hospita) disusun menggunakan basis akrual dengan mata uang Rupiah (IDR) sebagai mata uang pelaporan.</p>

          <h4>2. Pengakuan Pendapatan</h4>
          <p>Pendapatan subscription diakui secara bulanan pada saat invoice diterbitkan. Pendapatan add-on diakui pada saat pembayaran diterima.</p>

          <h4>3. Biaya Langsung (COGS)</h4>
          <p>Biaya langsung mencakup seluruh biaya API yang berhubungan langsung dengan produksi konten: AI/LLM (Claude, Gemini), image generation (Flux, DALL-E), video/voice (ElevenLabs, Hedra/D-ID), stock content (Pexels, Unsplash), dan research APIs (Perplexity, NewsAPI).</p>

          <h4>4. Biaya Operasional</h4>
          <p>Biaya operasional mencakup infrastructure (hosting, database), tools & subscriptions (SaaS), serta marketing & advertising expenses.</p>

          <h4>5. Piutang Usaha</h4>
          <p>Piutang usaha diakui sebesar nilai invoice yang belum dibayar. Invoice memiliki jatuh tempo 7 hari. Akun yang melewati 14 hari akan di-pause dan masuk AR aging.</p>

          <h4>6. Konversi Mata Uang</h4>
          <p>Biaya API yang ditagih dalam USD dikonversi menggunakan kurs tengah BI pada tanggal transaksi.</p>
        </CardContent>
      </Card>

      {/* Per-report notes */}
      {reports && reports.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Catatan per Laporan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reports.map((r, i) => (
                <div key={i} className="rounded-lg border border-gray-100 p-4">
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-teal-dark" />
                    <span className="font-medium text-navy-dark">
                      {reportTypeLabels[r.report_type] || r.report_type}
                    </span>
                    <span className="text-gray-400">&middot;</span>
                    <span className="text-gray-500">{r.period}</span>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">{r.notes}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
