'use client'

import { Link2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { OpportunityRow } from '@/app/actions/opportunity'

interface OpportunityHeaderProps {
  opportunity: OpportunityRow
  onViewLead?: (leadId: string) => void
}

export function OpportunityHeader({ opportunity, onViewLead }: OpportunityHeaderProps) {
  return (
    <div className="border-b pb-4 mb-4">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">{opportunity.serviceTypeLabel || opportunity.serviceType}</h2>
          <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
            <span className="font-mono">{opportunity.opportunityCode}</span>

            {/* 数据血缘展示 */}
            {opportunity.convertedFromLeadId ? (
              <div className="flex items-center gap-1.5 text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
                <Link2 size={14} />
                <span>转化自线索：</span>
                <button
                  onClick={() => onViewLead?.(opportunity.convertedFromLeadId!)}
                  className="font-mono underline hover:text-blue-700 transition-colors"
                >
                  {opportunity.convertedFromLeadId}
                </button>
              </div>
            ) : (
              <Badge variant="outline" className="text-xs">
                手动新建
              </Badge>
            )}
          </div>
        </div>

        {/* 商机状态 */}
        <div className="flex items-center gap-2">
          <Badge
            variant={opportunity.status === 'active' ? 'default' : 'secondary'}
            className="text-xs"
          >
            {opportunity.status === 'active' ? '进行中' : opportunity.status === 'won' ? '已赢单' : '已失败'}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {opportunity.stageId}
          </Badge>
        </div>
      </div>

      {/* 商机金额 */}
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-bold text-slate-900">
          {new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: opportunity.currency || 'IDR',
            minimumFractionDigits: 0,
          }).format(opportunity.estimatedAmount)}
        </span>
        <span className="text-sm text-slate-500">预估金额</span>
      </div>

      {/* 需求描述 */}
      {opportunity.requirements && (
        <div className="mt-3 text-sm text-slate-600 bg-slate-50 p-3 rounded-md">
          <div className="font-medium text-slate-700 mb-1">需求描述：</div>
          {opportunity.requirements}
        </div>
      )}
    </div>
  )
}
