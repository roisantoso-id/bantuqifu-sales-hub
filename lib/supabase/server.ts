import { createClient } from '@supabase/supabase-js'

// Server-side client — uses service role for full access (never exposed to browser)
export const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  // Falls back to anon key in preview; in production set SUPABASE_SERVICE_ROLE_KEY
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false } }
)
