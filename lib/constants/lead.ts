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
  { value: 'NEW',       label: '新建',   color: 'bg-slate-100 text-slate-600' },
  { value: 'PUSHING',   label: '推进',   color: 'bg-blue-100 text-blue-700' },
  { value: 'CONVERTED', label: '转化商机', color: 'bg-green-100 text-green-700' },
  { value: 'LOST',      label: '丢失',   color: 'bg-red-100 text-red-500' },
]

export const DISCARD_REASONS = [
  { value: 'NO_CONTACT',               label: '无法联系' },
  { value: 'MISMATCH_NEEDS',           label: '需求不匹配' },
  { value: 'LIMITED_SALES_CAPABILITY', label: '销售能力不足' },
  { value: 'RETURN_TO_POOL',           label: '退回公海' },
  { value: 'OTHER',                    label: '其他' },
]
