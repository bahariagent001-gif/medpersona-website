import { createClient } from "@/lib/supabase/server"
import { formatDate } from "@/lib/utils"
import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Blog — MedPersona",
  description: "Artikel tentang personal branding dokter, tips media sosial untuk tenaga medis, dan strategi konten kesehatan.",
}

export default async function BlogPage() {
  const supabase = await createClient()
  const { data: articles } = await supabase
    .from("articles")
    .select("slug, title, excerpt, cover_image_url, category, published_at, tags")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(20)

  return (
    <section className="py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-navy-dark">Blog</h1>
          <p className="mx-auto mt-3 max-w-xl text-gray-500">
            Tips personal branding, strategi media sosial, dan insight untuk dokter & tenaga medis
          </p>
        </div>

        {articles && articles.length > 0 ? (
          <div className="mt-14 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <Link key={article.slug} href={`/blog/${article.slug}`}>
                <article className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all hover:shadow-md">
                  <div className="aspect-video bg-gradient-to-br from-teal-light to-gray-100">
                    {article.cover_image_url && (
                      <img
                        src={article.cover_image_url}
                        alt={article.title}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <div className="p-6">
                    {article.category && (
                      <span className="text-xs font-semibold uppercase tracking-wider text-teal-dark">
                        {article.category}
                      </span>
                    )}
                    <h2 className="mt-2 text-lg font-bold text-navy-dark group-hover:text-teal-dark line-clamp-2">
                      {article.title}
                    </h2>
                    {article.excerpt && (
                      <p className="mt-2 text-sm text-gray-500 line-clamp-3">{article.excerpt}</p>
                    )}
                    {article.published_at && (
                      <p className="mt-4 text-xs text-gray-400">{formatDate(article.published_at)}</p>
                    )}
                  </div>
                </article>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-20 text-center">
            <p className="text-gray-400">Belum ada artikel. Artikel baru segera hadir!</p>
          </div>
        )}
      </div>
    </section>
  )
}
