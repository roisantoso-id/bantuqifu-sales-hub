'use server'
// Interaction Actions - v1.0 unified timeline (leads, opportunities, customers)

import { createClient } from '@/lib/supabase/server'

// ─── 类型定义 ─────────────────────────────────────────────────────────────────

export type InteractionRow = {
  id: string
  organizationId: string
  customerId: string
  leadId: string | null
  opportunityId: string | null
  operatorId: string | null
  operatorName?: string | null
  operatorEmail?: string | null
  type: 'NOTE' | 'CALL' | 'VISIT' | 'MEETING' | 'EMAIL' | 'STAGE_CHANGE' | 'SYSTEM'
  content: string
  nextAction: string | null
  nextActionDate: string | null
  createdAt: string
  updatedAt: string
}

export type InteractionAttachmentRow = {
  id: string
  interactionId: string
  fileName: string
  fileUrl: string
  previewUrl?: string
  fileSize: number
  createdAt: string
}

export type InteractionWithAttachmentsRow = InteractionRow & {
  attachments?: InteractionAttachmentRow[]
}

// ─── 创建互动记录 ─────────────────────────────────────────────────────────────

export async function createInteractionAction(data: {
  organizationId: string
  customerId: string
  leadId?: string | null
  opportunityId?: string | null
  type: 'NOTE' | 'CALL' | 'VISIT' | 'MEETING' | 'EMAIL' | 'STAGE_CHANGE' | 'SYSTEM'
  content: string
  nextAction?: string | null
  nextActionDate?: string | null
}): Promise<{ success: boolean; data?: InteractionRow; error?: string }> {
  const supabase = await createClient()

  try {
    const newId = crypto.randomUUID()
    
    const { data: inserted, error } = await supabase
      .from('interactions')
      .insert([
        {
          id: newId,
          organizationId: data.organizationId,
          customerId: data.customerId,
          leadId: data.leadId ?? null,
          opportunityId: data.opportunityId ?? null,
          operatorId: null, // 可后续由前端设置或由系统自动获取
          type: data.type,
          content: data.content,
          nextAction: data.nextAction ?? null,
          nextActionDate: data.nextActionDate ?? null,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error('[createInteractionAction] insert error:', error)
      return { success: false, error: '创建记录失败，请稍后重试' }
    }

    return { success: true, data: inserted }
  } catch (err) {
    console.error('[createInteractionAction] exception:', err)
    return { success: false, error: '系统错误，请稍后重试' }
  }
}

// ─── 获取时间线（统一客户/线索/商机的互动记录）──────────────────────────────

export async function getTimelineAction(data: {
  organizationId: string
  customerId: string
  leadId?: string | null
  opportunityId?: string | null
  limit?: number
}): Promise<{ success: boolean; data?: InteractionRow[]; error?: string }> {
  const supabase = await createClient()

  try {
    let query = supabase
      .from('interactions')
      .select('*')
      .eq('organizationId', data.organizationId)
      .eq('customerId', data.customerId)
      .order('createdAt', { ascending: false })
      .limit(data.limit ?? 50)

    // 可选过滤：如果指定了leadId或opportunityId，进行额外过滤
    if (data.leadId) {
      query = query.eq('leadId', data.leadId)
    }
    if (data.opportunityId) {
      query = query.eq('opportunityId', data.opportunityId)
    }

    const { data: interactions, error } = await query

    if (error) {
      console.error('[getTimelineAction] query error:', error)
      return { success: false, error: '获取时间线失败，请稍后重试' }
    }

    return { success: true, data: interactions || [] }
  } catch (err) {
    console.error('[getTimelineAction] exception:', err)
    return { success: false, error: '系统错误，请稍后重试' }
  }
}

// ─── 更新互动记录 ─────────────────────────────────────────────────────────────

export async function updateInteractionAction(data: {
  id: string
  organizationId: string
  type?: 'NOTE' | 'CALL' | 'VISIT' | 'MEETING' | 'EMAIL' | 'STAGE_CHANGE' | 'SYSTEM'
  content?: string
  nextAction?: string | null
  nextActionDate?: string | null
}): Promise<{ success: boolean; data?: InteractionRow; error?: string }> {
  const supabase = await createClient()

  try {
    const updatePayload: Record<string, any> = {}

    if (data.type) updatePayload.type = data.type
    if (data.content) updatePayload.content = data.content
    if (data.nextAction !== undefined) updatePayload.nextAction = data.nextAction
    if (data.nextActionDate !== undefined) updatePayload.nextActionDate = data.nextActionDate
    updatePayload.updatedAt = new Date().toISOString()

    const { data: updated, error } = await supabase
      .from('interactions')
      .update(updatePayload)
      .eq('id', data.id)
      .eq('organizationId', data.organizationId)
      .select()
      .single()

    if (error) {
      console.error('[updateInteractionAction] update error:', error)
      return { success: false, error: '更新记录失败，请稍后重试' }
    }

    return { success: true, data: updated }
  } catch (err) {
    console.error('[updateInteractionAction] exception:', err)
    return { success: false, error: '系统错误，请稍后重试' }
  }
}

// ─── 删除互动记录 ─────────────────────────────────────────────────────────────

export async function deleteInteractionAction(data: {
  id: string
  organizationId: string
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  try {
    const { error } = await supabase
      .from('interactions')
      .delete()
      .eq('id', data.id)
      .eq('organizationId', data.organizationId)

    if (error) {
      console.error('[deleteInteractionAction] delete error:', error)
      return { success: false, error: '删除记录失败，请稍后重试' }
    }

    return { success: true }
  } catch (err) {
    console.error('[deleteInteractionAction] exception:', err)
    return { success: false, error: '系统错误，请稍后重试' }
  }
}

// ─── 添加附件 ─────────────────────────────────────────────────────────────────

export async function addInteractionAttachmentAction(data: {
  interactionId: string
  fileName: string
  fileUrl: string
  fileSize: number
}): Promise<{ success: boolean; data?: InteractionAttachmentRow; error?: string }> {
  const supabase = await createClient()

  try {
    const { data: inserted, error } = await supabase
      .from('interaction_attachments')
      .insert([
        {
          id: crypto.randomUUID(),
          interactionId: data.interactionId,
          fileName: data.fileName,
          fileUrl: data.fileUrl,
          fileSize: data.fileSize,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error('[addInteractionAttachmentAction] insert error:', error)
      return { success: false, error: '添加附件失败，请稍后重试' }
    }

    return { success: true, data: inserted }
  } catch (err) {
    console.error('[addInteractionAttachmentAction] exception:', err)
    return { success: false, error: '系统错误，请稍后重试' }
  }
}

// ─── 获取互动的附件 ────────────────────────────────────────────────────────────

export async function getInteractionAttachmentsAction(data: {
  interactionId: string
}): Promise<{ success: boolean; data?: InteractionAttachmentRow[]; error?: string }> {
  const supabase = await createClient()

  try {
    const { data: attachments, error } = await supabase
      .from('interaction_attachments')
      .select('*')
      .eq('interactionId', data.interactionId)
      .order('createdAt', { ascending: false })

    if (error) {
      console.error('[getInteractionAttachmentsAction] query error:', error)
      return { success: false, error: '获取附件失败，请稍后重试' }
    }

    return { success: true, data: attachments || [] }
  } catch (err) {
    console.error('[getInteractionAttachmentsAction] exception:', err)
    return { success: false, error: '系统错误，请稍后重试' }
  }
}

// ─── 删除附件 ──────────────────────────────────────────────────────────────────

export async function deleteInteractionAttachmentAction(data: {
  id: string
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  try {
    const { error } = await supabase
      .from('interaction_attachments')
      .delete()
      .eq('id', data.id)

    if (error) {
      console.error('[deleteInteractionAttachmentAction] delete error:', error)
      return { success: false, error: '删除附件失败，请稍后重试' }
    }

    return { success: true }
  } catch (err) {
    console.error('[deleteInteractionAttachmentAction] exception:', err)
    return { success: false, error: '系统错误，请稍后重试' }
  }
}

// ─── getOpportunityTimelineWithLeadHistoryAction ───────────────────────────────
// 获取商机的完整时间轴（包含线索阶段的历史记录）
export async function getOpportunityTimelineWithLeadHistoryAction(data: {
  organizationId: string
  opportunityId: string
  leadId?: string | null
}): Promise<{ success: boolean; data?: InteractionRow[]; error?: string }> {
  const supabase = await createClient()

  try {
    let query = supabase
      .from('interactions')
      .select('*')
      .eq('organizationId', data.organizationId)

    // 构建 OR 条件：商机ID 或 线索ID（如果存在）
    if (data.leadId) {
      query = query.or(`opportunityId.eq.${data.opportunityId},leadId.eq.${data.leadId}`)
    } else {
      query = query.eq('opportunityId', data.opportunityId)
    }

    const { data: interactions, error } = await query.order('createdAt', { ascending: false })

    if (error) {
      console.error('[getOpportunityTimelineWithLeadHistoryAction] query error:', error)
      return { success: false, error: '获取时间线失败，请稍后重试' }
    }

    return { success: true, data: interactions || [] }
  } catch (err) {
    console.error('[getOpportunityTimelineWithLeadHistoryAction] exception:', err)
    return { success: false, error: '系统错误，请稍后重试' }
  }
}
