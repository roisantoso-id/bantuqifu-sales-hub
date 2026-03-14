'use client'

import { useState, useMemo } from 'react'
import { Search, Plus, Edit2, Archive, Trash2, X } from 'lucide-react'
import type { Opportunity } from '@/lib/types'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'

interface CustomerRecord {
  id: string
  customerId: string
  customerName: string
  industry: string
  contactName: string
  phone: string
  lastInteraction: string
  activeOpportunitiesCount: number
  opportunitiesByStage: Record<string, number>
}

interface CustomerManagementProps {
  opportunities: Opportunity[]
  onCustomerCreate?: (customerData: any) => void
  onCustomerUpdate?: (customerId: string, data: any) => void
}

export function CustomerManagement({ opportunities, onCustomerCreate, onCustomerUpdate }: CustomerManagementProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<CustomerRecord | null>(null)
  const [archivedIds, setArchivedIds] = useState<Set<string>>(new Set())
  const [newCustomerForm, setNewCustomerForm] = useState({
    customerName: '',
    passportNo: '',
    contactName: '',
    phone: '',
    email: '',
    wechat: '',
    industry: '',
  })

  // Extract unique customers from opportunities
  const customers = useMemo(() => {
    const customerMap = new Map<string, CustomerRecord>()

    opportunities.forEach((opp) => {
      if (!customerMap.has(opp.customerId)) {
        customerMap.set(opp.customerId, {
          id: opp.id,
          customerId: opp.customerId,
          customerName: opp.customer.name,
          industry: opp.destination ?? '未分类',
          contactName: opp.customer.name.split('-')[0] ?? '',
          phone: opp.customer.phone,
          lastInteraction: new Date(opp.updatedAt).toLocaleString('zh-CN'),
          activeOpportunitiesCount: 0,
          opportunitiesByStage: {},
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

  // Filter customers
  const filtered = useMemo(() => {
    return customers.filter((c) => {
      if (archivedIds.has(c.customerId)) return false
      const matchesQuery =
        !searchQuery ||
        c.customerId.includes(searchQuery) ||
        c.customerName.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesIndustry = !selectedIndustry || c.industry === selectedIndustry
      return matchesQuery && matchesIndustry
    })
  }, [customers, searchQuery, selectedIndustry, archivedIds])

  // Get industries
  const industries = useMemo(() => {
    return Array.from(new Set(customers.map((c) => c.industry))).sort()
  }, [customers])

  // Check if customer can be deleted (no active P4-P8 stages)
  const canDelete = (customer: CustomerRecord): boolean => {
    const dangerousStages = ['P4', 'P5', 'P6', 'P7', 'P8']
    for (const stage of dangerousStages) {
      if ((customer.opportunitiesByStage[stage] ?? 0) > 0) return false
    }
    return true
  }

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header */}
      <div className="border-b border-[#e5e7eb] px-5 py-3">
        <h2 className="text-[14px] font-semibold text-[#111827]">客户管理</h2>
        <p className="mt-1 text-[11px] text-[#9ca3af]">共 {filtered.length} 个客户 · {customers.length} 个在库</p>
      </div>

      {/* Search & Filters */}
      <div className="border-b border-[#e5e7eb] bg-[#fafbfc] px-5 py-3 space-y-2">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-2 top-2.5 text-[#9ca3af]" />
            <input
              type="text"
              placeholder="搜索商机ID或客户名..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 w-full rounded-sm border border-[#e5e7eb] bg-white pl-7 pr-2 text-[12px] text-[#111827] placeholder-[#9ca3af] outline-none focus:border-[#2563eb]"
            />
          </div>
          <button
            onClick={() => {
              setNewCustomerForm({
                customerName: '',
                passportNo: '',
                contactName: '',
                phone: '',
                email: '',
                wechat: '',
                industry: '',
              })
              setIsCreateModalOpen(true)
            }}
            className="flex h-8 items-center gap-1.5 rounded-sm bg-[#2563eb] px-3 text-[12px] font-medium text-white hover:bg-[#1d4ed8]"
          >
            <Plus size={14} />
            新增
          </button>
        </div>

        {/* Industry Filter */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-[#6b7280]">行业：</span>
          <button
            onClick={() => setSelectedIndustry(null)}
            className={`h-6 rounded-sm px-2 text-[11px] font-medium transition-colors ${
              selectedIndustry === null
                ? 'bg-[#2563eb] text-white'
                : 'border border-[#e5e7eb] text-[#6b7280] hover:border-[#2563eb]'
            }`}
          >
            全部
          </button>
          {industries.map((ind) => (
            <button
              key={ind}
              onClick={() => setSelectedIndustry(selectedIndustry === ind ? null : ind)}
              className={`h-6 rounded-sm px-2 text-[11px] font-medium transition-colors ${
                selectedIndustry === ind
                  ? 'bg-[#2563eb] text-white'
                  : 'border border-[#e5e7eb] text-[#6b7280] hover:border-[#2563eb]'
              }`}
            >
              {ind}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto">
        <div className="inline-block w-full min-w-max">
          {/* Table Header */}
          <div className="grid grid-cols-[120px_150px_120px_120px_180px_120px_80px] gap-0 border-b border-[#e5e7eb] bg-[#f9fafb] text-[11px] font-semibold uppercase tracking-wider text-[#9ca3af]">
            <div className="px-3 py-2">客户ID</div>
            <div className="px-3 py-2">客户名</div>
            <div className="px-3 py-2">行业</div>
            <div className="px-3 py-2">联系人</div>
            <div className="px-3 py-2">最近互动</div>
            <div className="px-3 py-2">活跃商机</div>
            <div className="px-3 py-2 text-center">操作</div>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-[#f3f4f6]">
            {filtered.map((customer) => (
              <div
                key={customer.customerId}
                className="group grid grid-cols-[120px_150px_120px_120px_180px_120px_80px] gap-0 hover:bg-[#f9fafb] text-[12px]"
              >
                <div className="px-3 py-2 font-mono text-[#2563eb] truncate">{customer.customerId}</div>
                <div className="px-3 py-2 text-[#111827] truncate font-medium">{customer.customerName}</div>
                <div className="px-3 py-2 text-[#6b7280] truncate">{customer.industry}</div>
                <div className="px-3 py-2 text-[#6b7280] truncate">{customer.contactName}</div>
                <div className="px-3 py-2 font-mono text-[#9ca3af]">{customer.lastInteraction}</div>
                <div className="px-3 py-2 text-[#111827]">
                  <span className="inline-flex items-center gap-1 rounded-sm bg-[#eff6ff] px-1.5 py-0.5 text-[11px] font-semibold text-[#2563eb]">
                    {customer.activeOpportunitiesCount}
                  </span>
                </div>
                <div className="px-3 py-2 flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => {
                      setEditingCustomer(customer)
                      setIsEditModalOpen(true)
                    }}
                    className="flex h-6 w-6 items-center justify-center rounded-sm text-[#6b7280] hover:bg-[#e5e7eb] hover:text-[#111827]"
                    title="编辑"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => setArchivedIds((prev) => new Set(prev).add(customer.customerId))}
                    className="flex h-6 w-6 items-center justify-center rounded-sm text-[#6b7280] hover:bg-[#e5e7eb] hover:text-[#111827]"
                    title="归档"
                  >
                    <Archive size={14} />
                  </button>
                  {canDelete(customer) && (
                    <button
                      onClick={() => {
                        if (confirm('确定要删除此客户吗？')) {
                          // Delete logic
                        }
                      }}
                      className="flex h-6 w-6 items-center justify-center rounded-sm text-[#6b7280] hover:bg-[#fee2e2] hover:text-[#dc2626]"
                      title="删除"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="py-12 text-center text-[12px] text-[#9ca3af]">无匹配客户</div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      <Sheet open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <SheetContent side="right" className="w-[400px]" aria-describedby={undefined}>
          <SheetHeader>
            <SheetTitle className="text-[14px] font-semibold">编辑客户</SheetTitle>
          </SheetHeader>
          {editingCustomer && (
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-[12px] font-medium text-[#6b7280]">客户ID</label>
                <div className="mt-1 font-mono text-[13px] text-[#2563eb]">{editingCustomer.customerId}</div>
              </div>
              <div>
                <label className="text-[12px] font-medium text-[#6b7280]">客户名</label>
                <input
                  type="text"
                  defaultValue={editingCustomer.customerName}
                  className="mt-1 h-8 w-full rounded-sm border border-[#e5e7eb] bg-white px-2 text-[12px] text-[#111827] outline-none focus:border-[#2563eb]"
                />
              </div>
              <div>
                <label className="text-[12px] font-medium text-[#6b7280]">行业</label>
                <input
                  type="text"
                  defaultValue={editingCustomer.industry}
                  className="mt-1 h-8 w-full rounded-sm border border-[#e5e7eb] bg-white px-2 text-[12px] text-[#111827] outline-none focus:border-[#2563eb]"
                />
              </div>
              <div>
                <label className="text-[12px] font-medium text-[#6b7280]">联系电话</label>
                <input
                  type="text"
                  defaultValue={editingCustomer.phone}
                  className="mt-1 h-8 w-full rounded-sm border border-[#e5e7eb] bg-white px-2 text-[12px] text-[#111827] outline-none focus:border-[#2563eb]"
                />
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Create Customer Modal */}
      <Sheet open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <SheetContent side="right" className="w-[400px]" aria-describedby={undefined}>
          <SheetHeader>
            <SheetTitle className="text-[14px] font-semibold">新增客户</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-3">
            <div>
              <label className="text-[12px] font-medium text-[#6b7280]">客户名*</label>
              <input
                type="text"
                value={newCustomerForm.customerName}
                onChange={(e) => setNewCustomerForm((prev) => ({ ...prev, customerName: e.target.value }))}
                placeholder="客户名"
                className="mt-1 h-8 w-full rounded-sm border border-[#e5e7eb] bg-white px-2 text-[12px] text-[#111827] placeholder-[#9ca3af] outline-none focus:border-[#2563eb]"
              />
            </div>
            <div>
              <label className="text-[12px] font-medium text-[#6b7280]">护照号</label>
              <input
                type="text"
                value={newCustomerForm.passportNo}
                onChange={(e) => setNewCustomerForm((prev) => ({ ...prev, passportNo: e.target.value }))}
                placeholder="E00000000"
                className="mt-1 h-8 w-full rounded-sm border border-[#e5e7eb] bg-white px-2 font-mono text-[12px] text-[#111827] placeholder-[#9ca3af] outline-none focus:border-[#2563eb]"
              />
            </div>
            <div>
              <label className="text-[12px] font-medium text-[#6b7280]">联系人</label>
              <input
                type="text"
                value={newCustomerForm.contactName}
                onChange={(e) => setNewCustomerForm((prev) => ({ ...prev, contactName: e.target.value }))}
                placeholder="联系人名字"
                className="mt-1 h-8 w-full rounded-sm border border-[#e5e7eb] bg-white px-2 text-[12px] text-[#111827] placeholder-[#9ca3af] outline-none focus:border-[#2563eb]"
              />
            </div>
            <div>
              <label className="text-[12px] font-medium text-[#6b7280]">电话</label>
              <input
                type="text"
                value={newCustomerForm.phone}
                onChange={(e) => setNewCustomerForm((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="手机号"
                className="mt-1 h-8 w-full rounded-sm border border-[#e5e7eb] bg-white px-2 text-[12px] text-[#111827] placeholder-[#9ca3af] outline-none focus:border-[#2563eb]"
              />
            </div>
            <div>
              <label className="text-[12px] font-medium text-[#6b7280]">邮箱</label>
              <input
                type="email"
                value={newCustomerForm.email}
                onChange={(e) => setNewCustomerForm((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="email@example.com"
                className="mt-1 h-8 w-full rounded-sm border border-[#e5e7eb] bg-white px-2 text-[12px] text-[#111827] placeholder-[#9ca3af] outline-none focus:border-[#2563eb]"
              />
            </div>
            <div>
              <label className="text-[12px] font-medium text-[#6b7280]">微信</label>
              <input
                type="text"
                value={newCustomerForm.wechat}
                onChange={(e) => setNewCustomerForm((prev) => ({ ...prev, wechat: e.target.value }))}
                placeholder="微信号"
                className="mt-1 h-8 w-full rounded-sm border border-[#e5e7eb] bg-white px-2 text-[12px] text-[#111827] placeholder-[#9ca3af] outline-none focus:border-[#2563eb]"
              />
            </div>
            <div>
              <label className="text-[12px] font-medium text-[#6b7280]">行业</label>
              <input
                type="text"
                value={newCustomerForm.industry}
                onChange={(e) => setNewCustomerForm((prev) => ({ ...prev, industry: e.target.value }))}
                placeholder="行业分类"
                className="mt-1 h-8 w-full rounded-sm border border-[#e5e7eb] bg-white px-2 text-[12px] text-[#111827] placeholder-[#9ca3af] outline-none focus:border-[#2563eb]"
              />
            </div>
            <div className="flex gap-2 border-t border-[#e5e7eb] pt-4 mt-6">
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="flex-1 h-8 rounded-sm border border-[#e5e7eb] bg-white text-[12px] font-medium text-[#374151] hover:bg-[#f9fafb]"
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
