// 线索相关的中文标签映射

// 线索状态标签
export const LEAD_STATUS_LABELS: Record<string, string> = {
  // 数据库枚举值（小写）
  new: '新线索',
  contacted: '已联系',
  no_interest: '无意向',
  ready_for_opportunity: '待转化',
  discarded: '已丢弃',
  public_pool: '公海',

  // 前端使用的大写值（兼容）
  NEW: '新线索',
  PUSHING: '跟进中',
  CONVERTED: '已转化',
  CONTACTED: '已联系',
  NO_INTEREST: '无意向',
  READY_FOR_OPPORTUNITY: '待转化',
  DISCARDED: '已丢弃',
  PUBLIC_POOL: '公海',
}

// 线索来源标签
export const LEAD_SOURCE_LABELS: Record<string, string> = {
  // 数据库枚举值（小写）
  wechat: '微信',
  referral: '转介绍',
  facebook: 'Facebook',
  website: '官网',
  cold_outreach: '陌生开发',

  // 大写兼容
  WECHAT: '微信',
  REFERRAL: '转介绍',
  FACEBOOK: 'Facebook',
  WEBSITE: '官网',
  COLD_OUTREACH: '陌生开发',
  CUSTOMER_REF: '客户推荐',
  PARTNER: '合作伙伴',
  EXHIBITION: '展会',
  ONLINE_AD: '线上广告',
}

// 紧迫度标签
export const LEAD_URGENCY_LABELS: Record<string, string> = {
  HIGH: '高',
  MEDIUM: '中',
  LOW: '低',
  HOT: '高',
  WARM: '中',
  COLD: '低',

  // 小写兼容
  high: '高',
  medium: '中',
  low: '低',
  hot: '高',
  warm: '中',
  cold: '低',
}

// 线索类目标签
export const LEAD_CATEGORY_LABELS: Record<string, string> = {
  VISA: '签证服务',
  COMPANY_REGISTRATION: '公司注册',
  FINANCIAL_SERVICES: '财务服务',
  PERMIT_SERVICES: '准证服务',
  TAX_SERVICES: '税务服务',
  FACTORY_SETUP: '工厂落地',
  IMMIGRATION: '移民服务',
  SERVICE_INQUIRY: '服务咨询',
  OTHER: '其他',
}

// 丢弃原因标签
export const DISCARD_REASON_LABELS: Record<string, string> = {
  NO_CONTACT: '无法联系',
  MISMATCH_NEEDS: '需求不匹配',
  LIMITED_SALES_CAPABILITY: '销售能力有限',
  OTHER: '其他',
}

// 跟进类型标签
export const FOLLOWUP_TYPE_LABELS: Record<string, string> = {
  general: '一般跟进',
  call: '电话沟通',
  visit: '上门拜访',
  meeting: '会议',
  email: '邮件',
  wechat: '微信',
}

// 辅助函数：获取标签，如果没有映射则返回原值
export function getLeadStatusLabel(status: string): string {
  return LEAD_STATUS_LABELS[status] || status
}

export function getLeadSourceLabel(source: string): string {
  return LEAD_SOURCE_LABELS[source] || source
}

export function getLeadUrgencyLabel(urgency: string): string {
  return LEAD_URGENCY_LABELS[urgency] || urgency
}

export function getLeadCategoryLabel(category: string): string {
  return LEAD_CATEGORY_LABELS[category] || category
}

export function getDiscardReasonLabel(reason: string): string {
  return DISCARD_REASON_LABELS[reason] || reason
}

export function getFollowupTypeLabel(type: string): string {
  return FOLLOWUP_TYPE_LABELS[type] || type
}
