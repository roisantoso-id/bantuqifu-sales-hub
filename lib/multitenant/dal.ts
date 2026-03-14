import { prisma } from '@/lib/prisma'
import { getCurrentTenantId } from './tenant-context'
import type { Lead, Opportunity, ActionLog, Customer, Product } from '@prisma/client'

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 多租户数据访问层 (DAL)
 * 
 * 核心原则：
 * 1. 所有查询都必须强制附加 organizationId 过滤
 * 2. 绝对不能允许跨租户数据泄露
 * 3. 每次查询时都需要调用 getCurrentTenantId() 进行上下文验证
 * ═══════════════════════════════════════════════════════════════════════════
 */

// ──────────────────────────────────────────────────────────────────────────
// LEAD 查询
// ──────────────────────────────────────────────────────────────────────────

export async function getLeads(filters?: {
  status?: string
  assigneeId?: string
}): Promise<Lead[]> {
  const organizationId = getCurrentTenantId()
  
  return await prisma.lead.findMany({
    where: {
      organizationId, // ✓ 强制租户隔离
      ...(filters?.status && { status: filters.status }),
      ...(filters?.assigneeId && { assigneeId: filters.assigneeId }),
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getLeadById(leadId: string): Promise<Lead | null> {
  const organizationId = getCurrentTenantId()
  
  // ✓ 验证该 lead 属于当前租户
  return await prisma.lead.findFirst({
    where: {
      id: leadId,
      organizationId,
    },
  })
}

export async function createLead(data: {
  wechatName: string
  phone?: string
  source: string
  category?: string
  urgency?: string
  initialIntent: string
}): Promise<Lead> {
  const organizationId = getCurrentTenantId()
  
  return await prisma.lead.create({
    data: {
      organizationId, // ✓ 强制附加租户 ID
      ...data,
    },
  })
}

// ──────────────────────────────────────────────────────────────────────────
// OPPORTUNITY 查询
// ──────────────────────────────────────────────────────────────────────────

export async function getOpportunities(filters?: {
  stageId?: string
  customerId?: string
  assigneeId?: string
}): Promise<Opportunity[]> {
  const organizationId = getCurrentTenantId()
  
  return await prisma.opportunity.findMany({
    where: {
      organizationId, // ✓ 强制租户隔离
      ...(filters?.stageId && { stageId: filters.stageId }),
      ...(filters?.customerId && { customerId: filters.customerId }),
      ...(filters?.assigneeId && { assigneeId: filters.assigneeId }),
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getOpportunityById(opportunityId: string): Promise<Opportunity | null> {
  const organizationId = getCurrentTenantId()
  
  return await prisma.opportunity.findFirst({
    where: {
      id: opportunityId,
      organizationId, // ✓ 验证租户所有权
    },
  })
}

export async function updateOpportunityStage(
  opportunityId: string,
  newStageId: string
): Promise<Opportunity> {
  const organizationId = getCurrentTenantId()
  
  // ✓ 先验证此商机属于当前租户
  const opp = await prisma.opportunity.findFirst({
    where: { id: opportunityId, organizationId },
  })
  
  if (!opp) {
    throw new Error('❌ 商机不存在或无权访问')
  }
  
  return await prisma.opportunity.update({
    where: { id: opportunityId },
    data: { stageId: newStageId },
  })
}

// ──────────────────────────────────────────────────────────────────────────
// CUSTOMER 查询
// ──────────────────────────────────────────────────────────────────────────

export async function getCustomers(filters?: {
  level?: string
}): Promise<Customer[]> {
  const organizationId = getCurrentTenantId()
  
  return await prisma.customer.findMany({
    where: {
      organizationId, // ✓ 强制租户隔离
      ...(filters?.level && { level: filters.level }),
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getCustomerById(customerId: string): Promise<Customer | null> {
  const organizationId = getCurrentTenantId()
  
  return await prisma.customer.findFirst({
    where: {
      id: customerId,
      organizationId, // ✓ 验证租户所有权
    },
  })
}

// ──────────────────────────────────────────────────────────────────────────
// ACTION LOG 查询
// ──────────────────────────────────────────────────────────────────────────

export async function getActionLogs(opportunityId: string): Promise<ActionLog[]> {
  const organizationId = getCurrentTenantId()
  
  return await prisma.actionLog.findMany({
    where: {
      organizationId, // ✓ 强制租户隔离
      opportunityId,
    },
    orderBy: { timestamp: 'desc' },
  })
}

export async function addActionLog(data: {
  opportunityId: string
  operatorId: string
  actionType: string
  actionLabel: string
  remark?: string
  stageId?: string
}): Promise<ActionLog> {
  const organizationId = getCurrentTenantId()
  
  // ✓ 验证商机属于当前租户
  const opp = await prisma.opportunity.findFirst({
    where: { id: data.opportunityId, organizationId },
  })
  
  if (!opp) {
    throw new Error('❌ 商机不存在或无权访问')
  }
  
  return await prisma.actionLog.create({
    data: {
      organizationId, // ✓ 强制附加租户 ID
      ...data,
    },
  })
}

// ──────────────────────────────────────────────────────────────────────────
// PRODUCT 查询
// ──────────────────────────────────────────────────────────────────────────

export async function getProducts(): Promise<Product[]> {
  const organizationId = getCurrentTenantId()
  
  return await prisma.product.findMany({
    where: {
      organizationId, // ✓ 强制租户隔离
    },
    orderBy: { name: 'asc' },
  })
}

export async function getProductById(productId: string): Promise<Product | null> {
  const organizationId = getCurrentTenantId()
  
  return await prisma.product.findFirst({
    where: {
      id: productId,
      organizationId, // ✓ 验证租户所有权
    },
  })
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 重要提示：
 * 
 * ❌ 错误示例（会导致数据泄露）：
 *    const leads = await prisma.lead.findMany()
 *    // 会返回所有租户的 leads！
 *
 * ✓ 正确示例（安全）：
 *    const leads = await getLeads()
 *    // 只返回当前租户的 leads
 * 
 * 所有业务代码应该通过这些 DAL 函数进行查询，
 * 绝对不能直接调用 prisma 进行未经过滤的查询！
 * ═══════════════════════════════════════════════════════════════════════════
 */
