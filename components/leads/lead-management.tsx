'use client'

import { useState, useMemo } from 'react'
import { Search, Plus, Trash2, AlertCircle } from 'lucide-react'
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
}

const LEAD_STATUS_LABEL: Record<string, string> = {
  new: '新线索',
  contacted: '沟通中',
  no_interest: '无意向',
  ready_for_opportunity: '待转商机',
}

const LEAD_SOURCE_LABEL: Record<string, string> = {
  wechat: '山海图',
  referral: '推荐',
  facebook: 'Facebook',
  website: '官网',
  cold_outreach: '冷拉',
}

const DISCARD_REASONS = ['无法联系', '需求不匹配', '销售能力有限', '其他'] as const

// 计算距离下次跟进日期的天数
function calcDaysUntilRecycle(nextFollowDate: string | undefined): number {
  if (!nextFollowDate) return 999
  const followDate = new Date(nextFollowDate)
  const today = new Date()
  const diffMs = followDate.getTime() - today.getTime()
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}

// 获取回收倒计时的颜色
function getRecycleCountdownColor(daysLeft: number): string {
  if (daysLeft <= 0) return 'bg-[#fee2e2] text-[#dc2626] animate-pulse'
  if (daysLeft <= 3) return 'bg-[#f3f4f6] text-[#6b7280]'
  if (daysLeft <= 6) return 'bg-[#fed7aa] text-[#92400e]'
  return 'bg-[#f3f4f6] text-[#9ca3af]'
}

export function LeadManagement({
  leads,
  onLeadStatusChange,
  onLeadDelete,
  onAddLead,
  onDiscardLead,
  onClaimLead,
}: LeadManagementProps) {
  const [viewMode, setViewMode] = useState<'my_leads' | 'public_pool'>('my_leads')
  const [searchQuery, setSearchQuery] = useState('')
  const [isEntryFormOpen, setIsEntryFormOpen] = useState(false)
  const [isDiscardModalOpen, setIsDiscardModalOpen] = useState(false)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [discardForm, setDiscardForm] = useState({
    reason: '无法联系' as DiscardReason,
    notes: '',
  })

  // 我的线索（非丢弃状态）
  const myLeads = useMemo(() => {
    return leads
      .filter((l) => l.status !== 'discarded' && l.status !== 'public_pool')
      .filter(
        (l) =>
          l.wechatName.includes(searchQuery) ||
          l.initialIntent.includes(searchQuery) ||
          (l.phone?.includes(searchQuery) ?? false)
      )
      .sort((a, b) => new Date(b.lastActionAt || '').getTime() - new Date(a.lastActionAt || '').getTime())
  }, [leads, searchQuery])

  const handleAddLead = (leadData: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newLead: Lead = {
      ...leadData,
      id: `LEAD-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastActionAt: new Date().toISOString(),
    }
    onAddLead?.(newLead)
  }

  const handleDiscardSubmit = () => {
    if (!selectedLead) return
    onDiscardLead?.(selectedLead.id, discardForm.reason, '当前用户')
    setIsDiscardModalOpen(false)
    setSelectedLead(null)
  }

  const handleClaimLead = (lead: Lead) => {
    onClaimLead?.(lead, '当前用户')
    setViewMode('my_leads')
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* 头部 */}
      <div className="border-b border-[#e5e7eb] bg-[#fafbfc] px-5 py-3 space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-[13px] font-semibold text-[#111827]">线索管理</h3>
          <button
            onClick={() => setIsEntryFormOpen(true)}
            className="flex h-7 items-center gap-1.5 rounded-sm bg-[#2563eb] px-2.5 text-[12px] font-medium text-white hover:bg-[#1d4ed8]"
          >
            <Plus size={14} />
            新增线索
          </button>
        </div>

        {/* 视图切换 */}
        <div className="flex items-center gap-1 bg-white border border-[#e5e7eb] rounded-sm p-0.5">
          <button
            onClick={() => setViewMode('my_leads')}
            className={`flex-1 h-7 rounded-sm text-[12px] font-medium transition-colors ${
              viewMode === 'my_leads'
                ? 'bg-[#2563eb] text-white'
                : 'text-[#6b7280] hover:text-[#111827]'
            }`}
          >
            我的线索 {myLeads.length > 0 && `(${myLeads.length})`}
          </button>
          <button
            onClick={() => setViewMode('public_pool')}
            className={`flex-1 h-7 rounded-sm text-[12px] font-medium transition-colors ${
              viewMode === 'public_pool'
                ? 'bg-[#2563eb] text-white'
                : 'text-[#6b7280] hover:text-[#111827]'
            }`}
          >
            公海池
          </button>
        </div>

        {/* 搜索 */}
        {viewMode === 'my_leads' && (
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
        )}
      </div>

      {/* 内容区域 */}
      {viewMode === 'my_leads' ? (
        <div className="flex-1 overflow-y-auto">
          {myLeads.length === 0 ? (
            <div className="flex items-center justify-center h-full text-[#9ca3af]">
              <div className="text-center">
                <div className="text-[12px]">暂无线索</div>
                <div className="text-[11px] text-[#d1d5db] mt-0.5">点击"新增线索"开始添加</div>
              </div>
            </div>
          ) : (
            <div className="space-y-0">
              {/* 表头 */}
              <div className="sticky top-0 grid grid-cols-[1fr_80px_80px_70px_80px_100px_70px] gap-2 border-b border-[#e5e7eb] bg-[#f9fafb] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af] z-10">
                <div>微信名 / 意向</div>
                <div className="text-center">分类</div>
                <div className="text-center">来源</div>
                <div className="text-center">紧迫度</div>
                <div className="text-center">负责人</div>
                <div className="text-center">回收倒计时</div>
                <div className="text-center">操作</div>
              </div>

              {/* 行 */}
              <div className="divide-y divide-[#f3f4f6]">
                {myLeads.map((lead) => {
                  const daysLeft = calcDaysUntilRecycle(lead.nextFollowDate)
                  const countdownText = daysLeft <= 0 ? '已过期' : `${daysLeft}天`

                  return (
                    <div
                      key={lead.id}
                      className="grid grid-cols-[1fr_80px_80px_70px_80px_100px_70px] gap-2 items-center px-3 py-1.5 text-[12px] hover:bg-[#f9fafb] transition-colors group"
                    >
                      {/* 微信名 + 意向 */}
                      <div className="min-w-0">
                        <p className="font-mono text-[#2563eb] truncate text-[11px]">{lead.wechatName}</p>
                        <p className="text-[#6b7280] truncate text-[10px]">{lead.initialIntent}</p>
                      </div>

                      {/* 分类 */}
                      <div className="text-center text-[#6b7280] text-[11px]">
                        {lead.category || '-'}
                      </div>

                      {/* 来源 */}
                      <div className="text-center">
                        <span className="inline-flex items-center rounded-sm bg-[#f3f4f6] px-1.5 py-0.5 text-[10px] font-medium text-[#6b7280]">
                          {LEAD_SOURCE_LABEL[lead.source] || lead.source}
                        </span>
                      </div>

                      {/* 紧迫度 */}
                      <div className="text-center">
                        <span
                          className={`inline-flex items-center rounded-sm px-1.5 py-0.5 text-[10px] font-medium ${
                            lead.urgency === '高'
                              ? 'bg-[#fee2e2] text-[#dc2626]'
                              : lead.urgency === '中'
                                ? 'bg-[#fef3c7] text-[#92400e]'
                                : 'bg-[#dbeafe] text-[#1e40af]'
                          }`}
                        >
                          {lead.urgency || '-'}
                        </span>
                      </div>

                      {/* 负责人 */}
                      <div className="text-center text-[#6b7280] text-[11px]">
                        {lead.assignee || '-'}
                      </div>

                      {/* 回收倒计时 - 显示预警 */}
                      <div className="text-center">
                        <span className={`inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[10px] font-mono font-semibold ${getRecycleCountdownColor(daysLeft)}`}>
                          {daysLeft <= 3 && <AlertCircle size={12} />}
                          {countdownText}
                        </span>
                      </div>

                      {/* 操作按钮 */}
                      <div className="flex justify-center gap-1">
                        <button
                          onClick={() => {
                            setSelectedLead(lead)
                            setIsDiscardModalOpen(true)
                          }}
                          className="flex h-6 w-6 items-center justify-center rounded-sm border border-[#e5e7eb] text-[#9ca3af] hover:border-[#dc2626] hover:text-[#dc2626] opacity-0 group-hover:opacity-100 transition-opacity"
                          title="丢弃至公海"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        <PublicPool leads={leads} onClaimLead={handleClaimLead} currentUser="当前用户" />
      )}

      {/* 新增线索表单 */}
      <LeadEntryForm
        open={isEntryFormOpen}
        onOpenChange={setIsEntryFormOpen}
        onSubmit={handleAddLead}
      />

      {/* 丢弃至公海 Modal */}
      <Sheet open={isDiscardModalOpen} onOpenChange={setIsDiscardModalOpen}>
        <SheetContent side="right" className="w-[400px]" aria-describedby={undefined}>
          <SheetHeader>
            <SheetTitle className="text-[14px] font-semibold">丢弃至公海</SheetTitle>
          </SheetHeader>
          {selectedLead && (
            <div className="mt-6 space-y-4">
              <div className="rounded-sm bg-[#f9fafb] border border-[#e5e7eb] p-3">
                <p className="text-[12px] font-semibold text-[#111827] mb-1">{selectedLead.wechatName}</p>
                <p className="text-[11px] text-[#6b7280]">{selectedLead.initialIntent}</p>
              </div>

              <div>
                <label className="text-[12px] font-medium text-[#6b7280]">丢弃原因 *</label>
                <select
                  value={discardForm.reason}
                  onChange={(e) => setDiscardForm((prev) => ({ ...prev, reason: e.target.value as DiscardReason }))}
                  className="mt-2 h-8 w-full rounded-sm border border-[#e5e7eb] bg-white px-2 text-[12px] text-[#111827] outline-none focus:border-[#2563eb]"
                >
                  {DISCARD_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[12px] font-medium text-[#6b7280]">备注说明</label>
                <textarea
                  value={discardForm.notes}
                  onChange={(e) => setDiscardForm((prev) => ({ ...prev, notes: e.target.value }))}
                  placeholder="记录丢弃原因的详细说明"
                  rows={3}
                  className="mt-2 w-full rounded-sm border border-[#e5e7eb] bg-white p-2 text-[12px] text-[#111827] placeholder-[#9ca3af] outline-none focus:border-[#2563eb] resize-none leading-relaxed"
                />
              </div>

              <div className="flex gap-2 border-t border-[#e5e7eb] pt-4">
                <button
                  onClick={() => setIsDiscardModalOpen(false)}
                  className="flex-1 h-8 rounded-sm border border-[#e5e7eb] bg-white text-[12px] font-medium text-[#374151] hover:bg-[#f9fafb]"
                >
                  取消
                </button>
                <button
                  onClick={handleDiscardSubmit}
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
