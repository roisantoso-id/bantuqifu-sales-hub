// ─── Navigation ──────────────────────────────────────────────────────────────
export type NavSection = 'leads' | 'opportunities' | 'customers' | 'analytics'

// ─── Pipeline Stages ─────────────────────────────────────────────────────────
export type StageId = 'P1' | 'P2' | 'P3' | 'P4' | 'P5' | 'P6' | 'P7'

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
  lockedPrice: number // 固定单价（财务阶段不可改）
  currency: Currency // IDR or CNY
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
