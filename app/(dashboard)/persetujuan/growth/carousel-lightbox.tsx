"use client"

import { useState, useEffect, useCallback } from "react"
import { ChevronLeft, ChevronRight, X, Download, ExternalLink } from "lucide-react"

type Props = {
  slides: string[]
  /** Caption for keyboard accessibility + bottom overlay */
  caption?: string
  /** Initial size in the preview strip (px height) */
  thumbSize?: number
}

export function CarouselLightbox({ slides, caption = "", thumbSize = 140 }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const isOpen = openIndex !== null

  const close = useCallback(() => setOpenIndex(null), [])
  const next = useCallback(
    () => setOpenIndex((i) => (i === null ? null : (i + 1) % slides.length)),
    [slides.length]
  )
  const prev = useCallback(
    () => setOpenIndex((i) =>
      i === null ? null : (i - 1 + slides.length) % slides.length
    ),
    [slides.length]
  )

  useEffect(() => {
    if (!isOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close()
      else if (e.key === "ArrowRight") next()
      else if (e.key === "ArrowLeft") prev()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [isOpen, close, next, prev])

  if (!slides || slides.length === 0) return null

  return (
    <>
      {/* Thumb strip */}
      <div className="space-y-1">
        <div className="flex gap-2 overflow-x-auto rounded-md border border-gray-200 bg-gray-50 p-2">
          {slides.map((u, i) => (
            <button
              key={i}
              onClick={() => setOpenIndex(i)}
              className="group relative flex-shrink-0 overflow-hidden rounded-md ring-1 ring-gray-200 transition hover:ring-2 hover:ring-teal-500"
              style={{ height: thumbSize, width: thumbSize }}
              aria-label={`Buka slide ${i + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={u}
                alt={`Slide ${i + 1}`}
                className="h-full w-full object-cover transition group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-1">
                <span className="text-[10px] font-medium text-white">
                  {i + 1}/{slides.length}
                </span>
              </div>
            </button>
          ))}
        </div>
        <p className="px-1 text-[10px] uppercase tracking-wide text-gray-400">
          Carousel · {slides.length} slide{slides.length > 1 ? "s" : ""} · klik untuk review ukuran penuh
        </p>
      </div>

      {/* Lightbox modal */}
      {isOpen && openIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={close}
        >
          {/* Close */}
          <button
            onClick={close}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Download + open-in-tab */}
          <div className="absolute right-4 top-16 flex flex-col gap-2">
            <a
              href={slides[openIndex]}
              download
              onClick={(e) => e.stopPropagation()}
              className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
              title="Download"
            >
              <Download className="h-5 w-5" />
            </a>
            <a
              href={slides[openIndex]}
              target="_blank"
              rel="noopener"
              onClick={(e) => e.stopPropagation()}
              className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
              title="Open in tab"
            >
              <ExternalLink className="h-5 w-5" />
            </a>
          </div>

          {/* Prev */}
          {slides.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); prev() }}
              className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
              aria-label="Sebelumnya"
            >
              <ChevronLeft className="h-8 w-8" />
            </button>
          )}

          {/* Image */}
          <div
            className="relative flex max-h-full max-w-full flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={slides[openIndex]}
              alt={`Slide ${openIndex + 1}`}
              className="max-h-[85vh] max-w-[85vw] rounded-lg object-contain shadow-2xl"
            />
            <div className="mt-3 flex items-center gap-3 text-sm text-white">
              <span>
                Slide {openIndex + 1} / {slides.length}
              </span>
              {/* Thumbnail strip navigation in-lightbox */}
              <div className="flex gap-1">
                {slides.map((u, i) => (
                  <button
                    key={i}
                    onClick={() => setOpenIndex(i)}
                    className={`h-10 w-10 overflow-hidden rounded border-2 transition ${
                      i === openIndex
                        ? "border-teal-400 ring-2 ring-teal-400/50"
                        : "border-white/30 opacity-70 hover:opacity-100"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={u} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
            {caption && (
              <p className="mt-2 line-clamp-2 max-w-2xl text-center text-xs text-white/70">
                {caption}
              </p>
            )}
          </div>

          {/* Next */}
          {slides.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); next() }}
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
              aria-label="Berikutnya"
            >
              <ChevronRight className="h-8 w-8" />
            </button>
          )}
        </div>
      )}
    </>
  )
}
