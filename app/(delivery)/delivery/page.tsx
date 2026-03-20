import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export default async function DeliveryIndexPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  console.log('[delivery page] user:', user?.email ?? 'null')
  if (!user) redirect('https://auth.oabantuqifu.com/login?redirect=https://delivery.oabantuqifu.com/delivery')

  const cookieStore = await cookies()
  const tenantId = cookieStore.get('selectedTenant')?.value ?? 'org_bantu_id'

  const { data } = await supabase
    .from('user_organizations')
    .select('role:roles(code)')
    .eq('userId', user.id)
    .eq('organizationId', tenantId)
    .single()

  const roleCode = (data?.role as { code: string } | null)?.code

  if (roleCode === 'DELIVERY_PM' || roleCode === 'ADMIN') {
    redirect('/delivery/dispatch')
  } else {
    redirect('/delivery/tasks')
  }
}
