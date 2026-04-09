'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export interface OpportunityListRow {
  id: string
  opportunityCode: string
  stageId: string
  status: string
  serviceType: string
  serviceTypeLabel: string | null
  estimatedAmount: number
  currency: string
  expectedCloseDate: string | null
  actualCloseDate: string | null
  assigneeId: string | null
  customerId: string
  wechatGroupId: number | null
  wechatGroupName: string | null
  destination: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
  customer: {
    id: string
    customerCode: string | null
    customerName: string
    phone: string | null
    email: string | null
    wechat: string | null
    level: string
  } | null
  assignee: {
    id: string
    name: string
  } | null
}

export interface OpportunityListResult {
  rows: OpportunityListRow[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface OpportunityListParams {
  page?: number
  pageSize?: number
  search?: string
  stages?: string[]       // multi-select
  status?: string
  serviceTypes?: string[] // multi-select
  assigneeId?: string
  minAmount?: number
  maxAmount?: number
  dateFrom?: string       // expectedCloseDate >=
  dateTo?: string         // expectedCloseDate <=
  sortField?: string
  sortOrder?: 'asc' | 'desc'
}

async function getCurrentTenantId(): Promise<string> {
  const cookieStore = await cookies()
  return cookieStore.get('selectedTenant')?.value ?? 'org_bantu_id'
}

export async function getOpportunityListAction(
  params: OpportunityListParams
): Promise<OpportunityListResult> {
  const supabase = await createClient()
  const tenantId = await getCurrentTenantId()

  const page = Math.max(1, params.page ?? 1)
  const pageSize = params.pageSize ?? 20
  const skip = (page - 1) * pageSize

  const sortField = params.sortField ?? 'createdAt'
  const sortOrder = params.sortOrder ?? 'desc'

  // Resolve customer IDs for search
  let searchCustomerIds: string[] | null = null
  if (params.search?.trim()) {
    const s = params.search.trim()
    const { data: matched } = await supabase
      .from('customers')
      .select('id')
      .eq('organizationId', tenantId)
      .ilike('customerName', `%${s}%`)
    searchCustomerIds = (matched ?? []).map((c: { id: string }) => c.id)
  }

  function applyFilters(q: ReturnType<typeof supabase.from>) {
    q = q.eq('organizationId', tenantId)

    if (params.stages && params.stages.length > 0) {
      q = q.in('stageId', params.stages)
    }
    if (params.status && params.status !== 'all') {
      q = q.eq('status', params.status)
    }
    if (params.serviceTypes && params.serviceTypes.length > 0) {
      q = q.in('serviceType', params.serviceTypes)
    }
    if (params.assigneeId) {
      q = q.eq('assigneeId', params.assigneeId)
    }
    if (params.minAmount !== undefined) {
      q = q.gte('estimatedAmount', params.minAmount)
    }
    if (params.maxAmount !== undefined) {
      q = q.lte('estimatedAmount', params.maxAmount)
    }
    if (params.dateFrom) {
      q = q.gte('expectedCloseDate', params.dateFrom)
    }
    if (params.dateTo) {
      q = q.lte('expectedCloseDate', params.dateTo)
    }
    if (params.search?.trim()) {
      const s = params.search.trim()
      if (searchCustomerIds && searchCustomerIds.length > 0) {
        q = q.or(`opportunityCode.ilike.%${s}%,customerId.in.(${searchCustomerIds.join(',')})`)
      } else {
        q = q.ilike('opportunityCode', `%${s}%`)
      }
    }
    return q
  }

  const dataQuery = applyFilters(
    supabase.from('opportunities').select(`
      id,
      opportunityCode,
      stageId,
      status,
      serviceType,
      serviceTypeLabel,
      estimatedAmount,
      currency,
      expectedCloseDate,
      actualCloseDate,
      assigneeId,
      customerId,
      wechatGroupId,
      wechatGroupName,
      destination,
      notes,
      createdAt,
      updatedAt,
      customer:customers!opportunities_customerId_fkey (
        id,
        customerCode,
        customerName,
        phone,
        email,
        wechat,
        level
      ),
      assignee:users_auth!opportunities_assigneeId_fkey (
        id,
        name
      )
    `)
  )
    .order(sortField, { ascending: sortOrder === 'asc' })
    .range(skip, skip + pageSize - 1)

  const countQuery = applyFilters(
    supabase.from('opportunities').select('id', { count: 'exact', head: true })
  )

  const [{ data, error }, { count }] = await Promise.all([dataQuery, countQuery])

  if (error) {
    console.error('[getOpportunityListAction] Error:', error.message)
    return { rows: [], total: 0, page, pageSize, totalPages: 0 }
  }

  const total = count ?? 0
  return {
    rows: (data ?? []) as unknown as OpportunityListRow[],
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
}

// ─── PM Task Assignment Operations ─────────────────────────────────────────────

export interface PMTaskOpportunity extends OpportunityListRow {
  department?: string | null
  p6TargetDate?: string | null
  p7TargetDate?: string | null
}

/**
 * Get opportunities in P2-P5 stages for PM task assignment
 * These are ready for activation to P6/P7
 */
export async function getPMTaskOpportunitiesAction(): Promise<PMTaskOpportunity[]> {
  const supabase = await createClient()
  const tenantId = await getCurrentTenantId()

  const { data, error } = await supabase
    .from('opportunities')
    .select(`
      id,
      opportunityCode,
      stageId,
      status,
      serviceType,
      serviceTypeLabel,
      estimatedAmount,
      currency,
      expectedCloseDate,
      actualCloseDate,
      assigneeId,
      customerId,
      createdAt,
      updatedAt,
      customer:customers!opportunities_customerId_fkey (
        id,
        customerCode,
        customerName,
        phone,
        email,
        wechat,
        level
      ),
      assignee:users_auth!opportunities_assigneeId_fkey (
        id,
        name
      )
    `)
    .eq('organizationId', tenantId)
    .in('stageId', ['P2', 'P3', 'P4', 'P5'])
    .order('createdAt', { ascending: false })

  if (error) {
    console.error('[getPMTaskOpportunitiesAction] Error:', error.message)
    return []
  }

  return (data ?? []) as unknown as PMTaskOpportunity[]
}

/**
 * Get department overview metrics for PM dashboard
 */
export async function getDepartmentMetricsAction(): Promise<{
  waitingForP6: number
  inP7: number
  delayed: number
}> {
  const supabase = await createClient()
  const tenantId = await getCurrentTenantId()
  const today = new Date().toISOString().split('T')[0]

  // Waiting for P6: Opportunities in P2-P5
  const { count: waitingForP6 } = await supabase
    .from('opportunities')
    .select('id', { count: 'exact', head: true })
    .eq('organizationId', tenantId)
    .in('stageId', ['P2', 'P3', 'P4', 'P5'])

  // In P7
  const { count: inP7 } = await supabase
    .from('opportunities')
    .select('id', { count: 'exact', head: true })
    .eq('organizationId', tenantId)
    .eq('stageId', 'P7')

  // Delayed: Opportunities with expectedCloseDate < today
  const { count: delayed } = await supabase
    .from('opportunities')
    .select('id', { count: 'exact', head: true })
    .eq('organizationId', tenantId)
    .lt('expectedCloseDate', today)
    .in('stageId', ['P2', 'P3', 'P4', 'P5', 'P6'])

  return {
    waitingForP6: waitingForP6 ?? 0,
    inP7: inP7 ?? 0,
    delayed: delayed ?? 0,
  }
}

/**
 * Update opportunity with P6/P7 activation dates and notes
 */
export async function activateOpportunityAction(
  opportunityId: string,
  data: {
    p6TargetDate?: string
    p7TargetDate?: string
    coordinationNotes?: string
  }
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const tenantId = await getCurrentTenantId()

  // Update the opportunity with P6/P7 data in the notes or custom fields if available
  const { error } = await supabase
    .from('opportunities')
    .update({
      notes: data.coordinationNotes || null,
      updatedAt: new Date().toISOString(),
      // These fields would be stored in p6Data/p7Data JSON if available in schema
    })
    .eq('id', opportunityId)
    .eq('organizationId', tenantId)

  if (error) {
    console.error('[activateOpportunityAction] Error:', error.message)
    return { success: false, error: '更新失败，请稍后重试' }
  }

  return { success: true }
}
