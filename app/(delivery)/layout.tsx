import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import DeliverySidebar from '@/components/delivery/delivery-sidebar'

const ALLOWED_ROLES = ['DELIVERY_PM', 'DELIVERY_EXEC', 'ADMIN']

async function getCurrentUserRole() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const cookieStore = await cookies()
  const tenantId = cookieStore.get('selectedTenant')?.value ?? 'org_bantu_id'

  const { data } = await supabase
    .from('user_organizations')
    .select('role:roles(code, name)')
    .eq('userId', user.id)
    .eq('organizationId', tenantId)
    .single()

  return (data?.role as { code: string; name: string } | null) ?? null
}

export default async function DeliveryLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const role = await getCurrentUserRole()

  if (!role || !ALLOWED_ROLES.includes(role.code)) {
    redirect('/login')
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <DeliverySidebar roleCode={role.code} />
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  )
}
