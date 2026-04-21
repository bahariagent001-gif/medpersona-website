import Link from "next/link"
import { classifyRenewal, reminderMessage } from "@/lib/subscription/reminders"

/**
 * Server component. Shown at the top of the doctor dashboard whenever the
 * subscription is expiring within 7 days or already expired. Hidden when
 * doctor is on a healthy schedule (>7 days) and no autopay hint is needed.
 */
export function RenewalBanner({
  subscriptionExpires,
  hasAutoRenew,
}: {
  subscriptionExpires: string | null | undefined
  hasAutoRenew: boolean
}) {
  const status = classifyRenewal(subscriptionExpires, hasAutoRenew)
  if (status.bucket === "ok") return null

  const palette: Record<Exclude<typeof status.bucket, "ok">, string> = {
    expired: "border-red-300 bg-red-50 text-red-900",
    critical: "border-red-300 bg-red-50 text-red-900",
    warning: "border-orange-300 bg-orange-50 text-orange-900",
    notice: "border-amber-200 bg-amber-50 text-amber-900",
  }

  return (
    <div className={`flex flex-col gap-2 rounded-lg border p-4 text-sm sm:flex-row sm:items-center sm:justify-between ${palette[status.bucket]}`}>
      <div>
        <div className="font-semibold">
          {status.bucket === "expired" ? "⚠ Langganan Expired" :
           status.bucket === "critical" ? "⚠ Segera Perpanjang" :
           status.bucket === "warning" ? "⏰ Langganan Hampir Expired" :
           "📅 Reminder Perpanjangan"}
        </div>
        <div className="mt-0.5">{reminderMessage(status)}</div>
      </div>
      <div className="flex shrink-0 gap-2">
        <Link
          href="/langganan"
          className="rounded-md bg-white/80 px-3 py-1.5 text-xs font-medium hover:bg-white"
        >
          Kelola Langganan
        </Link>
        {!hasAutoRenew && status.bucket !== "expired" && process.env.NEXT_PUBLIC_AUTO_RENEWAL_ENABLED === "true" && (
          <Link
            href="/langganan#auto-renewal"
            className="rounded-md bg-teal-dark px-3 py-1.5 text-xs font-medium text-white hover:bg-teal"
          >
            Aktifkan Auto-Renewal
          </Link>
        )}
      </div>
    </div>
  )
}
