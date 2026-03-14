'use client'

import { useState, useMemo } from 'react'
import { Search, UserPlus } from 'lucide-react'
import type { Lead } from '@/lib/types'


interface PublicPoolProps {
  leads: Lead[]
  onClaimLead: (lead: Lead) => void
  currentUser: string
}

export function PublicPool({ leads, onClaimLead, currentUser }: PublicPoolProps) {
  const [searchQuery, setSearchQuery] = useState('')

  // 筛选出公海池中的线索（discarded 或自动回收）
  const poolLeads = useMemo(() => {
    return leads
      .filter((l) => l.status === 'discarded' || l.status === 'public_pool')
      .filter(
        (l) =>
          l.wechatName.includes(searchQuery) ||
          l.initialIntent.includes(searchQuery) ||
          (l.phone?.includes(searchQuery) ?? false)
      )
      .sort((a, b) => new Date(b.discardedAt || '').getTime() - new Date(a.discardedAt || '').getTime())
  }, [leads, searchQuery])

  const getDiscardReasonColor = (reason?: string) => {
    switch (reason) {
      case '无法联系':
        return 'bg-[#fee2e2] text-[#dc2626]'
      case '需求不匹配':
        return 'bg-[#fef3c7] text-[#92400e]'
      case '销售能力有限':
        return 'bg-[#dbeafe] text-[#1e40af]'
      default:
        return 'bg-[#f3f4f6] text-[#6b7280]'
    }
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* 头部 */}
      <div className="border-b border-[#e5e7eb] bg-[#fafbfc] px-5 py-3 space-y-2">
        <h3 className="text-[13px] font-semibold text-[#111827]">公海池</h3>
        <div className="relative">
          <Search size={14} className="absolute left-2 top-2.5 text-[#9ca3af]" />
          <input
            type="text"
            placeholder="搜索线索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 w-full rounded-sm border border-[#e5e7eb] bg-white pl-7 pr-2 text-[12px] text-[#111827] placeholder-[#9ca3af] outline-none focus:border-[#2563eb]"
          />
        </div>
      </div>

      {/* 表格区域 */}
      <div className="flex-1 overflow-y-auto">
        {poolLeads.length === 0 ? (
          <div className="flex items-center justify-center h-full text-[#9ca3af]">
            <div className="text-center">
              <div className="text-[12px]">暂无公海线索</div>
              <div className="text-[11px] text-[#d1d5db]">所有线索都有负责人跟进中</div>
            </div>
          </div>
        ) : (
          <div className="space-y-0">
            {/* 表头 */}
            <div className="sticky top-0 grid grid-cols-[1fr_120px_140px_100px_80px] gap-2 border-b border-[#e5e7eb] bg-[#f9fafb] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af] z-10">
              <div>微信名 / 意向</div>
              <div className="text-center">丢弃原因</div>
              <div className="text-right">丢弃时间</div>
              <div className="text-center">丢弃人</div>
              <div className="text-center">操作</div>
            </div>

            {/* 行 */}
            <div className="divide-y divide-[#f3f4f6]">
              {poolLeads.map((lead) => {
                const discardDate = lead.discardedAt ? new Date(lead.discardedAt) : null
                const formattedDate = discardDate?.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })

                return (
                  <div
                    key={lead.id}
                    className="grid grid-cols-[1fr_120px_140px_100px_80px] gap-2 items-center px-3 py-1.5 text-[12px] bg-[#fafbfc] hover:bg-[#f3f4f6] transition-colors"
                  >
                    {/* 微信名 + 意向 */}
                    <div className="min-w-0">
                      <p className="font-mono text-[#2563eb] truncate text-[11px]">{lead.wechatName}</p>
                      <p className="text-[#6b7280] truncate text-[10px]">{lead.initialIntent}</p>
                    </div>

                    {/* 丢弃原因 */}
                    <div className="flex justify-center">
                      <span className={`inline-flex items-center rounded-sm px-1.5 py-0.5 text-[10px] font-medium ${getDiscardReasonColor(lead.discardReason)}`}>
                        {lead.discardReason || '自动回收'}
                      </span>
                    </div>

                    {/* 丢弃时间 */}
                    <div className="text-right font-mono text-[#9ca3af] text-[11px]">
                      {formattedDate || '-'}
                    </div>

                    {/* 丢弃人 */}
                    <div className="text-center text-[#6b7280] text-[11px]">
                      {lead.discardedBy || '-'}
                    </div>

                    {/* 一键领取 */}
                    <div className="flex justify-center">
                      <button
                        onClick={() => onClaimLead(lead)}
                        className="flex items-center gap-1 h-6 px-2 rounded-sm bg-[#10b981] text-white hover:bg-[#059669] text-[11px] font-medium transition-colors"
                      >
                        <UserPlus size={12} />
                        领取
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
