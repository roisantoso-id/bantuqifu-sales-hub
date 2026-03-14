'use client'

import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Opportunity, StageId } from '@/lib/types'

const stageColors: Record<StageId, string> = {
  P1: 'bg-amber-500',
  P2: 'bg-blue-500',
  P3: 'bg-emerald-500',
}

const serviceAbbr: Record<string, string> = {
  VISA: 'V',
  IMMIGRATION: 'I',
  STUDY: 'S',
  WORK: 'W',
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
      opp.customer.passportNo.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStage = !stageFilter || opp.stageId === stageFilter
    return matchesSearch && matchesStage
  })

  return (
    <div className="flex h-full w-[320px] flex-col border-r border-[#e5e7eb] bg-white">
      {/* Header */}
      <div className="border-b border-[#e5e7eb] p-2">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#6b7280]" />
          <input
            type="text"
            placeholder="搜索客户/护照号..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-7 w-full rounded-sm border border-[#e5e7eb] bg-white pl-7 pr-2 text-[12px] text-[#111827] placeholder:text-[#9ca3af] focus:border-[#2563eb] focus:outline-none"
          />
        </div>
        {/* Stage Filters */}
        <div className="mt-2 flex gap-1">
          {stages.map((stage) => (
            <button
              key={stage ?? 'all'}
              onClick={() => onStageFilterChange(stage)}
              className={cn(
                'h-6 rounded-sm px-2 text-[11px] font-medium transition-colors',
                stageFilter === stage
                  ? 'bg-[#2563eb] text-white'
                  : 'bg-[#f3f4f6] text-[#6b7280] hover:bg-[#e5e7eb]'
              )}
            >
              {stage ?? '全部'}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filteredOpportunities.map((opp) => (
          <button
            key={opp.id}
            onClick={() => onSelect(opp)}
            className={cn(
              'relative flex w-full items-start border-b border-[#e5e7eb] px-2 py-1.5 text-left transition-colors',
              selectedId === opp.id
                ? 'bg-[#f3f4f6]'
                : 'bg-white hover:bg-[#f9fafb]'
            )}
          >
            {/* Active indicator */}
            {selectedId === opp.id && (
              <div className="absolute left-0 top-0 h-full w-0.5 bg-[#2563eb]" />
            )}
            
            {/* Stage indicator */}
            <div
              className={cn(
                'mt-1 h-2 w-2 flex-shrink-0 rounded-full',
                stageColors[opp.stageId]
              )}
            />
            
            {/* Content */}
            <div className="ml-2 min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-[13px] font-medium text-[#111827]">
                  {opp.customer.name}
                </span>
                <span className="flex-shrink-0 rounded-sm bg-[#f3f4f6] px-1 py-0.5 text-[10px] font-medium text-[#6b7280]">
                  {serviceAbbr[opp.serviceType]}
                </span>
              </div>
              <div className="mt-0.5 flex items-center justify-between">
                <span className="font-mono text-[11px] text-[#6b7280]">
                  {opp.customer.passportNo}
                </span>
                <span className="font-mono text-[11px] font-medium text-[#111827]">
                  ¥{opp.estimatedAmount.toLocaleString()}
                </span>
              </div>
            </div>
          </button>
        ))}
        
        {filteredOpportunities.length === 0 && (
          <div className="flex h-32 items-center justify-center text-[12px] text-[#6b7280]">
            暂无商机记录
          </div>
        )}
      </div>
    </div>
  )
}
