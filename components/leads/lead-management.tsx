'use client'
// Lead Management - v2.0 Supabase direct

import { useState, useMemo, useEffect, useCallback } from 'react'
import { Search, Plus, X, RefreshCw, ChevronRight, Flame, Thermometer, Snowflake, Clock, User, Phone, Mail, MessageCircle, Building2, Archive } from 'lucide-react'
import {
  getLeadsAction,
  createLeadAction,
  updateLeadStatusAction,
  discardLeadAction,
  claimLeadAction,
  addLeadFollowUpAction,
  getLeadFollowUpsAction,
  LEAD_SOURCES,
  LEAD_CATEGORIES,
  LEAD_URGENCY,
  LEAD_STATUSES,
  DISCARD_REASONS,
  type LeadRow,
  type LeadFollowUpRow,
} from '@/app/actions/lead'

// ─── 辅助函数 ─────────────────────────────────────────────────────────────────

function getUrgencyStyle(urgency: string) {
  const map: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
    HOT:  { label: '热', cls: 'bg-red-100 text-red-700',    icon: <Flame size={11} /> },
    WARM: { label: '温', cls: 'bg-amber-100 text-amber-700', icon: <Thermometer size={11} /> },
    COLD: { label: '冷', cls: 'bg-sky-100 text-sky-700',     icon: <Snowflake size={11} /> },
  }
  return map[urgency] ?? { label: urgency, cls: 'bg-slate-100 text-slate-600', icon: null }
}

function getStatusStyle(status: string) {
  return LEAD_STATUSES.find((s) => s.value === status) ?? { label: status, color: 'bg-slate-100 text-slate-500' }
}

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 py-2.5 px-3 border-b border-[#f3f4f6]">
      <div className="w-20 h-3 bg-[#f3f4f6] rounded animate-pulse" />
      <div className="flex-1 h-3 bg-[#f3f4f6] rounded animate-pulse" />
      <div className="w-14 h-3 bg-[#f3f4f6] rounded animate-pulse" />
    </div>
  )
}

// ─── 主组件 ───────────────────────────────────────────────────────────────────

export function LeadManagement() {
  const [viewMode, setViewMode] = useState<'my_leads' | 'public_pool'>('my_leads')
  const [leads, setLeads] = useState<LeadRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [filterUrgency, setFilterUrgency] = useState('ALL')

  const [selectedLead, setSelectedLead] = useState<LeadRow | null>(null)
  const [followUps, setFollowUps] = useState<LeadFollowUpRow[]>([])
  const [followUpsLoading, setFollowUpsLoading] = useState(false)
  const [detailTab, setDetailTab] = useState<'info' | 'followups'>('info')

  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createForm, setCreateForm] = useState({
    personName: '', company: '', position: '', phone: '', email: '', wechat: '',
    source: 'INBOUND', sourceDetail: '', category: 'OTHER', urgency: 'WARM', notes: '',
  })

  const [showDiscard, setShowDiscard] = useState<LeadRow | null>(null)
  const [discardReason, setDiscardReason] = useState('NOT_INTERESTED')
  const [discarding, setDiscarding] = useState(false)

  const [showFollowUp, setShowFollowUp] = useState(false)
  const [followUpForm, setFollowUpForm] = useState({ followupType: 'general', content: '', nextAction: '', nextActionDate: '' })
  const [addingFollowUp, setAddingFollowUp] = useState(false)

  // ─── 数据加载 ─────────────────────────────────────────────────────────────

  const loadLeads = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getLeadsAction(viewMode)
      setLeads(data)
    } finally {
      setLoading(false)
    }
  }, [viewMode])

  useEffect(() => {
    loadLeads()
    setSelectedLead(null)
    setFollowUps([])
  }, [loadLeads])

  const loadFollowUps = async (leadId: string) => {
    setFollowUpsLoading(true)
    try {
      const data = await getLeadFollowUpsAction(leadId)
      setFollowUps(data)
    } finally {
      setFollowUpsLoading(false)
    }
  }

  // ─── 过滤 ─────────────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    return leads.filter((l) => {
      const q = search.toLowerCase()
      const matchSearch = !q ||
        l.personName.toLowerCase().includes(q) ||
        (l.company ?? '').toLowerCase().includes(q) ||
        (l.phone ?? '').includes(q) ||
        l.leadCode.toLowerCase().includes(q)
      const matchStatus = filterStatus === 'ALL' || l.status === filterStatus
      const matchUrgency = filterUrgency === 'ALL' || l.urgency === filterUrgency
      return matchSearch && matchStatus && matchUrgency
    })
  }, [leads, search, filterStatus, filterUrgency])

  // ─── 操作处理 ─────────────────────────────────────────────────────────────

  const handleSelectLead = (lead: LeadRow) => {
    setSelectedLead(lead)
    setDetailTab('info')
    setFollowUps([])
  }

  const handleTabChange = (tab: 'info' | 'followups') => {
    setDetailTab(tab)
    if (tab === 'followups' && selectedLead && followUps.length === 0) {
      loadFollowUps(selectedLead.id)
    }
  }

  const handleCreate = async () => {
    if (!createForm.personName.trim()) return
    setCreating(true)
    try {
      const result = await createLeadAction({
        personName: createForm.personName.trim(),
        company: createForm.company || null,
        position: createForm.position || null,
        phone: createForm.phone || null,
        email: createForm.email || null,
        wechat: createForm.wechat || null,
        source: createForm.source,
        sourceDetail: createForm.sourceDetail || null,
        category: createForm.category,
        urgency: createForm.urgency,
        notes: createForm.notes || null,
      })
      if (result) {
        setLeads((prev) => [result, ...prev])
        setShowCreate(false)
        setCreateForm({ personName: '', company: '', position: '', phone: '', email: '', wechat: '', source: 'INBOUND', sourceDetail: '', category: 'OTHER', urgency: 'WARM', notes: '' })
      }
    } finally {
      setCreating(false)
    }
  }

  const handleDiscard = async () => {
    if (!showDiscard) return
    setDiscarding(true)
    try {
      const result = await discardLeadAction(showDiscard.id, discardReason)
      if (result) {
        setLeads((prev) => prev.filter((l) => l.id !== result.id))
        if (selectedLead?.id === result.id) setSelectedLead(null)
        setShowDiscard(null)
      }
    } finally {
      setDiscarding(false)
    }
  }

  const handleClaim = async (lead: LeadRow) => {
    const result = await claimLeadAction(lead.id)
    if (result) {
      setLeads((prev) => prev.filter((l) => l.id !== result.id))
      setSelectedLead(null)
    }
  }

  const handleStatusChange = async (lead: LeadRow, status: string) => {
    const result = await updateLeadStatusAction(lead.id, status)
    if (result) {
      setLeads((prev) => prev.map((l) => l.id === result.id ? result : l))
      if (selectedLead?.id === result.id) setSelectedLead(result)
    }
  }

  const handleAddFollowUp = async () => {
    if (!selectedLead || !followUpForm.content.trim()) return
    setAddingFollowUp(true)
    try {
      const result = await addLeadFollowUpAction({
        leadId: selectedLead.id,
        followupType: followUpForm.followupType,
        content: followUpForm.content,
        nextAction: followUpForm.nextAction || null,
        nextActionDate: followUpForm.nextActionDate || null,
      })
      if (result) {
        setFollowUps((prev) => [result, ...prev])
        setFollowUpForm({ followupType: 'general', content: '', nextAction: '', nextActionDate: '' })
        setShowFollowUp(false)
      }
    } finally {
      setAddingFollowUp(false)
    }
  }

  // ─── 渲染 ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-full bg-[#f9fafb]">

      {/* ── 左侧列表 ── */}
      <div className="w-[340px] flex-shrink-0 flex flex-col bg-white border-r border-[#e5e7eb]">

        <div className="px-4 pt-4 pb-3 border-b border-[#e5e7eb]">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[15px] font-semibold text-[#111827]">线索管理</h2>
            <div className="flex items-center gap-1.5">
              <button onClick={loadLeads} className="p-1.5 rounded-sm hover:bg-[#f3f4f6] text-[#9ca3af]"><RefreshCw size={14} /></button>
              <button onClick={() => setShowCreate(true)} className="flex items-center gap-1 h-7 px-2.5 rounded-sm bg-[#2563eb] text-[11px] font-medium text-white hover:bg-[#1d4ed8]"><Plus size={13} />新建</button>
            </div>
          </div>

          {/* 视图切换 */}
          <div className="flex gap-1 mb-3 p-0.5 bg-[#f3f4f6] rounded-sm">
            {[{ id: 'my_leads', label: '我的线索' }, { id: 'public_pool', label: '公海线索' }].map((v) => (
              <button key={v.id} onClick={() => setViewMode(v.id as any)}
                className={`flex-1 h-6 text-[11px] font-medium rounded-sm transition-all ${viewMode === v.id ? 'bg-white text-[#111827] shadow-sm' : 'text-[#6b7280]'}`}>
                {v.label}
              </button>
            ))}
          </div>

          <div className="relative mb-2">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} className="w-full h-7 pl-7 pr-2 text-[12px] border border-[#e5e7eb] rounded-sm outline-none focus:border-[#2563eb]" placeholder="搜索姓名、公司、电话…" />
          </div>

          <div className="flex gap-1.5">
            <select value={filterUrgency} onChange={(e) => setFilterUrgency(e.target.value)} className="flex-1 h-6 px-1.5 text-[11px] border border-[#e5e7eb] rounded-sm bg-white outline-none">
              <option value="ALL">全部紧迫度</option>
              {LEAD_URGENCY.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
            </select>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="flex-1 h-6 px-1.5 text-[11px] border border-[#e5e7eb] rounded-sm bg-white outline-none">
              <option value="ALL">全部状态</option>
              {LEAD_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </div>

        <div className="px-4 py-1.5 border-b border-[#f3f4f6]">
          <span className="text-[11px] text-[#9ca3af]">共 {filtered.length} 条线索</span>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-[12px] text-[#9ca3af]">暂无线索</div>
          ) : filtered.map((lead) => {
            const urgency = getUrgencyStyle(lead.urgency)
            const status = getStatusStyle(lead.status)
            const isSelected = selectedLead?.id === lead.id
            return (
              <div key={lead.id} onClick={() => handleSelectLead(lead)}
                className={`flex items-start gap-2.5 px-3 py-2.5 border-b border-[#f3f4f6] cursor-pointer hover:bg-[#f9fafb] transition-colors ${isSelected ? 'bg-[#eff6ff] border-l-2 border-l-[#2563eb]' : ''}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[13px] font-medium text-[#111827] truncate">{lead.personName}</span>
                    <span className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-sm text-[10px] font-medium ${urgency.cls}`}>{urgency.icon}{urgency.label}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-[#6b7280]">
                    {lead.company && <span className="truncate max-w-[110px]">{lead.company}</span>}
                    {lead.phone && <span className="font-mono">{lead.phone}</span>}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={`px-1.5 py-0.5 rounded-sm text-[10px] font-medium ${status.color}`}>{status.label}</span>
                    <span className="text-[10px] text-[#d1d5db]">{lead.leadCode}</span>
                    {lead.nextFollowDate && (
                      <span className="flex items-center gap-0.5 text-[10px] text-[#f59e0b]">
                        <Clock size={9} />{formatDate(lead.nextFollowDate)}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight size={14} className="text-[#d1d5db] mt-1 flex-shrink-0" />
              </div>
            )
          })}
        </div>
      </div>

      {/* ── 右侧详情 ── */}
      {!selectedLead ? (
        <div className="flex-1 flex items-center justify-center text-[13px] text-[#9ca3af]">选择左侧线索查看详情</div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* 顶栏 */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#e5e7eb] bg-white">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#dbeafe] flex items-center justify-center text-[#2563eb] font-semibold text-[14px]">
                {selectedLead.personName.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-[15px] font-semibold text-[#111827]">{selectedLead.personName}</h3>
                  <span className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-sm text-[10px] font-medium ${getUrgencyStyle(selectedLead.urgency).cls}`}>
                    {getUrgencyStyle(selectedLead.urgency).icon}{getUrgencyStyle(selectedLead.urgency).label}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded-sm text-[10px] font-medium ${getStatusStyle(selectedLead.status).color}`}>
                    {getStatusStyle(selectedLead.status).label}
                  </span>
                </div>
                <p className="text-[11px] text-[#6b7280]">{selectedLead.leadCode} · {selectedLead.company ?? '无公司'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {viewMode === 'public_pool' ? (
                <button onClick={() => handleClaim(selectedLead)} className="h-7 px-3 rounded-sm bg-[#2563eb] text-[11px] font-medium text-white hover:bg-[#1d4ed8]">认领线索</button>
              ) : (
                <>
                  <select value={selectedLead.status} onChange={(e) => handleStatusChange(selectedLead, e.target.value)}
                    className="h-7 px-2 text-[11px] border border-[#e5e7eb] rounded-sm bg-white outline-none focus:border-[#2563eb]">
                    {LEAD_STATUSES.filter((s) => s.value !== 'DISCARDED').map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                  <button onClick={() => setShowDiscard(selectedLead)}
                    className="h-7 px-2.5 rounded-sm border border-[#e5e7eb] text-[11px] text-[#6b7280] hover:border-red-300 hover:text-red-600 flex items-center gap-1">
                    <Archive size={12} />废弃
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-[#e5e7eb] bg-white px-6">
            {[{ id: 'info', label: '基本信息' }, { id: 'followups', label: `跟进记录${followUps.length > 0 ? ` (${followUps.length})` : ''}` }].map((tab) => (
              <button key={tab.id} onClick={() => handleTabChange(tab.id as any)}
                className={`mr-4 py-2.5 text-[12px] font-medium border-b-2 transition-colors ${detailTab === tab.id ? 'border-[#2563eb] text-[#2563eb]' : 'border-transparent text-[#6b7280] hover:text-[#111827]'}`}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* 内容 */}
          <div className="flex-1 overflow-y-auto">
            {detailTab === 'info' ? (
              <div className="p-6 space-y-6">
                <div>
                  <h4 className="text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wide mb-3">联系方式</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { icon: <User size={13} />, label: '姓名', value: selectedLead.personName },
                      { icon: <Building2 size={13} />, label: '公司', value: selectedLead.company },
                      { icon: <User size={13} />, label: '职位', value: selectedLead.position },
                      { icon: <Phone size={13} />, label: '电话', value: selectedLead.phone },
                      { icon: <Mail size={13} />, label: '邮箱', value: selectedLead.email },
                      { icon: <MessageCircle size={13} />, label: '微信', value: selectedLead.wechat },
                    ].map((item) => (
                      <div key={item.label} className="flex items-start gap-2">
                        <span className="text-[#9ca3af] mt-0.5">{item.icon}</span>
                        <div>
                          <p className="text-[10px] text-[#9ca3af]">{item.label}</p>
                          <p className="text-[12px] text-[#111827]">{item.value || '—'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wide mb-3">线索信息</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: '来源', value: LEAD_SOURCES.find((s) => s.value === selectedLead.source)?.label ?? selectedLead.source },
                      { label: '来源详情', value: selectedLead.sourceDetail },
                      { label: '分类', value: LEAD_CATEGORIES.find((c) => c.value === selectedLead.category)?.label ?? selectedLead.category },
                      { label: '紧迫度', value: getUrgencyStyle(selectedLead.urgency).label },
                      { label: '下次跟进', value: selectedLead.nextFollowDate ? formatDate(selectedLead.nextFollowDate) : '未设置' },
                      { label: '创建时间', value: formatDate(selectedLead.createdAt) },
                    ].map((item) => (
                      <div key={item.label}>
                        <p className="text-[10px] text-[#9ca3af] mb-0.5">{item.label}</p>
                        <p className="text-[12px] text-[#111827]">{item.value || '—'}</p>
                      </div>
                    ))}
                  </div>
                </div>
                {selectedLead.notes && (
                  <div>
                    <h4 className="text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wide mb-2">备注</h4>
                    <p className="text-[12px] text-[#374151] leading-relaxed">{selectedLead.notes}</p>
                  </div>
                )}
                {selectedLead.discardReason && (
                  <div className="p-3 bg-red-50 border border-red-100 rounded-sm">
                    <p className="text-[11px] font-semibold text-red-600 mb-1">废弃原因</p>
                    <p className="text-[12px] text-red-500">{DISCARD_REASONS.find((r) => r.value === selectedLead.discardReason)?.label ?? selectedLead.discardReason}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4">
                <div className="flex justify-end mb-3">
                  <button onClick={() => setShowFollowUp(true)} className="flex items-center gap-1 h-7 px-3 rounded-sm bg-[#2563eb] text-[11px] font-medium text-white hover:bg-[#1d4ed8]"><Plus size={12} />添加跟进</button>
                </div>
                {followUpsLoading ? (
                  Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 bg-[#f3f4f6] rounded animate-pulse mb-2" />)
                ) : followUps.length === 0 ? (
                  <div className="py-8 text-center text-[12px] text-[#9ca3af]">暂无跟进记录</div>
                ) : (
                  <div className="space-y-3">
                    {followUps.map((f) => (
                      <div key={f.id} className="border border-[#e5e7eb] rounded-sm p-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[11px] font-medium text-[#374151] capitalize">{f.followupType}</span>
                          <span className="text-[10px] text-[#9ca3af]">{formatDate(f.createdAt)}</span>
                        </div>
                        <p className="text-[12px] text-[#111827] leading-relaxed">{f.content}</p>
                        {f.nextAction && (
                          <p className="mt-1.5 text-[11px] text-[#6b7280]">
                            下一步：{f.nextAction}{f.nextActionDate ? ` (${formatDate(f.nextActionDate)})` : ''}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 新建线索 Modal ── */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-[480px] bg-white rounded-sm shadow-lg max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#e5e7eb]">
              <h3 className="text-[14px] font-semibold text-[#111827]">新建线索</h3>
              <button onClick={() => setShowCreate(false)} className="text-[#9ca3af] hover:text-[#111827]"><X size={16} /></button>
            </div>
            <div className="p-4 overflow-y-auto space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] text-[#6b7280] mb-1">姓名 *</label>
                  <input value={createForm.personName} onChange={(e) => setCreateForm((f) => ({ ...f, personName: e.target.value }))} className="w-full h-8 px-2 text-[12px] border border-[#e5e7eb] rounded-sm outline-none focus:border-[#2563eb]" placeholder="联系人姓名" />
                </div>
                <div>
                  <label className="block text-[12px] text-[#6b7280] mb-1">公司</label>
                  <input value={createForm.company} onChange={(e) => setCreateForm((f) => ({ ...f, company: e.target.value }))} className="w-full h-8 px-2 text-[12px] border border-[#e5e7eb] rounded-sm outline-none focus:border-[#2563eb]" placeholder="公司名称" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] text-[#6b7280] mb-1">职位</label>
                  <input value={createForm.position} onChange={(e) => setCreateForm((f) => ({ ...f, position: e.target.value }))} className="w-full h-8 px-2 text-[12px] border border-[#e5e7eb] rounded-sm outline-none focus:border-[#2563eb]" placeholder="职位" />
                </div>
                <div>
                  <label className="block text-[12px] text-[#6b7280] mb-1">电话</label>
                  <input value={createForm.phone} onChange={(e) => setCreateForm((f) => ({ ...f, phone: e.target.value }))} className="w-full h-8 px-2 text-[12px] font-mono border border-[#e5e7eb] rounded-sm outline-none focus:border-[#2563eb]" placeholder="+62 xxx" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] text-[#6b7280] mb-1">微信</label>
                  <input value={createForm.wechat} onChange={(e) => setCreateForm((f) => ({ ...f, wechat: e.target.value }))} className="w-full h-8 px-2 text-[12px] border border-[#e5e7eb] rounded-sm outline-none focus:border-[#2563eb]" placeholder="微信号" />
                </div>
                <div>
                  <label className="block text-[12px] text-[#6b7280] mb-1">邮箱</label>
                  <input value={createForm.email} onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))} className="w-full h-8 px-2 text-[12px] border border-[#e5e7eb] rounded-sm outline-none focus:border-[#2563eb]" placeholder="email@example.com" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[12px] text-[#6b7280] mb-1">来源 *</label>
                  <select value={createForm.source} onChange={(e) => setCreateForm((f) => ({ ...f, source: e.target.value }))} className="w-full h-8 px-2 text-[12px] border border-[#e5e7eb] rounded-sm bg-white outline-none focus:border-[#2563eb]">
                    {LEAD_SOURCES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] text-[#6b7280] mb-1">分类 *</label>
                  <select value={createForm.category} onChange={(e) => setCreateForm((f) => ({ ...f, category: e.target.value }))} className="w-full h-8 px-2 text-[12px] border border-[#e5e7eb] rounded-sm bg-white outline-none focus:border-[#2563eb]">
                    {LEAD_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] text-[#6b7280] mb-1">紧迫度 *</label>
                  <select value={createForm.urgency} onChange={(e) => setCreateForm((f) => ({ ...f, urgency: e.target.value }))} className="w-full h-8 px-2 text-[12px] border border-[#e5e7eb] rounded-sm bg-white outline-none focus:border-[#2563eb]">
                    {LEAD_URGENCY.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[12px] text-[#6b7280] mb-1">备注</label>
                <textarea value={createForm.notes} onChange={(e) => setCreateForm((f) => ({ ...f, notes: e.target.value }))} rows={2} className="w-full px-2 py-1.5 text-[12px] border border-[#e5e7eb] rounded-sm outline-none focus:border-[#2563eb] resize-none" placeholder="线索来源描述、初始意向等" />
              </div>
            </div>
            <div className="flex justify-end gap-2 px-4 py-3 border-t border-[#e5e7eb]">
              <button onClick={() => setShowCreate(false)} className="h-8 px-3 text-[12px] text-[#6b7280] hover:text-[#111827]">取消</button>
              <button onClick={handleCreate} disabled={!createForm.personName.trim() || creating} className="h-8 px-4 rounded-sm bg-[#2563eb] text-[12px] font-medium text-white hover:bg-[#1d4ed8] disabled:bg-[#d1d5db] disabled:cursor-not-allowed">{creating ? '创建中...' : '创建线索'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── 废弃线索 Modal ── */}
      {showDiscard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-[360px] bg-white rounded-sm shadow-lg">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#e5e7eb]">
              <h3 className="text-[14px] font-semibold text-[#111827]">废弃线索</h3>
              <button onClick={() => setShowDiscard(null)} className="text-[#9ca3af] hover:text-[#111827]"><X size={16} /></button>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-[12px] text-[#6b7280]">废弃后该线索将进入公海，可被其他成员认领。</p>
              <div>
                <label className="block text-[12px] text-[#6b7280] mb-1">废弃原因 *</label>
                <select value={discardReason} onChange={(e) => setDiscardReason(e.target.value)} className="w-full h-8 px-2 text-[12px] border border-[#e5e7eb] rounded-sm bg-white outline-none focus:border-[#2563eb]">
                  {DISCARD_REASONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 px-4 py-3 border-t border-[#e5e7eb]">
              <button onClick={() => setShowDiscard(null)} className="h-8 px-3 text-[12px] text-[#6b7280] hover:text-[#111827]">取消</button>
              <button onClick={handleDiscard} disabled={discarding} className="h-8 px-4 rounded-sm bg-red-600 text-[12px] font-medium text-white hover:bg-red-700 disabled:opacity-50">{discarding ? '废弃中...' : '确认废弃'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── 添加跟进 Modal ── */}
      {showFollowUp && selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-[420px] bg-white rounded-sm shadow-lg">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#e5e7eb]">
              <h3 className="text-[14px] font-semibold text-[#111827]">添加跟进记录</h3>
              <button onClick={() => setShowFollowUp(false)} className="text-[#9ca3af] hover:text-[#111827]"><X size={16} /></button>
            </div>
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] text-[#6b7280] mb-1">跟进方式</label>
                  <select value={followUpForm.followupType} onChange={(e) => setFollowUpForm((f) => ({ ...f, followupType: e.target.value }))} className="w-full h-8 px-2 text-[12px] border border-[#e5e7eb] rounded-sm bg-white outline-none focus:border-[#2563eb]">
                    {[['general','一般'],['call','电话'],['visit','拜访'],['meeting','会议'],['email','邮件'],['proposal','报价']].map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] text-[#6b7280] mb-1">下次跟进日期</label>
                  <input type="date" value={followUpForm.nextActionDate} onChange={(e) => setFollowUpForm((f) => ({ ...f, nextActionDate: e.target.value }))} className="w-full h-8 px-2 text-[12px] border border-[#e5e7eb] rounded-sm outline-none focus:border-[#2563eb]" />
                </div>
              </div>
              <div>
                <label className="block text-[12px] text-[#6b7280] mb-1">跟进内容 *</label>
                <textarea value={followUpForm.content} onChange={(e) => setFollowUpForm((f) => ({ ...f, content: e.target.value }))} rows={3} className="w-full px-2 py-1.5 text-[12px] border border-[#e5e7eb] rounded-sm outline-none focus:border-[#2563eb] resize-none" placeholder="描述本次跟进情况…" />
              </div>
              <div>
                <label className="block text-[12px] text-[#6b7280] mb-1">下一步行动</label>
                <input value={followUpForm.nextAction} onChange={(e) => setFollowUpForm((f) => ({ ...f, nextAction: e.target.value }))} className="w-full h-8 px-2 text-[12px] border border-[#e5e7eb] rounded-sm outline-none focus:border-[#2563eb]" placeholder="例如：发送报价单" />
              </div>
            </div>
            <div className="flex justify-end gap-2 px-4 py-3 border-t border-[#e5e7eb]">
              <button onClick={() => setShowFollowUp(false)} className="h-8 px-3 text-[12px] text-[#6b7280] hover:text-[#111827]">取消</button>
              <button onClick={handleAddFollowUp} disabled={!followUpForm.content.trim() || addingFollowUp} className="h-8 px-4 rounded-sm bg-[#2563eb] text-[12px] font-medium text-white hover:bg-[#1d4ed8] disabled:bg-[#d1d5db] disabled:cursor-not-allowed">{addingFollowUp ? '保存中...' : '保存'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
