'use client'

import { useState } from 'react'
import { Search, Plus, Pin, PinOff } from 'lucide-react'
import type { Opportunity, StageId } from '@/lib/types'

interface SecondarySidebarProps {
  opportunities: Opportunity[]
  selectedId: string | null
  onSelect: (opp: Opportunity) => void
}

// 阶段颜色分组: 使用单一灰色方案
const STAGE_COLOR: Record<StageId, { bg: string; text: string; dot: string }> = {
  P1: { bg: '#f3f4f6', text: '#374151', dot: '#9ca3af' },
  P2: { bg: '#f3f4f6', text: '#374151', dot: '#9ca3af' },
  P3: { bg: '#f3f4f6', text: '#374151', dot: '#9ca3af' },
  P4: { bg: '#f3f4f6', text: '#374151', dot: '#9ca3af' },
  P5: { bg: '#f3f4f6', text: '#374151', dot: '#9ca3af' },
  P6: { bg: '#f3f4f6', text: '#374151', dot: '#9ca3af' },
  P7: { bg: '#f3f4f6', text: '#374151', dot: '#9ca3af' },
  P8: { bg: '#f3f4f6', text: '#374151', dot: '#9ca3af' },
}

const STAGE_GROUPS: { label: string; stages: StageId[]; activeColor: string; activeBg: string; inactiveBg: string; inactiveText: string }[] = [
  { label: 'P1–P4', stages: ['P1', 'P2', 'P3', 'P4'], activeColor: '#ffffff', activeBg: '#6b7280', inactiveBg: '#f3f4f6', inactiveText: '#6b7280' },
  { label: 'P5–P6', stages: ['P5', 'P6'],              activeColor: '#ffffff', activeBg: '#6b7280', inactiveBg: '#f3f4f6', inactiveText: '#6b7280' },
  { label: 'P7',    stages: ['P7'],                    activeColor: '#ffffff', activeBg: '#6b7280', inactiveBg: '#f3f4f6', inactiveText: '#6b7280' },
  { label: 'P8',    stages: ['P8'],                    activeColor: '#ffffff', activeBg: '#6b7280', inactiveBg: '#f3f4f6', inactiveText: '#6b7280' },
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
  const [groupFilter, setGroupFilter] = useState<string | null>(null)
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(new Set())
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const togglePin = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    setPinnedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const activeGroup = STAGE_GROUPS.find((g) => g.label === groupFilter)

  const filtered = opportunities.filter((opp) => {
    const matchesQuery =
      !query ||
      opp.customer.name.includes(query) ||
      opp.customer.passportNo.toLowerCase().includes(query.toLowerCase()) ||
      opp.serviceTypeLabel.includes(query) ||
      (opp.destination?.includes(query) ?? false)
    const matchesStage = !activeGroup || activeGroup.stages.includes(opp.stageId)
    return matchesQuery && matchesStage
  })

  // pinned first, then rest — preserve original order within each group
  const pinned = filtered.filter((o) => pinnedIds.has(o.id))
  const unpinned = filtered.filter((o) => !pinnedIds.has(o.id))
  const sorted = [...pinned, ...unpinned]

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

        {/* Stage group filter tabs */}
        <div className="mt-2 flex gap-1">
          <button
            onClick={() => setGroupFilter(null)}
            className={[
              'h-5 rounded-sm px-1.5 text-[11px] font-medium transition-colors',
              groupFilter === null
                ? 'bg-[#374151] text-white'
                : 'bg-[#f3f4f6] text-[#6b7280] hover:text-[#111827]',
            ].join(' ')}
          >
            全部
          </button>
          {STAGE_GROUPS.map((g) => {
            const isActive = groupFilter === g.label
            return (
              <button
                key={g.label}
                onClick={() => setGroupFilter(isActive ? null : g.label)}
                className="h-5 rounded-sm px-1.5 text-[11px] font-semibold transition-colors"
                style={{
                  backgroundColor: isActive ? g.activeBg : g.inactiveBg,
                  color: isActive ? g.activeColor : g.inactiveText,
                }}
              >
                {g.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Count */}
      <div className="flex items-center justify-between px-3 py-1.5">
        <span className="text-[11px] text-[#9ca3af]">{filtered.length} 条商机</span>
        {pinnedIds.size > 0 && (
          <span className="inline-flex items-center gap-0.5 text-[10px] text-[#6b7280]">
            <Pin size={10} className="text-[#f59e0b]" />
            {pinnedIds.size} 个置顶
          </span>
        )}
      </div>

      {/* List */}
      <ul className="flex-1 overflow-y-auto">
        {sorted.map((opp, idx) => {
          const isSelected = opp.id === selectedId
          const isPinned = pinnedIds.has(opp.id)
          const isHovered = hoveredId === opp.id
          const stageColor = STAGE_COLOR[opp.stageId] ?? STAGE_COLOR.P1
          // Divider between pinned and unpinned sections
          const showDivider = isPinned && idx === pinned.length - 1 && unpinned.length > 0
          return (
            <li key={opp.id}>
              <button
                onClick={() => onSelect(opp)}
                onMouseEnter={() => setHoveredId(opp.id)}
                onMouseLeave={() => setHoveredId(null)}
                className={[
                  'group relative w-full border-b border-[#e5e7eb] px-3 py-2.5 text-left transition-colors',
                  isSelected ? 'bg-white' : 'hover:bg-white',
                  isPinned ? 'bg-[#fffbeb]' : '',
                ].join(' ')}
              >
                {/* Active indicator bar */}
                {isSelected && (
                  <span className="absolute inset-y-0 left-0 w-0.5 rounded-r-sm bg-[#2563eb]" />
                )}
                {/* Pinned indicator bar */}
                {isPinned && !isSelected && (
                  <span className="absolute inset-y-0 left-0 w-0.5 rounded-r-sm bg-[#f59e0b]" />
                )}

                {/* Row 1: name + amount + pin button */}
                <div className="flex items-center justify-between gap-1">
                  <div className="flex min-w-0 flex-1 items-center gap-1">
                    {isPinned && (
                      <Pin size={10} className="shrink-0 text-[#f59e0b]" style={{ fill: '#f59e0b' }} />
                    )}
                    <span className="truncate text-[13px] font-medium text-[#111827]">
                      {opp.customer.name}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {/* Pin toggle — visible on hover or if pinned */}
                    {(isHovered || isPinned) && (
                      <button
                        onClick={(e) => togglePin(e, opp.id)}
                        className="flex h-4 w-4 items-center justify-center rounded-sm text-[#9ca3af] hover:bg-[#f3f4f6] hover:text-[#f59e0b]"
                        title={isPinned ? '取消置顶' : '置顶'}
                      >
                        {isPinned ? <PinOff size={10} /> : <Pin size={10} />}
                      </button>
                    )}
                    <span className="font-mono text-[12px] text-[#374151]">
                      {formatAmount(opp.estimatedAmount, opp.currency)}
                    </span>
                  </div>
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

                {/* Row 3: service badge + stage pill + assignee */}
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="rounded-sm bg-[#f3f4f6] px-1 py-0.5 text-[10px] font-medium text-[#374151]">
                    {SERVICE_BADGES[opp.serviceType] ?? opp.serviceTypeLabel}
                  </span>
                  <span
                    className="inline-flex items-center gap-0.5 rounded-sm px-1 py-0.5 text-[10px] font-semibold"
                    style={{ backgroundColor: stageColor.bg, color: stageColor.text }}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: stageColor.dot }}
                    />
                    {opp.stageId}
                  </span>
                  <span className="text-[10px] text-[#9ca3af]">{opp.assignee}</span>
                </div>
              </button>
              {/* Divider between pinned and unpinned */}
              {showDivider && (
                <div className="flex items-center gap-1.5 border-b border-[#e5e7eb] bg-[#f9fafb] px-3 py-0.5">
                  <div className="h-px flex-1 bg-[#e5e7eb]" />
                  <span className="text-[10px] text-[#9ca3af]">其他商机</span>
                  <div className="h-px flex-1 bg-[#e5e7eb]" />
                </div>
              )}
            </li>
          )
        })}

        {sorted.length === 0 && (
          <li className="py-8 text-center text-[12px] text-[#9ca3af]">无匹配商机</li>
        )}
      </ul>
    </aside>
  )
}
