import { createClient } from '@/lib/supabase/server'
import { DeliveryLayoutClient } from './layout-client'

export default async function DeliveryLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const userName = user?.user_metadata?.name || user?.email || '用户'

  return (
    <DeliveryLayoutClient userName={userName}>
      {children}
    </DeliveryLayoutClient>
  )
}
