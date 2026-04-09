import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { applyCookieDomain } from './cookies'

/**
 * Browser/anon client — 用于读取数据，受 RLS 约束
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, applyCookieDomain({ ...options })),
            )
          } catch {
            // 从 Server Component 调用时可以忽略
          }
        },
      },
    },
  )
}

/**
 * Service role client — 用于 Server Action 写操作，绕过 RLS
 */
export async function createServiceClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, applyCookieDomain({ ...options })),
            )
          } catch {}
        },
      },
    },
  )
}
