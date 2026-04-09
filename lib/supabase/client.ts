import { createBrowserClient } from '@supabase/ssr'
import { applyCookieDomain } from './cookies'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: applyCookieDomain({
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      }),
    }
  )
}
