/**
 * ApprovalPreview
 * Displays a human-readable preview of a growth-engine approval payload:
 * visual image, copy (headline + primary text), CTA, targeting summary,
 * and budget. Falls back gracefully when fields are missing.
 */
import { CarouselLightbox } from "./carousel-lightbox"

type Payload = {
  visual?: {
    public_url?: string | null
    source?: string | null
    stock_query?: string | null
    carousel_slide_urls?: string[] | null
  }
  creative?: {
    headline?: string
    primary_text?: string
    cta?: string
    angle?: string
  }
  platform?: string
  budget_daily_idr?: number
  duration_days?: number
  target_cpl_idr?: number
  predicted_cpl_idr?: number
  targeting?: {
    geo?: string[]
    age_min?: number
    age_max?: number
    interests?: string[]
    placements?: string[]
  }
  targeting_summary?: string
  campaign_name?: string
  objective?: string
  rationale?: string
}

function formatIDR(n?: number) {
  if (!n || !Number.isFinite(n)) return "—"
  return `Rp ${Math.round(n).toLocaleString("id-ID")}`
}

export function ApprovalPreview({ payload }: { payload: Payload | null | undefined }) {
  if (!payload || typeof payload !== "object") return null

  const imageUrl = payload.visual?.public_url
  const slides = payload.visual?.carousel_slide_urls
  const copy = payload.creative || {}
  const tg = payload.targeting || {}

  const geo = tg.geo?.join(", ")
  const ageRange = tg.age_min && tg.age_max ? `${tg.age_min}–${tg.age_max}` : undefined
  const interests = tg.interests?.slice(0, 5).join(", ")

  // If carousel, use full-width layout (lightbox thumb strip needs space)
  const isCarousel = slides && slides.length > 1

  return (
    <div className={isCarousel ? "space-y-4" : "grid gap-4 md:grid-cols-[200px_1fr]"}>
      {isCarousel ? (
        <CarouselLightbox slides={slides!} caption={copy.headline} thumbSize={160} />
      ) : imageUrl ? (
        <div className="overflow-hidden rounded-md border border-gray-200 bg-gray-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={copy.headline || "Ad preview"}
            className="aspect-square w-full object-cover"
            loading="lazy"
          />
          {payload.visual?.source && (
            <p className="px-2 py-1 text-[10px] uppercase text-gray-400">
              {payload.visual.source}
            </p>
          )}
        </div>
      ) : (
        <div className="flex aspect-square w-full items-center justify-center rounded-md border border-dashed border-gray-200 bg-gray-50 text-xs text-gray-400">
          No visual yet
        </div>
      )}

      <div className="min-w-0 space-y-3 text-sm">
        {copy.headline && (
          <div>
            <p className="text-xs font-medium uppercase text-gray-400">Headline</p>
            <p className="font-semibold text-gray-900">{copy.headline}</p>
          </div>
        )}
        {copy.primary_text && (
          <div>
            <p className="text-xs font-medium uppercase text-gray-400">Body</p>
            <p className="whitespace-pre-wrap leading-relaxed text-gray-700">{copy.primary_text}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 rounded-md bg-gray-50 p-3 text-xs md:grid-cols-4">
          <Field label="Platform" value={payload.platform?.toUpperCase()} />
          <Field label="Budget/day" value={formatIDR(payload.budget_daily_idr)} />
          <Field label="Durasi" value={payload.duration_days ? `${payload.duration_days} hari` : "—"} />
          <Field label="Target CPL" value={formatIDR(payload.target_cpl_idr)} />
          <Field label="Prediksi CPL" value={formatIDR(payload.predicted_cpl_idr)} />
          <Field label="Objective" value={payload.objective?.replace("OUTCOME_", "")} />
          <Field label="CTA" value={copy.cta?.replace(/_/g, " ")} />
          {ageRange && <Field label="Umur" value={ageRange} />}
        </div>

        {(geo || interests) && (
          <div className="text-xs text-gray-600">
            {geo && <p><span className="font-medium">Geo:</span> {geo}</p>}
            {interests && <p><span className="font-medium">Interests:</span> {interests}</p>}
          </div>
        )}

        {payload.rationale && (
          <details>
            <summary className="cursor-pointer text-xs font-medium text-gray-500 hover:text-gray-700">
              Rationale AI
            </summary>
            <p className="mt-1 text-xs leading-relaxed text-gray-600">{payload.rationale}</p>
          </details>
        )}
      </div>
    </div>
  )
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-[10px] uppercase text-gray-400">{label}</p>
      <p className="font-medium text-gray-900">{value || "—"}</p>
    </div>
  )
}
