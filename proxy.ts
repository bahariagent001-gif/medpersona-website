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

  // Protected dashboard routes — require authentication
  if (pathname.startsWith("/dashboard") ||
      pathname.startsWith("/keuangan") ||
      pathname.startsWith("/dokter") ||
      pathname.startsWith("/crm") ||
      pathname.startsWith("/iklan") ||
      pathname.startsWith("/konten") ||
      pathname.startsWith("/persetujuan") ||
      pathname.startsWith("/langganan") ||
      pathname.startsWith("/pengaturan") ||
      pathname.startsWith("/organic") ||
      pathname.startsWith("/seo") ||
      pathname.startsWith("/leads")) {
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
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
