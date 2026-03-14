'use client'

import { useState, useMemo } from 'react'
import { Search, Plus, Edit2, Archive, Trash2, ChevronRight, Lock, Users, Building2, Globe, ExternalLink, X, Paperclip, FileText, Image as ImageIcon } from 'lucide-react'
import type { Opportunity, ActionLog, ChinaEntity } from '@/lib/types'
import { ChinaEntitySearchDialog } from './china-entity-search-dialog'

import { CUSTOMER_LEVELS } from '@/lib/types'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'

interface CustomerRecord {
  id: string
  customerId: string
  customerName: string
  level: string
  industry: string
  contactName: string
  phone: string
  email: string
  assignee: string
  lastInteraction: string
  activeOpportunitiesCount: number
  opportunitiesByStage: Record<string, number>
  isLocked?: boolean
}

interface CustomerManagementProps {
  opportunities: Opportunity[]
  actionLogs?: Record<string, ActionLog[]>
  onCustomerCreate?: (customerData: any) => void
  onCustomerUpdate?: (customerId: string, data: any) => void
  onSelectCustomer?: (customerId: string) => void
}

const levelColors: Record<string, string> = {
  L2: 'bg-blue-900 text-white',
  L3: 'bg-blue-700 text-white',
  L4: 'bg-blue-500 text-white',
  L5: 'bg-blue-100 text-blue-700',
  L6: 'bg-slate-100 text-slate-600',
}

export function CustomerManagement({ opportunities, actionLogs = {}, onCustomerCreate, onCustomerUpdate, onSelectCustomer }: CustomerManagementProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null)
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRecord | null>(null)
  const [activeTab, setActiveTab] = useState<'opportunities' | 'followups' | 'contacts' | 'companies'>('opportunities')
  const [chinaEntityDialogOpen, setChinaEntityDialogOpen] = useState(false)
  const [chinaEntities, setChinaEntities] = useState<any[]>([])
  const [foreignEntities, setForeignEntities] = useState<any[]>([])
  const [foreignFormOpen, setForeignFormOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [archivedIds, setArchivedIds] = useState<Set<string>>(new Set())

  // 联系人管理
  const [contacts, setContacts] = useState<{ id: string; name: string; title: string; phone: string; email: string; wechat: string }[]>([])
  const [addContactOpen, setAddContactOpen] = useState(false)
  const [newContact, setNewContact] = useState({ name: '', title: '', phone: '', email: '', wechat: '' })

  // 跟进记录
  const [localFollowups, setLocalFollowups] = useState<{ id: string; operatorName: string; remark: string; timestamp: string; files?: { name: string; url: string; type: string }[] }[]>([])
  const [newFollowup, setNewFollowup] = useState('')
  const [newFollowupFiles, setNewFollowupFiles] = useState<File[]>([])
  const [newCustomerForm, setNewCustomerForm] = useState({
    customerName: '',
    passportNo: '',
    contactName: '',
    phone: '',
    email: '',
    wechat: '',
    level: 'L5',
    industry: '',
  })

  const customers = useMemo(() => {
    const customerMap = new Map<string, CustomerRecord>()
    opportunities.forEach((opp) => {
      if (!customerMap.has(opp.customerId)) {
        customerMap.set(opp.customerId, {
          id: opp.id,
          customerId: opp.customerId,
          customerName: opp.customer.name,
          level: 'L5',
          industry: '科技/互联网',
          contactName: opp.customer.name.split('-')[0] ?? '',
          phone: opp.customer.phone,
          email: opp.customer.email || '',
          assignee: opp.assignee || '系统管理员',
          lastInteraction: new Date(opp.updatedAt).toLocaleString('zh-CN'),
          activeOpportunitiesCount: 0,
          opportunitiesByStage: {},
          isLocked: false,
        })
      }
      const rec = customerMap.get(opp.customerId)!
      rec.activeOpportunitiesCount++
      rec.opportunitiesByStage[opp.stageId] = (rec.opportunitiesByStage[opp.stageId] ?? 0) + 1
    })
    return Array.from(customerMap.values()).sort(
      (a, b) => new Date(b.lastInteraction).getTime() - new Date(a.lastInteraction).getTime()
    )
  }, [opportunities])

  const filtered = useMemo(() => {
    return customers.filter((c) => {
      if (archivedIds.has(c.customerId)) return false
      const matchesQuery =
        !searchQuery ||
        c.customerId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.customerName.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesLevel = !selectedLevel || c.level === selectedLevel
      return matchesQuery && matchesLevel
    })
  }, [customers, searchQuery, selectedLevel, archivedIds])

  const levelStats = useMemo(() => {
    const stats: Record<string, number> = {}
    CUSTOMER_LEVELS.forEach((l) => { stats[l.id] = 0 })
    customers.forEach((c) => { stats[c.level] = (stats[c.level] ?? 0) + 1 })
    return stats
  }, [customers])

  const customersByLevel = useMemo(() => {
    const grouped: Record<string, CustomerRecord[]> = {}
    CUSTOMER_LEVELS.forEach((l) => { grouped[l.id] = [] })
    filtered.forEach((c) => {
      if (grouped[c.level]) grouped[c.level].push(c)
    })
    return grouped
  }, [filtered])

  const getLevelLabel = (levelId: string) => CUSTOMER_LEVELS.find((l) => l.id === levelId)?.zh ?? levelId

  const customerOpportunities = useMemo(() => {
    if (!selectedCustomer) return []
    return opportunities.filter((o) => o.customerId === selectedCustomer.customerId)
  }, [selectedCustomer, opportunities])

  const customerFollowups = useMemo(() => {
    if (!selectedCustomer) return []
    const logs: ActionLog[] = []
    customerOpportunities.forEach((opp) => {
      const oppLogs = actionLogs[opp.id] || []
      logs.push(...oppLogs)
    })
    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }, [selectedCustomer, customerOpportunities, actionLogs])

  return (
    <div className="flex h-full bg-white">
      {/* 二级导航栏 (Secondary Sidebar) - 280px */}
      <div className="w-[280px] shrink-0 flex flex-col border-r border-[#e5e7eb]">
        {/* 搜索框 */}
        <div className="p-3 border-b border-[#e5e7eb]">
          <div className="relative">
            <Search size={13} className="absolute left-2 top-[9px] text-[#9ca3af]" />
            <input
              type="text"
              placeholder="搜索商机ID或客户名..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 w-full rounded-sm border border-[#e5e7eb] bg-white pl-7 pr-2 text-[12px] text-[#111827] placeholder-[#9ca3af] outline-none focus:border-[#2563eb]"
            />
          </div>
        </div>

        {/* 等级 Tab */}
        <div className="flex border-b border-[#e5e7eb] bg-[#f9fafb]">
          <button
            onClick={() => setSelectedLevel(null)}
            className={`flex-1 h-8 text-[11px] font-medium transition-colors ${
              selectedLevel === null ? 'bg-white text-[#2563eb] border-b-2 border-[#2563eb]' : 'text-[#6b7280] hover:text-[#111827]'
            }`}
          >
            全部
          </button>
          {CUSTOMER_LEVELS.map((lvl) => (
            <button
              key={lvl.id}
              onClick={() => setSelectedLevel(selectedLevel === lvl.id ? null : lvl.id)}
              className={`flex-1 h-8 text-[11px] font-medium transition-colors ${
                selectedLevel === lvl.id ? 'bg-white text-[#2563eb] border-b-2 border-[#2563eb]' : 'text-[#6b7280] hover:text-[#111827]'
              }`}
            >
              {lvl.id}
            </button>
          ))}
        </div>

        {/* 客户列表 - 按等级分组 */}
        <div className="scrollable-container high-density-list flex-1 overflow-y-auto">
          {CUSTOMER_LEVELS.filter((l) => !selectedLevel || l.id === selectedLevel).map((level) => {
            const levelCustomers = customersByLevel[level.id] || []
            if (levelCustomers.length === 0) return null
            return (
              <div key={level.id}>
                <div className="sticky top-0 bg-[#f9fafb] px-3 py-1.5 text-[11px] font-semibold text-[#6b7280] border-b border-[#e5e7eb] flex items-center justify-between">
                  <span>{level.id} · {level.zh}</span>
                  <span className="text-[10px] bg-[#e5e7eb] px-1.5 py-0.5 rounded-sm">{levelCustomers.length}</span>
                </div>
                {levelCustomers.map((customer) => (
                  <div
                    key={customer.customerId}
                    className="list-item"
                    onClick={() => setSelectedCustomer(customer)}
                  >
                    <div
                      className={`px-3 py-2 border-b border-[#f3f4f6] cursor-pointer hover:bg-[#f9fafb] ${
                        selectedCustomer?.customerId === customer.customerId ? 'bg-[#eff6ff]' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[12px] text-[#2563eb]">{customer.customerId}</span>
                        {customer.isLocked && <Lock size={10} className="text-[#9ca3af]" />}
                      </div>
                      <div className="text-[12px] font-medium text-[#111827] truncate">{customer.customerName}</div>
                    </div>
                  </div>
                ))}
              </div>
            )
          })}
        </div>

        {/* 新增客户按钮 */}
        <div className="p-3 border-t border-[#e5e7eb]">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="w-full flex items-center justify-center gap-1.5 h-8 rounded-sm bg-[#2563eb] text-[12px] font-medium text-white hover:bg-[#1d4ed8]"
          >
            <Plus size={13} />
            新增客户
          </button>
        </div>
      </div>

      {/* 主作业区 (Main Workspace) */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 统计条 (Stats Bar) */}
        <div className="h-10 border-b border-[#e5e7eb] bg-[#f9fafb] px-4 flex items-center gap-4">
          <div className="flex items-center gap-1 text-[11px] text-[#6b7280]">
            <Users size={12} />
            <span>共 {customers.length} 个客户</span>
          </div>
          <div className="h-4 w-px bg-[#e5e7eb]" />
          {CUSTOMER_LEVELS.map((lvl) => (
            <div key={lvl.id} className="flex items-center gap-1">
              <span className={`px-1.5 py-0.5 rounded-sm text-[10px] font-semibold ${levelColors[lvl.id]}`}>{lvl.id}</span>
              <span className="text-[11px] font-mono text-[#6b7280]">{levelStats[lvl.id]}</span>
            </div>
          ))}
        </div>

        {/* 主内容区 */}
        {selectedCustomer ? (
          /* 客户档案模式 */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* 档案头部 */}
            <div className="px-5 py-4 border-b border-[#e5e7eb] bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedCustomer(null)}
                    className="text-[12px] text-[#6b7280] hover:text-[#2563eb]"
                  >
                    返回列表
                  </button>
                  <ChevronRight size={12} className="text-[#9ca3af]" />
                  <span className="font-mono text-[13px] text-[#2563eb]">{selectedCustomer.customerId}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button className="h-7 px-2 rounded-sm border border-[#e5e7eb] text-[11px] text-[#6b7280] hover:bg-[#f9fafb]">
                    <Edit2 size={12} />
                  </button>
                  <button className="h-7 px-2 rounded-sm border border-[#e5e7eb] text-[11px] text-[#6b7280] hover:bg-[#f9fafb]">
                    <Archive size={12} />
                  </button>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <h2 className="text-[16px] font-semibold text-[#111827]">{selectedCustomer.customerName}</h2>
                <span className={`px-2 py-0.5 rounded-sm text-[11px] font-semibold ${levelColors[selectedCustomer.level]}`}>
                  {selectedCustomer.level} · {getLevelLabel(selectedCustomer.level)}
                </span>
                {selectedCustomer.isLocked && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-sm bg-amber-100 text-amber-700 text-[11px]">
                    <Lock size={10} /> 已锁定
                  </span>
                )}
              </div>
              <div className="mt-2 flex items-center gap-4 text-[12px] text-[#6b7280]">
                <span>行业：{selectedCustomer.industry}</span>
                <span>负责人：{selectedCustomer.assignee}</span>
                <span>电话：{selectedCustomer.phone || '-'}</span>
              </div>
            </div>

            {/* Tab 切换 */}
            <div className="h-10 border-b border-[#e5e7eb] flex">
              {[
                { id: 'opportunities', label: '关联商机', count: customerOpportunities.length },
                { id: 'followups', label: '跟进记录', count: customerFollowups.length },
                { id: 'contacts', label: '联系人', count: 1 },
                { id: 'companies', label: '关联企业', count: chinaEntities.length + foreignEntities.length },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 h-full text-[12px] font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'text-[#2563eb] border-[#2563eb]'
                      : 'text-[#6b7280] border-transparent hover:text-[#111827]'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>

            {/* Tab 内容 */}
            <div className="flex-1 overflow-y-auto">
              {activeTab === 'opportunities' && (
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="border-b border-[#e5e7eb] bg-[#f9fafb] text-[11px] text-[#6b7280]">
                      <th className="px-4 py-2 text-left font-semibold">商机编号</th>
                      <th className="px-4 py-2 text-left font-semibold">产品名</th>
                      <th className="px-4 py-2 text-left font-semibold">阶段</th>
                      <th className="px-4 py-2 text-left font-semibold">金额</th>
                      <th className="px-4 py-2 text-left font-semibold">状态</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f3f4f6]">
                    {customerOpportunities.map((opp) => (
                      <tr key={opp.id} className="hover:bg-[#f9fafb]">
                        <td className="px-4 py-2 font-mono text-[#2563eb]">{opp.id}</td>
                        <td className="px-4 py-2 text-[#111827]">{opp.serviceTypeLabel}</td>
                        <td className="px-4 py-2">
                          <span className="px-1.5 py-0.5 rounded-sm bg-blue-100 text-blue-700 text-[11px] font-semibold">
                            {opp.stageId}
                          </span>
                        </td>
                        <td className="px-4 py-2 font-mono text-[#111827]">
                          {opp.currency} {opp.estimatedAmount.toLocaleString()}
                        </td>
                        <td className="px-4 py-2">
                          <span className={`px-1.5 py-0.5 rounded-sm text-[11px] font-semibold ${
                            opp.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {opp.status === 'active' ? '进行中' : opp.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {activeTab === 'followups' && (
                <div className="flex flex-col h-full">
                  {/* 新增跟进记录输入框 */}
                  <div className="p-4 border-b border-[#e5e7eb] bg-[#fafbfc]">
                    <div className="space-y-2">
                      <textarea
                        value={newFollowup}
                        onChange={(e) => setNewFollowup(e.target.value)}
                        placeholder="记录本次跟进内容，如：客户态度积极，计划下周签合同..."
                        rows={3}
                        className="w-full resize-none rounded-sm border border-[#e5e7eb] bg-white p-2 text-[12px] placeholder-[#9ca3af] outline-none focus:border-[#2563eb]"
                      />
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <label className="flex h-7 cursor-pointer items-center gap-1 rounded-sm border border-[#e5e7eb] bg-white px-2 text-[11px] text-[#6b7280] hover:border-[#2563eb] hover:text-[#2563eb]">
                            <Paperclip size={12} />
                            上传附件
                            <input
                              type="file"
                              multiple
                              className="hidden"
                              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                              onChange={(e) => {
                                if (e.target.files) {
                                  setNewFollowupFiles(prev => [...prev, ...Array.from(e.target.files!)])
                                }
                              }}
                            />
                          </label>
                          {newFollowupFiles.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1">
                              {newFollowupFiles.map((file, idx) => (
                                <span key={idx} className="flex items-center gap-1 rounded-sm bg-[#eff6ff] px-1.5 py-0.5 text-[10px] text-[#2563eb]">
                                  {file.type.startsWith('image/') ? <ImageIcon size={10} /> : <FileText size={10} />}
                                  {file.name.length > 15 ? file.name.slice(0, 12) + '...' : file.name}
                                  <button
                                    onClick={() => setNewFollowupFiles(prev => prev.filter((_, i) => i !== idx))}
                                    className="hover:text-[#dc2626]"
                                  >
                                    <X size={10} />
                                  </button>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            if (!newFollowup.trim() && newFollowupFiles.length === 0) return
                            const files = newFollowupFiles.map(f => ({
                              name: f.name,
                              url: URL.createObjectURL(f),
                              type: f.type,
                            }))
                            setLocalFollowups(prev => [{
                              id: `fu-${Date.now()}`,
                              operatorName: '系统管理员',
                              remark: newFollowup.trim(),
                              timestamp: new Date().toISOString(),
                              files: files.length > 0 ? files : undefined,
                            }, ...prev])
                            setNewFollowup('')
                            setNewFollowupFiles([])
                          }}
                          disabled={!newFollowup.trim() && newFollowupFiles.length === 0}
                          className="h-7 px-3 rounded-sm bg-[#2563eb] text-[11px] font-medium text-white hover:bg-[#1d4ed8] disabled:bg-[#d1d5db] disabled:cursor-not-allowed"
                        >
                          添加记录
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 垂直时间轴 */}
                  <div className="flex-1 overflow-y-auto px-4 py-4">
                    {[...localFollowups, ...customerFollowups].length === 0 ? (
                      <div className="py-12 text-center text-[12px] text-[#9ca3af]">暂无跟进记录，在上方输入框添加第一条</div>
                    ) : (
                      <div className="relative pl-6">
                        {/* 时间轴竖线 */}
                        <div className="absolute left-[7px] top-2 bottom-2 w-px bg-[#e5e7eb]" />

                        {[...localFollowups, ...customerFollowups].map((log, idx) => {
                          const logFiles = (log as any).files as { name: string; url: string; type: string }[] | undefined
                          return (
                            <div key={log.id} className="relative pb-6 last:pb-0">
                              {/* 时间轴圆点 */}
                              <div className="absolute left-[-20px] top-1 w-3 h-3 rounded-full bg-[#2563eb] border-2 border-white shadow-sm" />

                              {/* 时间标签 */}
                              <div className="mb-1 font-mono text-[10px] text-[#9ca3af]">
                                {new Date(log.timestamp).toLocaleString('zh-CN', {
                                  month: '2-digit',
                                  day: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </div>

                              {/* 内容卡片 */}
                              <div className="rounded-sm border border-[#e5e7eb] bg-white p-3 hover:shadow-sm transition-shadow">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-[12px] font-semibold text-[#111827]">{log.operatorName}</span>
                                  {idx === 0 && (
                                    <span className="px-1 py-0.5 rounded-sm bg-[#dcfce7] text-[#16a34a] text-[9px] font-semibold">最新</span>
                                  )}
                                </div>
                                {log.remark && (
                                  <p className="text-[12px] text-[#374151] leading-relaxed whitespace-pre-wrap">{log.remark}</p>
                                )}
                                {!log.remark && (log as any).actionLabel && (
                                  <p className="text-[12px] text-[#6b7280]">{(log as any).actionLabel}</p>
                                )}

                                {/* 附件展示 */}
                                {logFiles && logFiles.length > 0 && (
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    {logFiles.map((file, fidx) => (
                                      <a
                                        key={fidx}
                                        href={file.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 rounded-sm border border-[#e5e7eb] bg-[#f9fafb] px-2 py-1 text-[11px] text-[#6b7280] hover:border-[#2563eb] hover:text-[#2563eb]"
                                      >
                                        {file.type.startsWith('image/') ? (
                                          <ImageIcon size={12} />
                                        ) : (
                                          <FileText size={12} />
                                        )}
                                        {file.name.length > 20 ? file.name.slice(0, 17) + '...' : file.name}
                                      </a>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'contacts' && (
                <div className="p-4 space-y-3">
                  {/* 新增联系人按钮 */}
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-medium text-[#6b7280]">
                      共 {contacts.length + 1} 位联系人
                    </span>
                    <button
                      onClick={() => setAddContactOpen(true)}
                      className="flex h-7 items-center gap-1 rounded-sm bg-[#2563eb] px-2 text-[11px] font-medium text-white hover:bg-[#1d4ed8]"
                    >
                      <Plus size={12} />
                      新增联系人
                    </button>
                  </div>

                  {/* 默认联系人（来自客户数据） */}
                  <div className="p-4 border border-[#e5e7eb] rounded-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#eff6ff] flex items-center justify-center text-[#2563eb] text-[13px] font-semibold">
                          {selectedCustomer.contactName.charAt(0)}
                        </div>
                        <div>
                          <div className="text-[13px] font-semibold text-[#111827]">{selectedCustomer.contactName}</div>
                          <div className="text-[11px] text-[#9ca3af]">主联系人 · 经理</div>
                        </div>
                      </div>
                      <span className="px-1.5 py-0.5 rounded-sm bg-[#eff6ff] text-[#2563eb] text-[10px] font-semibold">主要</span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-[12px]">
                      <div className="flex items-center gap-2">
                        <span className="text-[#9ca3af] shrink-0">电话</span>
                        <span className="font-mono text-[#111827]">{selectedCustomer.phone || '-'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[#9ca3af] shrink-0">邮箱</span>
                        <span className="text-[#111827] truncate">{selectedCustomer.email || '-'}</span>
                      </div>
                    </div>
                  </div>

                  {/* 手动新增的联系人 */}
                  {contacts.map((contact) => (
                    <div key={contact.id} className="p-4 border border-[#e5e7eb] rounded-sm group">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#f3f4f6] flex items-center justify-center text-[#374151] text-[13px] font-semibold">
                            {contact.name.charAt(0)}
                          </div>
                          <div>
                            <div className="text-[13px] font-semibold text-[#111827]">{contact.name}</div>
                            {contact.title && <div className="text-[11px] text-[#9ca3af]">{contact.title}</div>}
                          </div>
                        </div>
                        <button
                          onClick={() => setContacts(prev => prev.filter(c => c.id !== contact.id))}
                          className="opacity-0 group-hover:opacity-100 h-6 w-6 flex items-center justify-center rounded-sm text-[#9ca3af] hover:bg-[#fee2e2] hover:text-[#dc2626] transition-opacity"
                        >
                          <X size={12} />
                        </button>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-[12px]">
                        {contact.phone && (
                          <div className="flex items-center gap-2">
                            <span className="text-[#9ca3af] shrink-0">电话</span>
                            <span className="font-mono text-[#111827]">{contact.phone}</span>
                          </div>
                        )}
                        {contact.email && (
                          <div className="flex items-center gap-2">
                            <span className="text-[#9ca3af] shrink-0">邮箱</span>
                            <span className="text-[#111827] truncate">{contact.email}</span>
                          </div>
                        )}
                        {contact.wechat && (
                          <div className="flex items-center gap-2">
                            <span className="text-[#9ca3af] shrink-0">微信</span>
                            <span className="text-[#111827]">{contact.wechat}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* 新增联系人内联表单 */}
                  {addContactOpen && (
                    <div className="p-4 border-2 border-[#2563eb] border-dashed rounded-sm bg-[#f8faff] space-y-3">
                      <p className="text-[12px] font-semibold text-[#2563eb]">新增联系人</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[11px] text-[#6b7280]">姓名 *</label>
                          <input
                            type="text"
                            value={newContact.name}
                            onChange={(e) => setNewContact(p => ({ ...p, name: e.target.value }))}
                            placeholder="联系人姓名"
                            className="mt-1 h-8 w-full rounded-sm border border-[#e5e7eb] bg-white px-2 text-[12px] outline-none focus:border-[#2563eb]"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-[#6b7280]">职位</label>
                          <input
                            type="text"
                            value={newContact.title}
                            onChange={(e) => setNewContact(p => ({ ...p, title: e.target.value }))}
                            placeholder="如：总经理"
                            className="mt-1 h-8 w-full rounded-sm border border-[#e5e7eb] bg-white px-2 text-[12px] outline-none focus:border-[#2563eb]"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-[#6b7280]">电话</label>
                          <input
                            type="text"
                            value={newContact.phone}
                            onChange={(e) => setNewContact(p => ({ ...p, phone: e.target.value }))}
                            placeholder="+62 812-3456-7890"
                            className="mt-1 h-8 w-full rounded-sm border border-[#e5e7eb] bg-white px-2 font-mono text-[12px] outline-none focus:border-[#2563eb]"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-[#6b7280]">邮箱</label>
                          <input
                            type="email"
                            value={newContact.email}
                            onChange={(e) => setNewContact(p => ({ ...p, email: e.target.value }))}
                            placeholder="email@example.com"
                            className="mt-1 h-8 w-full rounded-sm border border-[#e5e7eb] bg-white px-2 text-[12px] outline-none focus:border-[#2563eb]"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-[#6b7280]">微信号</label>
                          <input
                            type="text"
                            value={newContact.wechat}
                            onChange={(e) => setNewContact(p => ({ ...p, wechat: e.target.value }))}
                            placeholder="微信号"
                            className="mt-1 h-8 w-full rounded-sm border border-[#e5e7eb] bg-white px-2 text-[12px] outline-none focus:border-[#2563eb]"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setAddContactOpen(false); setNewContact({ name: '', title: '', phone: '', email: '', wechat: '' }) }}
                          className="flex-1 h-8 rounded-sm border border-[#e5e7eb] text-[12px] font-medium text-[#374151] hover:bg-white"
                        >
                          取消
                        </button>
                        <button
                          onClick={() => {
                            if (!newContact.name.trim()) return
                            setContacts(prev => [...prev, { id: `c-${Date.now()}`, ...newContact }])
                            setAddContactOpen(false)
                            setNewContact({ name: '', title: '', phone: '', email: '', wechat: '' })
                          }}
                          disabled={!newContact.name.trim()}
                          className="flex-1 h-8 rounded-sm bg-[#2563eb] text-[12px] font-medium text-white hover:bg-[#1d4ed8] disabled:bg-[#d1d5db] disabled:cursor-not-allowed"
                        >
                          保存联系人
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'companies' && (
                <div className="p-4 space-y-6">
                  {/* 中国境内企业 */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Building2 size={14} className="text-[#128BED]" />
                        <span className="text-[13px] font-semibold text-[#111827]">中国境内企业</span>
                        <span className="font-mono text-[11px] text-[#9ca3af]">via 天眼查</span>
                      </div>
                      <button
                        onClick={() => setChinaEntityDialogOpen(true)}
                        className="flex h-7 items-center gap-1 rounded-sm border border-[#128BED] bg-[#f0f9ff] px-2 text-[11px] font-medium text-[#128BED] hover:bg-[#e0f2fe]"
                      >
                        <Plus size={12} />
                        搜索关联
                      </button>
                    </div>
                    {chinaEntities.length === 0 ? (
                      <div
                        onClick={() => setChinaEntityDialogOpen(true)}
                        className="flex cursor-pointer flex-col items-center justify-center rounded-sm border border-dashed border-[#d1d5db] bg-[#fafbfc] py-8 text-center hover:border-[#128BED] hover:bg-[#f0f9ff] transition-colors"
                      >
                        <Building2 size={20} className="mb-2 text-[#9ca3af]" />
                        <p className="text-[12px] text-[#6b7280]">点击从天眼查搜索并关联</p>
                        <p className="mt-1 text-[11px] text-[#9ca3af]">可关联多个国内主体</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {chinaEntities.map((entity: ChinaEntity) => (
                          <div key={entity.id} className="rounded-sm border border-[#e5e7eb] border-l-4 border-l-[#128BED]">
                            <div className="px-4 py-3">
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="text-[13px] font-semibold text-[#111827]">{entity.companyName}</p>
                                  <p className="mt-0.5 font-mono text-[11px] text-[#6b7280]">{entity.creditCode}</p>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className={`px-1.5 py-0.5 rounded-sm text-[10px] font-semibold ${
                                    entity.status === '存续' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                  }`}>{entity.status}</span>
                                  <a
                                    href={`https://www.tianyancha.com/search?key=${entity.creditCode}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="h-6 w-6 flex items-center justify-center rounded-sm text-[#9ca3af] hover:bg-[#f3f4f6]"
                                  >
                                    <ExternalLink size={12} />
                                  </a>
                                  <button
                                    onClick={() => setChinaEntities(prev => prev.filter(e => e.id !== entity.id))}
                                    className="h-6 w-6 flex items-center justify-center rounded-sm text-[#9ca3af] hover:bg-[#fee2e2] hover:text-[#dc2626]"
                                  >
                                    <X size={12} />
                                  </button>
                                </div>
                              </div>
                              <div className="mt-2 grid grid-cols-3 gap-2 text-[11px]">
                                <div>
                                  <span className="text-[#9ca3af]">法定代表人</span>
                                  <p className="font-medium text-[#374151]">{entity.legalPerson}</p>
                                </div>
                                <div>
                                  <span className="text-[#9ca3af]">注册资本</span>
                                  <p className="font-mono font-medium text-[#374151]">{entity.regCapital}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="border-t border-[#e5e7eb]" />

                  {/* 其他国家企业 */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Globe size={14} className="text-[#6b7280]" />
                        <span className="text-[13px] font-semibold text-[#111827]">其他国家企业</span>
                        <span className="text-[11px] text-[#9ca3af]">手动录入</span>
                      </div>
                      <button
                        onClick={() => setForeignFormOpen(true)}
                        className="flex h-7 items-center gap-1 rounded-sm border border-[#e5e7eb] bg-white px-2 text-[11px] font-medium text-[#374151] hover:bg-[#f9fafb]"
                      >
                        <Plus size={12} />
                        添加企业
                      </button>
                    </div>
                    {foreignEntities.length === 0 ? (
                      <div
                        onClick={() => setForeignFormOpen(true)}
                        className="flex cursor-pointer flex-col items-center justify-center rounded-sm border border-dashed border-[#d1d5db] bg-[#fafbfc] py-8 text-center hover:border-[#9ca3af] hover:bg-[#f9fafb] transition-colors"
                      >
                        <Globe size={20} className="mb-2 text-[#9ca3af]" />
                        <p className="text-[12px] text-[#6b7280]">手动录入印尼、新加坡等海外企业信息</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {foreignEntities.map((entity: any) => (
                          <div key={entity.id} className="rounded-sm border border-[#e5e7eb] px-4 py-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="text-[13px] font-semibold text-[#111827]">{entity.companyName}</p>
                                <p className="mt-0.5 text-[11px] text-[#6b7280]">{entity.country}</p>
                              </div>
                              <button
                                onClick={() => setForeignEntities(prev => prev.filter(e => e.id !== entity.id))}
                                className="h-6 w-6 flex items-center justify-center rounded-sm text-[#9ca3af] hover:bg-[#fee2e2] hover:text-[#dc2626]"
                              >
                                <X size={12} />
                              </button>
                            </div>
                            {entity.registrationNumber && (
                              <p className="mt-1 font-mono text-[11px] text-[#6b7280]">{entity.registrationNumber}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* 客户列表模式 */
          <div className="flex-1 overflow-auto">
            <table className="w-full border-collapse text-[12px]">
              <thead>
                <tr className="border-b border-[#e5e7eb] bg-[#f9fafb] text-[11px] font-semibold text-[#6b7280]">
                  <th className="px-4 py-2 text-left">客户代码</th>
                  <th className="px-4 py-2 text-left">客户名</th>
                  <th className="px-4 py-2 text-left">等级</th>
                  <th className="px-4 py-2 text-left">行业</th>
                  <th className="px-4 py-2 text-left">负责人</th>
                  <th className="px-4 py-2 text-left">活跃商机</th>
                  <th className="px-4 py-2 text-left">最近互动</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f3f4f6]">
                {filtered.map((customer) => (
                  <tr
                    key={customer.customerId}
                    onClick={() => setSelectedCustomer(customer)}
                    className="cursor-pointer hover:bg-[#f9fafb]"
                  >
                    <td className="px-4 py-2 font-mono text-[#2563eb]">{customer.customerId}</td>
                    <td className="px-4 py-2 font-medium text-[#111827]">{customer.customerName}</td>
                    <td className="px-4 py-2">
                      <span className={`px-1.5 py-0.5 rounded-sm text-[10px] font-semibold ${levelColors[customer.level]}`}>
                        {customer.level}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-[#6b7280]">{customer.industry}</td>
                    <td className="px-4 py-2 text-[#6b7280]">{customer.assignee}</td>
                    <td className="px-4 py-2">
                      <span className="px-1.5 py-0.5 rounded-sm bg-[#eff6ff] text-[#2563eb] text-[11px] font-semibold">
                        {customer.activeOpportunitiesCount}
                      </span>
                    </td>
                    <td className="px-4 py-2 font-mono text-[11px] text-[#9ca3af]">{customer.lastInteraction}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="py-12 text-center text-[12px] text-[#9ca3af]">无匹配客户</div>
            )}
          </div>
        )}
      </div>

      {/* 新增客户 Modal */}
      <Sheet open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <SheetContent side="right" className="w-[420px] overflow-y-auto" aria-describedby={undefined}>
          <SheetHeader>
            <SheetTitle className="text-[14px] font-semibold">新增客户</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-3">
            <div>
              <label className="text-[12px] font-medium text-[#6b7280]">客户名 *</label>
              <input
                type="text"
                value={newCustomerForm.customerName}
                onChange={(e) => setNewCustomerForm((p) => ({ ...p, customerName: e.target.value }))}
                placeholder="客户名"
                className="mt-1 h-8 w-full rounded-sm border border-[#e5e7eb] bg-white px-2 text-[12px] placeholder-[#9ca3af] outline-none focus:border-[#2563eb]"
              />
            </div>
            <div>
              <label className="text-[12px] font-medium text-[#6b7280]">客户等级 *</label>
              <select
                value={newCustomerForm.level}
                onChange={(e) => setNewCustomerForm((p) => ({ ...p, level: e.target.value }))}
                className="mt-1 h-8 w-full rounded-sm border border-[#e5e7eb] bg-white px-2 text-[12px] outline-none focus:border-[#2563eb]"
              >
                {CUSTOMER_LEVELS.map((lvl) => (
                  <option key={lvl.id} value={lvl.id}>
                    {lvl.id} · {lvl.zh}
                  </option>
                ))}
              </select>
              {/* 等级参考表 */}
              <div className="mt-2 rounded-sm border border-[#e5e7eb] overflow-hidden">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="bg-[#f9fafb] border-b border-[#e5e7eb]">
                      <th className="px-2 py-1 text-left font-semibold text-[#6b7280] w-10">等级</th>
                      <th className="px-2 py-1 text-left font-semibold text-[#6b7280]">中文</th>
                      <th className="px-2 py-1 text-left font-semibold text-[#6b7280]">Indonesia</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f3f4f6]">
                    {CUSTOMER_LEVELS.map((lvl) => (
                      <tr key={lvl.id} className="hover:bg-[#f9fafb]">
                        <td className="px-2 py-1">
                          <span className={`px-1 py-0.5 rounded-sm text-[10px] font-semibold ${levelColors[lvl.id]}`}>
                            {lvl.id}
                          </span>
                        </td>
                        <td className="px-2 py-1 text-[#374151]">{lvl.zh}</td>
                        <td className="px-2 py-1 text-[#6b7280]">{lvl.id_}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div>
              <label className="text-[12px] font-medium text-[#6b7280]">行业</label>
              <input
                type="text"
                value={newCustomerForm.industry}
                onChange={(e) => setNewCustomerForm((p) => ({ ...p, industry: e.target.value }))}
                placeholder="如：科技/互联网"
                className="mt-1 h-8 w-full rounded-sm border border-[#e5e7eb] bg-white px-2 text-[12px] placeholder-[#9ca3af] outline-none focus:border-[#2563eb]"
              />
            </div>
            <div>
              <label className="text-[12px] font-medium text-[#6b7280]">联系人</label>
              <input
                type="text"
                value={newCustomerForm.contactName}
                onChange={(e) => setNewCustomerForm((p) => ({ ...p, contactName: e.target.value }))}
                placeholder="联系人名字"
                className="mt-1 h-8 w-full rounded-sm border border-[#e5e7eb] bg-white px-2 text-[12px] placeholder-[#9ca3af] outline-none focus:border-[#2563eb]"
              />
            </div>
            <div>
              <label className="text-[12px] font-medium text-[#6b7280]">电话</label>
              <input
                type="text"
                value={newCustomerForm.phone}
                onChange={(e) => setNewCustomerForm((p) => ({ ...p, phone: e.target.value }))}
                placeholder="手机号"
                className="mt-1 h-8 w-full rounded-sm border border-[#e5e7eb] bg-white px-2 text-[12px] placeholder-[#9ca3af] outline-none focus:border-[#2563eb]"
              />
            </div>
            <div>
              <label className="text-[12px] font-medium text-[#6b7280]">邮箱</label>
              <input
                type="email"
                value={newCustomerForm.email}
                onChange={(e) => setNewCustomerForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="email@example.com"
                className="mt-1 h-8 w-full rounded-sm border border-[#e5e7eb] bg-white px-2 text-[12px] placeholder-[#9ca3af] outline-none focus:border-[#2563eb]"
              />
            </div>
            <div className="flex gap-2 border-t border-[#e5e7eb] pt-4">
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="flex-1 h-8 rounded-sm border border-[#e5e7eb] text-[12px] font-medium text-[#374151] hover:bg-[#f9fafb]"
              >
                取消
              </button>
              <button
                onClick={() => {
                  if (!newCustomerForm.customerName.trim()) {
                    alert('客户名不能为空')
                    return
                  }
                  onCustomerCreate?.(newCustomerForm)
                  setIsCreateModalOpen(false)
                }}
                className="flex-1 h-8 rounded-sm bg-[#2563eb] text-[12px] font-medium text-white hover:bg-[#1d4ed8]"
              >
                创建
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* 天眼查搜索对话框 */}
      <ChinaEntitySearchDialog
        open={chinaEntityDialogOpen}
        onOpenChange={setChinaEntityDialogOpen}
        onSelect={(entity) => setChinaEntities(prev => [...prev, entity])}
      />

      {/* 海外企业表单 */}
      <Sheet open={foreignFormOpen} onOpenChange={setForeignFormOpen}>
        <SheetContent side="right" className="w-[400px]" aria-describedby={undefined}>
          <SheetHeader>
            <SheetTitle className="text-[14px] font-semibold">添加海外关联企业</SheetTitle>
          </SheetHeader>
          <ForeignEntityForm
            onSave={(entity) => {
              setForeignEntities(prev => [...prev, entity])
              setForeignFormOpen(false)
            }}
            onCancel={() => setForeignFormOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </div>
  )
}

// 海外企业表单组件
const COUNTRIES = ['印度尼西亚', '新加坡', '马来西亚', '香港', '泰国', '越南', '美国', '英国', '其他']

function ForeignEntityForm({ onSave, onCancel }: { onSave: (entity: any) => void; onCancel: () => void }) {
  const [form, setForm] = useState({
    companyName: '',
    country: '印度尼西亚',
    registrationNumber: '',
    legalPerson: '',
    regCapital: '',
  })

  return (
    <div className="mt-4 space-y-3">
      <div>
        <label className="text-[12px] font-medium text-[#6b7280]">企业全名 *</label>
        <input
          type="text"
          value={form.companyName}
          onChange={(e) => setForm(p => ({ ...p, companyName: e.target.value }))}
          placeholder="PT. Example Indonesia"
          className="mt-1 h-8 w-full rounded-sm border border-[#e5e7eb] bg-white px-2 text-[12px] placeholder-[#9ca3af] outline-none focus:border-[#2563eb]"
        />
      </div>
      <div>
        <label className="text-[12px] font-medium text-[#6b7280]">注册国家 *</label>
        <select
          value={form.country}
          onChange={(e) => setForm(p => ({ ...p, country: e.target.value }))}
          className="mt-1 h-8 w-full rounded-sm border border-[#e5e7eb] bg-white px-2 text-[12px] outline-none focus:border-[#2563eb]"
        >
          {COUNTRIES.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>
      <div>
        <label className="text-[12px] font-medium text-[#6b7280]">注册号</label>
        <input
          type="text"
          value={form.registrationNumber}
          onChange={(e) => setForm(p => ({ ...p, registrationNumber: e.target.value }))}
          placeholder="NIB: 8120000000000"
          className="mt-1 h-8 w-full rounded-sm border border-[#e5e7eb] bg-white px-2 font-mono text-[12px] placeholder-[#9ca3af] outline-none focus:border-[#2563eb]"
        />
      </div>
      <div>
        <label className="text-[12px] font-medium text-[#6b7280]">法定代表人</label>
        <input
          type="text"
          value={form.legalPerson}
          onChange={(e) => setForm(p => ({ ...p, legalPerson: e.target.value }))}
          className="mt-1 h-8 w-full rounded-sm border border-[#e5e7eb] bg-white px-2 text-[12px] outline-none focus:border-[#2563eb]"
        />
      </div>
      <div>
        <label className="text-[12px] font-medium text-[#6b7280]">注册资本</label>
        <input
          type="text"
          value={form.regCapital}
          onChange={(e) => setForm(p => ({ ...p, regCapital: e.target.value }))}
          placeholder="IDR 1.000.000.000"
          className="mt-1 h-8 w-full rounded-sm border border-[#e5e7eb] bg-white px-2 font-mono text-[12px] placeholder-[#9ca3af] outline-none focus:border-[#2563eb]"
        />
      </div>
      <div className="flex gap-2 border-t border-[#e5e7eb] pt-4">
        <button
          onClick={onCancel}
          className="flex-1 h-8 rounded-sm border border-[#e5e7eb] text-[12px] font-medium text-[#374151] hover:bg-[#f9fafb]"
        >
          取消
        </button>
        <button
          onClick={() => {
            if (!form.companyName.trim()) return
            onSave({ id: `FE-${Date.now()}`, ...form })
          }}
          disabled={!form.companyName.trim()}
          className="flex-1 h-8 rounded-sm bg-[#2563eb] text-[12px] font-medium text-white hover:bg-[#1d4ed8] disabled:bg-[#d1d5db] disabled:cursor-not-allowed"
        >
          保存
        </button>
      </div>
    </div>
  )
}
