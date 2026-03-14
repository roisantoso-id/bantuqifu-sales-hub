'use server'

import { createClient, createServiceClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { generateBizId } from '@/lib/utils/id-generator'

// ─── 租户隔离辅助 ─────────────────────────────────────────────────────────────

async function getCurrentTenantId(): Promise<string> {
  const cookieStore = await cookies()
  return cookieStore.get('selectedTenant')?.value ?? 'org_bantu_id'
}

// ─── 返回类型定义 ─────────────────────────────────────────────────────────────

export interface CustomerRow {
  id: string            // DB 主键 (UUID)
  customerId: string    // 人读编号 CUST-2024-001
  customerName: string
  phone: string | null
  email: string | null
  wechat: string | null
  level: string         // L1–L6
  isLocked: boolean
  passportNo: string | null
  createdAt: string
  // 前端聚合字段
  opportunityCount: number
  activeOpportunityCount: number
  totalRevenue: number
}

export interface CustomerOpportunityRow {
  id: string
  opportunityCode: string
  stageId: string
  status: string
  serviceTypeLabel: string
  estimatedAmount: number
  currency: string
  requirements: string | null
  createdAt: string
  updatedAt: string
}

export interface CustomerActionLogRow {
  id: string
  opportunityId: string
  operatorId: string
  operatorName: string
  actionType: string
  actionLabel: string
  stageId: string | null
  remark: string | null
  timestamp: string
}

// ─── getCustomersAction ───────────────────────────────────────────────────────

export async function getCustomersAction(): Promise<CustomerRow[]> {
  const supabase = await createClient()
  const tenantId = await getCurrentTenantId()

  const { data, error } = await supabase
    .from('customers')
    .select(`
      id,
      customerId,
      customerName,
      phone,
      email,
      wechat,
      level,
      isLocked,
      passportNo,
      createdAt,
      opportunities(id, estimatedAmount, status)
    `)
    .eq('organizationId', tenantId)
    .order('createdAt', { ascending: false })

  if (error) {
    console.error('[customer action] getCustomers error:', error.message)
    throw new Error(error.message)
  }

  return (data ?? []).map((c: any) => {
    const opps: any[] = c.opportunities ?? []
    return {
      id: c.id,
      customerId: c.customerId,
      customerName: c.customerName,
      phone: c.phone ?? null,
      email: c.email ?? null,
      wechat: c.wechat ?? null,
      level: c.level ?? 'L1',
      isLocked: c.isLocked ?? false,
      passportNo: c.passportNo ?? null,
      createdAt: c.createdAt,
      opportunityCount: opps.length,
      activeOpportunityCount: opps.filter((o) => o.status === 'active').length,
      totalRevenue: opps.reduce((sum: number, o: any) => sum + (Number(o.estimatedAmount) || 0), 0),
    }
  })
}

// ─── getCustomerDetailAction ──────────────────────────────────────────────────

export async function getCustomerDetailAction(customerDbId: string): Promise<{
  opportunities: CustomerOpportunityRow[]
  actionLogs: CustomerActionLogRow[]
} | null> {
  const supabase = await createClient()
  const tenantId = await getCurrentTenantId()

  // 查该客户的商机（租户隔离）
  const { data: oppsData, error: oppsError } = await supabase
    .from('opportunities')
    .select(`
      id,
      opportunityCode,
      serviceTypeLabel,
      stageId,
      status,
      estimatedAmount,
      currency,
      requirements,
      createdAt,
      updatedAt
    `)
    .eq('organizationId', tenantId)
    .eq('customerId', customerDbId)
    .order('createdAt', { ascending: false })

  if (oppsError) {
    console.error('[customer action] getCustomerDetail opps error:', oppsError.message)
    throw new Error(oppsError.message)
  }

  const opportunities: CustomerOpportunityRow[] = (oppsData ?? []).map((o: any) => ({
    id: o.id,
    opportunityCode: o.opportunityCode ?? '-',
    serviceTypeLabel: o.serviceTypeLabel ?? '-',
    stageId: o.stageId,
    status: o.status,
    estimatedAmount: Number(o.estimatedAmount ?? 0),
    currency: o.currency ?? 'IDR',
    requirements: o.requirements ?? null,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  }))

  // 查关联操作日志（join users_auth 获取操作者姓名）
  let actionLogs: CustomerActionLogRow[] = []
  const oppIds = opportunities.map((o) => o.id)

  if (oppIds.length > 0) {
    const { data: logsData, error: logsError } = await supabase
      .from('action_logs')
      .select(`
        id,
        opportunityId,
        operatorId,
        actionType,
        actionLabel,
        stageId,
        remark,
        timestamp
      `)
      .eq('organizationId', tenantId)
      .in('opportunityId', oppIds)
      .order('timestamp', { ascending: false })

    if (logsError) {
      console.error('[customer action] getCustomerDetail logs error:', logsError.message)
      // 日志查询失败不阻断主流程
    } else {
      // 批量获取操作者姓名
      const operatorIds = [...new Set((logsData ?? []).map((l: any) => l.operatorId))]
      let operatorMap: Record<string, string> = {}

      if (operatorIds.length > 0) {
        const { data: usersData } = await supabase
          .from('users_auth')
          .select('id, name')
          .in('id', operatorIds)

        operatorMap = Object.fromEntries((usersData ?? []).map((u: any) => [u.id, u.name]))
      }

      actionLogs = (logsData ?? []).map((l: any) => ({
        id: l.id,
        opportunityId: l.opportunityId,
        operatorId: l.operatorId,
        operatorName: operatorMap[l.operatorId] ?? l.operatorId,
        actionType: l.actionType,
        actionLabel: l.actionLabel,
        stageId: l.stageId ?? null,
        remark: l.remark ?? null,
        timestamp: l.timestamp,
      }))
    }
  }

  return { opportunities, actionLogs }
}

// ─── createCustomerAction ────────────────────────────────────────────────────

export async function createCustomerAction(data: {
  customerName: string
  phone?: string | null
  email?: string | null
  wechat?: string | null
  level?: string
  passportNo?: string | null
}): Promise<CustomerRow | null> {
  // 写操作使用 service_role 绕过 RLS
  const supabase = await createServiceClient()
  const tenantId = await getCurrentTenantId()

  try {
    // 1. 生成语义化客户 ID
    const customerId = await generateBizId('CUS') // 例如：CUS-260315-0001

    // 2. 插入数据库
    const { data: inserted, error } = await supabase
      .from('customers')
      .insert([
        {
          organizationId: tenantId,
          customerId,
          customerName: data.customerName,
          phone: data.phone ?? null,
          email: data.email ?? null,
          wechat: data.wechat ?? null,
          level: data.level ?? 'L5',
          passportNo: data.passportNo ?? null,
          isLocked: false,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error('[customer action] createCustomer error:', error.message)
      throw new Error(error.message)
    }

    return {
      id: inserted.id,
      customerId: inserted.customerId,
      customerName: inserted.customerName,
      phone: inserted.phone ?? null,
      email: inserted.email ?? null,
      wechat: inserted.wechat ?? null,
      level: inserted.level ?? 'L5',
      isLocked: inserted.isLocked ?? false,
      passportNo: inserted.passportNo ?? null,
      createdAt: inserted.createdAt,
      opportunityCount: 0,
      activeOpportunityCount: 0,
      totalRevenue: 0,
    }
  } catch (error: any) {
    console.error('[customer action] createCustomer caught error:', error)
    return null
  }
}
