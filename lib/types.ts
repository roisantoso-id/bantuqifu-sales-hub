// ─── Navigation ──────────────────────────────────────────────────────────────
export type NavSection = 'leads' | 'opportunities' | 'customers' | 'analytics'

// ─── Pipeline Stages ─────────────────────────────────────────────────────────
export type StageId = 'P1' | 'P2' | 'P3'

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

export interface ActionLog {
  id: string
  opportunityId: string
  operatorId: string
  operatorName: string
  actionType: ActionType
  actionLabel: string
  timestamp: string
  remark?: string
}

// ─── User ────────────────────────────────────────────────────────────────────
export interface UserProfile {
  id: string
  name: string
  avatar?: string
  role: string
  company: string
}
