'use server'

import { createClient } from '@/lib/supabase/server'
import { uploadContractToOss, uploadFinanceReceiptToOss, uploadInteractionAttachmentToOss, getTemporaryPreviewUrl, getTemporaryPreviewUrls } from '@/lib/oss'
import { cookies } from 'next/headers'
import { createDeliveryProjectAction } from './delivery'
import type { InteractionAttachmentRow, InteractionWithAttachmentsRow } from './interaction'
import type { OpportunityP2Data, OpportunityP3Data, OpportunityP4Data, OpportunityP5Data, OpportunityP6Data, OpportunityP7Data, OpportunityP8Data, StageId } from '@/lib/types'

export interface OpportunityRow {
  id: string
  organizationId: string
  opportunityCode: string
  customerId: string
  convertedFromLeadId?: string | null
  stageId: string
  status: string
  serviceType: string
  serviceTypeLabel?: string | null
  estimatedAmount: number
  currency: string
  requirements?: string | null
  notes?: string | null
  assigneeId?: string | null
  expectedCloseDate?: string | null
  actualCloseDate?: string | null
  pinnedByUsers?: string[]
  wechatGroupId?: number | null
  wechatGroupName?: string | null
  createdAt: string
  updatedAt: string
  customer?: {
    id: string
    customerName: string
    customerId: string
    passportNo?: string | null
    phone?: string | null
    email?: string | null
    wechat?: string | null
    level?: string | null
    industryId?: string | null
  }
}

export interface HydratedOpportunityRow extends OpportunityRow {
  p2Data: OpportunityP2Data[]
  p3Data: OpportunityP3Data[]
  p4Data?: OpportunityP4Data
  p5Data?: OpportunityP5Data
  p6Data?: OpportunityP6Data
  p7Data?: OpportunityP7Data
  p8Data?: OpportunityP8Data
}

const DEFAULT_P4_DATA: OpportunityP4Data = {
  contractStatus: 'pending',
  notes: '',
  sealVisible: false,
  signatureComplete: false,
  qualityClear: false,
}

const DEFAULT_P5_DATA: OpportunityP5Data = {
  dueAmount: 0,
  receivedAmount: 0,
  paymentStatus: 'pending',
}

function mapP4DataRow(row: any): OpportunityP4Data {
  return {
    contractFileUrl: row?.contractFileUrl ?? undefined,
    contractPreviewUrl: row?.contractPreviewUrl ?? undefined,
    contractFileName: row?.contractFileName ?? undefined,
    contractFileSize: typeof row?.contractFileSize === 'number' ? row.contractFileSize : undefined,
    contractStatus: row?.contractStatus === 'returned' || row?.contractStatus === 'archived' ? row.contractStatus : 'pending',
    uploadedAt: row?.uploadedAt ?? undefined,
    notes: row?.notes ?? '',
    sealVisible: Boolean(row?.sealVisible),
    signatureComplete: Boolean(row?.signatureComplete),
    qualityClear: Boolean(row?.qualityClear),
  }
}

function buildP4UpsertPayload(
  oppId: string,
  data: OpportunityP4Data,
  overrides?: Partial<Record<'contractFileUrl' | 'contractFileName' | 'contractFileSize' | 'contractStatus' | 'uploadedAt', string | number | null>>
) {
  return {
    id: crypto.randomUUID(),
    opportunityId: oppId,
    contractFileUrl: data.contractFileUrl ?? null,
    contractFileName: data.contractFileName ?? null,
    contractFileSize: data.contractFileSize ?? null,
    contractStatus: data.contractStatus,
    uploadedAt: data.uploadedAt ?? null,
    notes: data.notes?.trim() || null,
    sealVisible: data.sealVisible,
    signatureComplete: data.signatureComplete,
    qualityClear: data.qualityClear,
    ...overrides,
  }
}

function mapP5DataRow(row: any): OpportunityP5Data {
  return {
    bankAccount: row?.bankAccount ?? undefined,
    bankName: row?.bankName ?? undefined,
    accountHolder: row?.accountHolder ?? undefined,
    swiftCode: row?.swiftCode ?? undefined,
    dueAmount: typeof row?.dueAmount === 'number' ? row.dueAmount : 0,
    receivedAmount: typeof row?.receivedAmount === 'number' ? row.receivedAmount : 0,
    receiptFileUrl: row?.receiptFileUrl ?? undefined,
    receiptPreviewUrl: row?.receiptPreviewUrl ?? undefined,
    receiptFileName: row?.receiptFileName ?? undefined,
    receiptUploadedAt: row?.receiptUploadedAt ?? undefined,
    receiptUploadedBy: row?.receiptUploadedBy ?? undefined,
    paymentStatus: row?.paymentStatus === 'verified' || row?.paymentStatus === 'rejected' ? row.paymentStatus : 'pending',
    rejectionReason: row?.rejectionReason ?? undefined,
    confirmedAt: row?.confirmedAt ?? undefined,
    confirmedBy: row?.confirmedById ?? undefined,
  }
}

function buildP5UpsertPayload(
  oppId: string,
  data: OpportunityP5Data,
  overrides?: Partial<Record<'bankAccount' | 'bankName' | 'accountHolder' | 'swiftCode' | 'dueAmount' | 'receivedAmount' | 'receiptFileUrl' | 'receiptFileName' | 'receiptUploadedAt' | 'receiptUploadedBy' | 'paymentStatus' | 'rejectionReason' | 'confirmedAt' | 'confirmedById', string | number | null>>
) {
  return {
    id: crypto.randomUUID(),
    opportunityId: oppId,
    bankAccount: data.bankAccount ?? null,
    bankName: data.bankName ?? null,
    accountHolder: data.accountHolder ?? null,
    swiftCode: data.swiftCode ?? null,
    dueAmount: data.dueAmount,
    receivedAmount: data.receivedAmount,
    receiptFileUrl: data.receiptFileUrl ?? null,
    receiptFileName: data.receiptFileName ?? null,
    receiptUploadedAt: data.receiptUploadedAt ?? null,
    receiptUploadedBy: data.receiptUploadedBy ?? null,
    paymentStatus: data.paymentStatus,
    rejectionReason: data.rejectionReason?.trim() || null,
    confirmedAt: data.confirmedAt ?? null,
    confirmedById: data.confirmedBy ?? null,
    ...overrides,
  }
}

function mapP6DataRow(row: any): OpportunityP6Data {
  return {
    materials: [],
    lastUpdatedAt: row?.lastUpdatedAt ?? undefined,
  }
}

function mapP7DataRow(row: any): OpportunityP7Data {
  return {
    progressPoints: [],
    deliveryStatus: row?.deliveryStatus ?? 'in_transit',
    assignmentLogic: undefined,
    finalDocumentUrl: row?.finalDocumentUrl ?? undefined,
    finalDocumentName: row?.finalDocumentName ?? undefined,
    deliveredAt: row?.deliveredAt ?? undefined,
    completedAt: row?.completedAt ?? undefined,
    notes: row?.notes ?? undefined,
  }
}

function mapP8DataRow(row: any): OpportunityP8Data {
  return {
    totalAmount: typeof row?.totalAmount === 'number' ? row.totalAmount : 0,
    paidAmount: typeof row?.paidAmount === 'number' ? row.paidAmount : 0,
    balanceDue: typeof row?.balanceDue === 'number' ? row.balanceDue : 0,
    balanceReceiptUrl: row?.balanceReceiptUrl ?? undefined,
    balanceReceivedAt: row?.balanceReceivedAt ?? undefined,
    balanceStatus: row?.balanceStatus === 'received' || row?.balanceStatus === 'partial' ? row.balanceStatus : 'pending',
    refunds: [],
    totalRefund: typeof row?.totalRefund === 'number' ? row.totalRefund : 0,
    expenses: [],
    totalExpense: typeof row?.totalExpense === 'number' ? row.totalExpense : 0,
    netBalance: typeof row?.netBalance === 'number' ? row.netBalance : 0,
    profitMargin: typeof row?.profitMargin === 'number' ? row.profitMargin : undefined,
    settledAt: row?.settledAt ?? undefined,
    settledBy: row?.settledById ?? undefined,
    archived: Boolean(row?.archived),
    notes: row?.notes ?? undefined,
  }
}

function mapProgressPointRow(row: any) {
  return {
    id: row.id,
    label: row.label,
    status: row.status,
    timestamp: row.timestamp ?? undefined,
    serviceId: row.productId ?? undefined,
  }
}

function mapMaterialItemRow(row: any) {
  return {
    id: row.id,
    name: row.name,
    requirement: row.requirement,
    fileUrl: row.fileUrl ?? undefined,
    fileName: row.fileName ?? undefined,
    fileSize: typeof row.fileSize === 'number' ? row.fileSize : undefined,
    status: row.status,
    uploadedAt: row.uploadedAt ?? undefined,
    uploadedBy: row.uploadedBy ?? undefined,
    approvedAt: row.approvedAt ?? undefined,
    approvedBy: row.approvedById ?? undefined,
    rejectionReason: row.rejectionReason ?? undefined,
    serviceId: row.productId ?? undefined,
    serviceName: row.productName ?? undefined,
  }
}

function mapRefundItemRow(row: any) {
  return {
    id: row.id,
    serviceId: row.serviceId,
    serviceName: row.serviceName,
    originalAmount: row.originalAmount,
    refundedAmount: row.refundedAmount,
    reason: row.reason,
    refundedAt: row.refundedAt ?? undefined,
    refundedBy: row.refundedBy ?? undefined,
    receiptUrl: row.receiptUrl ?? undefined,
  }
}

function mapExpenseItemRow(row: any) {
  return {
    id: row.id,
    description: row.description,
    amount: row.amount,
    category: row.category,
    receiptUrl: row.receiptUrl ?? undefined,
    receiptFileName: row.receiptFileName ?? undefined,
    createdBy: row.createdBy,
    createdAt: row.createdAt,
    approvedBy: row.approvedById ?? undefined,
    approvedAt: row.approvedAt ?? undefined,
  }
}

function buildP3DataFromItems(items: OpportunityP2Data[]): OpportunityP3Data[] {
  return items.map((item) => ({
    tempId: item.tempId,
    productId: item.productId,
    productName: item.productName,
    targetName: item.targetName,
    lockedPrice: item.basePrice,
    currency: item.currency,
    costFloor: item.costFloor,
    profitMargin: item.profitMargin,
    costPriceCny: item.costPriceCny,
    costPriceIdr: item.costPriceIdr,
    partnerPriceCny: item.partnerPriceCny,
    partnerPriceIdr: item.partnerPriceIdr,
    retailPriceCny: item.retailPriceCny,
    retailPriceIdr: item.retailPriceIdr,
    approvalStatus: 'auto-approved',
  }))
}

// ─── getCurrentTenantId helper ─────────────────────────────────────────────────
async function getCurrentTenantId(): Promise<string> {
  const cookieStore = await cookies()
  return cookieStore.get('selectedTenant')?.value ?? 'org_bantu_id'
}

function isBrowserFile(value: FormDataEntryValue | null): value is File {
  return typeof File !== 'undefined' && value instanceof File
}

function getFormFiles(formData: FormData, fieldName: string): File[] {
  return formData
    .getAll(fieldName)
    .filter((value): value is File => isBrowserFile(value) && value.size > 0)
}

async function getAuthorizedOpportunity(
  supabase: Awaited<ReturnType<typeof createClient>>,
  oppId: string,
  tenantId: string
): Promise<{ id: string; customerId: string; stageId: string } | null> {
  const { data: opportunity, error } = await supabase
    .from('opportunities')
    .select('id, customerId, stageId')
    .eq('id', oppId)
    .eq('organizationId', tenantId)
    .single()

  if (error || !opportunity) {
    return null
  }

  return opportunity
}

async function getAuthenticatedUserId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  context: string,
  tenantId: string,
  oppId: string
): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser()
  const userId = user?.id

  if (!userId) {
    const cookieStore = await cookies()
    const { data: authSession } = await supabase.auth.getSession()

    console.error(`[${context}] Missing auth user`, {
      hasSession: Boolean(authSession.session),
      tenantId,
      oppId,
      cookieNames: cookieStore.getAll().map((cookie) => cookie.name),
    })

    return null
  }

  return userId
}

async function insertOpportunityInteraction(
  supabase: Awaited<ReturnType<typeof createClient>>,
  payload: {
    tenantId: string
    customerId: string
    opportunityId: string
    operatorId?: string | null
    type?: string
    content: string
  }
) {
  const { error } = await supabase.from('interactions').insert({
    id: crypto.randomUUID(),
    organizationId: payload.tenantId,
    customerId: payload.customerId,
    opportunityId: payload.opportunityId,
    operatorId: payload.operatorId ?? null,
    type: payload.type ?? 'FORM',
    content: payload.content,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })

  if (error) {
    console.error('[insertOpportunityInteraction] Interaction log error:', error)
  }
}

async function getAttachmentsByInteractionIds(
  supabase: Awaited<ReturnType<typeof createClient>>,
  interactionIds: string[]
): Promise<Map<string, InteractionAttachmentRow[]>> {
  if (interactionIds.length === 0) {
    return new Map()
  }

  const { data: attachments, error } = await supabase
    .from('interaction_attachments')
    .select('id, interactionId, fileName, fileUrl, fileSize, createdAt')
    .in('interactionId', interactionIds)
    .order('createdAt', { ascending: true })

  if (error) {
    console.error('[getAttachmentsByInteractionIds] Query error:', error)
    return new Map()
  }

  const previewUrlMap = await getTemporaryPreviewUrls((attachments ?? []).map((attachment) => attachment.fileUrl))

  return (attachments ?? []).reduce((map, attachment) => {
    const existing = map.get(attachment.interactionId) ?? []
    existing.push({
      ...(attachment as InteractionAttachmentRow),
      previewUrl: previewUrlMap.get(attachment.fileUrl) ?? attachment.fileUrl,
    })
    map.set(attachment.interactionId, existing)
    return map
  }, new Map<string, InteractionAttachmentRow[]>())
}

export async function saveOpportunityItemsAction(
  oppId: string,
  items: Array<OpportunityP2Data | OpportunityP3Data>
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const tenantId = await getCurrentTenantId()

  const { data: existingOpportunity, error: opportunityError } = await supabase
    .from('opportunities')
    .select('id')
    .eq('id', oppId)
    .eq('organizationId', tenantId)
    .single()

  if (opportunityError || !existingOpportunity) {
    console.error('[saveOpportunityItemsAction] Opportunity not found:', opportunityError)
    return { success: false, error: '商机不存在' }
  }

  const { error: deleteError } = await supabase
    .from('opportunity_items')
    .delete()
    .eq('opportunityId', oppId)
    .eq('organizationId', tenantId)

  if (deleteError) {
    console.error('[saveOpportunityItemsAction] Delete error:', deleteError)
    return { success: false, error: '清除旧服务方案失败' }
  }

  if (items.length === 0) {
    return { success: true }
  }

  const productIds = Array.from(new Set(items.map((item) => item.productId)))
  const { data: productPrices, error: productPricesError } = await supabase
    .from('product_prices')
    .select('productId, costPriceIdr, costPriceCny, isCurrent')
    .in('productId', productIds)
    .eq('isCurrent', true)

  if (productPricesError) {
    console.error('[saveOpportunityItemsAction] Product prices error:', productPricesError)
  }

  const priceMap = new Map((productPrices ?? []).map((row) => [row.productId, row]))

  const rows = items.map((item) => {
    const price = priceMap.get(item.productId)
    const unitPrice = 'lockedPrice' in item ? item.lockedPrice : item.basePrice
    const currency = item.currency
    const costFloor = currency === 'CNY'
      ? (price?.costPriceCny ?? price?.costPriceIdr ?? 0)
      : (price?.costPriceIdr ?? 0)

    const profitMargin = costFloor > 0
      ? Number((((unitPrice - costFloor) / costFloor) * 100).toFixed(2))
      : null

    return {
      id: crypto.randomUUID(),
      organizationId: tenantId,
      opportunityId: oppId,
      productId: item.productId,
      targetName: item.targetName?.trim() || null,
      unitPrice,
      currency,
      costFloor,
      profitMargin,
      settlementStatus: 'UNSETTLED',
      salesRemarks: null,
      deliveryRemarks: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  })

  const { error: insertError } = await supabase
    .from('opportunity_items')
    .insert(rows)

  if (insertError) {
    console.error('[saveOpportunityItemsAction] Insert error:', insertError)
    return { success: false, error: '保存服务方案失败' }
  }

  return { success: true }
}

export async function getOpportunityItemsAction(oppId: string) {
  const supabase = await createClient()
  const tenantId = await getCurrentTenantId()

  const { data, error } = await supabase
    .from('opportunity_items')
    .select(`
      id,
      productId,
      targetName,
      unitPrice,
      currency,
      product:products (
        id,
        name,
        product_prices (
          costPriceIdr,
          costPriceCny,
          partnerPriceIdr,
          partnerPriceCny,
          retailPriceIdr,
          retailPriceCny,
          isCurrent
        )
      )
    `)
    .eq('opportunityId', oppId)
    .eq('organizationId', tenantId)
    .order('createdAt', { ascending: true })

  if (error) {
    console.error('[getOpportunityItemsAction] Error:', error)
    return []
  }

  return (data ?? []).map((item: any) => {
    const currentPrice = (item.product?.product_prices || []).find((price: any) => price.isCurrent) || item.product?.product_prices?.[0]
    const costFloor = item.currency === 'CNY'
      ? currentPrice?.costPriceCny
      : currentPrice?.costPriceIdr
    const profitMargin = typeof costFloor === 'number' && costFloor > 0
      ? Number((((item.unitPrice || 0) - costFloor) / costFloor * 100).toFixed(2))
      : undefined

    return {
      tempId: item.id,
      productId: item.productId,
      productName: item.product?.name || '未命名产品',
      targetName: item.targetName || '',
      basePrice: item.unitPrice || (item.currency === 'CNY' ? (currentPrice?.retailPriceCny ?? 0) : (currentPrice?.retailPriceIdr ?? 0)),
      currency: item.currency || 'IDR',
      costFloor,
      profitMargin,
      costPriceCny: typeof currentPrice?.costPriceCny === 'number' ? currentPrice.costPriceCny : undefined,
      costPriceIdr: typeof currentPrice?.costPriceIdr === 'number' ? currentPrice.costPriceIdr : undefined,
      partnerPriceCny: typeof currentPrice?.partnerPriceCny === 'number' ? currentPrice.partnerPriceCny : undefined,
      partnerPriceIdr: typeof currentPrice?.partnerPriceIdr === 'number' ? currentPrice.partnerPriceIdr : undefined,
      retailPriceCny: typeof currentPrice?.retailPriceCny === 'number' ? currentPrice.retailPriceCny : undefined,
      retailPriceIdr: typeof currentPrice?.retailPriceIdr === 'number' ? currentPrice.retailPriceIdr : undefined,
    }
  })
}

// ─── getOpportunityTimelineAction ──────────────────────────────────────────────
// 获取商机的完整时间轴，包括线索阶段的跟进记录
export async function getOpportunityTimelineAction(oppId: string) {
  const supabase = await createClient()
  const tenantId = await getCurrentTenantId()

  // 1. 查询商机信息，获取关联的 leadId
  const { data: opp, error: oppError } = await supabase
    .from('opportunities')
    .select('id, convertedFromLeadId')
    .eq('id', oppId)
    .eq('organizationId', tenantId)
    .single()

  if (oppError || !opp) {
    console.error('[getOpportunityTimelineAction] Opportunity not found:', oppError)
    return { success: false, error: '商机不存在' }
  }

  // 2. 联合查询：商机阶段的记录 + 线索阶段的记录
  let query = supabase
    .from('interactions')
    .select('*')
    .eq('organizationId', tenantId)

  if (opp.convertedFromLeadId) {
    query = query.or(`opportunityId.eq.${oppId},leadId.eq.${opp.convertedFromLeadId}`)
  } else {
    query = query.eq('opportunityId', oppId)
  }

  const { data: interactions, error: interactionsError } = await query.order('createdAt', { ascending: false })

  if (interactionsError) {
    console.error('[getOpportunityTimelineAction] Query error:', interactionsError)
    return { success: false, error: '查询跟进记录失败' }
  }

  const operatorIds = Array.from(
    new Set((interactions ?? []).map((interaction: any) => interaction.operatorId).filter(Boolean))
  ) as string[]

  let operatorMap = new Map<string, { name: string | null; email: string | null }>()

  if (operatorIds.length > 0) {
    const { data: operators, error: operatorsError } = await supabase
      .from('users_auth')
      .select('id, name, email')
      .in('id', operatorIds)

    if (operatorsError) {
      console.error('[getOpportunityTimelineAction] Operator query error:', operatorsError)
    } else {
      operatorMap = new Map(
        (operators ?? []).map((operator: any) => [
          operator.id,
          {
            name: operator.name ?? null,
            email: operator.email ?? null,
          },
        ])
      )
    }
  }

  const enrichedInteractions: InteractionWithAttachmentsRow[] = (interactions || []).map((interaction: any) => {
    const operator = interaction.operatorId ? operatorMap.get(interaction.operatorId) : undefined

    return {
      ...interaction,
      operatorName: operator?.name ?? null,
      operatorEmail: operator?.email ?? null,
      attachments: [],
    }
  })

  const attachmentMap = await getAttachmentsByInteractionIds(
    supabase,
    enrichedInteractions.map((interaction) => interaction.id)
  )

  const interactionsWithAttachments = enrichedInteractions.map((interaction) => ({
    ...interaction,
    attachments: attachmentMap.get(interaction.id) ?? [],
  }))

  return {
    success: true,
    data: {
      opportunity: opp,
      interactions: interactionsWithAttachments,
      hasLeadHistory: !!opp.convertedFromLeadId,
    },
  }
}

export async function createOpportunityNoteWithAttachmentsAction(
  formData: FormData
): Promise<{ success: boolean; error?: string; attachmentErrors?: string[] }> {
  const supabase = await createClient()
  const tenantId = await getCurrentTenantId()

  const opportunityId = String(formData.get('opportunityId') ?? '')
  const content = String(formData.get('content') ?? '').trim()
  const nextAction = String(formData.get('nextAction') ?? '').trim()
  const nextActionDate = String(formData.get('nextActionDate') ?? '').trim()
  const files = getFormFiles(formData, 'files')

  if (!opportunityId) {
    return { success: false, error: '商机不存在' }
  }

  if (!content) {
    return { success: false, error: '备注内容不能为空' }
  }

  const { data: { user } } = await supabase.auth.getUser()
  const userId = user?.id

  if (!userId) {
    return { success: false, error: '用户未登录' }
  }

  const { data: opportunity, error: opportunityError } = await supabase
    .from('opportunities')
    .select('id, customerId, convertedFromLeadId')
    .eq('id', opportunityId)
    .eq('organizationId', tenantId)
    .single()

  if (opportunityError || !opportunity) {
    console.error('[createOpportunityNoteWithAttachmentsAction] Opportunity not found:', opportunityError)
    return { success: false, error: '商机不存在' }
  }

  const interactionId = crypto.randomUUID()
  const timestamp = new Date().toISOString()

  const { error: interactionError } = await supabase.from('interactions').insert({
    id: interactionId,
    organizationId: tenantId,
    customerId: opportunity.customerId,
    leadId: opportunity.convertedFromLeadId ?? null,
    opportunityId,
    operatorId: userId,
    type: 'NOTE',
    content,
    nextAction: nextAction || null,
    nextActionDate: nextActionDate || null,
    createdAt: timestamp,
    updatedAt: timestamp,
  })

  if (interactionError) {
    console.error('[createOpportunityNoteWithAttachmentsAction] Insert error:', interactionError)
    return { success: false, error: '保存备注失败，请稍后重试' }
  }

  const attachmentRows: Array<Pick<InteractionAttachmentRow, 'id' | 'interactionId' | 'fileName' | 'fileUrl' | 'fileSize'>> = []
  const attachmentErrors: string[] = []

  for (const file of files) {
    try {
      const uploaded = await uploadInteractionAttachmentToOss({
        file,
        tenantId,
        opportunityId,
        interactionId,
      })

      attachmentRows.push({
        id: crypto.randomUUID(),
        interactionId,
        fileName: uploaded.fileName,
        fileUrl: uploaded.url,
        fileSize: uploaded.fileSize,
      })
    } catch (error) {
      console.error('[createOpportunityNoteWithAttachmentsAction] Attachment upload error:', error)
      attachmentErrors.push(error instanceof Error ? error.message : `附件 ${file.name} 上传失败`)
    }
  }

  if (attachmentRows.length > 0) {
    const { error: attachmentInsertError } = await supabase
      .from('interaction_attachments')
      .insert(attachmentRows)

    if (attachmentInsertError) {
      console.error('[createOpportunityNoteWithAttachmentsAction] Attachment insert error:', attachmentInsertError)
      return {
        success: false,
        error: '备注已保存，但附件写入失败，请稍后刷新重试',
        attachmentErrors,
      }
    }
  }

  return {
    success: true,
    attachmentErrors: attachmentErrors.length > 0 ? attachmentErrors : undefined,
  }
}

export async function createOpportunityNoteAction(data: {
  opportunityId: string
  content: string
  nextAction?: string | null
  nextActionDate?: string | null
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const tenantId = await getCurrentTenantId()

  const trimmedContent = data.content.trim()
  if (!trimmedContent) {
    return { success: false, error: '备注内容不能为空' }
  }

  const { data: { user } } = await supabase.auth.getUser()
  const userId = user?.id

  if (!userId) {
    return { success: false, error: '用户未登录' }
  }

  const { data: opportunity, error: opportunityError } = await supabase
    .from('opportunities')
    .select('id, customerId, convertedFromLeadId')
    .eq('id', data.opportunityId)
    .eq('organizationId', tenantId)
    .single()

  if (opportunityError || !opportunity) {
    console.error('[createOpportunityNoteAction] Opportunity not found:', opportunityError)
    return { success: false, error: '商机不存在' }
  }

  const { error } = await supabase.from('interactions').insert({
    id: crypto.randomUUID(),
    organizationId: tenantId,
    customerId: opportunity.customerId,
    leadId: opportunity.convertedFromLeadId ?? null,
    opportunityId: data.opportunityId,
    operatorId: userId ?? null,
    type: 'NOTE',
    content: trimmedContent,
    nextAction: data.nextAction?.trim() || null,
    nextActionDate: data.nextActionDate || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })

  if (error) {
    console.error('[createOpportunityNoteAction] Insert error:', error)
    return { success: false, error: '保存备注失败，请稍后重试' }
  }

  return { success: true }
}

// ─── allocateWechatGroupIdAction ──────────────────────────────────────────────
// 原子性分配企微群编号，防止并发重复
export async function allocateWechatGroupIdAction(): Promise<{ success: boolean; groupId?: number; error?: string }> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('wechat_group_sequences')
    .insert({})
    .select('id')
    .single()

  if (error || !data) {
    console.error('[allocateWechatGroupIdAction] Error:', error)
    return { success: false, error: '分配企微群编号失败，请稍后重试' }
  }

  return { success: true, groupId: data.id }
}

// ─── createOpportunityAction ───────────────────────────────────────────────────
// 手动新建商机（非线索转化）
export async function createOpportunityAction(data: {
  customerId: string
  title: string
  serviceType: string
  estimatedAmount: number
  currency?: string
  requirements?: string
  expectedCloseDate?: string
  wechatGroupName?: string
}): Promise<{ success: boolean; data?: OpportunityRow; error?: string }> {
  const supabase = await createClient()
  const tenantId = await getCurrentTenantId()

  const { data: { user } } = await supabase.auth.getUser()
  const userId = user?.id

  if (!userId) {
    return { success: false, error: '用户未登录' }
  }

  if (!tenantId) {
    return { success: false, error: '租户信息缺失' }
  }

  // 生成商机编号（格式：OPP-YYMMDD-XXXX）
  const { data: opportunityCode, error: codeError } = await supabase.rpc('generate_business_code', { doc_prefix: 'OPP' })

  if (codeError || !opportunityCode) {
    console.error('[createOpportunityAction] Generate code error:', codeError)
    return { success: false, error: '生成商机编号失败' }
  }

  // 如果填写了企微群名称，原子性分配编号
  let wechatGroupId: number | null = null
  if (data.wechatGroupName?.trim()) {
    const allocated = await allocateWechatGroupIdAction()
    if (!allocated.success || !allocated.groupId) {
      return { success: false, error: '分配企微群编号失败，请稍后重试' }
    }
    wechatGroupId = allocated.groupId
  }

  // 创建商机
  const opportunityData = {
    id: crypto.randomUUID(),
    organizationId: tenantId,
    opportunityCode,
    customerId: data.customerId,
    convertedFromLeadId: null,
    stageId: 'P1',
    status: 'active',
    serviceType: data.serviceType,
    serviceTypeLabel: data.serviceType,
    estimatedAmount: data.estimatedAmount,
    currency: data.currency || 'IDR',
    requirements: data.requirements || '',
    notes: '',
    assigneeId: userId,
    expectedCloseDate: data.expectedCloseDate || null,
    wechatGroupId,
    wechatGroupName: data.wechatGroupName?.trim() || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  const { data: opportunity, error: oppError } = await supabase
    .from('opportunities')
    .insert(opportunityData)
    .select()
    .single()

  if (oppError || !opportunity) {
    console.error('[createOpportunityAction] Create error:', oppError)
    return { success: false, error: '创建商机失败，请稍后重试' }
  }

  // 记录系统日志
  await supabase.from('interactions').insert({
    id: crypto.randomUUID(),
    organizationId: tenantId,
    customerId: data.customerId,
    opportunityId: opportunity.id,
    operatorId: userId,
    type: 'SYSTEM',
    content: `手动创建了新商机：${data.title}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })

  return { success: true, data: opportunity as OpportunityRow }
}

// ─── getOpportunitiesAction ────────────────────────────────────────────────────
// 获取商机列表（包含客户信息）
export async function getOpportunitiesAction(filters?: {
  status?: string
  stageId?: string
  assigneeId?: string
  customerId?: string
}): Promise<OpportunityRow[]> {
  const supabase = await createClient()
  const tenantId = await getCurrentTenantId()

  console.log('[getOpportunitiesAction] tenantId:', tenantId)

  if (!tenantId) {
    console.error('[getOpportunitiesAction] No tenantId found')
    return []
  }

  let query = supabase
    .from('opportunities')
    .select(`
      *,
      customer:customers!opportunities_customerId_fkey (
        id,
        customerName,
        customerId,
        customerCode
      )
    `)
    .eq('organizationId', tenantId)

  // 应用过滤条件
  if (filters?.status) {
    query = query.eq('status', filters.status)
  }
  if (filters?.stageId) {
    query = query.eq('stageId', filters.stageId)
  }
  if (filters?.assigneeId) {
    query = query.eq('assigneeId', filters.assigneeId)
  }
  if (filters?.customerId) {
    query = query.eq('customerId', filters.customerId)
  }

  const { data, error } = await query.order('createdAt', { ascending: false })

  console.log('[getOpportunitiesAction] Query result:', { count: data?.length || 0, error: error?.message })

  if (error) {
    console.error('[getOpportunitiesAction] Error:', error.message)
    return []
  }

  return (data ?? []) as OpportunityRow[]
}

// ─── getOpportunityByIdAction ──────────────────────────────────────────────────
// 获取单个商机详情
export async function getOpportunityByIdAction(oppId: string): Promise<OpportunityRow | null> {
  const supabase = await createClient()
  const tenantId = await getCurrentTenantId()

  const { data, error } = await supabase
    .from('opportunities')
    .select(`
      *,
      customer:customers!opportunities_customerId_fkey (
        id,
        customerName,
        customerId,
        passportNo,
        phone,
        email,
        wechat,
        level,
        industryId
      )
    `)
    .eq('id', oppId)
    .eq('organizationId', tenantId)
    .single()

  if (error) {
    console.error('[getOpportunityByIdAction] Error:', error.message)
    return null
  }

  return data as OpportunityRow
}

export async function getOpportunityWorkspaceAction(oppId: string): Promise<HydratedOpportunityRow | null> {
  const opportunity = await getOpportunityByIdAction(oppId)

  if (!opportunity) {
    return null
  }

  const supabase = await createClient()
  const tenantId = await getCurrentTenantId()

  const [
    p2Data,
    p4Data,
    p5Row,
    p6Row,
    p7Row,
    p8Row,
  ] = await Promise.all([
    getOpportunityItemsAction(oppId),
    getOpportunityP4DataAction(oppId),
    supabase
      .from('opportunity_p5_data')
      .select('*')
      .eq('opportunityId', oppId)
      .maybeSingle(),
    supabase
      .from('opportunity_p6_data')
      .select('*')
      .eq('opportunityId', oppId)
      .maybeSingle(),
    supabase
      .from('opportunity_p7_data')
      .select('*')
      .eq('opportunityId', oppId)
      .maybeSingle(),
    supabase
      .from('opportunity_p8_data')
      .select('*')
      .eq('opportunityId', oppId)
      .maybeSingle(),
  ])

  const p5Data = p5Row.data ? mapP5DataRow(p5Row.data) : undefined
  const p6Data = p6Row.data ? mapP6DataRow(p6Row.data) : undefined
  const p7Data = p7Row.data ? mapP7DataRow(p7Row.data) : undefined
  const p8Data = p8Row.data ? mapP8DataRow(p8Row.data) : undefined

  if (p5Row.error) {
    console.error('[getOpportunityWorkspaceAction] P5 query error:', p5Row.error)
  }
  if (p6Row.error) {
    console.error('[getOpportunityWorkspaceAction] P6 query error:', p6Row.error)
  }
  if (p7Row.error) {
    console.error('[getOpportunityWorkspaceAction] P7 query error:', p7Row.error)
  }
  if (p8Row.error) {
    console.error('[getOpportunityWorkspaceAction] P8 query error:', p8Row.error)
  }

  if (p6Row.data) {
    const { data: materials, error: materialsError } = await supabase
      .from('material_items')
      .select('*')
      .eq('p6DataId', p6Row.data.id)
      .order('createdAt', { ascending: true })

    if (materialsError) {
      console.error('[getOpportunityWorkspaceAction] P6 materials query error:', materialsError)
    } else if (p6Data) {
      p6Data.materials = (materials ?? []).map(mapMaterialItemRow)
    }
  }

  if (p7Row.data) {
    const { data: progressPoints, error: progressPointsError } = await supabase
      .from('progress_points')
      .select('*')
      .eq('p7DataId', p7Row.data.id)
      .order('createdAt', { ascending: true })

    if (progressPointsError) {
      console.error('[getOpportunityWorkspaceAction] P7 progress query error:', progressPointsError)
    } else if (p7Data) {
      p7Data.progressPoints = (progressPoints ?? []).map(mapProgressPointRow)
    }
  }

  if (p8Row.data) {
    const [refundsResult, expensesResult] = await Promise.all([
      supabase
        .from('refund_items')
        .select('*')
        .eq('p8DataId', p8Row.data.id)
        .order('createdAt', { ascending: true }),
      supabase
        .from('expense_items')
        .select('*')
        .eq('p8DataId', p8Row.data.id)
        .order('createdAt', { ascending: true }),
    ])

    if (refundsResult.error) {
      console.error('[getOpportunityWorkspaceAction] P8 refunds query error:', refundsResult.error)
    } else if (p8Data) {
      p8Data.refunds = (refundsResult.data ?? []).map(mapRefundItemRow)
    }

    if (expensesResult.error) {
      console.error('[getOpportunityWorkspaceAction] P8 expenses query error:', expensesResult.error)
    } else if (p8Data) {
      p8Data.expenses = (expensesResult.data ?? []).map(mapExpenseItemRow)
    }
  }

  const [contractPreviewUrl, receiptPreviewUrl] = await Promise.all([
    getTemporaryPreviewUrl(p4Data?.contractFileUrl),
    getTemporaryPreviewUrl(p5Data?.receiptFileUrl),
  ])

  if (p4Data) {
    p4Data.contractPreviewUrl = contractPreviewUrl ?? p4Data.contractFileUrl
  }

  if (p5Data) {
    p5Data.receiptPreviewUrl = receiptPreviewUrl ?? p5Data.receiptFileUrl
  }

  return {
    ...opportunity,
    p2Data,
    p3Data: buildP3DataFromItems(p2Data),
    p4Data,
    p5Data,
    p6Data,
    p7Data,
    p8Data,
  }
}

export async function getOpportunityP4DataAction(oppId: string): Promise<OpportunityP4Data | undefined> {
  const supabase = await createClient()
  const tenantId = await getCurrentTenantId()

  const opportunity = await getAuthorizedOpportunity(supabase, oppId, tenantId)

  if (!opportunity) {
    console.error('[getOpportunityP4DataAction] Opportunity not found')
    return undefined
  }

  const { data, error } = await supabase
    .from('opportunity_p4_data')
    .select('contractFileUrl, contractFileName, contractFileSize, contractStatus, uploadedAt, notes, sealVisible, signatureComplete, qualityClear')
    .eq('opportunityId', oppId)
    .maybeSingle()

  if (error) {
    console.error('[getOpportunityP4DataAction] Error:', error)
    return undefined
  }

  if (!data) {
    return undefined
  }

  return mapP4DataRow(data)
}

export async function getOpportunityP5DataAction(oppId: string): Promise<OpportunityP5Data | undefined> {
  const supabase = await createClient()
  const tenantId = await getCurrentTenantId()

  const opportunity = await getAuthorizedOpportunity(supabase, oppId, tenantId)

  if (!opportunity) {
    console.error('[getOpportunityP5DataAction] Opportunity not found')
    return undefined
  }

  const { data, error } = await supabase
    .from('opportunity_p5_data')
    .select('bankAccount, bankName, accountHolder, swiftCode, dueAmount, receivedAmount, receiptFileUrl, receiptFileName, receiptUploadedAt, receiptUploadedBy, paymentStatus, rejectionReason, confirmedAt, confirmedById')
    .eq('opportunityId', oppId)
    .maybeSingle()

  if (error) {
    console.error('[getOpportunityP5DataAction] Error:', error)
    return undefined
  }

  if (!data) {
    return undefined
  }

  return mapP5DataRow(data)
}

export async function saveOpportunityP4DraftAction(
  oppId: string,
  data: OpportunityP4Data
): Promise<{ success: boolean; data?: HydratedOpportunityRow; error?: string }> {
  const supabase = await createClient()
  const tenantId = await getCurrentTenantId()

  const opportunity = await getAuthorizedOpportunity(supabase, oppId, tenantId)

  if (!opportunity) {
    console.error('[saveOpportunityP4DraftAction] Opportunity not found')
    return { success: false, error: '商机不存在' }
  }

  const nextData: OpportunityP4Data = {
    ...DEFAULT_P4_DATA,
    ...data,
    contractStatus: data.contractFileUrl ? data.contractStatus : 'pending',
  }

  const { error: upsertError } = await supabase
    .from('opportunity_p4_data')
    .upsert(buildP4UpsertPayload(oppId, nextData), { onConflict: 'opportunityId' })

  if (upsertError) {
    console.error('[saveOpportunityP4DraftAction] Upsert error:', upsertError)
    return { success: false, error: '保存合同草稿失败' }
  }

  const hydrated = await getOpportunityWorkspaceAction(oppId)

  if (!hydrated) {
    return { success: false, error: '刷新合同数据失败' }
  }

  return { success: true, data: hydrated }
}

export async function submitOpportunityContractAction(
  oppId: string,
  formData: FormData
): Promise<{ success: boolean; data?: HydratedOpportunityRow; error?: string }> {
  const supabase = await createClient()
  const tenantId = await getCurrentTenantId()

  const userId = await getAuthenticatedUserId(supabase, 'submitOpportunityContractAction', tenantId, oppId)

  if (!userId) {
    return { success: false, error: '用户未登录' }
  }

  const opportunity = await getAuthorizedOpportunity(supabase, oppId, tenantId)

  if (!opportunity) {
    console.error('[submitOpportunityContractAction] Opportunity not found')
    return { success: false, error: '商机不存在' }
  }

  if (opportunity.stageId !== 'P4') {
    return { success: false, error: '当前商机不在 P4 阶段' }
  }

  const fileEntry = formData.get('file')
  if (!(fileEntry instanceof File)) {
    return { success: false, error: '请先上传合同 PDF' }
  }

  const payload: OpportunityP4Data = {
    contractStatus: 'returned',
    notes: String(formData.get('notes') ?? ''),
    sealVisible: String(formData.get('sealVisible') ?? 'false') === 'true',
    signatureComplete: String(formData.get('signatureComplete') ?? 'false') === 'true',
    qualityClear: String(formData.get('qualityClear') ?? 'false') === 'true',
  }

  if (!payload.sealVisible || !payload.signatureComplete || !payload.qualityClear) {
    return { success: false, error: '请先完成合同质检清单' }
  }

  let uploadedFile
  try {
    uploadedFile = await uploadContractToOss({
      file: fileEntry,
      tenantId,
      opportunityId: oppId,
    })
  } catch (error) {
    console.error('[submitOpportunityContractAction] OSS upload error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '合同上传失败，请稍后重试',
    }
  }

  const uploadedAt = new Date().toISOString()
  const persistedP4Data: OpportunityP4Data = {
    ...payload,
    contractFileUrl: uploadedFile.url,
    contractFileName: uploadedFile.fileName,
    contractFileSize: uploadedFile.fileSize,
    uploadedAt,
  }

  const { error: p4Error } = await supabase
    .from('opportunity_p4_data')
    .upsert(
      buildP4UpsertPayload(oppId, persistedP4Data, {
        contractFileUrl: uploadedFile.url,
        contractFileName: uploadedFile.fileName,
        contractFileSize: uploadedFile.fileSize,
        contractStatus: 'returned',
        uploadedAt,
      }),
      { onConflict: 'opportunityId' }
    )

  if (p4Error) {
    console.error('[submitOpportunityContractAction] P4 upsert error:', p4Error)
    return { success: false, error: '保存合同信息失败' }
  }

  const { error: stageError } = await supabase
    .from('opportunities')
    .update({
      stageId: 'P5',
      updatedAt: new Date().toISOString(),
    })
    .eq('id', oppId)
    .eq('organizationId', tenantId)

  if (stageError) {
    console.error('[submitOpportunityContractAction] Stage update error:', stageError)
    return { success: false, error: '合同已上传，但推进到 P5 失败' }
  }

  await insertOpportunityInteraction(supabase, {
    tenantId,
    customerId: opportunity.customerId,
    opportunityId: oppId,
    operatorId: userId,
    type: 'STAGE_CHANGE',
    content: '合同已上传并通过质检，商机阶段变更为：P5',
  })

  const hydrated = await getOpportunityWorkspaceAction(oppId)

  if (!hydrated) {
    return { success: false, error: '刷新合同数据失败' }
  }

  return { success: true, data: hydrated }
}

export async function saveOpportunityP5ReceiptAction(
  oppId: string,
  formData: FormData
): Promise<{ success: boolean; data?: HydratedOpportunityRow; error?: string }> {
  const supabase = await createClient()
  const tenantId = await getCurrentTenantId()

  const userId = await getAuthenticatedUserId(supabase, 'saveOpportunityP5ReceiptAction', tenantId, oppId)

  if (!userId) {
    return { success: false, error: '用户未登录' }
  }

  const opportunity = await getAuthorizedOpportunity(supabase, oppId, tenantId)

  if (!opportunity) {
    console.error('[saveOpportunityP5ReceiptAction] Opportunity not found')
    return { success: false, error: '商机不存在' }
  }

  if (!['P5', 'P6', 'P7', 'P8'].includes(opportunity.stageId)) {
    return { success: false, error: '当前商机尚未进入财务阶段' }
  }

  const fileEntry = formData.get('file')
  if (!(fileEntry instanceof File)) {
    return { success: false, error: '请先选择打款凭证文件' }
  }

  const existingP5 = await getOpportunityP5DataAction(oppId)
  const dueAmountValue = Number(formData.get('dueAmount'))
  const dueAmount = Number.isFinite(dueAmountValue)
    ? dueAmountValue
    : existingP5?.dueAmount ?? 0

  let uploadedFile
  try {
    uploadedFile = await uploadFinanceReceiptToOss({
      file: fileEntry,
      tenantId,
      opportunityId: oppId,
    })
  } catch (error) {
    console.error('[saveOpportunityP5ReceiptAction] OSS upload error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '打款凭证上传失败，请稍后重试',
    }
  }

  const receiptUploadedAt = new Date().toISOString()
  const nextP5Data: OpportunityP5Data = {
    ...DEFAULT_P5_DATA,
    ...existingP5,
    dueAmount,
    receiptFileUrl: uploadedFile.url,
    receiptFileName: uploadedFile.fileName,
    receiptUploadedAt,
    receiptUploadedBy: userId,
    paymentStatus: 'pending',
    rejectionReason: undefined,
    confirmedAt: undefined,
    confirmedBy: undefined,
  }

  const { error: upsertError } = await supabase
    .from('opportunity_p5_data')
    .upsert(
      buildP5UpsertPayload(oppId, nextP5Data, {
        dueAmount,
        receiptFileUrl: uploadedFile.url,
        receiptFileName: uploadedFile.fileName,
        receiptUploadedAt,
        receiptUploadedBy: userId,
        paymentStatus: 'pending',
        rejectionReason: null,
        confirmedAt: null,
        confirmedById: null,
      }),
      { onConflict: 'opportunityId' }
    )

  if (upsertError) {
    console.error('[saveOpportunityP5ReceiptAction] Upsert error:', upsertError)
    return { success: false, error: '保存打款凭证失败' }
  }

  await insertOpportunityInteraction(supabase, {
    tenantId,
    customerId: opportunity.customerId,
    opportunityId: oppId,
    operatorId: userId,
    type: 'FORM',
    content: `已上传打款凭证：${uploadedFile.fileName}`,
  })

  const hydrated = await getOpportunityWorkspaceAction(oppId)

  if (!hydrated) {
    return { success: false, error: '刷新财务数据失败' }
  }

  return { success: true, data: hydrated }
}

export async function rejectOpportunityP5ReceiptAction(
  oppId: string,
  rejectionReason: string
): Promise<{ success: boolean; data?: HydratedOpportunityRow; error?: string }> {
  const supabase = await createClient()
  const tenantId = await getCurrentTenantId()

  const userId = await getAuthenticatedUserId(supabase, 'rejectOpportunityP5ReceiptAction', tenantId, oppId)

  if (!userId) {
    return { success: false, error: '用户未登录' }
  }

  const opportunity = await getAuthorizedOpportunity(supabase, oppId, tenantId)

  if (!opportunity) {
    console.error('[rejectOpportunityP5ReceiptAction] Opportunity not found')
    return { success: false, error: '商机不存在' }
  }

  const existingP5 = await getOpportunityP5DataAction(oppId)
  if (!existingP5?.receiptFileUrl) {
    return { success: false, error: '请先上传打款凭证' }
  }

  const trimmedReason = rejectionReason.trim()
  if (!trimmedReason) {
    return { success: false, error: '请填写驳回原因' }
  }

  const nextP5Data: OpportunityP5Data = {
    ...DEFAULT_P5_DATA,
    ...existingP5,
    paymentStatus: 'rejected',
    rejectionReason: trimmedReason,
  }

  const { error: upsertError } = await supabase
    .from('opportunity_p5_data')
    .upsert(
      buildP5UpsertPayload(oppId, nextP5Data, {
        paymentStatus: 'rejected',
        rejectionReason: trimmedReason,
      }),
      { onConflict: 'opportunityId' }
    )

  if (upsertError) {
    console.error('[rejectOpportunityP5ReceiptAction] Upsert error:', upsertError)
    return { success: false, error: '驳回打款凭证失败' }
  }

  await insertOpportunityInteraction(supabase, {
    tenantId,
    customerId: opportunity.customerId,
    opportunityId: oppId,
    operatorId: userId,
    type: 'FORM',
    content: `财务驳回了打款凭证：${trimmedReason}`,
  })

  const hydrated = await getOpportunityWorkspaceAction(oppId)

  if (!hydrated) {
    return { success: false, error: '刷新财务数据失败' }
  }

  return { success: true, data: hydrated }
}

export async function confirmOpportunityP5PaymentAction(
  oppId: string,
  payload: { receivedAmount: number }
): Promise<{ success: boolean; data?: HydratedOpportunityRow; error?: string }> {
  const supabase = await createClient()
  const tenantId = await getCurrentTenantId()

  const userId = await getAuthenticatedUserId(supabase, 'confirmOpportunityP5PaymentAction', tenantId, oppId)

  if (!userId) {
    return { success: false, error: '用户未登录' }
  }

  const opportunity = await getAuthorizedOpportunity(supabase, oppId, tenantId)

  if (!opportunity) {
    console.error('[confirmOpportunityP5PaymentAction] Opportunity not found')
    return { success: false, error: '商机不存在' }
  }

  if (opportunity.stageId !== 'P5') {
    return { success: false, error: '当前商机不在 P5 阶段' }
  }

  const existingP5 = await getOpportunityP5DataAction(oppId)
  if (!existingP5?.receiptFileUrl) {
    return { success: false, error: '请先上传打款凭证' }
  }

  const receivedAmount = Number(payload.receivedAmount)
  if (!Number.isFinite(receivedAmount) || receivedAmount < 0) {
    return { success: false, error: '到账金额无效' }
  }

  const confirmedAt = new Date().toISOString()
  const nextP5Data: OpportunityP5Data = {
    ...DEFAULT_P5_DATA,
    ...existingP5,
    receivedAmount,
    paymentStatus: 'verified',
    confirmedAt,
    confirmedBy: userId,
    rejectionReason: undefined,
  }

  const { error: upsertError } = await supabase
    .from('opportunity_p5_data')
    .upsert(
      buildP5UpsertPayload(oppId, nextP5Data, {
        receivedAmount,
        paymentStatus: 'verified',
        confirmedAt,
        confirmedById: userId,
        rejectionReason: null,
      }),
      { onConflict: 'opportunityId' }
    )

  if (upsertError) {
    console.error('[confirmOpportunityP5PaymentAction] Upsert error:', upsertError)
    return { success: false, error: '确认到账失败' }
  }

  const { error: stageError } = await supabase
    .from('opportunities')
    .update({
      stageId: 'P6',
      updatedAt: new Date().toISOString(),
    })
    .eq('id', oppId)
    .eq('organizationId', tenantId)

  if (stageError) {
    console.error('[confirmOpportunityP5PaymentAction] Stage update error:', stageError)
    return { success: false, error: '到账已确认，但推进到 P6 失败' }
  }

  await insertOpportunityInteraction(supabase, {
    tenantId,
    customerId: opportunity.customerId,
    opportunityId: oppId,
    operatorId: userId,
    type: 'STAGE_CHANGE',
    content: `财务已确认到账，金额为 ${receivedAmount}，商机阶段变更为：P6`,
  })

  const hydrated = await getOpportunityWorkspaceAction(oppId)

  if (!hydrated) {
    return { success: false, error: '刷新财务数据失败' }
  }

  return { success: true, data: hydrated }
}

// ─── updateOpportunityStageAction ──────────────────────────────────────────────
// 更新商机阶段
export async function updateOpportunityStageAction(
  oppId: string,
  newStageId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const tenantId = await getCurrentTenantId()

  const { data: { user } } = await supabase.auth.getUser()
  const userId = user?.id

  const { error } = await supabase
    .from('opportunities')
    .update({
      stageId: newStageId,
      updatedAt: new Date().toISOString(),
    })
    .eq('id', oppId)
    .eq('organizationId', tenantId)

  if (error) {
    console.error('[updateOpportunityStageAction] Error:', error.message)
    return { success: false, error: '更新商机阶段失败，请稍后重试' }
  }

  // 记录阶段变更日志
  const { data: opp } = await supabase
    .from('opportunities')
    .select('customerId')
    .eq('id', oppId)
    .single()

  if (opp) {
    await supabase.from('interactions').insert({
      id: crypto.randomUUID(),
      organizationId: tenantId,
      customerId: opp.customerId,
      opportunityId: oppId,
      operatorId: userId,
      type: 'STAGE_CHANGE',
      content: `商机阶段变更为：${newStageId}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  }

  return { success: true }
}

// ─── updateOpportunityAction ───────────────────────────────────────────────────
// 更新商机信息
export async function updateOpportunityAction(
  oppId: string,
  updates: Partial<OpportunityRow>
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const tenantId = await getCurrentTenantId()

  const { error } = await supabase
    .from('opportunities')
    .update({
      ...updates,
      updatedAt: new Date().toISOString(),
    })
    .eq('id', oppId)
    .eq('organizationId', tenantId)

  if (error) {
    console.error('[updateOpportunityAction] Error:', error.message)
    return { success: false, error: '更新商机失败，请稍后重试' }
  }

  // 赢单时自动创建交付项目
  if (updates.status === 'won') {
    const { data: opp } = await supabase
      .from('opportunities')
      .select(`
        id, customerId, opportunityCode, serviceTypeLabel,
        customer:customers!opportunities_customerId_fkey (
          customerName
        )
      `)
      .eq('id', oppId)
      .eq('organizationId', tenantId)
      .single()

    if (opp) {
      const projectName = `${opp.customer?.customerName || '客户'} - ${opp.serviceTypeLabel || opp.opportunityCode}`
      await createDeliveryProjectAction({
        opportunityId: opp.id,
        customerId: opp.customerId,
        name: projectName,
      })
    }
  }

  return { success: true }
}

// ─── toggleOpportunityPinAction ────────────────────────────────────────────────
// 切换商机置顶状态
export async function toggleOpportunityPinAction(
  oppId: string,
  isPinned: boolean
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const tenantId = await getCurrentTenantId()

  const { data: { user } } = await supabase.auth.getUser()
  const userId = user?.id

  if (!userId) {
    return { success: false, error: '用户未登录' }
  }

  // 获取当前商机的 pinnedByUsers
  const { data: opp, error: fetchError } = await supabase
    .from('opportunities')
    .select('pinnedByUsers')
    .eq('id', oppId)
    .eq('organizationId', tenantId)
    .single()

  if (fetchError || !opp) {
    console.error('[toggleOpportunityPinAction] Fetch error:', fetchError)
    return { success: false, error: '商机不存在' }
  }

  const currentPinnedUsers = (opp.pinnedByUsers as string[]) || []
  let newPinnedUsers: string[]

  if (isPinned) {
    // 添加当前用户到置顶列表
    if (!currentPinnedUsers.includes(userId)) {
      newPinnedUsers = [...currentPinnedUsers, userId]
    } else {
      newPinnedUsers = currentPinnedUsers
    }
  } else {
    // 从置顶列表移除当前用户
    newPinnedUsers = currentPinnedUsers.filter(id => id !== userId)
  }

  // 更新数据库
  const { error: updateError } = await supabase
    .from('opportunities')
    .update({
      pinnedByUsers: newPinnedUsers,
      updatedAt: new Date().toISOString(),
    })
    .eq('id', oppId)
    .eq('organizationId', tenantId)

  if (updateError) {
    console.error('[toggleOpportunityPinAction] Update error:', updateError.message)
    return { success: false, error: '操作失败，请稍后重试' }
  }

  return { success: true }
}
