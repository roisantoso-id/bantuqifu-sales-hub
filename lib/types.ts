export type StageId = 'P1' | 'P2' | 'P3'

export interface Customer {
  id: string
  name: string
  passportNo: string
  phone: string
  email: string
  wechat?: string
}

export interface Opportunity {
  id: string
  customerId: string
  customer: Customer
  stageId: StageId
  serviceType: 'VISA' | 'IMMIGRATION' | 'STUDY' | 'WORK'
  serviceTypeLabel: string
  estimatedAmount: number
  currency: string
  requirements?: string
  notes?: string
  destination?: string
  travelDate?: string
  createdAt: string
  updatedAt: string
}

export interface Product {
  id: string
  name: string
  category: string
  price: number
  currency: string
  description?: string
}

export interface SelectedProduct {
  product: Product
  quantity: number
  discount: number
  subtotal: number
}

export interface ActionLog {
  id: string
  opportunityId: string
  operatorId: string
  operatorName: string
  operatorAvatar?: string
  actionType: 'FORM' | 'MATCH' | 'STAGE_CHANGE' | 'NOTE' | 'QUOTE'
  actionLabel: string
  timestamp: string
  remark?: string
}

export interface UserProfile {
  id: string
  name: string
  avatar?: string
  role: string
  company: string
}
