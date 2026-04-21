/**
 * Subscription renewal reminder logic.
 *
 * Computes how many days until a doctor's `subscription_expires` and
 * classifies it into a severity bucket so the UI + Anita bot can show
 * the right tone of reminder.
 *
 * Buckets (relative to today):
 *   - `expired` — past expiry; service should be frozen
 *   - `critical` — 1 day or less
 *   - `warning` — 2–3 days
 *   - `notice` — 4–7 days
 *   - `ok` — more than 7 days OR no expiry set
 */

export type ReminderBucket = "expired" | "critical" | "warning" | "notice" | "ok"

export type RenewalStatus = {
  bucket: ReminderBucket
  daysLeft: number | null
  expiresAt: string | null
  hasAutoRenew: boolean
}

export function classifyRenewal(
  subscriptionExpires: string | null | undefined,
  hasAutoRenew: boolean = false
): RenewalStatus {
  if (!subscriptionExpires) {
    return { bucket: "ok", daysLeft: null, expiresAt: null, hasAutoRenew }
  }
  const exp = new Date(subscriptionExpires).getTime()
  const now = Date.now()
  const daysLeft = Math.floor((exp - now) / (1000 * 60 * 60 * 24))

  let bucket: ReminderBucket
  if (daysLeft < 0) bucket = "expired"
  else if (daysLeft <= 1) bucket = "critical"
  else if (daysLeft <= 3) bucket = "warning"
  else if (daysLeft <= 7) bucket = "notice"
  else bucket = "ok"

  return { bucket, daysLeft, expiresAt: subscriptionExpires, hasAutoRenew }
}

export function reminderMessage(status: RenewalStatus): string {
  const { bucket, daysLeft, hasAutoRenew } = status
  if (bucket === "ok") return ""
  if (hasAutoRenew && bucket !== "expired") {
    // Autopay covers it — reassure, don't pressure
    return `Langganan akan diperpanjang otomatis ${daysLeft} hari lagi. Pastikan saldo/kartu masih aktif.`
  }
  if (bucket === "expired") {
    return "Langganan Anda sudah expired. Perpanjang sekarang untuk melanjutkan layanan."
  }
  if (bucket === "critical") {
    return `Langganan Anda expired dalam ${daysLeft} hari. Perpanjang sekarang untuk menghindari gangguan layanan.`
  }
  if (bucket === "warning") {
    return `Langganan akan expired ${daysLeft} hari lagi. Aktifkan auto-renewal atau perpanjang manual.`
  }
  // notice
  return `Langganan akan expired ${daysLeft} hari lagi. Pertimbangkan aktifkan auto-renewal biar tidak lupa.`
}
