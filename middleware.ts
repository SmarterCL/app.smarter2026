import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

const publicRoutes = [
  "/",
  "/login",
  "/auth/callback",
  "/pricing",
  "/registro",
  "/api/env/diagnostic",
  "/api/mcp/ping",
  "/api/health",
  "/api/contacts/test",
]

const protectedPrefixes = [
  "/dashboard",
  "/workspace",
  "/api/tenants",
  "/api/qr",
  "/api/chatwoot",
  "/api/waha",
  "/api/hermes",
  "/api/crm",
  "/api/mcp",
  "/api/settings",
]

const isPublicRoute = (pathname: string) =>
  publicRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`))

const isProtectedRoute = (pathname: string) =>
  protectedPrefixes.some((route) => pathname === route || pathname.startsWith(`${route}/`))

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request,
  })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    return response
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({
          request,
        })
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  if (!user && isProtectedRoute(pathname) && !isPublicRoute(pathname)) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 })
    }

    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = "/login"
    loginUrl.searchParams.set("next", pathname)
    return NextResponse.redirect(loginUrl)
  }

  return response
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
}
