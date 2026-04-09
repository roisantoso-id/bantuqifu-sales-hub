// ─── Domestic Entity (国内关联实体) ──────────────────────────────────────────
export type ChinaEntityStatus = '存续' | '吊销' | '注销'

export interface ChinaEntity {
  id: string // 统一社会信用代码
  companyName: string // 公司全名
  creditCode: string // 统一社会信用代码 (font-mono)
  legalPerson: string // 法定代表人
  regCapital: string // 注册资本 (如 "1000万人民币")
  businessScope?: string // 经营范围
  status: ChinaEntityStatus
  industry?: string // 行业分类 (如 "制造业")
  foundedDate?: string
  registrationLocation?: string // 注册地
}

export interface DomesticEntityAssociation {
  customerId: string
  chinaEntity: ChinaEntity
  businessMatch: 'high' | 'medium' | 'low' // 与印尼业务的匹配度
  riskLevel: 'low' | 'medium' | 'high' // 风险等级
  notes?: string
  associatedAt: string
}

// ─── Customer Level ──────────────────────────────────────────────────────────
export const CUSTOMER_LEVELS = [
  { id: 'L2', zh: '央企总部和龙头企业', id_: 'BUMN Pusat & Perusahaan Unggulan', weight: 5 },
  { id: 'L3', zh: '国有企业和上市公司', id_: 'Perusahaan Negara & Perusahaan Tbk', weight: 4 },
  { id: 'L4', zh: '非上市品牌公司',    id_: 'Perusahaan Merek Non-Tbk', weight: 3 },
  { id: 'L5', zh: '中小型企业',        id_: 'Usaha Kecil & Menengah (UKM)', weight: 2 },
  { id: 'L6', zh: '个人创业小公司',    id_: 'Wirausaha & Perusahaan Rintisan', weight: 1 },
] as const
export type CustomerLevelId = typeof CUSTOMER_LEVELS[number]['id']

// ─── Lead ────────────────────────────────────────────────────────────────────
export type LeadSource = 'wechat' | 'referral' | 'facebook' | 'website' | 'cold_outreach'
export type LeadStatus = 'new' | 'contacted' | 'no_interest' | 'ready_for_opportunity' | 'discarded' | 'public_pool'
export type LeadUrgency = '高' | '中' | '低'
export type DiscardReason = '无法联系' | '需求不匹配' | '销售能力有限' | '其他'
export type LeadCategory = '签证服务' | '公司注册' | '财务服务' | '准证服务' | '税务服务'

// ─── OpportunityRow (from database) ──────────────────────────────────────────
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
  createdAt: string
  updatedAt: string
  customer?: {
    id: string
    customerName: string
    customerId: string
  }
}

export interface Lead {
  id: string // LEAD-系列ID
  wechatName: string // 微信名/称呼（必填）
  phone?: string // 联系电话
  source: LeadSource // 来源：山海图微信群、老客户推荐、Facebook、官网

  // 业务画像
  category?: LeadCategory // 意向分类
  budget?: { min: number; max: number; currency: 'CNY' | 'IDR' } // 初步预算范围
  urgency?: LeadUrgency // 紧迫度：高、中、低
  initialIntent: string // 初步意向备注

  // 跟进逻辑
  assignee?: string // 负责人
  nextFollowDate?: string // 下次跟进计划（关键字段，触发回收逻辑）
  lastActionAt?: string // 最后一次行动时间
  status: LeadStatus // 状态

  // 丢弃逻辑
  discardedAt?: string // 丢弃时间
  discardReason?: DiscardReason // 丢弃原因
  discardedBy?: string // 谁丢弃的

  createdAt: string
  updatedAt: string
  notes?: string // 备注
  convertedOpportunityId?: string // 转化后的商机ID
}

export interface LeadRow extends Lead {}

// ─── Navigation ──────────────────────────────────────────────────────────────
export type NavSection = 'leads' | 'opportunities' | 'customers' | 'analytics' | 'oppolist' | 'pm_tasks' | 'execution'

// ─── Pipeline Stages ─────────────────────────────────────────────────────────
export type StageId = 'P1' | 'P2' | 'P3' | 'P4' | 'P5' | 'P6' | 'P7' | 'P8'

// ─── Customer / Applicant ────────────────────────────────────────────────────
export interface Customer {
  id: string
  name: string
  passportNo: string
  phone: string
  email: string
  wechat?: string
}

// ─── Opportunity ─────────────────────────────────────────────────────────────
export type OpportunityStatus = 'active' | 'won' | 'lost'

export interface OpportunityP2Data {
  tempId: string
  productId: string
  productName: string
  targetName: string
  basePrice: number
  currency: Currency
  costFloor?: number
  profitMargin?: number
  costPriceCny?: number
  costPriceIdr?: number
  partnerPriceCny?: number
  partnerPriceIdr?: number
  retailPriceCny?: number
  retailPriceIdr?: number
}

export interface OpportunityP3Data {
  tempId: string
  productId: string
  productName: string
  targetName: string
  lockedPrice: number
  currency: Currency
  costFloor?: number
  profitMargin?: number
  costPriceCny?: number
  costPriceIdr?: number
  partnerPriceCny?: number
  partnerPriceIdr?: number
  retailPriceCny?: number
  retailPriceIdr?: number
  approvalStatus: 'auto-approved' | 'admin-required' | 'pending'
  approvedAt?: string
  approvedBy?: string
}

export interface ContractEntity {
  id: string
  organizationId: string
  entityCode: string
  entityName: string
  shortName: string
  legalRepresentative?: string
  taxRate: number
  taxId?: string
  bankName?: string
  bankAccountNo?: string
  bankAccountName?: string
  swiftCode?: string
  currency: Currency
  address?: string
  contactPhone?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface AvailableContractEntityOption extends ContractEntity {
  isRecommended: boolean
}

// ─── Stage P4-P7 Data ────────────────────────────────────────────────────────
export interface OpportunityP4Data {
  contractFileUrl?: string // 合同PDF文件URL
  contractPreviewUrl?: string
  contractFileName?: string
  contractFileSize?: number
  contractStatus: 'pending' | 'returned' | 'archived' // 待签署 | 已回传 | 归档中
  uploadedAt?: string
  notes?: string
  sealVisible: boolean
  signatureComplete: boolean
  qualityClear: boolean
}

export interface OpportunityP5Data {
  contractEntityId?: string
  bankAccount?: string
  bankName?: string
  accountHolder?: string
  swiftCode?: string
  dueAmount: number
  receivedAmount: number
  receiptFileUrl?: string
  receiptPreviewUrl?: string
  receiptFileName?: string
  receiptUploadedAt?: string
  receiptUploadedBy?: string
  paymentStatus: 'pending' | 'verified' | 'rejected' // 待收款 | 已确认 | 驳回
  rejectionReason?: string
  confirmedAt?: string
  confirmedBy?: string
  availableContractEntities?: AvailableContractEntityOption[]
  recommendedContractEntityId?: string
  selectedContractEntity?: ContractEntity
}

export interface MaterialItem {
  id: string
  name: string // e.g., 护照首页、Kitap扫描件
  requirement?: string // 要求说明，e.g., "PDF格式，不超过5MB"
  serviceId?: string // 所属服务产品 ID (P2Data中的productId)
  serviceName?: string // 所属服务名称 (显示用)
  status: 'missing' | 'pending_review' | 'approved' | 'rejected'
  fileUrl?: string
  fileName?: string // 原始文件名
  fileSize?: number // 文件大小，单位 bytes
  ocrStatus?: 'pending' | 'completed' | 'failed'
  rejectionReason?: string
  uploadedAt?: string
  uploadedBy?: string
  approvedAt?: string
  approvedBy?: string
}

export interface OpportunityP6Data {
  materials: MaterialItem[]
  lastUpdatedAt?: string
}

export interface ProgressPoint {
  id: string
  label: string // e.g., 移民局接收、正在审理、贴纸完成
  status: 'pending' | 'in_progress' | 'completed'
  timestamp?: string
  serviceId?: string // 关联的服务项 ID (P2Data中的productId)
}

export interface AssignmentLogic {
  algorithm: 'expert' | 'load-balanced' // 专家匹配 或 负载均衡
  triggerServiceId?: string // 触发因素（如果是专家算法）
  triggerServiceName?: string // 触发因素名称
  assignedManagerId: string
  assignedManagerName: string
  assignedManagerAvatar?: string
  managedCount?: number // 当前在办件数
  managedCapacity?: number // 管理容量上限
  expertise?: string[] // 专家擅长领域
  assignedAt: string
}

export interface OpportunityP7Data {
  progressPoints: ProgressPoint[]
  finalDocumentUrl?: string
  finalDocumentName?: string
  deliveryStatus: 'in_transit' | 'delivered'
  deliveredAt?: string
  notes?: string
  assignmentLogic?: AssignmentLogic // 自动化委派逻辑
  completedAt?: string
}

// ─── Stage P8 Data ──────────────────────────────────────────────────────────
export interface RefundItem {
  id: string
  serviceId: string // 失败的服务项 ID
  serviceName: string // 服务名称
  originalAmount: number // P3 中的报价金额
  refundedAmount: number // 实际退款金额
  reason: string // 失败原因
  refundedAt?: string
  refundedBy?: string
  receiptUrl?: string
}

export interface ExpenseItem {
  id: string
  description: string // 事由（如："政���规费"、"加急费"、"差旅费"）
  amount: number
  category: 'gov-fee' | 'expedite' | 'travel' | 'other' // 分类
  receiptUrl?: string
  receiptFileName?: string
  createdBy: string
  createdAt: string
  approvedBy?: string
  approvedAt?: string
}

export interface OpportunityP8Data {
  totalAmount: number // P3 总合同金额
  paidAmount: number // P5 已收首款
  balanceDue: number // 应收尾款 = totalAmount - paidAmount
  balanceReceiptUrl?: string // 尾款凭证
  balanceReceivedAt?: string
  balanceStatus: 'pending' | 'received' | 'partial' // 尾款状态
  refunds: RefundItem[] // 退款项
  totalRefund: number // 总退款金额（自动累加）
  expenses: ExpenseItem[] // 报销项
  totalExpense: number // 总报销金额（自动累加）
  netBalance: number // 最终应收 = balanceDue + totalExpense - totalRefund
  profitMargin?: number // 利润率
  settledAt?: string
  settledBy?: string
  archived: boolean
  notes?: string
}

export interface Opportunity {
  id: string
  opportunityCode?: string
  customerId: string
  customer: Customer
  stageId: StageId
  status: OpportunityStatus
  serviceType: 'VISA' | 'COMPANY_REGISTRATION' | 'FACTORY_SETUP' | 'TAX_SERVICES' | 'PERMIT_SERVICES' | 'FINANCIAL_SERVICES' | 'IMMIGRATION' | 'OTHER'
  serviceTypeLabel: string
  estimatedAmount: number
  currency: Currency
  requirements?: string
  notes?: string
  destination?: string
  travelDate?: string
  assignee: string
  wechatGroupId?: number | null
  wechatGroupName?: string | null
  p2Data?: OpportunityP2Data[] // P2阶段服务实例（基于 opportunity_items）
  p3Data?: OpportunityP3Data[] // P3阶段的报价数据
  p4Data?: OpportunityP4Data // P4: 合同签署
  p5Data?: OpportunityP5Data // P5: 财务确认
  p6Data?: OpportunityP6Data // P6: 材料提交
  p7Data?: OpportunityP7Data // P7: 交付完成
  p8Data?: OpportunityP8Data // P8: 财务结算
  createdAt: string
  updatedAt: string
}

// ─── Product ─────────────────────────────────────────────────────────────────
export interface Product {
  id: string
  name: string
  category: string
  categoryId?: string | null
  categoryNameZh?: string | null
  price: number
  currency: string
  description?: string
  difficulty?: number // 1-5
  billingCycles?: string[] // e.g., ["3个月", "5个月", "12个月"]
}

export type Currency = 'CNY' | 'IDR'

export interface SelectedProduct {
  product: Product
  quantity: number
  discount: number
  billingCycle?: string // for products with cycles
  subtotal: number
  currency: Currency // snapshot of currency at time of selection
}

// ─── Action Log ──────────────────────────────────────────────────────────────
export type ActionType = 'FORM' | 'MATCH' | 'STAGE_CHANGE' | 'NOTE' | 'QUOTE' | 'CREATE'

export interface ActionLogAttachment {
  id: string
  fileName: string
  fileSize: number // bytes
  fileUrl: string // 文件URL (OSS)
  previewUrl?: string
  uploadedAt: string
}

export interface ActionLog {
  id: string
  opportunityId: string
  operatorId: string
  operatorName: string
  stageId?: StageId // 所属阶段（可选）
  actionType: ActionType
  actionLabel: string
  timestamp: string
  remark?: string
  attachments?: ActionLogAttachment[] // 附件清单
}

// ─── User ────────────────────────────────────────────────────────────────────
export interface UserProfile {
  id: string
  name: string
  avatar?: string
  role: string
  company: string
}

// ─── Delivery Center ─────────────────────────────────────────────────────────
export type DeliveryProjectStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SUSPENDED'
export type ServiceTaskStatus = 'TODO' | 'IN_PROGRESS' | 'PENDING_REVIEW' | 'COMPLETED'
export type DeliveryActionType = 'STATUS_CHANGE' | 'UPLOAD_FILE' | 'COMMENT' | 'NUDGE'
export type CommissionStatus = 'PENDING' | 'APPROVED' | 'SETTLED'
export type CommissionRoleType = 'SALES' | 'PM' | 'EXECUTOR'

export interface DeliveryProjectRow {
  id: string
  organizationId: string
  opportunityId: string
  customerId: string
  pmId?: string | null
  name: string
  status: DeliveryProjectStatus
  deadline?: string | null
  createdAt: string
  updatedAt: string
  // Joined
  customer?: { id: string; customerName: string; customerId: string }
  opportunity?: { id: string; opportunityCode: string; serviceTypeLabel: string }
  pm?: { id: string; name: string } | null
  tasks?: ServiceTaskRow[]
}

export interface ServiceTaskRow {
  id: string
  organizationId: string
  projectId: string
  executorId?: string | null
  title: string
  description?: string | null
  status: ServiceTaskStatus
  dueDate?: string | null
  commissionBase?: number | null
  createdAt: string
  updatedAt: string
  // Joined
  executor?: { id: string; name: string } | null
  project?: { id: string; name: string }
}

export interface DeliveryRecordRow {
  id: string
  taskId: string
  userId: string
  actionType: DeliveryActionType
  content?: string | null
  attachmentUrl?: string | null
  createdAt: string
  // Joined
  user?: { id: string; name: string }
}

export interface CommissionRecordRow {
  id: string
  organizationId: string
  userId: string
  roleType: CommissionRoleType
  sourceId: string
  sourceType: string
  amount: number
  status: CommissionStatus
  settlementDate?: string | null
  createdAt: string
  updatedAt: string
  // Joined
  user?: { id: string; name: string }
}
