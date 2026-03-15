'use client'

import { Search, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Opportunity, StageId } from '@/lib/types'

const stageColors: Record<StageId, string> = {
  P1: 'bg-amber-500',
  P2: 'bg-blue-500',
  P3: 'bg-emerald-500',
}

const stageBadgeStyles: Record<StageId, string> = {
  P1: 'bg-amber-100 text-amber-700 border-amber-200',
  P2: 'bg-blue-100 text-blue-700 border-blue-200',
  P3: 'bg-emerald-100 text-emerald-700 border-emerald-200',
}

const serviceAbbr: Record<string, string> = {
  VISA: '签证',
  IMMIGRATION: '移民',
  STUDY: '留学',
  WORK: '工作',
  COMPANY_REGISTRATION: '公司',
  TAX_SERVICES: '税务',
  FINANCIAL_SERVICES: '财务',
}

// 计算停滞天数
function getIdleDays(lastActivityDate?: string): number {
  if (!lastActivityDate) return 0
  const last = new Date(lastActivityDate)
  const now = new Date()
  const diff = now.getTime() - last.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

interface OpportunityListProps {
  opportunities: Opportunity[]
  selectedId: string | null
  onSelect: (opportunity: Opportunity) => void
  searchQuery: string
  onSearchChange: (query: string) => void
  stageFilter: StageId | null
  onStageFilterChange: (stage: StageId | null) => void
}

export function OpportunityList({
  opportunities,
  selectedId,
  onSelect,
  searchQuery,
  onSearchChange,
  stageFilter,
  onStageFilterChange,
}: OpportunityListProps) {
  const stages: (StageId | null)[] = [null, 'P1', 'P2', 'P3']

  const filteredOpportunities = opportunities.filter((opp) => {
    const matchesSearch =
      !searchQuery ||
      opp.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opp.customer.passportNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opp.opportunityCode.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStage = !stageFilter || opp.stageId === stageFilter
    return matchesSearch && matchesStage
  })

  return (
    <div className="flex h-full w-[280px] flex-col border-r border-slate-200 bg-white">
      {/* Header */}
      <div className="border-b border-slate-200 p-2">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="搜索商机..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-7 w-full rounded border border-slate-200 bg-white pl-7 pr-2 text-[12px] text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-0"
          />
        </div>
        {/* Stage Filters */}
        <div className="mt-2 flex gap-1">
          {stages.map((stage) => (
            <button
              key={stage ?? 'all'}
              onClick={() => onStageFilterChange(stage)}
              className={cn(
                'h-6 rounded px-2 text-[11px] font-medium transition-colors',
                stageFilter === stage
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              {stage ?? '全部'}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filteredOpportunities.map((opp) => {
          const idleDays = getIdleDays(opp.lastActivityDate || opp.updatedAt)
          const isOverdue = idleDays > 7

          return (
            <button
              key={opp.id}
              onClick={() => onSelect(opp)}
              className={cn(
                'relative flex w-full flex-col border-b border-slate-100 px-3 py-2 text-left transition-colors',
                selectedId === opp.id
                  ? 'bg-blue-50'
                  : 'bg-white hover:bg-slate-50'
              )}
            >
              {/* Active indicator */}
              {selectedId === opp.id && (
                <div className="absolute left-0 top-0 h-full w-0.5 bg-blue-600" />
              )}

              {/* 第一行：商机编号 + 阶段 Badge */}
              <div className="flex items-center justify-between gap-2">
                <span className="truncate font-mono text-[11px] text-slate-500">
                  {opp.opportunityCode}
                </span>
                <span
                  className={cn(
                    'flex-shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-medium',
                    stageBadgeStyles[opp.stageId]
                  )}
                >
                  {opp.stageId}
                </span>
              </div>

              {/* 第二行：客户名称 */}
              <div className="mt-1 truncate text-[13px] font-medium text-slate-900">
                {opp.customer.name}
              </div>

              {/* 第三行：服务类型 + 预估金额 + 停滞天数 */}
              <div className="mt-1 flex items-center justify-between text-[11px]">
                <span className="text-slate-500">
                  {serviceAbbr[opp.serviceType] || opp.serviceType}
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-medium text-slate-700">
                    ¥{opp.estimatedAmount.toLocaleString()}
                  </span>
                  {isOverdue ? (
                    <span className="flex items-center gap-0.5 font-semibold text-red-600">
                      <AlertCircle className="h-3 w-3" />
                      {idleDays}天
                    </span>
                  ) : idleDays > 0 ? (
                    <span className="text-slate-400">{idleDays}天</span>
                  ) : null}
                </div>
              </div>
            </button>
          )
        })}

        {filteredOpportunities.length === 0 && (
          <div className="flex h-32 items-center justify-center text-[12px] text-slate-500">
            暂无商机记录
          </div>
        )}
      </div>
    </div>
  )
}
