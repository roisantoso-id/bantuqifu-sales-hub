import type { Opportunity, Product, ActionLog, UserProfile, Currency, Lead } from './types'

// ─── Exchange Rate (Fixed for demo) ─────────────────────────────────────────
// Value represents how many units of currency = 1 CNY
export const EXCHANGE_RATES: Record<Currency, number> = {
  CNY: 1,
  IDR: 2273, // 1 CNY ≈ 2273 IDR
}

export const mockUser: UserProfile = {
  id: 'u1',
  name: '销售经理',
  avatar: undefined,
  role: 'Sales Manager',
  company: 'Bantu CRM',
}

// ─── Mock Products (精简版) ──────────────────────────────────────────────────────────
export const mockProducts: Product[] = [
  { id: 'p-001', name: '落地签【B1】', category: '签证服务', price: 750000, currency: 'IDR', difficulty: 4, billingCycles: ['一次性'] },
  { id: 'p-002', name: '商务签 C212 一年多次', category: '签证服务', price: 5300000, currency: 'IDR', difficulty: 2, billingCycles: ['一次性'] },
  { id: 'p-003', name: '商务签 C211 单次', category: '签证服务', price: 3700000, currency: 'IDR', difficulty: 2, billingCycles: ['一次性'] },
  { id: 'p-004', name: '投资签 C313/314', category: '签证服务', price: 15000000, currency: 'IDR', difficulty: 4, billingCycles: ['一次性'] },
  { id: 'p-005', name: '工作签 C312', category: '签证服务', price: 15000000, currency: 'IDR', difficulty: 5, billingCycles: ['一次性'] },
  { id: 'p-006', name: '公司注册-PMA(外资)', category: '公司开办服务', price: 15000000, currency: 'IDR', difficulty: 4, billingCycles: ['一次性'] },
  { id: 'p-007', name: '公司注册-PT PMDN(本地)', category: '公司开办服务', price: 12500000, currency: 'IDR', difficulty: 5, billingCycles: ['一次性'] },
  { id: 'p-008', name: '注册企业税卡', category: '税务服务', price: 1000000, currency: 'IDR', difficulty: 4, billingCycles: ['一次性'] },
  { id: 'p-009', name: '企业报税0申报/月', category: '税务服务', price: 3000000, currency: 'IDR', difficulty: 5, billingCycles: ['一次性'] },
  { id: 'p-010', name: '商标注册', category: '资质注册服务', price: 5000000, currency: 'IDR', difficulty: 2, billingCycles: ['一次性'] },
]

// ─── Mock Opportunities (精简版) ──────────────────────────────────────────────────────
export const mockOpportunities: Opportunity[] = [
  {
    id: 'opp-001',
    customerId: 'c-001',
    customer: { id: 'c-001', name: '极兔物流-总办', passportNo: '', phone: '', email: '' },
    stageId: 'P3',
    status: 'active',
    serviceType: 'VISA',
    serviceTypeLabel: '报价审核',
    estimatedAmount: 1000000,
    currency: 'IDR',
    requirements: '注册企业税卡',
    assignee: '销售经理',
    createdAt: '2026-01-14T08:00:00Z',
    updatedAt: '2026-01-14T08:00:00Z',
  },
  {
    id: 'opp-002',
    customerId: 'c-002',
    customer: { id: 'c-002', name: '青山矿业', passportNo: '', phone: '', email: '' },
    stageId: 'P6',
    status: 'active',
    serviceType: 'VISA',
    serviceTypeLabel: '资料提交',
    estimatedAmount: 1700000,
    currency: 'IDR',
    requirements: '落地签【B1】机场续签',
    assignee: '销售经理',
    createdAt: '2026-02-07T08:00:00Z',
    updatedAt: '2026-02-07T08:00:00Z',
  },
  {
    id: 'opp-003',
    customerId: 'c-003',
    customer: { id: 'c-003', name: '华为印尼', passportNo: '', phone: '', email: '' },
    stageId: 'P1',
    status: 'active',
    serviceType: 'VISA',
    serviceTypeLabel: '需求记录',
    estimatedAmount: 12500000,
    currency: 'IDR',
    requirements: '公司注册-PMA',
    assignee: '销售经理',
    createdAt: '2026-02-07T08:00:00Z',
    updatedAt: '2026-02-07T08:00:00Z',
  },
  {
    id: 'opp-004',
    customerId: 'c-004',
    customer: { id: 'c-004', name: '中建八局', passportNo: '', phone: '', email: '' },
    stageId: 'P2',
    status: 'active',
    serviceType: 'VISA',
    serviceTypeLabel: '方案匹配',
    estimatedAmount: 5000000,
    currency: 'IDR',
    requirements: '商标注册',
    assignee: '销售经理',
    createdAt: '2026-02-22T08:00:00Z',
    updatedAt: '2026-02-22T08:00:00Z',
  },
  {
    id: 'opp-005',
    customerId: 'c-005',
    customer: { id: 'c-005', name: '海底捞印尼', passportNo: '', phone: '', email: '' },
    stageId: 'P7',
    status: 'active',
    serviceType: 'VISA',
    serviceTypeLabel: '交付中',
    estimatedAmount: 2000,
    currency: 'CNY',
    requirements: '商务签 C211',
    assignee: '销售经理',
    createdAt: '2026-02-27T08:00:00Z',
    updatedAt: '2026-02-27T08:00:00Z',
  },
]

// ─── Mock Leads (精简版) ──────────────────────────────────────────────────────────────
export const mockLeads: Lead[] = [
  {
    id: 'LEAD-001',
    wechatName: '王总-山海图',
    phone: '13800138000',
    initialIntent: '想办 B1 签证',
    source: 'wechat',
    category: '签证服务',
    budget: { min: 5000, max: 10000, currency: 'CNY' },
    urgency: '高',
    status: 'new',
    assignee: '销售经理',
    nextFollowDate: '2026-03-17',
    lastActionAt: '2026-03-12T08:00:00Z',
    createdAt: '2026-03-15T08:00:00Z',
    updatedAt: '2026-03-15T08:00:00Z',
    notes: '客户来自微信群',
  },
  {
    id: 'LEAD-002',
    wechatName: '李总-极兔物流',
    phone: '13900139000',
    initialIntent: '商务签C211，5人',
    source: 'referral',
    category: '签证服务',
    budget: { min: 30000, max: 50000, currency: 'CNY' },
    urgency: '中',
    status: 'contacted',
    assignee: '销售经理',
    nextFollowDate: '2026-03-20',
    lastActionAt: '2026-03-14T08:00:00Z',
    createdAt: '2026-03-14T08:00:00Z',
    updatedAt: '2026-03-14T08:00:00Z',
    notes: '已初步沟通',
  },
  {
    id: 'LEAD-003',
    wechatName: '陈先生-投资',
    phone: '13600136000',
    initialIntent: '工作签',
    source: 'referral',
    category: '签证服务',
    budget: { min: 15000, max: 25000, currency: 'CNY' },
    urgency: '高',
    status: 'ready_for_opportunity',
    assignee: '销售经理',
    nextFollowDate: '2026-03-16',
    lastActionAt: '2026-03-15T08:00:00Z',
    createdAt: '2026-03-12T08:00:00Z',
    updatedAt: '2026-03-15T08:00:00Z',
    notes: '可转商机',
  },
]

// ─── Mock Action Logs (精简版) ───────────────────────────────────────────────────────
export const mockActionLogs: Record<string, ActionLog[]> = {
  'opp-001': [
    { id: 'log-001', opportunityId: 'opp-001', operatorId: 'u1', operatorName: '销售经理', actionType: 'CREATE', actionLabel: '创建商机', timestamp: '2026-01-14T08:00:00Z' },
    { id: 'log-002', opportunityId: 'opp-001', operatorId: 'u1', operatorName: '销售经理', actionType: 'STAGE_CHANGE', actionLabel: '推进至 P3', timestamp: '2026-01-20T08:00:00Z' },
  ],
  'opp-002': [
    { id: 'log-003', opportunityId: 'opp-002', operatorId: 'u1', operatorName: '销售经理', actionType: 'CREATE', actionLabel: '创建商机', timestamp: '2026-02-07T08:00:00Z' },
  ],
  'opp-003': [],
  'opp-004': [],
  'opp-005': [],
}
