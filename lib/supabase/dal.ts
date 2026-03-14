/**
 * lib/supabase/dal.ts
 * Data Access Layer — maps Supabase DB rows to app TypeScript types.
 * All functions use the anon client so they work in both client & server components.
 */

import { supabase } from './client'
import type { Lead, Opportunity, ActionLog, Customer, Product } from '@/lib/types'

// ─── Type helpers ─────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapLead(row: any): Lead {
  return {
    id: row.leadNo ?? row.id,
    wechatName: row.name,
    phone: row.phone ?? undefined,
    source: row.source ?? 'website',
    category: mapCategory(row.category),
    urgency: mapUrgency(row.urgency),
    initialIntent: row.notes ?? '',
    assignee: row.assignee ?? undefined,
    status: row.status ?? 'new',
    discardReason: mapDiscardReason(row.discardReason),
    discardedAt: row.updatedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    notes: row.notes ?? undefined,
    convertedOpportunityId: undefined,
  }
}

function mapCategory(cat?: string) {
  const map: Record<string, Lead['category']> = {
    VISA: '签证服务',
    COMPANY_REGISTRATION: '公司注册',
    FINANCIAL_SERVICES: '财务服务',
    PERMIT_SERVICES: '准证服务',
    TAX_SERVICES: '税务服务',
  }
  return cat ? map[cat] : undefined
}

function mapUrgency(urg?: string) {
  const map: Record<string, Lead['urgency']> = { HIGH: '高', MEDIUM: '中', LOW: '低' }
  return urg ? map[urg] : undefined
}

function mapDiscardReason(r?: string) {
  const map: Record<string, Lead['discardReason']> = {
    NO_CONTACT: '无法联系',
    MISMATCH_NEEDS: '需求不匹配',
    LIMITED_SALES_CAPABILITY: '销售能力有限',
    OTHER: '其他',
  }
  return r ? map[r] : undefined
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapOpportunity(row: any): Opportunity {
  return {
    id: row.opportunityId ?? row.id,
    customerId: row.customerId,
    customer: {
      id: row.customerId,
      name: row.Customer?.name ?? '',
      passportNo: '',
      phone: row.Customer?.Contact?.[0]?.phone ?? '',
      email: row.Customer?.Contact?.[0]?.email ?? '',
      wechat: row.Customer?.Contact?.[0]?.wechat ?? undefined,
    },
    stageId: row.stageId ?? 'P1',
    status: 'active',
    serviceType: 'VISA',
    serviceTypeLabel: row.title ?? '',
    estimatedAmount: parseFloat(row.amount ?? '0'),
    currency: (row.currency as 'CNY' | 'IDR') ?? 'IDR',
    assignee: row.assignee ?? '',
    notes: row.notes ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapActionLog(row: any): ActionLog {
  return {
    id: row.id,
    opportunityId: row.opportunityId ?? '',
    operatorId: row.operatorId ?? '',
    operatorName: row.operatorName,
    actionType: 'NOTE',
    actionLabel: row.actionLabel ?? row.remark ?? '',
    timestamp: row.timestamp ?? row.createdAt,
    remark: row.remark ?? undefined,
    attachments: row.attachments ?? undefined,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapProduct(row: any): Product {
  return {
    id: row.id,
    name: row.name,
    category: row.category ?? '',
    price: parseFloat(row.basePrice ?? '0'),
    currency: row.currency ?? 'IDR',
    description: row.description ?? undefined,
  }
}

// ─── Query functions ──────────────────────────────────────────────────────────

export async function fetchLeads(tenantId?: string): Promise<Lead[]> {
  const query = supabase
    .from('Lead')
    .select('*')
    .order('createdAt', { ascending: false })

  if (tenantId) query.eq('tenantId', tenantId)

  const { data, error } = await query
  if (error) throw new Error(`fetchLeads: ${error.message}`)
  return (data ?? []).map(mapLead)
}

export async function fetchOpportunities(tenantId?: string): Promise<Opportunity[]> {
  const query = supabase
    .from('Opportunity')
    .select(`
      *,
      Customer (
        id, name, customerId,
        Contact ( name, phone, email, wechat, isPrimary )
      )
    `)
    .order('createdAt', { ascending: false })

  if (tenantId) query.eq('tenantId', tenantId)

  const { data, error } = await query
  if (error) throw new Error(`fetchOpportunities: ${error.message}`)
  return (data ?? []).map(mapOpportunity)
}

export async function fetchActionLogs(opportunityId: string): Promise<ActionLog[]> {
  const { data, error } = await supabase
    .from('ActionLog')
    .select('*')
    .eq('opportunityId', opportunityId)
    .order('timestamp', { ascending: false })

  if (error) throw new Error(`fetchActionLogs: ${error.message}`)
  return (data ?? []).map(mapActionLog)
}

export async function fetchAllActionLogs(tenantId?: string): Promise<ActionLog[]> {
  const query = supabase
    .from('ActionLog')
    .select('*')
    .order('timestamp', { ascending: false })

  if (tenantId) query.eq('tenantId', tenantId)

  const { data, error } = await query
  if (error) throw new Error(`fetchAllActionLogs: ${error.message}`)
  return (data ?? []).map(mapActionLog)
}

export async function fetchProducts(tenantId?: string): Promise<Product[]> {
  const query = supabase
    .from('Product')
    .select('*')
    .eq('isActive', true)
    .order('name')

  if (tenantId) query.eq('tenantId', tenantId)

  const { data, error } = await query
  if (error) throw new Error(`fetchProducts: ${error.message}`)
  return (data ?? []).map(mapProduct)
}

// ─── Mutation functions ───────────────────────────────────────────────────────

export async function insertActionLog(params: {
  tenantId: string
  opportunityId?: string
  customerId?: string
  operatorName: string
  actionType?: string
  actionLabel?: string
  remark?: string
  stageFrom?: string
  stageTo?: string
  attachments?: object[]
}): Promise<void> {
  const { error } = await supabase.from('ActionLog').insert({
    tenantId: params.tenantId,
    opportunityId: params.opportunityId ?? null,
    customerId: params.customerId ?? null,
    operatorName: params.operatorName,
    actionType: params.actionType ?? 'note_added',
    actionLabel: params.actionLabel ?? null,
    remark: params.remark ?? null,
    stageFrom: params.stageFrom ?? null,
    stageTo: params.stageTo ?? null,
    attachments: params.attachments ? JSON.stringify(params.attachments) : null,
    timestamp: new Date().toISOString(),
  })
  if (error) throw new Error(`insertActionLog: ${error.message}`)
}

export async function updateOpportunityStage(
  opportunityDbId: string,
  newStage: string
): Promise<void> {
  const { error } = await supabase
    .from('Opportunity')
    .update({ stageId: newStage, updatedAt: new Date().toISOString() })
    .eq('opportunityId', opportunityDbId)
  if (error) throw new Error(`updateOpportunityStage: ${error.message}`)
}
