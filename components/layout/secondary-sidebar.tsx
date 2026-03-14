'use client'

import { useState } from 'react'
import { Search, Plus } from 'lucide-react'
import type { Opportunity, StageId } from '@/lib/types'

interface SecondarySidebarProps {
  opportunities: Opportunity[]
  selectedId: string | null
  onSelect: (opp: Opportunity) => void
}

const STAGES: { id: StageId; label: string; color: string }[] = [
  { id: 'P1', label: 'P1', color: '#6b7280' },
  { id: 'P2', label: 'P2', color: '#d97706' },
  { id: 'P3', label: 'P3', color: '#16a34a' },
]

const SERVICE_BADGES: Record<string, string> = {
  VISA: '签证',
  IMMIGRATION: '移民',
  STUDY: '留学',
  WORK: '工签',
}

function formatAmount(amount: number, currency: string) {
  if (currency === 'CNY') {
    return amount >= 10000
      ? `¥${(amount / 10000).toFixed(amount % 10000 === 0 ? 0 : 1)}万`
      : `¥${amount.toLocaleString()}`
  }
  return `${currency} ${amount.toLocaleString()}`
}

export function SecondarySidebar({ opportunities, selectedId, onSelect }: SecondarySidebarProps) {
  const [query, setQuery] = useState('')
  const [stageFilter, setStageFilter] = useState<StageId | null>(null)

  const filtered = opportunities.filter((opp) => {
    const matchesQuery =
      !query ||
      opp.customer.name.includes(query) ||
      opp.customer.passportNo.toLowerCase().includes(query.toLowerCase()) ||
      opp.serviceTypeLabel.includes(query) ||
      (opp.destination?.includes(query) ?? false)
    const matchesStage = !stageFilter || opp.stageId === stageFilter
    return matchesQuery && matchesStage
  })

  return (
    <aside className="flex h-full w-[280px] flex-col border-r border-[#e5e7eb] bg-[#f9fafb]">
      {/* Header */}
      <div className="border-b border-[#e5e7eb] bg-white px-3 py-2">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[13px] font-semibold text-[#111827]">商机</span>
          <button
            aria-label="新建商机"
            className="flex h-6 w-6 items-center justify-center rounded-sm text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#111827]"
          >
            <Plus size={14} />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={13} className="absolute left-2 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
          <input
            type="text"
            placeholder="搜索客户、护照号..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-7 w-full rounded-sm border border-[#e5e7eb] bg-[#f9fafb] pl-6 pr-2 text-[12px] text-[#111827] placeholder-[#9ca3af] outline-none focus:border-[#2563eb] focus:bg-white"
          />
        </div>

        {/* Stage filter tabs */}
        <div className="mt-2 flex gap-1">
          <button
            onClick={() => setStageFilter(null)}
            className={[
              'h-5 rounded-sm px-1.5 text-[11px] font-medium transition-colors',
              stageFilter === null
                ? 'bg-[#2563eb] text-white'
                : 'bg-[#f3f4f6] text-[#6b7280] hover:text-[#111827]',
            ].join(' ')}
          >
            全部
          </button>
          {STAGES.map((s) => (
            <button
              key={s.id}
              onClick={() => setStageFilter(stageFilter === s.id ? null : s.id)}
              className={[
                'h-5 rounded-sm px-1.5 text-[11px] font-medium transition-colors',
                stageFilter === s.id
                  ? 'bg-[#2563eb] text-white'
                  : 'bg-[#f3f4f6] text-[#6b7280] hover:text-[#111827]',
              ].join(' ')}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Count */}
      <div className="px-3 py-1.5">
        <span className="text-[11px] text-[#9ca3af]">{filtered.length} 条商机</span>
      </div>

      {/* List */}
      <ul className="flex-1 overflow-y-auto">
        {filtered.map((opp) => {
          const isSelected = opp.id === selectedId
          const stageInfo = STAGES.find((s) => s.id === opp.stageId)
          return (
            <li key={opp.id}>
              <button
                onClick={() => onSelect(opp)}
                className={[
                  'relative w-full border-b border-[#e5e7eb] px-3 py-2.5 text-left transition-colors',
                  isSelected
                    ? 'bg-white'
                    : 'hover:bg-white',
                ].join(' ')}
              >
                {/* Active indicator bar */}
                {isSelected && (
                  <span className="absolute inset-y-0 left-0 w-0.5 rounded-r-sm bg-[#2563eb]" />
                )}

                {/* Row 1: name + amount */}
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-medium text-[#111827]">
                    {opp.customer.name}
                  </span>
                  <span className="font-mono text-[12px] text-[#374151]">
                    {formatAmount(opp.estimatedAmount, opp.currency)}
                  </span>
                </div>

                {/* Row 2: passport + destination */}
                <div className="mt-0.5 flex items-center justify-between">
                  <span className="font-mono text-[11px] text-[#9ca3af]">
                    {opp.customer.passportNo}
                  </span>
                  <span className="text-[11px] text-[#6b7280]">
                    {opp.destination ?? '—'}
                  </span>
                </div>

                {/* Row 3: service badge + stage pill */}
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="rounded-sm bg-[#f3f4f6] px-1 py-0.5 text-[10px] font-medium text-[#374151]">
                    {SERVICE_BADGES[opp.serviceType] ?? opp.serviceTypeLabel}
                  </span>
                  <span
                    className="rounded-sm px-1 py-0.5 text-[10px] font-semibold"
                    style={{ color: stageInfo?.color, backgroundColor: `${stageInfo?.color}18` }}
                  >
                    {opp.stageId}
                  </span>
                  <span className="text-[10px] text-[#9ca3af]">{opp.assignee}</span>
                </div>
              </button>
            </li>
          )
        })}

        {filtered.length === 0 && (
          <li className="py-8 text-center text-[12px] text-[#9ca3af]">无匹配商机</li>
        )}
      </ul>
    </aside>
  )
}
