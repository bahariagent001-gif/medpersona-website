import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  // Skip Supabase auth check if env vars not configured (local dev without DB)
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return supabaseResponse
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Use getSession() for fast local JWT check (no network call).
  // Actual auth verification happens in server components via getUser().
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const pathname = request.nextUrl.pathname

  // Protected dashboard routes — require authentication. Middleware redirect
  // is ~5x faster than letting the server component do it (no SSR work).
  const PROTECTED_PREFIXES = [
    "/dashboard", "/keuangan", "/dokter", "/crm", "/iklan", "/konten",
    "/persetujuan", "/langganan", "/pengaturan", "/organic", "/seo",
    "/leads", "/anita",
  ]
  if (PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    if (!session) {
      const url = request.nextUrl.clone()
      url.pathname = "/masuk"
      url.searchParams.set("redirect", pathname)
      return NextResponse.redirect(url)
    }
  }

  // Redirect authenticated users away from login page
  if (pathname === "/masuk" && session) {
    const url = request.nextUrl.clone()
    url.pathname = "/dashboard"
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  // Only run middleware on routes that actually need auth checks — marketing
  // pages (/, /tos, /privacy), static assets, and public API routes bypass
  // Supabase cookie parsing entirely. Saves ~50-100ms TTFB on public pages.
  matcher: [
    "/dashboard/:path*",
    "/keuangan/:path*",
    "/dokter/:path*",
    "/crm/:path*",
    "/iklan/:path*",
    "/konten/:path*",
    "/persetujuan/:path*",
    "/langganan/:path*",
    "/pengaturan/:path*",
    "/organic/:path*",
    "/seo/:path*",
    "/leads/:path*",
    "/anita/:path*",
    "/masuk",
    "/daftar",
  ],
}
