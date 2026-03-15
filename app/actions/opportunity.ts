'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export interface OpportunityRow {
  id: string
  organizationId: string
  opportunityCode: string
  customerId: string
  convertedFromLeadId?: string | null
  stageId: string
  status: string
  serviceType: string
  serviceTypeLabel?: string | null
  estimatedAmount: number
  currency: string
  requirements?: string | null
  notes?: string | null
  assigneeId?: string | null
  expectedCloseDate?: string | null
  actualCloseDate?: string | null
  pinnedByUsers?: string[]
  wechatGroupId?: number | null
  wechatGroupName?: string | null
  createdAt: string
  updatedAt: string
  customer?: {
    id: string
    customerName: string
    customerId: string
  }
}

// ─── getCurrentTenantId helper ─────────────────────────────────────────────────
async function getCurrentTenantId(): Promise<string> {
  const cookieStore = await cookies()
  return cookieStore.get('selectedTenant')?.value ?? 'org_bantu_id'
}

// ─── getOpportunityTimelineAction ──────────────────────────────────────────────
// 获取商机的完整时间轴，包括线索阶段的跟进记录
export async function getOpportunityTimelineAction(oppId: string) {
  const supabase = await createClient()
  const tenantId = await getCurrentTenantId()

  // 1. 查询商机信息，获取关联的 leadId
  const { data: opp, error: oppError } = await supabase
    .from('opportunities')
    .select('id, convertedFromLeadId')
    .eq('id', oppId)
    .eq('organizationId', tenantId)
    .single()

  if (oppError || !opp) {
    console.error('[getOpportunityTimelineAction] Opportunity not found:', oppError)
    return { success: false, error: '商机不存在' }
  }

  // 2. 联合查询：商机阶段的记录 + 线索阶段的记录
  let query = supabase
    .from('interactions')
    .select('*')
    .eq('organizationId', tenantId)

  // 构建 OR 条件：商机ID 或 线索ID
  if (opp.convertedFromLeadId) {
    query = query.or(`opportunityId.eq.${oppId},leadId.eq.${opp.convertedFromLeadId}`)
  } else {
    query = query.eq('opportunityId', oppId)
  }

  const { data: interactions, error: interactionsError } = await query.order('createdAt', { ascending: false })

  if (interactionsError) {
    console.error('[getOpportunityTimelineAction] Query error:', interactionsError)
    return { success: false, error: '查询跟进记录失败' }
  }

  return {
    success: true,
    data: {
      opportunity: opp,
      interactions: interactions || [],
      hasLeadHistory: !!opp.convertedFromLeadId,
    },
  }
}

// ─── allocateWechatGroupIdAction ──────────────────────────────────────────────
// 原子性分配企微群编号，防止并发重复
export async function allocateWechatGroupIdAction(): Promise<{ success: boolean; groupId?: number; error?: string }> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('wechat_group_sequences')
    .insert({})
    .select('id')
    .single()

  if (error || !data) {
    console.error('[allocateWechatGroupIdAction] Error:', error)
    return { success: false, error: '分配企微群编号失败，请稍后重试' }
  }

  return { success: true, groupId: data.id }
}

// ─── createOpportunityAction ───────────────────────────────────────────────────
// 手动新建商机（非线索转化）
export async function createOpportunityAction(data: {
  customerId: string
  title: string
  serviceType: string
  estimatedAmount: number
  currency?: string
  requirements?: string
  expectedCloseDate?: string
  wechatGroupName?: string
}): Promise<{ success: boolean; data?: OpportunityRow; error?: string }> {
  const supabase = await createClient()
  const tenantId = await getCurrentTenantId()

  const { data: { user } } = await supabase.auth.getUser()
  const userId = user?.id

  if (!userId) {
    return { success: false, error: '用户未登录' }
  }

  if (!tenantId) {
    return { success: false, error: '租户信息缺失' }
  }

  // 生成商机编号（格式：OPP-YYMMDD-XXXX）
  const { data: opportunityCode, error: codeError } = await supabase.rpc('generate_business_code', { doc_prefix: 'OPP' })

  if (codeError || !opportunityCode) {
    console.error('[createOpportunityAction] Generate code error:', codeError)
    return { success: false, error: '生成商机编号失败' }
  }

  // 如果填写了企微群名称，原子性分配编号
  let wechatGroupId: number | null = null
  if (data.wechatGroupName?.trim()) {
    const allocated = await allocateWechatGroupIdAction()
    if (!allocated.success || !allocated.groupId) {
      return { success: false, error: '分配企微群编号失败，请稍后重试' }
    }
    wechatGroupId = allocated.groupId
  }

  // 创建商机
  const opportunityData = {
    id: crypto.randomUUID(),
    organizationId: tenantId,
    opportunityCode,
    customerId: data.customerId,
    convertedFromLeadId: null,
    stageId: 'P1',
    status: 'active',
    serviceType: data.serviceType,
    serviceTypeLabel: data.serviceType,
    estimatedAmount: data.estimatedAmount,
    currency: data.currency || 'IDR',
    requirements: data.requirements || '',
    notes: '',
    assigneeId: userId,
    expectedCloseDate: data.expectedCloseDate || null,
    wechatGroupId,
    wechatGroupName: data.wechatGroupName?.trim() || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  const { data: opportunity, error: oppError } = await supabase
    .from('opportunities')
    .insert(opportunityData)
    .select()
    .single()

  if (oppError || !opportunity) {
    console.error('[createOpportunityAction] Create error:', oppError)
    return { success: false, error: '创建商机失败，请稍后重试' }
  }

  // 记录系统日志
  await supabase.from('interactions').insert({
    id: crypto.randomUUID(),
    organizationId: tenantId,
    customerId: data.customerId,
    opportunityId: opportunity.id,
    operatorId: userId,
    type: 'SYSTEM',
    content: `手动创建了新商机：${data.title}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })

  return { success: true, data: opportunity as OpportunityRow }
}

// ─── getOpportunitiesAction ────────────────────────────────────────────────────
// 获取商机列表（包含客户信息）
export async function getOpportunitiesAction(filters?: {
  status?: string
  stageId?: string
  assigneeId?: string
  customerId?: string
}): Promise<OpportunityRow[]> {
  const supabase = await createClient()
  const tenantId = await getCurrentTenantId()

  console.log('[getOpportunitiesAction] tenantId:', tenantId)

  if (!tenantId) {
    console.error('[getOpportunitiesAction] No tenantId found')
    return []
  }

  let query = supabase
    .from('opportunities')
    .select(`
      *,
      customer:customers!opportunities_customerId_fkey (
        id,
        customerName,
        customerId
      )
    `)
    .eq('organizationId', tenantId)

  // 应用过滤条件
  if (filters?.status) {
    query = query.eq('status', filters.status)
  }
  if (filters?.stageId) {
    query = query.eq('stageId', filters.stageId)
  }
  if (filters?.assigneeId) {
    query = query.eq('assigneeId', filters.assigneeId)
  }
  if (filters?.customerId) {
    query = query.eq('customerId', filters.customerId)
  }

  const { data, error } = await query.order('createdAt', { ascending: false })

  console.log('[getOpportunitiesAction] Query result:', { count: data?.length || 0, error: error?.message })

  if (error) {
    console.error('[getOpportunitiesAction] Error:', error.message)
    return []
  }

  return (data ?? []) as OpportunityRow[]
}

// ─── getOpportunityByIdAction ──────────────────────────────────────────────────
// 获取单个商机详情
export async function getOpportunityByIdAction(oppId: string): Promise<OpportunityRow | null> {
  const supabase = await createClient()
  const tenantId = await getCurrentTenantId()

  const { data, error } = await supabase
    .from('opportunities')
    .select('*')
    .eq('id', oppId)
    .eq('organizationId', tenantId)
    .single()

  if (error) {
    console.error('[getOpportunityByIdAction] Error:', error.message)
    return null
  }

  return data as OpportunityRow
}

// ─── updateOpportunityStageAction ──────────────────────────────────────────────
// 更新商机阶段
export async function updateOpportunityStageAction(
  oppId: string,
  newStageId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const tenantId = await getCurrentTenantId()

  const { data: { user } } = await supabase.auth.getUser()
  const userId = user?.id

  const { error } = await supabase
    .from('opportunities')
    .update({
      stageId: newStageId,
      updatedAt: new Date().toISOString(),
    })
    .eq('id', oppId)
    .eq('organizationId', tenantId)

  if (error) {
    console.error('[updateOpportunityStageAction] Error:', error.message)
    return { success: false, error: '更新商机阶段失败，请稍后重试' }
  }

  // 记录阶段变更日志
  const { data: opp } = await supabase
    .from('opportunities')
    .select('customerId')
    .eq('id', oppId)
    .single()

  if (opp) {
    await supabase.from('interactions').insert({
      id: crypto.randomUUID(),
      organizationId: tenantId,
      customerId: opp.customerId,
      opportunityId: oppId,
      operatorId: userId,
      type: 'STAGE_CHANGE',
      content: `商机阶段变更为：${newStageId}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  }

  return { success: true }
}

// ─── updateOpportunityAction ───────────────────────────────────────────────────
// 更新商机信息
export async function updateOpportunityAction(
  oppId: string,
  updates: Partial<OpportunityRow>
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const tenantId = await getCurrentTenantId()

  const { error } = await supabase
    .from('opportunities')
    .update({
      ...updates,
      updatedAt: new Date().toISOString(),
    })
    .eq('id', oppId)
    .eq('organizationId', tenantId)

  if (error) {
    console.error('[updateOpportunityAction] Error:', error.message)
    return { success: false, error: '更新商机失败，请稍后重试' }
  }

  return { success: true }
}

// ─── toggleOpportunityPinAction ────────────────────────────────────────────────
// 切换商机置顶状态
export async function toggleOpportunityPinAction(
  oppId: string,
  isPinned: boolean
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const tenantId = await getCurrentTenantId()

  const { data: { user } } = await supabase.auth.getUser()
  const userId = user?.id

  if (!userId) {
    return { success: false, error: '用户未登录' }
  }

  // 获取当前商机的 pinnedByUsers
  const { data: opp, error: fetchError } = await supabase
    .from('opportunities')
    .select('pinnedByUsers')
    .eq('id', oppId)
    .eq('organizationId', tenantId)
    .single()

  if (fetchError || !opp) {
    console.error('[toggleOpportunityPinAction] Fetch error:', fetchError)
    return { success: false, error: '商机不存在' }
  }

  const currentPinnedUsers = (opp.pinnedByUsers as string[]) || []
  let newPinnedUsers: string[]

  if (isPinned) {
    // 添加当前用户到置顶列表
    if (!currentPinnedUsers.includes(userId)) {
      newPinnedUsers = [...currentPinnedUsers, userId]
    } else {
      newPinnedUsers = currentPinnedUsers
    }
  } else {
    // 从置顶列表移除当前用户
    newPinnedUsers = currentPinnedUsers.filter(id => id !== userId)
  }

  // 更新数据库
  const { error: updateError } = await supabase
    .from('opportunities')
    .update({
      pinnedByUsers: newPinnedUsers,
      updatedAt: new Date().toISOString(),
    })
    .eq('id', oppId)
    .eq('organizationId', tenantId)

  if (updateError) {
    console.error('[toggleOpportunityPinAction] Update error:', updateError.message)
    return { success: false, error: '操作失败，请稍后重试' }
  }

  return { success: true }
}
