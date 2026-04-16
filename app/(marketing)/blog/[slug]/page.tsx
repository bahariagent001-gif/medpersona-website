import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { formatDate } from "@/lib/utils"
import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data: article } = await supabase
    .from("articles")
    .select("title, seo_title, seo_description, og_image_url, excerpt")
    .eq("slug", slug)
    .eq("status", "published")
    .single()

  if (!article) return { title: "Artikel tidak ditemukan" }

  return {
    title: article.seo_title || article.title,
    description: article.seo_description || article.excerpt,
    openGraph: {
      title: article.seo_title || article.title,
      description: article.seo_description || article.excerpt || "",
      images: article.og_image_url ? [article.og_image_url] : undefined,
      type: "article",
    },
  }
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: article } = await supabase
    .from("articles")
    .select("*, profiles(full_name)")
    .eq("slug", slug)
    .eq("status", "published")
    .single()

  if (!article) notFound()

  const jsonLd = article.schema_markup || {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt || article.seo_description,
    datePublished: article.published_at,
    dateModified: article.updated_at,
    author: {
      "@type": "Organization",
      name: "MedPersona",
    },
    publisher: {
      "@type": "Organization",
      name: "PT Apexa Buana Hospita",
      url: "https://medpersona.id",
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article className="py-12">
        <div className="mx-auto max-w-3xl px-6">
          <Link
            href="/blog"
            className="mb-8 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-teal-dark"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Blog
          </Link>

          {article.category && (
            <span className="mb-4 block text-sm font-semibold uppercase tracking-wider text-teal-dark">
              {article.category}
            </span>
          )}

          <h1 className="text-3xl font-bold leading-tight text-navy-dark md:text-4xl">
            {article.title}
          </h1>

          <div className="mt-4 flex items-center gap-3 text-sm text-gray-500">
            {article.published_at && <time>{formatDate(article.published_at)}</time>}
            {(article.profiles as { full_name: string })?.full_name && (
              <>
                <span>&middot;</span>
                <span>{(article.profiles as { full_name: string }).full_name}</span>
              </>
            )}
          </div>

          {article.cover_image_url && (
            <div className="mt-8 overflow-hidden rounded-2xl">
              <img
                src={article.cover_image_url}
                alt={article.title}
                className="w-full object-cover"
              />
            </div>
          )}

          <div
            className="prose prose-lg prose-gray mt-8 max-w-none prose-headings:text-navy-dark prose-a:text-teal-dark prose-a:no-underline hover:prose-a:underline"
            dangerouslySetInnerHTML={{ __html: article.body }}
          />

          {article.tags && article.tags.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-2 border-t border-gray-200 pt-6">
              {article.tags.map((tag: string) => (
                <span key={tag} className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </article>
    </>
  )
}
