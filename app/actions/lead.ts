'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export interface LeadRow {
  id: string
  organizationId: string
  leadCode: string
  personName: string
  company?: string | null
  position?: string | null
  phone?: string | null
  email?: string | null
  wechat?: string | null
  source: string
  sourceDetail?: string | null
  category: string
  urgency: string
  status: 'NEW' | 'PUSHING' | 'converted' | 'LOST'
  assigneeId?: string | null
  nextFollowDate?: string | null
  discardReason?: string | null
  discardedAt?: string | null
  discardedById?: string | null
  notes?: string | null
  createdAt: string
  createdById?: string | null
  updatedAt: string
  updatedById?: string | null
  convertedOpportunityId?: string | null
  budgetMin?: number | null
  budgetMax?: number | null
  budgetCurrency?: string | null
  initialIntent?: string | null
}

export interface LeadFollowUpRow {
  id: string
  organizationId: string
  leadId: string
  followupType: string
  content: string
  nextAction?: string | null
  nextActionDate?: string | null
  createdById?: string | null
  createdAt: string
}

// ─── getCurrentTenantId helper ─────────────────────────────────────────────────
async function getCurrentTenantId(): Promise<string> {
  const cookieStore = await cookies()
  return cookieStore.get('selectedTenant')?.value ?? 'org_bantu_id'
}

// ─── getLeadsAction ────────────────────────────────────────────────────────────
export async function getLeadsAction(
  viewMode: 'my_leads' | 'pool',
  filters?: { status?: string; urgency?: string; search?: string },
): Promise<LeadRow[]> {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  const userId = user?.id

  // Get tenant from cookies
  const tenantId = await getCurrentTenantId()

  if (!tenantId) {
    console.error('[getLeadsAction] No tenantId found')
    return []
  }

  let query = supabase
    .from('leads')
    .select('*')
    .eq('organizationId', tenantId)

  // Filter by view mode
  if (viewMode === 'my_leads') {
    if (!userId) return []
    query = query.eq('assigneeId', userId)
  } else {
    // 公海：无负责人的线索
    query = query.is('assigneeId', null)
  }

  // Apply filters
  if (filters?.status) {
    query = query.eq('status', filters.status)
  }
  if (filters?.urgency) {
    query = query.eq('urgency', filters.urgency)
  }

  // Apply search filter (server-side)
  if (filters?.search) {
    const searchTerm = `%${filters.search}%`
    query = query.or(
      `personName.ilike.${searchTerm},leadCode.ilike.${searchTerm},company.ilike.${searchTerm},phone.ilike.${searchTerm}`
    )
  }

  // Exclude discarded
  query = query.neq('status', 'discarded')

  const { data, error } = await query.order('createdAt', { ascending: false })

  if (error) {
    console.error('[getLeadsAction] Error:', error.message)
    return []
  }

  return (data ?? []) as LeadRow[]
}

// ─── createLeadAction ──────────────────────────────────────────────────────────
export async function createLeadAction(input: {
  wechatName: string
  phone?: string
  source: string
  category?: string
  budgetMin?: number
  budgetMax?: number
  budgetCurrency?: string
  urgency: string
  initialIntent: string
  customerId?: string
  notes?: string
}): Promise<LeadRow | null> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const userId = user?.id

  const tenantId = await getCurrentTenantId()

  if (!tenantId) {
    console.error('[createLeadAction] No tenantId')
    return null
  }

  // Generate lead code
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const leadCode = `LEAD-${today}-${Math.random().toString().slice(2, 6)}`

  const { data, error } = await supabase
    .from('leads')
    .insert([
      {
        id: crypto.randomUUID(),
        organizationId: tenantId,
        leadCode,
        wechatName: input.wechatName,
        phone: input.phone || null,
        source: input.source,
        category: input.category || null,
        budgetMin: input.budgetMin || null,
        budgetMax: input.budgetMax || null,
        budgetCurrency: input.budgetCurrency || 'CNY',
        urgency: input.urgency,
        initialIntent: input.initialIntent,
        customerId: input.customerId || null,
        status: 'new',
        assigneeId: userId, // 自动分配给创建人
        lastActionAt: new Date().toISOString(),
        notes: input.notes || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ])
    .select('*')
    .single()

  if (error) {
    console.error('[createLeadAction] Error:', error.message)
    return null
  }

  return data as LeadRow
}

// ─── updateLeadStatusAction ────────────────────────────────────────────────────
export async function updateLeadStatusAction(
  leadId: string,
  status: 'NEW' | 'PUSHING' | 'converted' | 'LOST',
): Promise<LeadRow | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('leads')
    .update({
      status,
      updatedById: user?.id,
      updatedAt: new Date().toISOString(),
    })
    .eq('id', leadId)
    .select('*')
    .single()

  if (error) {
    console.error('[updateLeadStatusAction] Error:', error.message)
    return null
  }

  return data as LeadRow
}

// ─── updateLeadAction ──────────────────────────────────────────────────────────
// 更新线索信息（已转化的线索不能修改）
export async function updateLeadAction(
  leadId: string,
  updates: {
    wechatName?: string
    phone?: string
    source?: string
    category?: string
    budgetMin?: number
    budgetMax?: number
    budgetCurrency?: string
    urgency?: string
    initialIntent?: string
    notes?: string
  }
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // 检查线索是否已转化
  const { data: lead, error: checkError } = await supabase
    .from('leads')
    .select('status, convertedOpportunityId')
    .eq('id', leadId)
    .single()

  if (checkError) {
    console.error('[updateLeadAction] Check error:', checkError.message)
    return { success: false, error: '线索不存在' }
  }

  if (lead.convertedOpportunityId) {
    return { success: false, error: '该线索已转化为商机，不能修改' }
  }

  // 更新线索
  const { error } = await supabase
    .from('leads')
    .update({
      ...updates,
      updatedById: user?.id,
      updatedAt: new Date().toISOString(),
    })
    .eq('id', leadId)

  if (error) {
    console.error('[updateLeadAction] Update error:', error.message)
    return { success: false, error: '更新失败，请稍后重试' }
  }

  return { success: true }
}

// ─── advanceLeadStatusAction ───────────────────────────────────────────────────
// 推进线索状态
export async function advanceLeadStatusAction(
  leadId: string,
  newStatus: 'contacted' | 'ready_for_opportunity' | 'no_interest' | 'new'
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const tenantId = await getCurrentTenantId()

  if (!tenantId) {
    return { success: false, error: '租户信息缺失' }
  }

  // 检查线索是否已转化
  const { data: lead, error: checkError } = await supabase
    .from('leads')
    .select('status, convertedOpportunityId, organizationId')
    .eq('id', leadId)
    .single()

  if (checkError) {
    console.error('[advanceLeadStatusAction] Check error:', checkError.message)
    return { success: false, error: '线索不存在' }
  }

  if (lead.convertedOpportunityId) {
    return { success: false, error: '该线索已转化为商机，不能修改状态' }
  }

  const oldStatus = lead.status

  // 更新状态
  const { error } = await supabase
    .from('leads')
    .update({
      status: newStatus,
      lastActionAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .eq('id', leadId)

  if (error) {
    console.error('[advanceLeadStatusAction] Update error:', error.message)
    return { success: false, error: '更新失败，请稍后重试' }
  }

  // 状态标签映射
  const statusLabels: Record<string, string> = {
    new: '新线索',
    contacted: '已联系',
    ready_for_opportunity: '准备转商机',
    no_interest: '无意向',
    discarded: '已丢弃',
    public_pool: '公海池',
  }

  // 添加跟进记录
  await supabase.from('interactions').insert({
    id: crypto.randomUUID(),
    organizationId: tenantId,
    customerId: null,
    leadId: leadId,
    operatorId: user?.id,
    type: 'SYSTEM',
    content: `状态变更：${statusLabels[oldStatus] || oldStatus} → ${statusLabels[newStatus] || newStatus}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })

  return { success: true }
}

// ─── discardLeadAction ─────────────────────────────────────────────────────────
// 退回公海：清空责任人，状态重置为 new
export async function discardLeadAction(
  leadId: string,
  discardReason?: string
): Promise<LeadRow | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('leads')
    .update({
      assigneeId: null, // 清空责任人
      status: 'new', // 状态重置为新线索
      discardReason: discardReason === 'return_to_pool' ? 'RETURN_TO_POOL' : 'OTHER',
      discardedAt: new Date().toISOString(),
      discardedById: user?.id,
      updatedAt: new Date().toISOString(),
    })
    .eq('id', leadId)
    .select('*')
    .single()

  if (error) {
    console.error('[discardLeadAction] Error:', error.message)
    return null
  }

  return data as LeadRow
}

// ─── claimLeadAction ───────────────────────────────────────────────────────────
export async function claimLeadAction(leadId: string): Promise<LeadRow | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user?.id) {
    console.error('[claimLeadAction] Not authenticated')
    return null
  }

  // 使用原子操作确保并发安全：只有当 assigneeId 为 null 时才能更新
  const { data, error } = await supabase
    .from('leads')
    .update({
      assigneeId: user.id,
      updatedById: user.id,
      updatedAt: new Date().toISOString(),
      status: 'contacted', // 认领后自动变为已联系
    })
    .eq('id', leadId)
    .is('assigneeId', null) // 并发核心：确保它真的是公海的无主线索
    .select('*')
    .single()

  if (error) {
    console.error('[claimLeadAction] Error:', error.message)
    // 如果是因为 assigneeId 不为 null 导致的失败，返回特殊错误
    if (error.code === 'PGRST116') {
      console.warn('[claimLeadAction] Lead already claimed by another user')
    }
    return null
  }

  return data as LeadRow
}

// ─── setNextFollowDateAction ──────────────────────────────────────────────────
export async function setNextFollowDateAction(
  leadId: string,
  nextFollowDate: string,
): Promise<LeadRow | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('leads')
    .update({
      nextFollowDate,
      updatedById: user?.id,
      updatedAt: new Date().toISOString(),
    })
    .eq('id', leadId)
    .select('*')
    .single()

  if (error) {
    console.error('[setNextFollowDateAction] Error:', error.message)
    return null
  }

  return data as LeadRow
}

// ─── addLeadFollowUpAction ─────────────────────────────────────────────────────
export async function addLeadFollowUpAction(input: {
  leadId: string
  followupType: string
  content: string
  nextAction?: string
  nextActionDate?: string
}): Promise<LeadFollowUpRow | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  console.log('[addLeadFollowUpAction] user:', user?.id)

  const tenantId = await getCurrentTenantId()

  if (!tenantId) {
    console.error('[addLeadFollowUpAction] No tenantId')
    return null
  }

  const { data, error } = await supabase
    .from('interactions')
    .insert([
      {
        id: crypto.randomUUID(),
        organizationId: tenantId,
        customerId: null, // 线索阶段可能还没关联客户
        leadId: input.leadId,
        operatorId: user?.id,
        type: input.followupType === 'general' ? 'NOTE' : 'CALL',
        content: input.content,
        nextAction: input.nextAction || null,
        nextActionDate: input.nextActionDate || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ])
    .select('*')
    .single()

  if (error) {
    console.error('[addLeadFollowUpAction] Error:', error.message)
    return null
  }

  return data as LeadFollowUpRow
}

// ─── getLeadFollowUpsAction ───────────────────────────────────────────────────
export async function getLeadFollowUpsAction(leadId: string): Promise<LeadFollowUpRow[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('interactions')
    .select(`
      *,
      operator:users_auth!interactions_operatorId_fkey (
        id,
        name,
        email
      )
    `)
    .eq('leadId', leadId)
    .order('createdAt', { ascending: false })

  if (error) {
    console.error('[getLeadFollowUpsAction] Error:', error.message)
    return []
  }

  return (data ?? []) as LeadFollowUpRow[]
}

// ─── autoRecycleLeadsAction ───────────────────────────────────────────────────
// 自动回收7天未跟进的线索到公海池
// 由定时任务（Cron Job）或系统触发器调用
export async function autoRecycleLeadsAction(): Promise<{ success: boolean; count: number }> {
  const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000001' // 系统用户固定 UUID
  const supabase = await createClient()

  // 计算7天前的时间节点
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const tenantId = await getCurrentTenantId()

  if (!tenantId) {
    console.error('[autoRecycleLeadsAction] No tenantId found')
    return { success: false, count: 0 }
  }

  // 查询需要回收的线索：
  // 1. 状态为 NEW（新线索）
  // 2. 已分配给销售（assigneeId 不为空）
  // 3. 创建时间超过7天
  // 4. 不是已转化或已丢弃的
  const { data: leadsToRecycle, error: queryError } = await supabase
    .from('leads')
    .select('id, leadCode, personName, createdAt')
    .eq('organizationId', tenantId)
    .eq('status', 'NEW')
    .not('assigneeId', 'is', null)
    .lt('createdAt', sevenDaysAgo.toISOString())

  if (queryError) {
    console.error('[autoRecycleLeadsAction] Query error:', queryError.message)
    return { success: false, count: 0 }
  }

  if (!leadsToRecycle || leadsToRecycle.length === 0) {
    console.log('[autoRecycleLeadsAction] No leads to recycle')
    return { success: true, count: 0 }
  }

  // 批量更新：将线索退回公海
  const leadIds = leadsToRecycle.map(l => l.id)

  const { error: updateError } = await supabase
    .from('leads')
    .update({
      assigneeId: null, // 清空负责人
      discardReason: 'SYSTEM_AUTO_RECYCLE',
      discardedAt: new Date().toISOString(),
      discardedById: SYSTEM_USER_ID,
      updatedAt: new Date().toISOString(),
      updatedById: SYSTEM_USER_ID,
    })
    .in('id', leadIds)

  if (updateError) {
    console.error('[autoRecycleLeadsAction] Update error:', updateError.message)
    return { success: false, count: 0 }
  }

  console.log(`[autoRecycleLeadsAction] Successfully recycled ${leadsToRecycle.length} leads`)

  return { success: true, count: leadsToRecycle.length }
}

// ─── convertLeadToOpportunityAction ───────────────────────────────────────────
// 将线索转化为商机，强制关联客户
export async function convertLeadToOpportunityAction(
  leadId: string,
  customerId: string,
  wechatGroupName: string
): Promise<{ success: boolean; opportunityId?: string; error?: string }> {
  console.log('[convertLeadToOpportunityAction] Starting conversion:', { leadId, customerId })

  const supabase = await createClient()
  const tenantId = await getCurrentTenantId()

  const { data: { user } } = await supabase.auth.getUser()
  const userId = user?.id

  if (!userId) {
    console.error('[convertLeadToOpportunityAction] No user ID')
    return { success: false, error: '用户未登录' }
  }

  if (!tenantId) {
    console.error('[convertLeadToOpportunityAction] No tenant ID')
    return { success: false, error: '租户信息缺失' }
  }

  console.log('[convertLeadToOpportunityAction] User and tenant:', { userId, tenantId })

  // 1. 查询线索信息（包含关联的客户ID）
  const { data: lead, error: leadError } = await supabase
    .from('leads')
    .select('*, customerId')
    .select('*')
    .eq('id', leadId)
    .single()

  if (leadError || !lead) {
    console.error('[convertLeadToOpportunityAction] Lead query error:', leadError)
    return { success: false, error: '线索不存在' }
  }

  console.log('[convertLeadToOpportunityAction] Lead found:', lead.leadCode, 'status:', lead.status)

  if (lead.status === 'converted') {
    return { success: false, error: '该线索已被转化过' }
  }

  // 优先使用线索关联的客户ID，如果没有则使用传入的客户ID
  const finalCustomerId = lead.customerId || customerId

  if (!finalCustomerId) {
    return { success: false, error: '必须关联客户才能转化为商机' }
  }

  // 2. 生成商机编号（格式：OPP-YYMMDD-XXXX）
  const today = new Date().toISOString().slice(2, 10).replace(/-/g, '')
  const randomSuffix = Math.random().toString().slice(2, 6)
  const opportunityCode = `OPP-${today}-${randomSuffix}`

  console.log('[convertLeadToOpportunityAction] Generated opportunity code:', opportunityCode)

  // 3. 原子性分配企微群编号
  const { data: groupRow, error: groupError } = await supabase
    .from('wechat_group_sequences')
    .insert({})
    .select('id')
    .single()

  if (groupError || !groupRow) {
    console.error('[convertLeadToOpportunityAction] Wechat group alloc error:', groupError)
    return { success: false, error: '分配企微群编号失败，请稍后重试' }
  }

  // 4. 创建商机
  const opportunityData = {
    id: opportunityCode,
    organizationId: tenantId,
    opportunityCode,
    customerId: finalCustomerId,
    convertedFromLeadId: leadId,
    stageId: 'P1',
    status: 'active',
    serviceType: lead.category || 'VISA',
    serviceTypeLabel: lead.category || '签证服务',
    estimatedAmount: lead.budgetMin || 0,
    currency: lead.budgetCurrency || 'IDR',
    requirements: lead.initialIntent || '',
    notes: lead.notes || '',
    assigneeId: userId,
    wechatGroupId: groupRow.id,
    wechatGroupName: wechatGroupName.trim(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  console.log('[convertLeadToOpportunityAction] Creating opportunity with data:', opportunityData)

  const { data: opportunity, error: oppError } = await supabase
    .from('opportunities')
    .insert(opportunityData)
    .select('id, opportunityCode')
    .single()

  if (oppError || !opportunity) {
    console.error('[convertLeadToOpportunityAction] Create opportunity error:', oppError)
    return { success: false, error: '创建商机失败，请稍后重试' }
  }

  console.log('[convertLeadToOpportunityAction] Opportunity created:', opportunity)

  console.log('[convertLeadToOpportunityAction] Opportunity created:', opportunity)

  // 4. 更新线索状态为已转化
  const { error: updateError } = await supabase
    .from('leads')
    .update({
      status: 'converted',
      convertedOpportunityId: opportunity.id,
      updatedAt: new Date().toISOString(),
      updatedById: userId,
    })
    .eq('id', leadId)

  if (updateError) {
    console.error('[convertLeadToOpportunityAction] Update lead error:', updateError)
    return { success: false, error: '更新线索状态失败，请稍后重试' }
  }

  console.log('[convertLeadToOpportunityAction] ✅ Conversion successful!')

  // 5. 创建系统跟进记录（可选）
  // 如果您有 interactions 表，可以在这里记录转化事件

  return {
    success: true,
    opportunityId: opportunity.opportunityCode,
  }
}
