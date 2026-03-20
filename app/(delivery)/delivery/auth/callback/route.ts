import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const access_token = searchParams.get('access_token')
  const refresh_token = searchParams.get('refresh_token')
  const next = searchParams.get('next') ?? '/delivery'

  if (!access_token || !refresh_token) {
    return NextResponse.redirect('https://auth.oabantuqifu.com/login')
  }

  const safePath = (!next || next === '/') ? '/delivery' : next
  const destination = safePath.startsWith('/') ? `https://delivery.oabantuqifu.com${safePath}` : safePath
  const response = NextResponse.redirect(destination)

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
              domain: '.oabantuqifu.com',
              sameSite: 'lax',
              secure: true,
            })
          )
        },
      },
    }
  )

  const { error } = await supabase.auth.setSession({ access_token, refresh_token })

  if (error) {
    console.error('[delivery callback] setSession error:', error)
    return NextResponse.redirect('https://auth.oabantuqifu.com/login')
  }

  console.log('[delivery callback] session set OK, redirecting to', destination)
  return response
}
