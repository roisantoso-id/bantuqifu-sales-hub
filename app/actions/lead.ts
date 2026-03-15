'use server'

import { createClient } from '@/lib/supabase/server'

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
  status: 'NEW' | 'PUSHING' | 'CONVERTED' | 'LOST'
  assignedToId?: string | null
  nextFollowDate?: string | null
  discardReason?: string | null
  discardedAt?: string | null
  discardedById?: string | null
  notes?: string | null
  createdAt: string
  createdById?: string | null
  updatedAt: string
  updatedById?: string | null
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

// ─── getLeadsAction ────────────────────────────────────────────────────────────
export async function getLeadsAction(
  viewMode: 'my_leads' | 'pool',
  filters?: { status?: string; urgency?: string; searchText?: string },
): Promise<LeadRow[]> {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  const userId = user?.id

  // Get tenant from cookies
  const cookieStore = await import('next/headers').then(m => m.cookies())
  const tenantId = (await cookieStore).get('tenantId')?.value

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
    query = query.eq('assignedToId', userId)
  } else {
    // 公海：无负责人的线索
    query = query.is('assignedToId', null)
  }

  // Apply filters
  if (filters?.status) {
    query = query.eq('status', filters.status)
  }
  if (filters?.urgency) {
    query = query.eq('urgency', filters.urgency)
  }

  // Exclude discarded
  query = query.neq('status', 'LOST')

  const { data, error } = await query.order('createdAt', { ascending: false })

  if (error) {
    console.error('[getLeadsAction] Error:', error.message)
    return []
  }

  return (data ?? []) as LeadRow[]
}

// ─── createLeadAction ──────────────────────────────────────────────────────────
export async function createLeadAction(input: {
  personName: string
  company?: string
  position?: string
  phone?: string
  email?: string
  wechat?: string
  source: string
  sourceDetail?: string
  category: string
  urgency: string
  notes?: string
}): Promise<LeadRow | null> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const userId = user?.id

  const cookieStore = await import('next/headers').then(m => m.cookies())
  const tenantId = (await cookieStore).get('tenantId')?.value

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
        personName: input.personName,
        company: input.company || null,
        position: input.position || null,
        phone: input.phone || null,
        email: input.email || null,
        wechat: input.wechat || null,
        source: input.source,
        sourceDetail: input.sourceDetail || null,
        category: input.category,
        urgency: input.urgency,
        status: 'NEW',
        assignedToId: userId, // 自动分配给创建人
        notes: input.notes || null,
        createdById: userId,
        updatedById: userId,
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
  status: 'NEW' | 'PUSHING' | 'CONVERTED' | 'LOST',
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

// ─── discardLeadAction ─────────────────────────────────────────────────────────
export async function discardLeadAction(leadId: string): Promise<LeadRow | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // 丢失 = 放回公海（assignedToId=null）+ status=LOST
  const { data, error } = await supabase
    .from('leads')
    .update({
      status: 'LOST',
      assignedToId: null,
      discardReason: 'manual_discard',
      discardedAt: new Date().toISOString(),
      discardedById: user?.id,
      updatedById: user?.id,
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

  const { data, error } = await supabase
    .from('leads')
    .update({
      assignedToId: user.id,
      updatedById: user.id,
      updatedAt: new Date().toISOString(),
    })
    .eq('id', leadId)
    .is('assignedToId', null)
    .select('*')
    .single()

  if (error) {
    console.error('[claimLeadAction] Error:', error.message)
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

  const cookieStore = await import('next/headers').then(m => m.cookies())
  const tenantId = (await cookieStore).get('tenantId')?.value

  if (!tenantId) {
    console.error('[addLeadFollowUpAction] No tenantId')
    return null
  }

  const { data, error } = await supabase
    .from('lead_follow_ups')
    .insert([
      {
        id: crypto.randomUUID(),
        organizationId: tenantId,
        leadId: input.leadId,
        followupType: input.followupType,
        content: input.content,
        nextAction: input.nextAction || null,
        nextActionDate: input.nextActionDate || null,
        createdById: user?.id,
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
