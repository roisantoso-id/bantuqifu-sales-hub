'use client'

import { useState, useMemo } from 'react'
import { Search, Plus, Trash2, AlertCircle, ArrowRight } from 'lucide-react'
import { LeadEntryForm } from './lead-entry-form'
import { PublicPool } from './public-pool'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import type { Lead, DiscardReason } from '@/lib/types'

interface LeadManagementProps {
  leads: Lead[]
  onLeadStatusChange?: (leadId: string, status: Lead['status']) => void
  onLeadDelete?: (leadId: string) => void
  onAddLead?: (lead: Lead) => void
  onDiscardLead?: (leadId: string, reason: DiscardReason, discardedBy: string) => void
  onClaimLead?: (lead: Lead, newAssignee: string) => void
  onConvertToOpportunity?: (lead: Lead, data: any) => void
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  new:                   { label: '新线索',  bg: '#dbeafe', text: '#1e40af' },
  contacted:             { label: '沟通中',  bg: '#e0e7ff', text: '#4338ca' },
  ready_for_opportunity: { label: '待转商机', bg: '#fef3c7', text: '#92400e' },
  no_interest:           { label: '无意向',  bg: '#f3f4f6', text: '#6b7280' },
}

const SOURCE_LABEL: Record<string, string> = {
  wechat:        '山海图',
  referral:      '推荐',
  facebook:      'Facebook',
  website:       '官网',
  cold_outreach: '冷拉',
}

const DISCARD_REASONS: DiscardReason[] = ['无法联系', '需求不匹配', '销售能力有限', '其他']

function daysUntil(date?: string): number {
  if (!date) return 999
  const diff = new Date(date).getTime() - Date.now()
  return Math.ceil(diff / 86400000)
}

export function LeadManagement({
  leads,
  onLeadStatusChange,
  onLeadDelete,
  onAddLead,
  onDiscardLead,
  onClaimLead,
  onConvertToOpportunity,
}: LeadManagementProps) {
  const [view, setView] = useState<'my_leads' | 'public_pool'>('my_leads')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isEntryOpen, setIsEntryOpen] = useState(false)
  const [isDiscardOpen, setIsDiscardOpen] = useState(false)
  const [activeLead, setActiveLead] = useState<Lead | null>(null)
  const [discardReason, setDiscardReason] = useState<DiscardReason>('无法联系')

  const myLeads = useMemo(() => {
    return leads
      .filter((l) => l.status !== 'discarded' && l.status !== 'public_pool')
      .filter((l) => {
        const q = search.toLowerCase()
        return (
          l.wechatName.toLowerCase().includes(q) ||
          l.initialIntent.toLowerCase().includes(q) ||
          (l.phone?.toLowerCase().includes(q) ?? false) ||
          l.id.toLowerCase().includes(q)
        )
      })
      .filter((l) => statusFilter === 'all' || l.status === statusFilter)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  }, [leads, search, statusFilter])

  const poolCount = useMemo(
    () => leads.filter((l) => l.status === 'discarded' || l.status === 'public_pool').length,
    [leads]
  )

  const handleAddLead = (data: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>) => {
    onAddLead?.({
      ...data,
      id: `LEAD-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastActionAt: new Date().toISOString(),
    })
  }

  const openDiscard = (lead: Lead) => {
    setActiveLead(lead)
    setDiscardReason('无法联系')
    setIsDiscardOpen(true)
  }

  const confirmDiscard = () => {
    if (!activeLead) return
    onDiscardLead?.(activeLead.id, discardReason, '当前用户')
    setIsDiscardOpen(false)
    setActiveLead(null)
  }

  return (
    <div className="flex h-full flex-col bg-white overflow-hidden">

      {/* ── 顶部工具栏 ── */}
      <div className="shrink-0 border-b border-[#e5e7eb] bg-[#fafbfc]">
        {/* 行 1：标题 + 视图切换 + 新增 */}
        <div className="flex items-center gap-3 px-5 py-2.5">
          <h2 className="text-[13px] font-semibold text-[#111827] shrink-0">线索管理</h2>

          {/* 视图切换 */}
          <div className="flex items-center rounded-sm border border-[#e5e7eb] bg-white p-0.5 gap-0.5">
            <button
              onClick={() => setView('my_leads')}
              className={`h-6 rounded-[2px] px-3 text-[12px] font-medium transition-colors ${
                view === 'my_leads' ? 'bg-[#2563eb] text-white' : 'text-[#6b7280] hover:text-[#111827]'
              }`}
            >
              我的线索
              {myLeads.length > 0 && (
                <span className={`ml-1.5 rounded-sm px-1 text-[10px] ${view === 'my_leads' ? 'bg-white/20 text-white' : 'bg-[#e5e7eb] text-[#6b7280]'}`}>
                  {myLeads.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setView('public_pool')}
              className={`h-6 rounded-[2px] px-3 text-[12px] font-medium transition-colors ${
                view === 'public_pool' ? 'bg-[#2563eb] text-white' : 'text-[#6b7280] hover:text-[#111827]'
              }`}
            >
              公海池
              {poolCount > 0 && (
                <span className={`ml-1.5 rounded-sm px-1 text-[10px] ${view === 'public_pool' ? 'bg-white/20 text-white' : 'bg-[#fee2e2] text-[#dc2626]'}`}>
                  {poolCount}
                </span>
              )}
            </button>
          </div>

          {/* 搜索 */}
          {view === 'my_leads' && (
            <div className="relative flex-1 max-w-xs">
              <Search size={13} className="absolute left-2 top-[9px] text-[#9ca3af]" />
              <input
                type="text"
                placeholder="搜索微信名、意向..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-7 w-full rounded-sm border border-[#e5e7eb] bg-white pl-6 pr-2 text-[12px] text-[#111827] placeholder-[#9ca3af] outline-none focus:border-[#2563eb]"
              />
            </div>
          )}

          <div className="flex-1" />

          <button
            onClick={() => setIsEntryOpen(true)}
            className="flex h-7 shrink-0 items-center gap-1.5 rounded-sm bg-[#2563eb] px-3 text-[12px] font-medium text-white hover:bg-[#1d4ed8]"
          >
            <Plus size={13} />
            新增线索
          </button>
        </div>

        {/* 行 2：状态筛选 tabs（仅我的线索视图） */}
        {view === 'my_leads' && (
          <div className="flex items-center gap-1 px-5 pb-2">
            {[
              { key: 'all', label: '全部' },
              { key: 'new', label: '新线索' },
              { key: 'contacted', label: '沟通中' },
              { key: 'ready_for_opportunity', label: '待转商机' },
              { key: 'no_interest', label: '无意向' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setStatusFilter(key)}
                className={`h-6 rounded-sm px-2.5 text-[11px] font-medium transition-colors ${
                  statusFilter === key
                    ? 'bg-[#111827] text-white'
                    : 'text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#111827]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── 内容区域 ── */}
      {view === 'my_leads' ? (
        <div className="flex-1 overflow-y-auto">
          {myLeads.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-[#9ca3af]">
              <div className="text-[13px] font-medium">暂无线索</div>
              <div className="text-[12px]">点击「新增线索」开始添加，或调整筛选条件</div>
            </div>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="sticky top-0 z-10 border-b border-[#e5e7eb] bg-[#f9fafb]">
                  <th className="py-1.5 pl-5 pr-2 text-left text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af]">ID</th>
                  <th className="px-2 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af]">微信名 / 意向</th>
                  <th className="px-2 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af]">分类</th>
                  <th className="px-2 py-1.5 text-center text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af]">来源</th>
                  <th className="px-2 py-1.5 text-center text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af]">紧迫度</th>
                  <th className="px-2 py-1.5 text-center text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af]">状态</th>
                  <th className="px-2 py-1.5 text-center text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af]">负责人</th>
                  <th className="px-2 py-1.5 text-center text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af]">回收倒计时</th>
                  <th className="py-1.5 pl-2 pr-5 text-center text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af]">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f3f4f6]">
                {myLeads.map((lead) => {
                  const days = daysUntil(lead.nextFollowDate)
                  const status = STATUS_CONFIG[lead.status]
                  const isOverdue = days <= 0
                  const isWarning = days > 0 && days <= 3

                  return (
                    <tr
                      key={lead.id}
                      className="group bg-white hover:bg-[#f9fafb] transition-colors"
                    >
                      {/* ID */}
                      <td className="py-2 pl-5 pr-2">
                        <span className="font-mono text-[11px] text-[#2563eb]">{lead.id}</span>
                      </td>

                      {/* 微信名 + 意向 */}
                      <td className="max-w-[220px] px-2 py-2">
                        <div className="truncate font-medium text-[12px] text-[#111827]">{lead.wechatName}</div>
                        <div className="truncate text-[11px] text-[#9ca3af]">{lead.initialIntent}</div>
                      </td>

                      {/* 分类 */}
                      <td className="px-2 py-2">
                        <span className="text-[11px] text-[#6b7280]">{lead.category || '—'}</span>
                      </td>

                      {/* 来源 */}
                      <td className="px-2 py-2 text-center">
                        <span className="inline-flex items-center rounded-sm bg-[#f3f4f6] px-1.5 py-0.5 text-[10px] font-medium text-[#6b7280]">
                          {SOURCE_LABEL[lead.source] || lead.source}
                        </span>
                      </td>

                      {/* 紧迫度 */}
                      <td className="px-2 py-2 text-center">
                        {lead.urgency ? (
                          <span
                            className={`inline-flex items-center rounded-sm px-1.5 py-0.5 text-[10px] font-semibold ${
                              lead.urgency === '高'
                                ? 'bg-[#fee2e2] text-[#dc2626]'
                                : lead.urgency === '中'
                                  ? 'bg-[#fef3c7] text-[#92400e]'
                                  : 'bg-[#dbeafe] text-[#1e40af]'
                            }`}
                          >
                            {lead.urgency}
                          </span>
                        ) : (
                          <span className="text-[#d1d5db] text-[11px]">—</span>
                        )}
                      </td>

                      {/* 状态 */}
                      <td className="px-2 py-2 text-center">
                        <select
                          value={lead.status}
                          onChange={(e) => onLeadStatusChange?.(lead.id, e.target.value as Lead['status'])}
                          style={{ backgroundColor: status?.bg, color: status?.text }}
                          className="h-6 rounded-sm border-0 px-1.5 text-[10px] font-semibold outline-none cursor-pointer"
                        >
                          {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                            <option key={k} value={k}>{v.label}</option>
                          ))}
                        </select>
                      </td>

                      {/* 负责人 */}
                      <td className="px-2 py-2 text-center">
                        <span className="text-[11px] text-[#6b7280]">{lead.assignee || '—'}</span>
                      </td>

                      {/* 回收倒计时 */}
                      <td className="px-2 py-2 text-center">
                        {lead.nextFollowDate ? (
                          <span
                            className={`inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 font-mono text-[10px] font-semibold ${
                              isOverdue
                                ? 'animate-pulse bg-[#fee2e2] text-[#dc2626]'
                                : isWarning
                                  ? 'bg-[#fed7aa] text-[#92400e]'
                                  : 'bg-[#f3f4f6] text-[#9ca3af]'
                            }`}
                          >
                            {(isOverdue || isWarning) && <AlertCircle size={10} />}
                            {isOverdue ? '已逾期' : `${days}天`}
                          </span>
                        ) : (
                          <span className="text-[#d1d5db] text-[11px]">未设置</span>
                        )}
                      </td>

                      {/* 操作 */}
                      <td className="py-2 pl-2 pr-5 text-center">
                        <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {lead.status === 'ready_for_opportunity' && (
                            <button
                              className="flex h-6 items-center gap-0.5 rounded-sm bg-[#2563eb] px-1.5 text-[10px] font-medium text-white hover:bg-[#1d4ed8]"
                              title="转为商机"
                            >
                              <ArrowRight size={11} />
                              转商机
                            </button>
                          )}
                          <button
                            onClick={() => openDiscard(lead)}
                            className="flex h-6 w-6 items-center justify-center rounded-sm border border-[#e5e7eb] text-[#9ca3af] hover:border-[#dc2626] hover:bg-[#fef2f2] hover:text-[#dc2626]"
                            title="丢弃至公海"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <PublicPool leads={leads} onClaimLead={(lead) => onClaimLead?.(lead, '当前用户')} currentUser="当前用户" />
      )}

      {/* 新增线索表单 */}
      <LeadEntryForm open={isEntryOpen} onOpenChange={setIsEntryOpen} onSubmit={handleAddLead} />

      {/* 丢弃确认 */}
      <Sheet open={isDiscardOpen} onOpenChange={setIsDiscardOpen}>
        <SheetContent side="right" className="w-[360px]" aria-describedby={undefined}>
          <SheetHeader>
            <SheetTitle className="text-[14px] font-semibold">丢弃至公海</SheetTitle>
          </SheetHeader>
          {activeLead && (
            <div className="mt-6 space-y-4">
              <div className="rounded-sm border border-[#e5e7eb] bg-[#f9fafb] p-3">
                <p className="text-[12px] font-semibold text-[#111827]">{activeLead.wechatName}</p>
                <p className="mt-0.5 text-[11px] text-[#6b7280]">{activeLead.initialIntent}</p>
              </div>
              <div>
                <label className="text-[12px] font-medium text-[#6b7280]">丢弃原因 *</label>
                <select
                  value={discardReason}
                  onChange={(e) => setDiscardReason(e.target.value as DiscardReason)}
                  className="mt-1.5 h-8 w-full rounded-sm border border-[#e5e7eb] bg-white px-2 text-[12px] text-[#111827] outline-none focus:border-[#2563eb]"
                >
                  {DISCARD_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="flex gap-2 border-t border-[#e5e7eb] pt-4">
                <button
                  onClick={() => setIsDiscardOpen(false)}
                  className="flex-1 h-8 rounded-sm border border-[#e5e7eb] bg-white text-[12px] font-medium text-[#374151] hover:bg-[#f9fafb]"
                >
                  取消
                </button>
                <button
                  onClick={confirmDiscard}
                  className="flex-1 h-8 rounded-sm bg-[#dc2626] text-[12px] font-medium text-white hover:bg-[#b91c1c]"
                >
                  确认丢弃
                </button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
