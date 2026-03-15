'use client'

import { Badge } from '@/components/ui/badge'
import type { OpportunityRow } from '@/app/actions/opportunity'

interface OpportunityCardProps {
  opportunity: OpportunityRow
  isSelected: boolean
  onClick: () => void
}

export function OpportunityCard({ opportunity, isSelected, onClick }: OpportunityCardProps) {
  const statusColors = {
    active: 'bg-blue-100 text-blue-700',
    won: 'bg-green-100 text-green-700',
    lost: 'bg-slate-100 text-slate-600',
  }

  const statusLabels = {
    active: '进行中',
    won: '已赢单',
    lost: '已失败',
  }

  return (
    <div
      onClick={onClick}
      className={`p-3 rounded-lg border cursor-pointer transition-all ${
        isSelected
          ? 'bg-blue-50 border-blue-300 shadow-sm'
          : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
      }`}
    >
      {/* 头部 */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <div className="font-mono text-xs text-slate-500 mb-1">
            {opportunity.opportunityCode}
          </div>
          <div className="font-medium text-sm text-slate-900 truncate">
            {opportunity.serviceTypeLabel || opportunity.serviceType}
          </div>
        </div>
        <Badge
          variant="secondary"
          className={`text-xs ml-2 ${statusColors[opportunity.status as keyof typeof statusColors]}`}
        >
          {statusLabels[opportunity.status as keyof typeof statusLabels]}
        </Badge>
      </div>

      {/* 金额 */}
      <div className="mb-2">
        <div className="text-lg font-bold text-slate-900">
          {new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: opportunity.currency || 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(opportunity.estimatedAmount)}
        </div>
      </div>

      {/* 阶段 */}
      <div className="flex items-center justify-between text-xs">
        <Badge variant="outline" className="text-xs">
          {opportunity.stageId}
        </Badge>
        <span className="text-slate-500">
          {new Date(opportunity.createdAt).toLocaleDateString('zh-CN', {
            month: '2-digit',
            day: '2-digit',
          })}
        </span>
      </div>
    </div>
  )
}
