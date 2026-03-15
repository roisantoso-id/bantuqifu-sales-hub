'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

// ─── Types ───────────────────────────────────────────────────────────────────

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
  createdAt: string
  createdById: string | null
  updatedAt: string
  updatedById: string | null
}

export interface LeadFollowUpRow {
  id: string
  organizationId: string
  leadId: string
  followupType: string
  content: string
  nextAction: string | null
  nextActionDate: string | null
  createdById: string | null
  createdAt: string
}

// ─── Helper Functions ────────────────────────────────────────────────────────

async function getCurrentTenantId(): Promise<string> {
  const cookieStore = await cookies()
  return cookieStore.get('selectedTenant')?.value ?? 'org_bantu_id'
}

async function getCurrentUserId(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id ?? null
}

// ─── Actions ─────────────────────────────────────────────────────────────────

export async function getLeadsAction(viewMode: 'my_leads' | 'public_pool'): Promise<LeadRow[]> {
  const supabase = await createClient()
  const tenantId = await getCurrentTenantId()
  const userId = await getCurrentUserId()

  let query = supabase.from('leads').select('*').eq('organizationId', tenantId)

  if (viewMode === 'my_leads') {
    if (!userId) return []
    query = query.eq('assignedToId', userId).neq('status', 'LOST')
  } else {
    query = query.is('assignedToId', null).neq('status', 'LOST')
  }

  const { data, error } = await query.order('createdAt', { ascending: false })

  if (error) {
    console.error('[getLeadsAction] Error:', error.message)
    return []
  }

  return (data ?? []) as LeadRow[]
}

export async function createLeadAction(data: {
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
  const supabase = await createClient()
  const tenantId = await getCurrentTenantId()
  const userId = await getCurrentUserId()

  const leadCode = `LEAD-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${Math.random().toString().slice(2, 6).padStart(4, '0')}`

  const { data: inserted, error } = await supabase.from('leads').insert([{
    id: crypto.randomUUID(),
    organizationId: tenantId,
    leadCode,
    personName: data.personName.trim(),
    company: data.company || null,
    position: data.position || null,
    phone: data.phone || null,
    email: data.email || null,
    wechat: data.wechat || null,
    source: data.source,
    sourceDetail: data.sourceDetail || null,
    category: data.category,
    urgency: data.urgency,
    status: 'NEW',
    assignedToId: userId,
    nextFollowDate: null,
    notes: data.notes || null,
    createdById: userId,
    updatedById: userId,
  }]).select().single()

  if (error) {
    console.error('[createLeadAction] Error:', error.message)
    return null
  }

  return inserted as LeadRow
}

export async function updateLeadStatusAction(leadId: string, status: string): Promise<LeadRow | null> {
  const supabase = await createClient()
  const userId = await getCurrentUserId()

  const { data: updated, error } = await supabase
    .from('leads')
    .update({ status, updatedById: userId, updatedAt: new Date().toISOString() })
    .eq('id', leadId)
    .select()
    .single()

  if (error) {
    console.error('[updateLeadStatusAction] Error:', error.message)
    return null
  }

  return updated as LeadRow
}

export async function discardLeadAction(leadId: string, reason: string): Promise<LeadRow | null> {
  const supabase = await createClient()
  const userId = await getCurrentUserId()

  const { data: updated, error } = await supabase
    .from('leads')
    .update({
      status: 'LOST',
      assignedToId: null,
      discardReason: reason,
      discardedAt: new Date().toISOString(),
      discardedById: userId,
      updatedById: userId,
      updatedAt: new Date().toISOString(),
    })
    .eq('id', leadId)
    .select()
    .single()

  if (error) {
    console.error('[discardLeadAction] Error:', error.message)
    return null
  }

  return updated as LeadRow
}

export async function claimLeadAction(leadId: string): Promise<LeadRow | null> {
  const supabase = await createClient()
  const userId = await getCurrentUserId()

  if (!userId) {
    console.error('[claimLeadAction] Not authenticated')
    return null
  }

  const { data: updated, error } = await supabase
    .from('leads')
    .update({ assignedToId: userId, updatedById: userId, updatedAt: new Date().toISOString() })
    .eq('id', leadId)
    .select()
    .single()

  if (error) {
    console.error('[claimLeadAction] Error:', error.message)
    return null
  }

  return updated as LeadRow
}

export async function addLeadFollowUpAction(data: {
  leadId: string
  followupType: string
  content: string
  nextAction?: string | null
  nextActionDate?: string | null
}): Promise<LeadFollowUpRow | null> {
  const supabase = await createClient()
  const tenantId = await getCurrentTenantId()
  const userId = await getCurrentUserId()

  const { data: inserted, error } = await supabase.from('lead_follow_ups').insert([{
    id: crypto.randomUUID(),
    organizationId: tenantId,
    leadId: data.leadId,
    followupType: data.followupType,
    content: data.content.trim(),
    nextAction: data.nextAction || null,
    nextActionDate: data.nextActionDate || null,
    createdById: userId,
  }]).select().single()

  if (error) {
    console.error('[addLeadFollowUpAction] Error:', error.message)
    return null
  }

  return inserted as LeadFollowUpRow
}

export async function getLeadFollowUpsAction(leadId: string): Promise<LeadFollowUpRow[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('lead_follow_ups')
    .select('*')
    .eq('leadId', leadId)
    .order('createdAt', { ascending: false })

  if (error) {
    console.error('[getLeadFollowUpsAction] Error:', error.message)
    return []
  }

  return (data ?? []) as LeadFollowUpRow[]
}
