'use server'
// Lead Actions - v1.0 using Supabase direct (matches leads table schema)

import { createClient, createServiceClient } from '@/lib/supabase/server'
import { generateBizId } from '@/lib/utils/id-generator'
import { cookies } from 'next/headers'

// ─── 租户隔离辅助 ─────────────────────────────────────────────────────────────

async function getCurrentTenantId(): Promise<string> {
  const cookieStore = await cookies()
  return cookieStore.get('selectedTenant')?.value ?? 'org_bantu_id'
}

async function getCurrentUserId(): Promise<string | null> {
  const supabase = await createServiceClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return user.id
}

// ─── 类型定义 ─────────────────────────────────────────────────────────────────

export interface LeadRow {
  id: string
  organizationId: string
  leadCode: string
  personName: string
  company: string | null
  position: string | null
  phone: string | null
  email: string | null
  wechat: string | null
  source: string
  sourceDetail: string | null
  category: string
  urgency: string
  status: string
  assignedToId: string | null
  nextFollowDate: string | null
  discardReason: string | null
  discardedAt: string | null
  discardedById: string | null
  notes: string | null
  createdById: string | null
  createdAt: string
  updatedAt: string
}

export interface LeadFollowUpRow {
  id: string
  leadId: string
  followupType: string
  content: string
  nextAction: string | null
  nextActionDate: string | null
  createdById: string | null
  createdAt: string
}

// ─── 枚举常量 ─────────────────────────────────────────────────────────────────

export const LEAD_SOURCES = [
  { value: 'INBOUND',      label: '主动来访' },
  { value: 'REFERRAL',     label: '转介绍' },
  { value: 'CUSTOMER_REF', label: '老客户推荐' },
  { value: 'EXHIBITION',   label: '展会' },
  { value: 'WEBSITE',      label: '官网询盘' },
  { value: 'SOCIAL_MEDIA', label: '社交媒体' },
  { value: 'OTHER',        label: '其他' },
]

export const LEAD_CATEGORIES = [
  { value: 'PRODUCT_INQUIRY',  label: '产品咨询' },
  { value: 'PRICE_INQUIRY',    label: '价格咨询' },
  { value: 'SERVICE_INQUIRY',  label: '服务咨询' },
  { value: 'COOPERATION',      label: '合作洽谈' },
  { value: 'OTHER',            label: '其他' },
]

export const LEAD_URGENCY = [
  { value: 'HOT',  label: '热', color: 'bg-red-100 text-red-700' },
  { value: 'WARM', label: '温', color: 'bg-amber-100 text-amber-700' },
  { value: 'COLD', label: '冷', color: 'bg-sky-100 text-sky-700' },
]

export const LEAD_STATUSES = [
  { value: 'NEW',         label: '新线索',   color: 'bg-slate-100 text-slate-600' },
  { value: 'CONTACTED',   label: '已联系',   color: 'bg-blue-100 text-blue-700' },
  { value: 'INTERESTED',  label: '有意向',   color: 'bg-violet-100 text-violet-700' },
  { value: 'QUALIFIED',   label: '已确认',   color: 'bg-indigo-100 text-indigo-700' },
  { value: 'PROPOSAL',    label: '已报价',   color: 'bg-amber-100 text-amber-700' },
  { value: 'NEGOTIATION', label: '谈判中',   color: 'bg-orange-100 text-orange-700' },
  { value: 'CONVERTED',   label: '已转化',   color: 'bg-green-100 text-green-700' },
  { value: 'DISCARDED',   label: '已废弃',   color: 'bg-red-100 text-red-500' },
]

export const DISCARD_REASONS = [
  { value: 'INVALID_INFO',   label: '信息无效' },
  { value: 'NOT_INTERESTED', label: '无意向' },
  { value: 'POOR_MATCH',     label: '需求不匹配' },
  { value: 'COMPETITOR',     label: '选择竞争对手' },
  { value: 'DUPLICATE',      label: '重复线索' },
  { value: 'OTHER',          label: '其他' },
]

// ─── 1. 获取线索列表 ──────────────────────────────────────────────────────────

export async function getLeadsAction(
  viewMode: 'my_leads' | 'public_pool' = 'my_leads'
): Promise<LeadRow[]> {
  const supabase = await createClient()
  const tenantId = await getCurrentTenantId()
  const userId = await getCurrentUserId()

  let query = supabase
    .from('leads')
    .select('*')
    .eq('organizationId', tenantId)
    .order('createdAt', { ascending: false })

  if (viewMode === 'my_leads') {
    if (userId) {
      query = query.eq('assignedToId', userId).neq('status', 'DISCARDED')
    } else {
      query = query.neq('status', 'DISCARDED').is('assignedToId', null)
    }
  } else {
    // 公海：无负责人 或 已废弃
    query = query.or('assignedToId.is.null,status.eq.DISCARDED')
  }

  const { data, error } = await query

  if (error) {
    console.error('[lead action] getLeads error:', error.message)
    return []
  }

  return (data ?? []) as LeadRow[]
}

// ─── 2. 新建线索 ──────────────────────────────────────────────────────────────

export async function createLeadAction(input: {
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
  notes?: string | null
}): Promise<LeadRow | null> {
  const supabase = await createServiceClient()
  const tenantId = await getCurrentTenantId()
  const userId = await getCurrentUserId()

  const leadCode = await generateBizId('LED')

  const { data, error } = await supabase
    .from('leads')
    .insert([{
      id: crypto.randomUUID(),
      organizationId: tenantId,
      leadCode,
      personName: input.personName,
      company: input.company ?? null,
      position: input.position ?? null,
      phone: input.phone ?? null,
      email: input.email ?? null,
      wechat: input.wechat ?? null,
      source: input.source,
      sourceDetail: input.sourceDetail ?? null,
      category: input.category,
      urgency: input.urgency,
      status: 'NEW',
      assignedToId: userId,
      notes: input.notes ?? null,
      createdById: userId,
    }])
    .select('*')
    .single()

  if (error) {
    console.error('[lead action] createLead error:', error.message)
    return null
  }

  return data as LeadRow
}

// ─── 3. 更新线索状态 ──────────────────────────────────────────────────────────

export async function updateLeadStatusAction(
  leadId: string,
  status: string
): Promise<LeadRow | null> {
  const supabase = await createServiceClient()
  const userId = await getCurrentUserId()

  const { data, error } = await supabase
    .from('leads')
    .update({ status, updatedById: userId, updatedAt: new Date().toISOString() })
    .eq('id', leadId)
    .select('*')
    .single()

  if (error) {
    console.error('[lead action] updateLeadStatus error:', error.message)
    return null
  }

  return data as LeadRow
}

// ─── 4. 废弃线索 / 退回公海 ───────────────────────────────────────────────────

export async function discardLeadAction(
  leadId: string,
  discardReason: string
): Promise<LeadRow | null> {
  const supabase = await createServiceClient()
  const userId = await getCurrentUserId()

  const { data, error } = await supabase
    .from('leads')
    .update({
      status: 'DISCARDED',
      assignedToId: null,
      discardReason,
      discardedAt: new Date().toISOString(),
      discardedById: userId,
      updatedById: userId,
      updatedAt: new Date().toISOString(),
    })
    .eq('id', leadId)
    .select('*')
    .single()

  if (error) {
    console.error('[lead action] discardLead error:', error.message)
    return null
  }

  return data as LeadRow
}

// ─── 5. 从公海认领线索 ────────────────────────────────────────────────────────

export async function claimLeadAction(leadId: string): Promise<LeadRow | null> {
  const supabase = await createServiceClient()
  const userId = await getCurrentUserId()

  if (!userId) return null

  const { data, error } = await supabase
    .from('leads')
    .update({
      assignedToId: userId,
      status: 'NEW',
      discardReason: null,
      discardedAt: null,
      discardedById: null,
      updatedById: userId,
      updatedAt: new Date().toISOString(),
    })
    .eq('id', leadId)
    .select('*')
    .single()

  if (error) {
    console.error('[lead action] claimLead error:', error.message)
    return null
  }

  return data as LeadRow
}

// ─── 6. 设置下次跟进日期 ──────────────────────────────────────────────────────

export async function setNextFollowDateAction(
  leadId: string,
  nextFollowDate: string
): Promise<LeadRow | null> {
  const supabase = await createServiceClient()
  const userId = await getCurrentUserId()

  const { data, error } = await supabase
    .from('leads')
    .update({
      nextFollowDate,
      updatedById: userId,
      updatedAt: new Date().toISOString(),
    })
    .eq('id', leadId)
    .select('*')
    .single()

  if (error) {
    console.error('[lead action] setNextFollowDate error:', error.message)
    return null
  }

  return data as LeadRow
}

// ─── 7. 添加跟进记录 ──────────────────────────────────────────────────────────

export async function addLeadFollowUpAction(input: {
  leadId: string
  followupType: string
  content: string
  nextAction?: string | null
  nextActionDate?: string | null
}): Promise<LeadFollowUpRow | null> {
  const supabase = await createServiceClient()
  const tenantId = await getCurrentTenantId()
  const userId = await getCurrentUserId()

  const { data, error } = await supabase
    .from('lead_follow_ups')
    .insert([{
      id: crypto.randomUUID(),
      organizationId: tenantId,
      leadId: input.leadId,
      followupType: input.followupType,
      content: input.content,
      nextAction: input.nextAction ?? null,
      nextActionDate: input.nextActionDate ?? null,
      createdById: userId,
    }])
    .select('*')
    .single()

  if (error) {
    console.error('[lead action] addFollowUp error:', error.message)
    return null
  }

  return data as LeadFollowUpRow
}

// ─── 8. 获取线索跟进记录 ──────────────────────────────────────────────────────

export async function getLeadFollowUpsAction(leadId: string): Promise<LeadFollowUpRow[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('lead_follow_ups')
    .select('*')
    .eq('leadId', leadId)
    .order('createdAt', { ascending: false })

  if (error) {
    console.error('[lead action] getFollowUps error:', error.message)
    return []
  }

  return (data ?? []) as LeadFollowUpRow[]
}
