import type { MetadataRoute } from "next"
import { createClient } from "@/lib/supabase/server"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://medpersona.id"

const staticRoutes: MetadataRoute.Sitemap = [
  { url: `${SITE_URL}/`,         changeFrequency: "weekly",  priority: 1.0 },
  { url: `${SITE_URL}/harga`,    changeFrequency: "monthly", priority: 0.9 },
  { url: `${SITE_URL}/tentang`,  changeFrequency: "monthly", priority: 0.7 },
  { url: `${SITE_URL}/kontak`,   changeFrequency: "yearly",  priority: 0.5 },
  { url: `${SITE_URL}/blog`,     changeFrequency: "daily",   priority: 0.8 },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let articleRoutes: MetadataRoute.Sitemap = []
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from("articles")
      .select("slug, updated_at, published_at")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(1000)
    articleRoutes = (data ?? []).map((a) => ({
      url: `${SITE_URL}/blog/${a.slug}`,
      lastModified: a.updated_at || a.published_at || new Date().toISOString(),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }))
  } catch {
    // sitemap should never fail the build
  }
  return [...staticRoutes, ...articleRoutes]
}
