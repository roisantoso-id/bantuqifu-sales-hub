'use client'

import { useState, useMemo } from 'react'
import { Search, Plus, Edit2, Archive, Trash2, ChevronRight, Lock, Users } from 'lucide-react'
import type { Opportunity, ActionLog } from '@/lib/types'

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
  const [activeTab, setActiveTab] = useState<'opportunities' | 'followups' | 'contacts'>('opportunities')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [archivedIds, setArchivedIds] = useState<Set<string>>(new Set())
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
        <div className="flex-1 overflow-y-auto">
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
                    onClick={() => setSelectedCustomer(customer)}
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
                <div className="p-4 space-y-3">
                  {customerFollowups.length === 0 ? (
                    <div className="py-8 text-center text-[12px] text-[#9ca3af]">暂无跟进记录</div>
                  ) : (
                    customerFollowups.map((log) => (
                      <div key={log.id} className="flex gap-3 p-3 border border-[#e5e7eb] rounded-sm">
                        <div className="w-2 h-2 mt-1.5 rounded-full bg-[#2563eb] shrink-0" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[12px] font-medium text-[#111827]">{log.operatorName}</span>
                            <span className="font-mono text-[11px] text-[#9ca3af]">
                              {new Date(log.timestamp).toLocaleString('zh-CN')}
                            </span>
                          </div>
                          <div className="mt-1 text-[12px] text-[#6b7280]">{log.remark || log.actionLabel}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'contacts' && (
                <div className="p-4">
                  <div className="p-4 border border-[#e5e7eb] rounded-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#eff6ff] flex items-center justify-center text-[#2563eb] font-semibold">
                        {selectedCustomer.contactName.charAt(0)}
                      </div>
                      <div>
                        <div className="text-[13px] font-semibold text-[#111827]">{selectedCustomer.contactName}</div>
                        <div className="text-[11px] text-[#6b7280]">经理</div>
                      </div>
                    </div>
                    <div className="mt-3 space-y-1 text-[12px]">
                      <div className="flex items-center gap-2">
                        <span className="text-[#9ca3af] w-12">电话</span>
                        <span className="font-mono text-[#111827]">{selectedCustomer.phone || '-'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[#9ca3af] w-12">邮箱</span>
                        <span className="text-[#111827]">{selectedCustomer.email || '-'}</span>
                      </div>
                    </div>
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
    </div>
  )
}
