'use server'
// Lead Actions - v2.0 using Supabase direct (matches leads table schema)
// Updated: Fixed public pool logic - discard returns to pool (assignedToId=null), claim takes from pool
// Previous version had "use server" cache issue - this version forces rebuild

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

// Note: Enum constants are defined in lib/constants/lead.ts for use in both client and server

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
    // 我的线索：分配给当前用户且不是已废弃的
    if (userId) {
      query = query.eq('assignedToId', userId).neq('status', 'DISCARDED')
    } else {
      // 未登录用户看不到任何线索
      return []
    }
  } else {
    // 公海线索：无负责人（assignedToId 为 null）的所有非废弃线索
    query = query.is('assignedToId', null).neq('status', 'DISCARDED')
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
