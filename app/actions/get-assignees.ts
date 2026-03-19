'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export interface AssigneeOption {
  id: string
  name: string
}

async function getCurrentTenantId(): Promise<string> {
  const cookieStore = await cookies()
  return cookieStore.get('selectedTenant')?.value ?? 'org_bantu_id'
}

export async function getAssigneesAction(): Promise<AssigneeOption[]> {
  const supabase = await createClient()
  const tenantId = await getCurrentTenantId()

  // Get user IDs that belong to this org via user_organizations
  const { data: orgUsers } = await supabase
    .from('user_organizations')
    .select('userId')
    .eq('organizationId', tenantId)

  if (!orgUsers || orgUsers.length === 0) return []

  const userIds = orgUsers.map((u: { userId: string }) => u.userId)

  const { data } = await supabase
    .from('users_auth')
    .select('id, name')
    .in('id', userIds)
    .eq('isActive', true)
    .order('name')

  return (data ?? []) as AssigneeOption[]
}
