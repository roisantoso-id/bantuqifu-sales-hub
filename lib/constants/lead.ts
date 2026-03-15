// Lead constants - can be imported from client and server components

export const LEAD_SOURCES = [
  { value: 'INBOUND',      label: '主动来访' },
  { value: 'REFERRAL',     label: '转介绍' },
  { value: 'CUSTOMER_REF', label: '老客户推荐' },
  { value: 'EXHIBITION',   label: '展会' },
  { value: 'WEBSITE',      label: '官网询盘' },
  { value: 'SOCIAL_MEDIA', label: '社交媒体' },
  { value: 'OTHER',        label: '其他' },
]

export const LEAD_CATEGORIES = [
  { value: 'PRODUCT_INQUIRY',  label: '产品咨询' },
  { value: 'PRICE_INQUIRY',    label: '价格咨询' },
  { value: 'SERVICE_INQUIRY',  label: '服务咨询' },
  { value: 'COOPERATION',      label: '合作洽谈' },
  { value: 'OTHER',            label: '其他' },
]

export const LEAD_URGENCY = [
  { value: 'HOT',  label: '热', color: 'bg-red-100 text-red-700' },
  { value: 'WARM', label: '温', color: 'bg-amber-100 text-amber-700' },
  { value: 'COLD', label: '冷', color: 'bg-sky-100 text-sky-700' },
]

export const LEAD_STATUSES = [
  { value: 'NEW',         label: '新线索',   color: 'bg-slate-100 text-slate-600' },
  { value: 'CONTACTED',   label: '已联系',   color: 'bg-blue-100 text-blue-700' },
  { value: 'INTERESTED',  label: '有意向',   color: 'bg-violet-100 text-violet-700' },
  { value: 'QUALIFIED',   label: '已确认',   color: 'bg-indigo-100 text-indigo-700' },
  { value: 'PROPOSAL',    label: '已报价',   color: 'bg-amber-100 text-amber-700' },
  { value: 'NEGOTIATION', label: '谈判中',   color: 'bg-orange-100 text-orange-700' },
  { value: 'CONVERTED',   label: '已转化',   color: 'bg-green-100 text-green-700' },
  { value: 'DISCARDED',   label: '已废弃',   color: 'bg-red-100 text-red-500' },
]

export const DISCARD_REASONS = [
  { value: 'INVALID_INFO',   label: '信息无效' },
  { value: 'NOT_INTERESTED', label: '无意向' },
  { value: 'POOR_MATCH',     label: '需求不匹配' },
  { value: 'COMPETITOR',     label: '选择竞争对手' },
  { value: 'DUPLICATE',      label: '重复线索' },
  { value: 'OTHER',          label: '其他' },
]
