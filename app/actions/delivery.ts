'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import type {
  DeliveryProjectRow,
  ServiceTaskRow,
  DeliveryRecordRow,
} from '@/lib/types'

// ─── getCurrentTenantId helper ─────────────────────────────────────────────────
async function getCurrentTenantId(): Promise<string> {
  const cookieStore = await cookies()
  return cookieStore.get('selectedTenant')?.value ?? 'org_bantu_id'
}

// ═══════════════════════════════════════════════════════════════════════════════
// DELIVERY PROJECT
// ═══════════════════════════════════════════════════════════════════════════════

// ─── getDeliveryProjectsAction ─────────────────────────────────────────────────
export async function getDeliveryProjectsAction(filters?: {
  status?: string
  pmId?: string
  customerId?: string
}): Promise<DeliveryProjectRow[]> {
  const supabase = await createClient()
  const tenantId = await getCurrentTenantId()

  let query = supabase
    .from('delivery_projects')
    .select(`
      *,
      customer:customers!delivery_projects_customerId_fkey (
        id, customerName, customerId
      ),
      opportunity:opportunities!delivery_projects_opportunityId_fkey (
        id, opportunityCode, serviceTypeLabel
      ),
      pm:users_auth!delivery_projects_pmId_fkey (
        id, name
      )
    `)
    .eq('organizationId', tenantId)

  if (filters?.status) {
    query = query.eq('status', filters.status)
  }
  if (filters?.pmId) {
    query = query.eq('pmId', filters.pmId)
  }
  if (filters?.customerId) {
    query = query.eq('customerId', filters.customerId)
  }

  const { data, error } = await query.order('createdAt', { ascending: false })

  if (error) {
    console.error('[getDeliveryProjectsAction] Error:', error.message)
    return []
  }

  return (data ?? []) as DeliveryProjectRow[]
}

// ─── getDeliveryProjectByIdAction ─────────────────────────────────────���────────
export async function getDeliveryProjectByIdAction(
  projectId: string
): Promise<DeliveryProjectRow | null> {
  const supabase = await createClient()
  const tenantId = await getCurrentTenantId()

  const { data, error } = await supabase
    .from('delivery_projects')
    .select(`
      *,
      customer:customers!delivery_projects_customerId_fkey (
        id, customerName, customerId
      ),
      opportunity:opportunities!delivery_projects_opportunityId_fkey (
        id, opportunityCode, serviceTypeLabel
      ),
      pm:users_auth!delivery_projects_pmId_fkey (
        id, name
      )
    `)
    .eq('id', projectId)
    .eq('organizationId', tenantId)
    .single()

  if (error) {
    console.error('[getDeliveryProjectByIdAction] Error:', error.message)
    return null
  }

  return data as DeliveryProjectRow
}

// ─── createDeliveryProjectAction ───────────────────────────────────────────────
export async function createDeliveryProjectAction(data: {
  opportunityId: string
  customerId: string
  name: string
  pmId?: string
  deadline?: string
}): Promise<{ success: boolean; data?: DeliveryProjectRow; error?: string }> {
  const supabase = await createClient()
  const tenantId = await getCurrentTenantId()

  const { data: existing } = await supabase
    .from('delivery_projects')
    .select('id')
    .eq('opportunityId', data.opportunityId)
    .single()

  if (existing) {
    return { success: false, error: '该商机已存在交付项目' }
  }

  const projectData = {
    id: crypto.randomUUID(),
    organizationId: tenantId,
    opportunityId: data.opportunityId,
    customerId: data.customerId,
    name: data.name,
    pmId: data.pmId || null,
    status: 'PENDING',
    deadline: data.deadline || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  const { data: project, error } = await supabase
    .from('delivery_projects')
    .insert(projectData)
    .select()
    .single()

  if (error) {
    console.error('[createDeliveryProjectAction] Error:', error.message)
    return { success: false, error: '创建交付项目失败' }
  }

  return { success: true, data: project as DeliveryProjectRow }
}

// ─── updateDeliveryProjectAction ───────────────────────────────────────────────
export async function updateDeliveryProjectAction(
  projectId: string,
  updates: Partial<Pick<DeliveryProjectRow, 'name' | 'status' | 'pmId' | 'deadline'>>
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const tenantId = await getCurrentTenantId()

  const { error } = await supabase
    .from('delivery_projects')
    .update({ ...updates, updatedAt: new Date().toISOString() })
    .eq('id', projectId)
    .eq('organizationId', tenantId)

  if (error) {
    console.error('[updateDeliveryProjectAction] Error:', error.message)
    return { success: false, error: '更新交付项目失败' }
  }

  return { success: true }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SERVICE TASK
// ═══════════════════════════════════════════════════════════════════════════════

// ─── getTasksByProjectAction ───────────────────────────────────────────────────
export async function getTasksByProjectAction(
  projectId: string
): Promise<ServiceTaskRow[]> {
  const supabase = await createClient()
  const tenantId = await getCurrentTenantId()

  const { data, error } = await supabase
    .from('service_tasks')
    .select(`
      *,
      executor:users_auth!service_tasks_executorId_fkey (
        id, name
      )
    `)
    .eq('projectId', projectId)
    .eq('organizationId', tenantId)
    .order('createdAt', { ascending: true })

  if (error) {
    console.error('[getTasksByProjectAction] Error:', error.message)
    return []
  }

  return (data ?? []) as ServiceTaskRow[]
}

// ─── createServiceTaskAction ───────────────────────────────────────────────────
export async function createServiceTaskAction(data: {
  projectId: string
  title: string
  description?: string
  executorId?: string
  dueDate?: string
  commissionBase?: number
}): Promise<{ success: boolean; data?: ServiceTaskRow; error?: string }> {
  const supabase = await createClient()
  const tenantId = await getCurrentTenantId()

  // 验证项目属于当前租户
  const { data: project } = await supabase
    .from('delivery_projects')
    .select('id')
    .eq('id', data.projectId)
    .eq('organizationId', tenantId)
    .single()

  if (!project) {
    return { success: false, error: '项目不存在或无权访问' }
  }

  const taskData = {
    id: crypto.randomUUID(),
    organizationId: tenantId,
    projectId: data.projectId,
    title: data.title,
    description: data.description || null,
    executorId: data.executorId || null,
    status: 'TODO',
    dueDate: data.dueDate || null,
    commissionBase: data.commissionBase || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  const { data: task, error } = await supabase
    .from('service_tasks')
    .insert(taskData)
    .select()
    .single()

  if (error) {
    console.error('[createServiceTaskAction] Error:', error.message)
    return { success: false, error: '创建任务失败' }
  }

  return { success: true, data: task as ServiceTaskRow }
}

// ─── updateServiceTaskAction ───────────────────────────────────────────────────
export async function updateServiceTaskAction(
  taskId: string,
  updates: Partial<Pick<ServiceTaskRow, 'title' | 'description' | 'status' | 'executorId' | 'dueDate' | 'commissionBase'>>
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const tenantId = await getCurrentTenantId()

  const { error } = await supabase
    .from('service_tasks')
    .update({ ...updates, updatedAt: new Date().toISOString() })
    .eq('id', taskId)
    .eq('organizationId', tenantId)

  if (error) {
    console.error('[updateServiceTaskAction] Error:', error.message)
    return { success: false, error: '更新任务失败' }
  }

  return { success: true }
}

// ═══════════════════════════════════════════════════════════════════════════════
// DELIVERY RECORD (Timeline)
// ═══════════════════════════════════════════════════════════════════════════════

// ─── getDeliveryRecordsAction ──────────────────────────────────────────────────
export async function getDeliveryRecordsAction(
  taskId: string
): Promise<DeliveryRecordRow[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('delivery_records')
    .select(`
      *,
      user:users_auth!delivery_records_userId_fkey (
        id, name
      )
    `)
    .eq('taskId', taskId)
    .order('createdAt', { ascending: false })

  if (error) {
    console.error('[getDeliveryRecordsAction] Error:', error.message)
    return []
  }

  return (data ?? []) as DeliveryRecordRow[]
}

// ─── createDeliveryRecordAction ────────────────────────────────────────────────
export async function createDeliveryRecordAction(data: {
  taskId: string
  actionType: string
  content?: string
  attachmentUrl?: string
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user?.id) {
    return { success: false, error: '用户未登录' }
  }

  const { error } = await supabase
    .from('delivery_records')
    .insert({
      id: crypto.randomUUID(),
      taskId: data.taskId,
      userId: user.id,
      actionType: data.actionType,
      content: data.content || null,
      attachmentUrl: data.attachmentUrl || null,
      createdAt: new Date().toISOString(),
    })

  if (error) {
    console.error('[createDeliveryRecordAction] Error:', error.message)
    return { success: false, error: '创建记录失败' }
  }

  return { success: true }
}

// ─── nudgeTaskAction ───────────────────────────────────────────────────────────
export async function nudgeTaskAction(
  taskId: string
): Promise<{ success: boolean; error?: string }> {
  return createDeliveryRecordAction({
    taskId,
    actionType: 'NUDGE',
    content: '任务被催办，请尽快处理',
  })
}

// ─── getMyTasksAction ──────────────────────────────────────────────────────────
// 获取当前用户被指派的任务列表（执行人员视角）
export async function getMyTasksAction(filters?: {
  status?: string
}): Promise<ServiceTaskRow[]> {
  const supabase = await createClient()
  const tenantId = await getCurrentTenantId()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.id) return []

  let query = supabase
    .from('service_tasks')
    .select(`
      *,
      executor:users_auth!service_tasks_executorId_fkey (
        id, name
      ),
      project:delivery_projects!service_tasks_projectId_fkey (
        id, name
      )
    `)
    .eq('organizationId', tenantId)
    .eq('executorId', user.id)

  if (filters?.status) {
    query = query.eq('status', filters.status)
  }

  const { data, error } = await query.order('updatedAt', { ascending: false })

  if (error) {
    console.error('[getMyTasksAction] Error:', error.message)
    return []
  }

  return (data ?? []) as ServiceTaskRow[]
}

// ─── getTaskByIdAction ─────────────────────────────────────────────────────────
export async function getTaskByIdAction(
  taskId: string
): Promise<ServiceTaskRow | null> {
  const supabase = await createClient()
  const tenantId = await getCurrentTenantId()

  const { data, error } = await supabase
    .from('service_tasks')
    .select(`
      *,
      executor:users_auth!service_tasks_executorId_fkey (
        id, name
      ),
      project:delivery_projects!service_tasks_projectId_fkey (
        id, name
      )
    `)
    .eq('id', taskId)
    .eq('organizationId', tenantId)
    .single()

  if (error) {
    console.error('[getTaskByIdAction] Error:', error.message)
    return null
  }

  return data as ServiceTaskRow
}

// ─── getAssigneesAction ────────────────────────────────────────────────────────
// 获取当前租户下的用户列表（用于 PM/执行人选择）
export async function getDeliveryAssigneesAction(): Promise<
  { id: string; name: string; email: string }[]
> {
  const supabase = await createClient()
  const tenantId = await getCurrentTenantId()

  const { data, error } = await supabase
    .from('user_organizations')
    .select(`
      user:users_auth!user_organizations_userId_fkey (
        id, name, email
      )
    `)
    .eq('organizationId', tenantId)

  if (error) {
    console.error('[getDeliveryAssigneesAction] Error:', error.message)
    return []
  }

  return (data ?? []).map((d: any) => d.user).filter(Boolean)
}