'use server'
// Lead Actions - 线索模块 with public pool logic and tenant isolation

import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

// ─── 租户隔离与上下文 ─────────────────────────────────────────────────────────────

async function getCurrentTenantId(): Promise<string> {
  const cookieStore = await cookies()
  return cookieStore.get('selectedTenant')?.value ?? 'org_bantu_id'
}

async function getCurrentUserId(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get('userId')?.value ?? null
}

// ─── 返回类型定义 ─────────────────────────────────────────────────────────────

export interface LeadRow {
  id: string
  leadCode: string
  organizationId: string
  wechatName: string
  phone: string | null
  source: string // 'wechat' | 'referral' | 'facebook' | 'website' | 'cold_outreach'
  category: string | null // 'VISA' | 'COMPANY_REGISTRATION' | ...
  budgetMin: number | null
  budgetMax: number | null
  budgetCurrency: string
  urgency: string // 'HIGH' | 'MEDIUM' | 'LOW'
  initialIntent: string
  assigneeId: string | null
  assigneeName?: string | null
  nextFollowDate: Date | null
  lastActionAt: Date | null
  status: string // 'new' | 'contacted' | 'no_interest' | 'ready_for_opportunity' | 'discarded'
  discardedAt: Date | null
  discardReason: string | null
  discardedById: string | null
  createdAt: Date
  updatedAt: Date
  notes: string | null
  convertedOpportunityId: string | null
}

// ─── 1. 获取线索列表 (包含公海逻辑) ──────────────────────────────────────────

export async function getLeadsAction(viewMode: 'my_leads' | 'public_pool' = 'my_leads') {
  try {
    const tenantId = await getCurrentTenantId()
    const userId = await getCurrentUserId()

    // 动态构建查询条件
    let whereClause: any = {
      organizationId: tenantId,
    }

    if (viewMode === 'my_leads') {
      // 我的线索：分配给我，且状态不是已废弃或公海
      whereClause.assigneeId = userId
      whereClause.status = { notIn: ['discarded'] }
    } else if (viewMode === 'public_pool') {
      // 公海线索：状态为已废弃，或者没有负责人的新线索
      whereClause.OR = [
        { status: 'discarded', assigneeId: null },
        { assigneeId: null, status: 'new' }
      ]
    }

    const leads = await prisma.lead.findMany({
      where: whereClause,
      include: {
        assignee: { select: { name: true, id: true } } // 关联查询负责人的名字
      },
      orderBy: { createdAt: 'desc' }
    })

    // 映射到前端格式
    const leadRows = leads.map((lead: any) => ({
      ...lead,
      assigneeName: lead.assignee?.name ?? null,
    }))

    return { success: true, data: leadRows }
  } catch (error: any) {
    console.error('[lead action] getLeads error:', error)
    return { success: false, error: error.message }
  }
}

// ─── 2. 新建线索 (核心录入) ──────────────────────────────────────────────────

export async function createLeadAction(data: {
  wechatName: string
  phone?: string
  source: 'wechat' | 'referral' | 'facebook' | 'website' | 'cold_outreach'
  category?: 'VISA' | 'COMPANY_REGISTRATION' | 'FINANCIAL_SERVICES' | 'PERMIT_SERVICES' | 'TAX_SERVICES'
  budgetMin?: number
  budgetMax?: number
  urgency?: 'HIGH' | 'MEDIUM' | 'LOW'
  initialIntent: string
  notes?: string
}) {
  try {
    const tenantId = await getCurrentTenantId()
    const userId = await getCurrentUserId()
    
    if (!userId) throw new Error('登录已失效，请重新登录')

    // 生成语义化业务 ID (如 LED-260315-0001)
    const leadCode = `LED-${Date.now().toString().slice(-9)}`

    // 写入数据库
    const newLead = await prisma.lead.create({
      data: {
        leadCode,
        organizationId: tenantId,
        wechatName: data.wechatName,
        phone: data.phone ?? null,
        source: data.source,
        category: data.category ?? null,
        budgetMin: data.budgetMin ?? null,
        budgetMax: data.budgetMax ?? null,
        urgency: data.urgency ?? 'MEDIUM',
        initialIntent: data.initialIntent,
        notes: data.notes ?? null,
        status: 'new', // 默认状态
        assigneeId: userId, // 默认分配给录入人自己
        lastActionAt: new Date(), // 初始化最后跟进时间
      },
      include: {
        assignee: { select: { name: true, id: true } }
      }
    })

    // 刷新缓存，确保前端列表立即更新
    revalidatePath('/leads', 'layout')
    return { success: true, data: newLead }
  } catch (error: any) {
    console.error('[lead action] createLead error:', error)
    return { success: false, error: error.message }
  }
}

// ─── 3. 将线索退回公海 / 废弃 ─────────────────────────────────────────────────

export async function discardLeadAction(
  leadId: string, 
  reason: 'NO_CONTACT' | 'MISMATCH_NEEDS' | 'LIMITED_SALES_CAPABILITY' | 'OTHER'
) {
  try {
    const tenantId = await getCurrentTenantId()
    const userId = await getCurrentUserId()

    if (!userId) throw new Error('登录已失效，请重新登录')

    const updatedLead = await prisma.lead.update({
      where: { 
        id: leadId,
      },
      data: {
        status: 'discarded', // 状态改为废弃
        assigneeId: null,    // 清空负责人，供别人从公海抢单
        discardReason: reason,
        discardedAt: new Date(),
        discardedById: userId
      },
      include: {
        assignee: { select: { name: true, id: true } }
      }
    })

    revalidatePath('/leads', 'layout')
    return { success: true, data: updatedLead }
  } catch (error: any) {
    console.error('[lead action] discardLead error:', error)
    return { success: false, error: error.message }
  }
}

// ─── 4. 更新线索状态 ─────────────────────────────────────────────────────────

export async function updateLeadStatusAction(
  leadId: string,
  status: 'new' | 'contacted' | 'no_interest' | 'ready_for_opportunity' | 'discarded'
) {
  try {
    const tenantId = await getCurrentTenantId()

    const updatedLead = await prisma.lead.update({
      where: { id: leadId },
      data: {
        status,
        lastActionAt: new Date(),
      },
      include: {
        assignee: { select: { name: true, id: true } }
      }
    })

    revalidatePath('/leads', 'layout')
    return { success: true, data: updatedLead }
  } catch (error: any) {
    console.error('[lead action] updateLeadStatus error:', error)
    return { success: false, error: error.message }
  }
}

// ─── 5. 设置下次跟进时间 ─────────────────────────────────────────────────────

export async function setNextFollowDateAction(leadId: string, nextFollowDate: Date) {
  try {
    const updatedLead = await prisma.lead.update({
      where: { id: leadId },
      data: {
        nextFollowDate,
        lastActionAt: new Date(),
      },
      include: {
        assignee: { select: { name: true, id: true } }
      }
    })

    revalidatePath('/leads', 'layout')
    return { success: true, data: updatedLead }
  } catch (error: any) {
    console.error('[lead action] setNextFollowDate error:', error)
    return { success: false, error: error.message }
  }
}

// ─── 6. 从公海抢单 ─────────────────────────────────────────────────────────

export async function claimLeadFromPoolAction(leadId: string) {
  try {
    const userId = await getCurrentUserId()

    if (!userId) throw new Error('登录已失效，请重新登录')

    const updatedLead = await prisma.lead.update({
      where: { id: leadId },
      data: {
        assigneeId: userId,
        status: 'new', // 抢单后状态重置为新线索
        lastActionAt: new Date(),
      },
      include: {
        assignee: { select: { name: true, id: true } }
      }
    })

    revalidatePath('/leads', 'layout')
    return { success: true, data: updatedLead }
  } catch (error: any) {
    console.error('[lead action] claimLeadFromPool error:', error)
    return { success: false, error: error.message }
  }
}

// ─── 7. 获取单个线索详情 ─────────────────────────────────────────────────────

export async function getLeadDetailAction(leadId: string) {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        assignee: { select: { name: true, id: true, email: true } },
        convertedOpportunity: {
          select: {
            id: true,
            opportunityCode: true,
            status: true
          }
        }
      }
    })

    if (!lead) {
      return { success: false, error: '线索不存在' }
    }

    return { success: true, data: lead }
  } catch (error: any) {
    console.error('[lead action] getLeadDetail error:', error)
    return { success: false, error: error.message }
  }
}
