'use client'

import { useState, useMemo } from 'react'
import { ChevronRight, Plus } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import type { Lead, Opportunity, Customer } from '@/lib/types'

interface LeadManagementProps {
  leads: Lead[]
  onLeadStatusChange?: (leadId: string, status: Lead['status']) => void
  onLeadDelete?: (leadId: string) => void
  onConvertToOpportunity?: (lead: Lead, opportunityData: Partial<Opportunity>) => void
  onAddLead?: (lead: Lead) => void
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

export function LeadManagement({
  leads,
  onLeadStatusChange,
  onLeadDelete,
  onConvertToOpportunity,
  onAddLead,
}: LeadManagementProps) {
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [newLeadForm, setNewLeadForm] = useState({
    wechatName: '',
    initialIntent: '',
    source: 'wechat' as const,
  })
  const [convertForm, setConvertForm] = useState({
    customerName: '',
    passportNo: '',
    phone: '',
  })

  const statusColors: Record<string, { bg: string; text: string; border: string }> = {
    new: { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' },
    contacted: { bg: '#e0e7ff', text: '#4f46e5', border: '#c7d2fe' },
    no_interest: { bg: '#f3f4f6', text: '#6b7280', border: '#d1d5db' },
    ready_for_opportunity: { bg: '#fef3c7', text: '#9a3412', border: '#fcd34d' },
  }

  const sortedLeads = useMemo(() => {
    const statusOrder = { new: 0, contacted: 1, ready_for_opportunity: 2, no_interest: 3 }
    return [...leads].sort((a, b) => statusOrder[a.status] - statusOrder[b.status])
  }, [leads])

  const handleOpenConvert = (lead: Lead) => {
    setSelectedLead(lead)
    setConvertForm({
      customerName: lead.wechatName,
      passportNo: '',
      phone: '',
    })
    setIsConvertModalOpen(true)
  }

  const handleConvert = () => {
    if (!selectedLead || !convertForm.customerName.trim()) {
      alert('客户名不能为空')
      return
    }

    const customer: Customer = {
      id: `CUST-${Date.now()}`,
      name: convertForm.customerName,
      passportNo: convertForm.passportNo || `PASSPORT-${Date.now()}`,
      phone: convertForm.phone,
      email: '',
      wechat: selectedLead.wechatName,
    }

    const opportunityData: Partial<Opportunity> = {
      customer,
      requirements: selectedLead.initialIntent,
      notes: selectedLead.notes,
    }

    onConvertToOpportunity?.(selectedLead, opportunityData)
    setIsConvertModalOpen(false)
  }

  const handleAddLead = () => {
    if (!newLeadForm.wechatName.trim() || !newLeadForm.initialIntent.trim()) {
      alert('微信名和初步意向不能为空')
      return
    }

    const newLead: Lead = {
      id: `LEAD-${Date.now()}`,
      wechatName: newLeadForm.wechatName,
      initialIntent: newLeadForm.initialIntent,
      source: newLeadForm.source,
      status: 'new',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    onAddLead?.(newLead)
    setIsCreateModalOpen(false)
    setNewLeadForm({ wechatName: '', initialIntent: '', source: 'wechat' })
  }

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header */}
      <div className="border-b border-[#e5e7eb] px-5 py-2.5 flex items-center justify-between">
        <div>
          <h3 className="text-[13px] font-semibold text-[#111827]">线索管理</h3>
          <p className="mt-0.5 text-[11px] text-[#9ca3af]">共 {leads.length} 条线索</p>
        </div>
        <button
          onClick={() => {
            setNewLeadForm({ wechatName: '', initialIntent: '', source: 'wechat' })
            setIsCreateModalOpen(true)
          }}
          className="flex h-8 items-center gap-1.5 rounded-sm bg-[#2563eb] px-3 text-[12px] font-medium text-white hover:bg-[#1d4ed8]"
        >
          <Plus size={14} />
          快速录入
        </button>
      </div>

      {/* Toolbar */}
      <div className="border-b border-[#e5e7eb] bg-[#fafbfc] px-5 py-2 flex items-center gap-2">
        <button className="h-6 px-2 text-[11px] font-medium text-[#6b7280] border border-[#e5e7eb] rounded-sm hover:border-[#2563eb] hover:text-[#2563eb]">
          批量修改负责人
        </button>
        <button className="h-6 px-2 text-[11px] font-medium text-[#6b7280] border border-[#e5e7eb] rounded-sm hover:border-[#2563eb] hover:text-[#2563eb]">
          导出待跟进
        </button>
      </div>

      {/* Main Table */}
      <div className="flex-1 overflow-auto">
        {/* Table Header */}
        <div className="grid grid-cols-[100px_200px_150px_120px_100px_100px_80px] gap-1 border-b border-[#e5e7eb] bg-[#f9fafb] px-5 py-1 sticky top-0 text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af]">
          <div>线索 ID</div>
          <div>微信名/称呼</div>
          <div>初步意向</div>
          <div>来源</div>
          <div>跟进状态</div>
          <div>创建时间</div>
          <div>操作</div>
        </div>

        {/* Table Rows */}
        <div className="divide-y divide-[#f3f4f6]">
          {sortedLeads.map((lead) => {
            const color = statusColors[lead.status]
            return (
              <div
                key={lead.id}
                className="grid grid-cols-[100px_200px_150px_120px_100px_100px_80px] gap-1 px-5 py-1 items-center text-[13px] hover:bg-[#fafbfc]"
              >
                {/* Lead ID */}
                <div className="font-mono text-[#2563eb] truncate">{lead.id}</div>

                {/* WeChat Name */}
                <div className="text-[#111827] font-medium truncate">{lead.wechatName}</div>

                {/* Initial Intent */}
                <div className="text-[#6b7280] truncate">{lead.initialIntent}</div>

                {/* Source */}
                <div className="text-[#6b7280]">{LEAD_SOURCE_LABEL[lead.source]}</div>

                {/* Status Badge */}
                <div>
                  <select
                    value={lead.status}
                    onChange={(e) => onLeadStatusChange?.(lead.id, e.target.value as Lead['status'])}
                    className="h-6 rounded-sm px-1.5 text-[11px] font-semibold outline-none border"
                    style={{ backgroundColor: color.bg, color: color.text, borderColor: color.border }}
                  >
                    <option value="new">新线索</option>
                    <option value="contacted">沟通中</option>
                    <option value="ready_for_opportunity">待转商机</option>
                    <option value="no_interest">无意向</option>
                  </select>
                </div>

                {/* Created Time */}
                <div className="font-mono text-[#9ca3af] text-[12px]">
                  {new Date(lead.createdAt).toLocaleDateString('zh-CN')}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenConvert(lead)}
                    className="flex items-center gap-0.5 h-6 px-1.5 rounded-sm text-[11px] font-medium text-white bg-[#2563eb] hover:bg-[#1d4ed8]"
                  >
                    转商机
                    <ChevronRight size={12} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {sortedLeads.length === 0 && (
          <div className="flex items-center justify-center py-16 text-[14px] text-[#9ca3af]">
            暂无线索，快速录入开始销售闭环
          </div>
        )}
      </div>

      {/* Convert Modal */}
      <Sheet open={isConvertModalOpen} onOpenChange={setIsConvertModalOpen}>
        <SheetContent side="right" className="w-[400px]">
          <SheetHeader>
            <SheetTitle className="text-[14px] font-semibold">
              线索转商机 — {selectedLead?.id}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-3">
            <div className="p-2.5 rounded-sm bg-[#eff6ff] border border-[#93c5fd]">
              <p className="text-[11px] text-[#1e40af]">
                <strong>初步意向：</strong> {selectedLead?.initialIntent}
              </p>
            </div>

            <div>
              <label className="text-[12px] font-medium text-[#6b7280]">客户名*</label>
              <input
                type="text"
                value={convertForm.customerName}
                onChange={(e) => setConvertForm((prev) => ({ ...prev, customerName: e.target.value }))}
                className="mt-1 h-8 w-full rounded-sm border border-[#e5e7eb] bg-white px-2 text-[12px] text-[#111827] outline-none focus:border-[#2563eb]"
              />
            </div>

            <div>
              <label className="text-[12px] font-medium text-[#6b7280]">护照号</label>
              <input
                type="text"
                value={convertForm.passportNo}
                onChange={(e) => setConvertForm((prev) => ({ ...prev, passportNo: e.target.value }))}
                placeholder="E00000000"
                className="mt-1 h-8 w-full rounded-sm border border-[#e5e7eb] bg-white px-2 font-mono text-[12px] text-[#111827] placeholder-[#9ca3af] outline-none focus:border-[#2563eb]"
              />
            </div>

            <div>
              <label className="text-[12px] font-medium text-[#6b7280]">电话</label>
              <input
                type="text"
                value={convertForm.phone}
                onChange={(e) => setConvertForm((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="手机号"
                className="mt-1 h-8 w-full rounded-sm border border-[#e5e7eb] bg-white px-2 text-[12px] text-[#111827] placeholder-[#9ca3af] outline-none focus:border-[#2563eb]"
              />
            </div>

            <div className="flex gap-2 border-t border-[#e5e7eb] pt-4 mt-6">
              <button
                onClick={() => setIsConvertModalOpen(false)}
                className="flex-1 h-8 rounded-sm border border-[#e5e7eb] bg-white text-[12px] font-medium text-[#374151] hover:bg-[#f9fafb]"
              >
                取消
              </button>
              <button
                onClick={handleConvert}
                className="flex-1 h-8 rounded-sm bg-[#2563eb] text-[12px] font-medium text-white hover:bg-[#1d4ed8]"
              >
                转为商机
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Create Lead Modal */}
      <Sheet open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <SheetContent side="right" className="w-[400px]">
          <SheetHeader>
            <SheetTitle className="text-[14px] font-semibold">快速录入线索</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-3">
            <div>
              <label className="text-[12px] font-medium text-[#6b7280]">微信名/称呼*</label>
              <input
                type="text"
                value={newLeadForm.wechatName}
                onChange={(e) => setNewLeadForm((prev) => ({ ...prev, wechatName: e.target.value }))}
                placeholder="如：21231231山海图-王总"
                className="mt-1 h-8 w-full rounded-sm border border-[#e5e7eb] bg-white px-2 text-[12px] text-[#111827] placeholder-[#9ca3af] outline-none focus:border-[#2563eb]"
              />
            </div>

            <div>
              <label className="text-[12px] font-medium text-[#6b7280]">初步意向*</label>
              <input
                type="text"
                value={newLeadForm.initialIntent}
                onChange={(e) => setNewLeadForm((prev) => ({ ...prev, initialIntent: e.target.value }))}
                placeholder="如：想办 B1 签证"
                className="mt-1 h-8 w-full rounded-sm border border-[#e5e7eb] bg-white px-2 text-[12px] text-[#111827] placeholder-[#9ca3af] outline-none focus:border-[#2563eb]"
              />
            </div>

            <div>
              <label className="text-[12px] font-medium text-[#6b7280]">来源</label>
              <select
                value={newLeadForm.source}
                onChange={(e) => setNewLeadForm((prev) => ({ ...prev, source: e.target.value as any }))}
                className="mt-1 h-8 w-full rounded-sm border border-[#e5e7eb] bg-white px-2 text-[12px] text-[#111827] outline-none focus:border-[#2563eb]"
              >
                <option value="wechat">微信群</option>
                <option value="referral">转介绍</option>
                <option value="cold_outreach">冷拉</option>
              </select>
            </div>

            <div className="flex gap-2 border-t border-[#e5e7eb] pt-4 mt-6">
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="flex-1 h-8 rounded-sm border border-[#e5e7eb] bg-white text-[12px] font-medium text-[#374151] hover:bg-[#f9fafb]"
              >
                取消
              </button>
              <button
                onClick={handleAddLead}
                className="flex-1 h-8 rounded-sm bg-[#2563eb] text-[12px] font-medium text-white hover:bg-[#1d4ed8]"
              >
                快速录入
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
