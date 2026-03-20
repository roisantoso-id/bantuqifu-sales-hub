'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

async function getCurrentTenantId(): Promise<string> {
  const cookieStore = await cookies()
  return cookieStore.get('selectedTenant')?.value ?? 'org_bantu_id'
}

async function getCurrentUserId(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id ?? null
}

export interface DeliveryTask {
  id: string
  opportunityCode: string
  customerName: string
  serviceTypeLabel: string
  stageId: string
  createdAt: string
  assigneeId: string
  assigneeName?: string
}

export async function getDeliveryTasksAction() {
  const supabase = await createClient()
  const tenantId = await getCurrentTenantId()

  // 查询 P6/P7/P8 且无 DeliveryAssignment 的商机
  const { data, error } = await supabase
    .from('opportunities')
    .select(`
      id,
      opportunityCode,
      serviceTypeLabel,
      stageId,
      createdAt,
      assigneeId,
      customer:customers(customerName)
    `)
    .eq('organizationId', tenantId)
    .in('stageId', ['P6', 'P7', 'P8'])
    .eq('status', 'active')
    .order('createdAt', { ascending: false })

  if (error) {
    console.error('[getDeliveryTasksAction]', error)
    return { success: false, error: '查询失败', data: [] }
  }

  // 查询已有派单的商机 ID
  const { data: assigned } = await supabase
    .from('delivery_assignments')
    .select('opportunityId')
    .eq('organizationId', tenantId)
    .eq('status', 'active')

  const assignedIds = new Set((assigned ?? []).map((a: { opportunityId: string }) => a.opportunityId))

  const tasks: DeliveryTask[] = (data ?? [])
    .filter((opp: { id: string }) => !assignedIds.has(opp.id))
    .map((opp: {
      id: string
      opportunityCode: string
      serviceTypeLabel: string
      stageId: string
      createdAt: string
      assigneeId: string
      customer: { customerName: string } | null
    }) => ({
      id: opp.id,
      opportunityCode: opp.opportunityCode,
      customerName: opp.customer?.customerName ?? '-',
      serviceTypeLabel: opp.serviceTypeLabel,
      stageId: opp.stageId,
      createdAt: opp.createdAt,
      assigneeId: opp.assigneeId,
    }))

  return { success: true, data: tasks }
}

export async function getDeliveryExecutorsAction() {
  const supabase = await createClient()
  const tenantId = await getCurrentTenantId()

  // 查询当前租户下 DELIVERY_EXEC 角色的用户
  const { data, error } = await supabase
    .from('user_organizations')
    .select(`
      userId,
      user:users_auth(id, name, email),
      role:roles(code)
    `)
    .eq('organizationId', tenantId)

  if (error) {
    console.error('[getDeliveryExecutorsAction]', error)
    return { success: false, data: [] }
  }

  const executors = (data ?? [])
    .filter((uo: { role: { code: string } | null }) =>
      uo.role?.code === 'DELIVERY_EXEC' || uo.role?.code === 'DELIVERY_PM'
    )
    .map((uo: { userId: string; user: { id: string; name: string; email: string } | null }) => ({
      id: uo.userId,
      name: uo.user?.name ?? uo.userId,
      email: uo.user?.email ?? '',
    }))

  return { success: true, data: executors }
}

export async function assignDeliveryTaskAction(
  opportunityId: string,
  executorId: string,
  notes?: string
) {
  const supabase = await createClient()
  const tenantId = await getCurrentTenantId()
  const assignedById = await getCurrentUserId()

  if (!assignedById) {
    return { success: false, error: '未登录' }
  }

  // 验证商机属于当前租户
  const { data: opp, error: oppError } = await supabase
    .from('opportunities')
    .select('id')
    .eq('id', opportunityId)
    .eq('organizationId', tenantId)
    .single()

  if (oppError || !opp) {
    return { success: false, error: '商机不存在或无权限' }
  }

  // upsert DeliveryAssignment
  const { error } = await supabase
    .from('delivery_assignments')
    .upsert({
      opportunityId,
      organizationId: tenantId,
      executorId,
      assignedById,
      notes: notes ?? null,
      status: 'active',
      assignedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }, { onConflict: 'opportunityId' })

  if (error) {
    console.error('[assignDeliveryTaskAction]', error)
    return { success: false, error: '派单失败: ' + error.message }
  }

  return { success: true }
}
