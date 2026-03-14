// ─── Customer Level ──────────────────────────────────────────────────────────
export const CUSTOMER_LEVELS = [
  { id: 'L1', zh: '央企总部和龙头企业', id_: 'BUMN Pusat & Perusahaan Unggulan' },
  { id: 'L2', zh: '国有企业和上市公司', id_: 'Perusahaan Negara & Perusahaan Tbk' },
  { id: 'L3', zh: '非上市品牌公司',    id_: 'Perusahaan Merek Non-Tbk' },
  { id: 'L4', zh: '中小型企业',        id_: 'Usaha Kecil & Menengah (UKM)' },
  { id: 'L5', zh: '个人创业小公司',    id_: 'Wirausaha & Perusahaan Rintisan' },
] as const
export type CustomerLevelId = typeof CUSTOMER_LEVELS[number]['id']

// ─── Lead ────────────────────────────────────────────────────────────────────export type LeadSource = 'wechat' | 'referral' | 'facebook' | 'website' | 'cold_outreach'
export type LeadStatus = 'new' | 'contacted' | 'no_interest' | 'ready_for_opportunity' | 'discarded' | 'public_pool'
export type LeadUrgency = '高' | '中' | '低'
export type DiscardReason = '无法联系' | '需求不匹配' | '销售能力有限' | '其他'
export type LeadCategory = '签证服务' | '公司注册' | '财务服务' | '准证服务' | '税务服务'

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

// ─── Navigation ──────────────────────────────────────────────────────────────
export type NavSection = 'leads' | 'opportunities' | 'customers' | 'analytics'

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
  productId: string
  cycle?: string // 服务周期（如"1个月"、"12个月"）
}

export interface OpportunityP3Data {
  productId: string
  quantity: number // 数量，默认 1
  lockedPrice: number // 当前售价（可编辑）
  currency: Currency // IDR or CNY
  recommendedPrice?: number // 推荐价格（取自 Product.recommendedPrice）
  costFloor?: number // 成本底线（取自 Product.costPrice）
  profitMargin?: number // 利润率 = (lockedPrice - costFloor) / costFloor * 100
  approvalStatus: 'auto-approved' | 'admin-required' | 'pending' // 自动审批 | 需管理员审核 | 待审批
  approvedAt?: string
  approvedBy?: string
}

// ─── Stage P4-P7 Data ────────────────────────────────────────────────────────
export interface OpportunityP4Data {
  contractFileUrl?: string // 合同PDF文件URL
  contractStatus: 'pending' | 'returned' | 'archived' // 待签署 | 已回传 | 归档中
  uploadedAt?: string
  notes?: string
}

export interface OpportunityP5Data {
  bankAccount?: string
  bankName?: string
  accountHolder?: string
  swiftCode?: string
  dueAmount: number
  receivedAmount: number
  receiptFileUrl?: string
  receiptFileName?: string
  receiptUploadedAt?: string
  receiptUploadedBy?: string
  paymentStatus: 'pending' | 'verified' | 'rejected' // 待收款 | 已确认 | 驳回
  rejectionReason?: string
  confirmedAt?: string
  confirmedBy?: string
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
  description: string // 事由（如："政府规费"、"加急费"、"差旅费"）
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
  customerId: string
  customer: Customer
  stageId: StageId
  status: OpportunityStatus
  serviceType: 'VISA' | 'IMMIGRATION' | 'STUDY' | 'WORK'
  serviceTypeLabel: string
  estimatedAmount: number
  currency: Currency
  requirements?: string
  notes?: string
  destination?: string
  travelDate?: string
  assignee: string
  p2Data?: OpportunityP2Data[] // P2阶段选中的产品
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
