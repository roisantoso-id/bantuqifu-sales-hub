import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const COOKIE_DOMAIN = '.oabantuqifu.com'
const AUTH_BASE = 'https://auth.oabantuqifu.com'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const host = request.headers.get('host') ?? ''
  const isDelivery = host.startsWith('delivery.')

  // 公开路径直接放行
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/delivery/auth/callback')
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

  console.log('[middleware] host:', host, 'pathname:', pathname)
  console.log('[middleware] cookies:', request.cookies.getAll().map(c => c.name))
  console.log('[middleware] user:', user?.email ?? 'null')

  if (!user) {
    const siteUrl = isDelivery
      ? `https://${host}`
      : (process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ?? '')
    const redirectTarget = `${siteUrl}${pathname}${request.nextUrl.search}`
    const loginUrl = new URL(`${AUTH_BASE}/login?redirect=${encodeURIComponent(redirectTarget)}`)
    return NextResponse.redirect(loginUrl)
  }

  // delivery 子域名：rewrite 到 /delivery 路径前缀
  if (isDelivery && !pathname.startsWith('/delivery')) {
    const url = request.nextUrl.clone()
    url.pathname = `/delivery${pathname}`
    return NextResponse.rewrite(url)
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.svg|.*\\.ico).*)'],
}
