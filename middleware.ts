import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const COOKIE_DOMAIN = '.oabantuqifu.com'
const AUTH_BASE = 'https://auth.oabantuqifu.com'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 公开路径直接放行
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/login')
  ) {
    return NextResponse.next()
  }

  const response = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, {
              ...options,
              domain: COOKIE_DOMAIN,
              sameSite: 'lax',
              secure: true,
            })
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ?? ''
    const redirectTarget = `${siteUrl}${pathname}${request.nextUrl.search}`
    const loginUrl = new URL(`${AUTH_BASE}/login?redirect=${encodeURIComponent(redirectTarget)}`)
    return NextResponse.redirect(loginUrl)
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.svg|.*\\.ico).*)'],
}
