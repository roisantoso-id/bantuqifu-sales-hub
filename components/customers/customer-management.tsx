'use client'

import { useState, useMemo, useEffect } from 'react'
import { Search, Plus, Edit2, Archive, ChevronRight, Lock, Users, Paperclip, FileText, Image as ImageIcon, X, RefreshCw } from 'lucide-react'
import { CUSTOMER_LEVELS } from '@/lib/types'
import {
  getCustomersAction,
  getCustomerDetailAction,
  type CustomerRow,
  type CustomerOpportunityRow,
  type CustomerActionLogRow,
} from '@/app/actions/customer'

// ─── Types ─────────────────────────────────────────────────────────────────────

interface CustomerManagementProps {
  onSelectCustomer?: (customerId: string) => void
}

const levelColors: Record<string, string> = {
  L1: 'bg-blue-900 text-white',
  L2: 'bg-blue-700 text-white',
  L3: 'bg-blue-500 text-white',
  L4: 'bg-blue-300 text-blue-900',
  L5: 'bg-blue-100 text-blue-700',
  L6: 'bg-slate-100 text-slate-600',
}

const stageColors: Record<string, string> = {
  P1: 'bg-slate-100 text-slate-600',
  P2: 'bg-blue-100 text-blue-700',
  P3: 'bg-indigo-100 text-indigo-700',
  P4: 'bg-violet-100 text-violet-700',
  P5: 'bg-amber-100 text-amber-700',
  P6: 'bg-orange-100 text-orange-700',
  P7: 'bg-green-100 text-green-700',
  P8: 'bg-emerald-100 text-emerald-700',
}

// ─── Skeleton ──────────────────────────────────────────────────────────────────

function ListSkeleton() {
  return (
    <div className="flex flex-col gap-0">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="px-3 py-2 border-b border-[#f3f4f6] animate-pulse">
          <div className="h-3 w-24 rounded bg-[#e5e7eb] mb-1.5" />
          <div className="h-3 w-32 rounded bg-[#f3f4f6]" />
        </div>
      ))}
    </div>
  )
}

function DetailSkeleton() {
  return (
    <div className="p-5 space-y-4 animate-pulse">
      <div className="h-5 w-48 rounded bg-[#e5e7eb]" />
      <div className="h-4 w-64 rounded bg-[#f3f4f6]" />
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-10 rounded bg-[#f3f4f6]" />
      ))}
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CustomerManagement({ onSelectCustomer }: CustomerManagementProps) {
  // ── list state ──
  const [customers, setCustomers] = useState<CustomerRow[]>([])
  const [listLoading, setListLoading] = useState(true)
  const [listError, setListError] = useState<string | null>(null)

  // ── detail state ──
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRow | null>(null)
  const [detailOpportunities, setDetailOpportunities] = useState<CustomerOpportunityRow[]>([])
  const [detailLogs, setDetailLogs] = useState<CustomerActionLogRow[]>([])
  const [detailLoading, setDetailLoading] = useState(false)

  // ── UI state ──
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'opportunities' | 'followups'>('opportunities')
  const [newFollowup, setNewFollowup] = useState('')
  const [newFollowupFiles, setNewFollowupFiles] = useState<File[]>([])

  // ── Load customers on mount ──
  useEffect(() => {
    setListLoading(true)
    getCustomersAction()
      .then((data) => { setCustomers(data); setListError(null) })
      .catch((err) => setListError(err.message ?? '加载失败'))
      .finally(() => setListLoading(false))
  }, [])

  // ── Load detail when customer selected ──
  const handleSelectCustomer = async (customer: CustomerRow) => {
    setSelectedCustomer(customer)
    setActiveTab('opportunities')
    setDetailLoading(true)
    try {
      const detail = await getCustomerDetailAction(customer.id)
      if (detail) {
        setDetailOpportunities(detail.opportunities)
        setDetailLogs(detail.actionLogs)
      }
    } catch (err) {
      console.error('[v0] customer detail error:', err)
    } finally {
      setDetailLoading(false)
    }
  }

  // ── Derived / filtered list ──
  const filtered = useMemo(() => {
    return customers.filter((c) => {
      const matchesQuery =
        !searchQuery ||
        c.customerId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.customerName.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesLevel = !selectedLevel || c.level === selectedLevel
      return matchesQuery && matchesLevel
    })
  }, [customers, searchQuery, selectedLevel])

  const levelStats = useMemo(() => {
    const stats: Record<string, number> = {}
    CUSTOMER_LEVELS.forEach((l) => { stats[l.id] = 0 })
    customers.forEach((c) => { stats[c.level] = (stats[c.level] ?? 0) + 1 })
    return stats
  }, [customers])

  const customersByLevel = useMemo(() => {
    const grouped: Record<string, CustomerRow[]> = {}
    CUSTOMER_LEVELS.forEach((l) => { grouped[l.id] = [] })
    filtered.forEach((c) => {
      if (grouped[c.level]) grouped[c.level].push(c)
    })
    return grouped
  }, [filtered])

  const getLevelLabel = (levelId: string) => CUSTOMER_LEVELS.find((l) => l.id === levelId)?.zh ?? levelId

  // ── Detail computed ──
  const totalRevenue = detailOpportunities.reduce((s, o) => s + (o.estimatedAmount ?? 0), 0)
  const activeOppCount = detailOpportunities.filter((o) => o.status === 'active').length
  const lastLog = detailLogs[0]

  return (
    <div className="flex h-full bg-white">
      {/* ── 左侧导航栏 280px ─────────────────────────────────────── */}
      <div className="w-[280px] shrink-0 flex flex-col border-r border-[#e5e7eb]">
        {/* 搜索框 */}
        <div className="p-3 border-b border-[#e5e7eb]">
          <div className="relative">
            <Search size={13} className="absolute left-2 top-[9px] text-[#9ca3af]" />
            <input
              type="text"
              placeholder="搜索客户编号或名称..."
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

        {/* 客户列表 */}
        <div className="flex-1 overflow-y-auto">
          {listLoading ? (
            <ListSkeleton />
          ) : listError ? (
            <div className="p-4 text-center">
              <p className="text-[12px] text-red-500 mb-2">{listError}</p>
              <button
                onClick={() => { setListLoading(true); getCustomersAction().then(setCustomers).finally(() => setListLoading(false)) }}
                className="flex items-center gap-1 mx-auto text-[11px] text-[#2563eb] hover:underline"
              >
                <RefreshCw size={11} /> 重试
              </button>
            </div>
          ) : (
            CUSTOMER_LEVELS.filter((l) => !selectedLevel || l.id === selectedLevel).map((level) => {
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
                      key={customer.id}
                      onClick={() => handleSelectCustomer(customer)}
                      className={`px-3 py-2 border-b border-[#f3f4f6] cursor-pointer hover:bg-[#f9fafb] ${
                        selectedCustomer?.id === customer.id ? 'bg-[#eff6ff]' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[11px] text-[#2563eb]">{customer.customerId}</span>
                        {customer.isLocked && <Lock size={10} className="text-[#9ca3af]" />}
                      </div>
                      <div className="text-[12px] font-medium text-[#111827] truncate">{customer.customerName}</div>
                      {customer.phone && (
                        <div className="font-mono text-[10px] text-[#9ca3af] mt-0.5">{customer.phone}</div>
                      )}
                    </div>
                  ))}
                </div>
              )
            })
          )}
        </div>

        {/* 新增客户按钮 */}
        <div className="p-3 border-t border-[#e5e7eb]">
          <button className="w-full flex items-center justify-center gap-1.5 h-8 rounded-sm bg-[#2563eb] text-[12px] font-medium text-white hover:bg-[#1d4ed8]">
            <Plus size={13} />
            新增客户
          </button>
        </div>
      </div>

      {/* ── 主作业区 ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 统计条 */}
        <div className="h-10 border-b border-[#e5e7eb] bg-[#f9fafb] px-4 flex items-center gap-4">
          <div className="flex items-center gap-1 text-[11px] text-[#6b7280]">
            <Users size={12} />
            <span>共 {customers.length} 个客户</span>
          </div>
          <div className="h-4 w-px bg-[#e5e7eb]" />
          {CUSTOMER_LEVELS.map((lvl) => (
            <div key={lvl.id} className="flex items-center gap-1">
              <span className={`px-1.5 py-0.5 rounded-sm text-[10px] font-semibold ${levelColors[lvl.id] ?? 'bg-slate-100 text-slate-600'}`}>{lvl.id}</span>
              <span className="text-[11px] font-mono text-[#6b7280]">{levelStats[lvl.id] ?? 0}</span>
            </div>
          ))}
        </div>

        {/* 内容区 */}
        {!selectedCustomer ? (
          /* 列表模式 — 表格 */
          <div className="flex-1 overflow-y-auto">
            {listLoading ? (
              <DetailSkeleton />
            ) : (
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="border-b border-[#e5e7eb] bg-[#f9fafb] text-[11px] text-[#6b7280]">
                    <th className="px-4 py-2 text-left font-semibold">客户编号</th>
                    <th className="px-4 py-2 text-left font-semibold">客户名称</th>
                    <th className="px-4 py-2 text-left font-semibold">等级</th>
                    <th className="px-4 py-2 text-left font-semibold">电话</th>
                    <th className="px-4 py-2 text-left font-semibold">邮箱</th>
                    <th className="px-4 py-2 text-left font-semibold">微信</th>
                    <th className="px-4 py-2 text-left font-semibold">状态</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f3f4f6]">
                  {filtered.map((customer) => (
                    <tr
                      key={customer.id}
                      className="hover:bg-[#f9fafb] cursor-pointer"
                      onClick={() => handleSelectCustomer(customer)}
                    >
                      <td className="px-4 py-2 font-mono text-[#2563eb]">{customer.customerId}</td>
                      <td className="px-4 py-2 font-medium text-[#111827]">{customer.customerName}</td>
                      <td className="px-4 py-2">
                        <span className={`px-1.5 py-0.5 rounded-sm text-[10px] font-semibold ${levelColors[customer.level] ?? 'bg-slate-100 text-slate-600'}`}>
                          {customer.level} · {getLevelLabel(customer.level)}
                        </span>
                      </td>
                      <td className="px-4 py-2 font-mono text-[11px] text-[#6b7280]">{customer.phone ?? '—'}</td>
                      <td className="px-4 py-2 text-[11px] text-[#6b7280]">{customer.email ?? '—'}</td>
                      <td className="px-4 py-2 font-mono text-[11px] text-[#6b7280]">{customer.wechat ?? '—'}</td>
                      <td className="px-4 py-2">
                        {customer.isLocked ? (
                          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-sm bg-amber-100 text-amber-700 text-[10px]">
                            <Lock size={9} /> 已锁定
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded-sm bg-green-100 text-green-700 text-[10px]">正常</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {!listLoading && filtered.length === 0 && (
              <div className="py-12 text-center text-[12px] text-[#9ca3af]">无匹配客户</div>
            )}
          </div>
        ) : (
          /* 档案详情模式 */
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
                  <span className="font-mono text-[12px] text-[#2563eb]">{selectedCustomer.customerId}</span>
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
                <span className={`px-2 py-0.5 rounded-sm text-[11px] font-semibold ${levelColors[selectedCustomer.level] ?? 'bg-slate-100 text-slate-600'}`}>
                  {selectedCustomer.level} · {getLevelLabel(selectedCustomer.level)}
                </span>
                {selectedCustomer.isLocked && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-sm bg-amber-100 text-amber-700 text-[11px]">
                    <Lock size={10} /> 已锁定
                  </span>
                )}
              </div>

              {/* KPI 条 */}
              <div className="mt-3 flex items-center gap-6 text-[12px]">
                <div>
                  <span className="text-[#9ca3af]">电话 </span>
                  <span className="font-mono text-[#111827]">{selectedCustomer.phone ?? '—'}</span>
                </div>
                <div>
                  <span className="text-[#9ca3af]">邮箱 </span>
                  <span className="text-[#111827]">{selectedCustomer.email ?? '—'}</span>
                </div>
                {selectedCustomer.wechat && (
                  <div>
                    <span className="text-[#9ca3af]">微信 </span>
                    <span className="font-mono text-[#111827]">{selectedCustomer.wechat}</span>
                  </div>
                )}
              </div>

              {/* 指标统计 */}
              <div className="mt-3 flex gap-6">
                <div>
                  <div className="font-mono text-[13px] font-semibold text-[#111827]">
                    {detailOpportunities[0]?.currency === 'CNY' ? '¥' : 'Rp '}
                    {(totalRevenue / 10000).toFixed(1)}万
                  </div>
                  <div className="text-[11px] text-[#9ca3af]">累计金额</div>
                </div>
                <div>
                  <div className="font-mono text-[13px] font-semibold text-[#111827]">{activeOppCount}</div>
                  <div className="text-[11px] text-[#9ca3af]">进行中商机</div>
                </div>
                <div>
                  <div className="text-[12px] font-medium text-[#111827]">
                    {lastLog ? new Date(lastLog.timestamp).toLocaleDateString('zh-CN') : '—'}
                  </div>
                  <div className="text-[11px] text-[#9ca3af]">最后跟进</div>
                </div>
              </div>
            </div>

            {/* Tab 切换 */}
            <div className="h-10 border-b border-[#e5e7eb] flex">
              {[
                { id: 'opportunities' as const, label: '关联商机', count: detailOpportunities.length },
                { id: 'followups' as const, label: '跟进记录', count: detailLogs.length },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
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
              {detailLoading ? (
                <DetailSkeleton />
              ) : activeTab === 'opportunities' ? (
                /* ── 关联商机表格 ── */
                detailOpportunities.length === 0 ? (
                  <div className="py-12 text-center text-[12px] text-[#9ca3af]">暂无关联商机</div>
                ) : (
                  <table className="w-full text-[12px]">
                    <thead>
                      <tr className="border-b border-[#e5e7eb] bg-[#f9fafb] text-[11px] text-[#6b7280]">
                        <th className="px-4 py-2 text-left font-semibold">商机编号</th>
                        <th className="px-4 py-2 text-left font-semibold">服务类型</th>
                        <th className="px-4 py-2 text-left font-semibold">阶段</th>
                        <th className="px-4 py-2 text-left font-semibold">金额</th>
                        <th className="px-4 py-2 text-left font-semibold">状态</th>
                        <th className="px-4 py-2 text-left font-semibold">创建日期</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f3f4f6]">
                      {detailOpportunities.map((opp) => (
                        <tr key={opp.id} className="hover:bg-[#f9fafb]">
                          <td className="px-4 py-2 font-mono text-[#2563eb]">{opp.opportunityCode}</td>
                          <td className="px-4 py-2 text-[#111827]">{opp.serviceTypeLabel}</td>
                          <td className="px-4 py-2">
                            <span className={`px-1.5 py-0.5 rounded-sm text-[11px] font-semibold ${stageColors[opp.stageId] ?? 'bg-slate-100 text-slate-600'}`}>
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
                          <td className="px-4 py-2 font-mono text-[11px] text-[#9ca3af]">
                            {new Date(opp.createdAt).toLocaleDateString('zh-CN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )
              ) : (
                /* ── 跟进记录时间轴 ── */
                <div className="flex flex-col h-full">
                  {/* 新增跟进输入框 */}
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
                              accept="image/*,.pdf,.doc,.docx"
                              onChange={(e) => {
                                if (e.target.files) setNewFollowupFiles(prev => [...prev, ...Array.from(e.target.files!)])
                              }}
                            />
                          </label>
                          {newFollowupFiles.map((f, i) => (
                            <span key={i} className="flex items-center gap-1 rounded-sm bg-[#eff6ff] px-1.5 py-0.5 text-[10px] text-[#2563eb]">
                              {f.type.startsWith('image/') ? <ImageIcon size={10} /> : <FileText size={10} />}
                              {f.name.length > 12 ? f.name.slice(0, 10) + '…' : f.name}
                              <button onClick={() => setNewFollowupFiles(p => p.filter((_, j) => j !== i))}>
                                <X size={9} />
                              </button>
                            </span>
                          ))}
                        </div>
                        <button
                          disabled={!newFollowup.trim() && newFollowupFiles.length === 0}
                          className="h-7 px-3 rounded-sm bg-[#2563eb] text-[11px] font-medium text-white hover:bg-[#1d4ed8] disabled:bg-[#d1d5db] disabled:cursor-not-allowed"
                        >
                          添加记录
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 时间轴 */}
                  <div className="flex-1 overflow-y-auto px-4 py-4">
                    {detailLogs.length === 0 ? (
                      <div className="py-12 text-center text-[12px] text-[#9ca3af]">暂无跟进记录</div>
                    ) : (
                      <div className="relative pl-6">
                        <div className="absolute left-[7px] top-2 bottom-2 w-px bg-[#e5e7eb]" />
                        {detailLogs.map((log, idx) => (
                          <div key={log.id} className="relative pb-6 last:pb-0">
                            <div className="absolute left-[-20px] top-1 w-3 h-3 rounded-full bg-[#2563eb] border-2 border-white shadow-sm" />
                            <div className="mb-1 font-mono text-[10px] text-[#9ca3af]">
                              {new Date(log.timestamp).toLocaleString('zh-CN', {
                                month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta',
                              })}
                              {log.opportunityId && (
                                <span className="ml-2 text-[#9ca3af]">· 商机 <span className="font-mono text-[#2563eb]">{log.opportunityId}</span></span>
                              )}
                            </div>
                            <div className="rounded-sm border border-[#e5e7eb] bg-white p-3 hover:shadow-sm transition-shadow">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[12px] font-semibold text-[#111827]">{log.actionLabel}</span>
                                {idx === 0 && (
                                  <span className="px-1 py-0.5 rounded-sm bg-[#dcfce7] text-[#16a34a] text-[9px] font-semibold">最新</span>
                                )}
                              </div>
                              {log.remark && (
                                <p className="text-[12px] text-[#374151] leading-relaxed whitespace-pre-wrap">{log.remark}</p>
                              )}
                              {log.stageId && (
                                <div className="mt-1.5">
                                  <span className={`px-1.5 py-0.5 rounded-sm text-[10px] font-semibold ${stageColors[log.stageId] ?? 'bg-slate-100 text-slate-600'}`}>
                                    {log.stageId}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
