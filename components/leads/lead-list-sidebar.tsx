'use client'

import { useState } from 'react'
import { Search, Trash2 } from 'lucide-react'
import type { Lead } from '@/lib/types'

interface LeadListSidebarProps {
  leads: Lead[]
  selectedId: string | null
  onSelect: (lead: Lead) => void
  onDelete?: (leadId: string) => void
}

const LEAD_SOURCE_LABEL: Record<string, string> = {
  wechat: 'WeChat',
  referral: '转介绍',
  cold_outreach: '冷拉',
}

const LEAD_STATUS_LABEL: Record<string, string> = {
  new: '新线索',
  contacted: '沟通中',
  no_interest: '无意向',
  ready_for_opportunity: '待转商机',
}

export function LeadListSidebar({ leads, selectedId, onSelect, onDelete }: LeadListSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const filtered = leads.filter(
    (lead) =>
      lead.wechatName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.id.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // 新线索优先、按状态排序
  const sorted = [...filtered].sort((a, b) => {
    const statusOrder = { new: 0, contacted: 1, ready_for_opportunity: 2, no_interest: 3 }
    return statusOrder[a.status] - statusOrder[b.status]
  })

  const sourceIcons: Record<string, string> = {
    wechat: '[WeChat]',
    referral: '[转介绍]',
    cold_outreach: '[冷拉]',
  }

  return (
    <div className="flex h-full flex-col border-r border-[#e5e7eb] bg-white">
      {/* Header */}
      <div className="border-b border-[#e5e7eb] px-3 py-2.5">
        <h3 className="text-[12px] font-semibold text-[#111827]">线索管理</h3>
        <p className="mt-0.5 text-[10px] text-[#9ca3af]">{filtered.length} 条线索</p>
      </div>

      {/* Search */}
      <div className="border-b border-[#e5e7eb] px-3 py-2">
        <div className="relative">
          <Search size={13} className="absolute left-2 top-2.5 text-[#9ca3af]" />
          <input
            type="text"
            placeholder="搜索微信名或ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-7 w-full rounded-sm border border-[#e5e7eb] bg-white pl-6 pr-2 text-[11px] text-[#111827] placeholder-[#9ca3af] outline-none focus:border-[#2563eb]"
          />
        </div>
      </div>

      {/* List */}
      <ul className="flex-1 overflow-y-auto divide-y divide-[#f3f4f6]">
        {sorted.map((lead) => {
          const isSelected = lead.id === selectedId
          const isNew = lead.status === 'new'
          const statusColors: Record<string, { bg: string; text: string }> = {
            new: { bg: '#dbeafe', text: '#1e40af' },
            contacted: { bg: '#e0e7ff', text: '#4f46e5' },
            no_interest: { bg: '#f3f4f6', text: '#6b7280' },
            ready_for_opportunity: { bg: '#fef3c7', text: '#9a3412' },
            discarded: { bg: '#f3f4f6', text: '#9ca3af' },
            public_pool: { bg: '#fecaca', text: '#991b1b' },
          }
          const statusColor = statusColors[lead.status] || { bg: '#f3f4f6', text: '#6b7280' }

          return (
            <li key={lead.id}>
              <button
                onClick={() => onSelect(lead)}
                onMouseEnter={() => setHoveredId(lead.id)}
                onMouseLeave={() => setHoveredId(null)}
                className={`relative w-full px-3 py-2 text-left transition-colors ${
                  isSelected ? 'bg-[#eff6ff]' : 'hover:bg-[#f9fafb]'
                }`}
              >
                {/* Active indicator bar */}
                {isSelected && <span className="absolute inset-y-0 left-0 w-0.5 rounded-r-sm bg-[#2563eb]" />}

                {/* New lead indicator dot */}
                {isNew && (
                  <span className="absolute left-0 top-3 ml-3 h-1.5 w-1.5 rounded-full bg-[#dc2626]" />
                )}

                {/* Content */}
                <div className={`${isNew ? 'ml-2' : ''}`}>
                  {/* Row 1: source + wechat name */}
                  <div className="flex items-start gap-1.5 mb-0.5">
                    <span className="shrink-0 text-[10px] font-semibold text-[#6b7280]">
                      {sourceIcons[lead.source]}
                    </span>
                    <p className="truncate text-[12px] font-medium text-[#111827]">{lead.wechatName}</p>
                  </div>

                  {/* Row 2: intent */}
                  <p className="truncate text-[11px] text-[#6b7280]">{lead.initialIntent}</p>

                  {/* Row 3: status badge + delete button */}
                  <div className="mt-1 flex items-center justify-between gap-1">
                    <span
                      className="inline-flex items-center rounded-sm px-1.5 py-0.5 text-[10px] font-semibold"
                      style={{ backgroundColor: statusColor.bg, color: statusColor.text }}
                    >
                      {LEAD_STATUS_LABEL[lead.status]}
                    </span>
                    {hoveredId === lead.id && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onDelete?.(lead.id)
                        }}
                        className="flex h-4 w-4 items-center justify-center rounded-sm text-[#9ca3af] hover:bg-[#fee2e2] hover:text-[#dc2626]"
                        title="废弃线索"
                      >
                        <Trash2 size={10} />
                      </button>
                    )}
                  </div>
                </div>
              </button>
            </li>
          )
        })}

        {sorted.length === 0 && (
          <li className="flex items-center justify-center py-8 text-[12px] text-[#9ca3af]">
            暂无线索
          </li>
        )}
      </ul>
    </div>
  )
}
