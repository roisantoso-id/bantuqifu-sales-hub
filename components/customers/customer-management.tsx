'use client'
// Customer Management - v2.1 with contacts tab support

import { useState, useMemo, useEffect, useCallback } from 'react'
import { Search, Plus, Edit2, Archive, ChevronRight, Lock, Users, RefreshCw, X, Building2, Calendar, Globe, User, Phone, Mail, MessageCircle } from 'lucide-react'
import { CUSTOMER_LEVELS } from '@/lib/types'
import { CreateOpportunityDialog } from '@/components/opportunities/create-opportunity-dialog'

// Server Actions - 动态导入避免 HMR 问题
import * as customerActions from '@/app/actions/customer'

type CustomerRow = customerActions.CustomerRow
type CustomerOpportunityRow = customerActions.CustomerOpportunityRow
type CustomerActionLogRow = customerActions.CustomerActionLogRow
type CustomerFollowupRow = customerActions.CustomerFollowupRow
type AssociatedCompanyRow = customerActions.AssociatedCompanyRow
type CustomerContactRow = customerActions.CustomerContactRow

const {
  getCustomersAction,
  getCustomerDetailAction,
  createCustomerAction,
  getCustomerFollowupsAction,
  addCustomerFollowupAction,
  getAssociatedCompaniesAction,
  addAssociatedCompanyAction,
  getCustomerContactsAction,
  addCustomerContactAction,
} = customerActions

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

const INDUSTRY_OPTIONS = [
  { id: 'cross-border-ecommerce', zh: '跨境电商' },
  { id: 'domestic-ecommerce', zh: '国内电商' },
  { id: 'logistics', zh: '物流/货代' },
  { id: 'trade', zh: '外贸/进出口' },
  { id: 'manufacturing', zh: '生产制造' },
  { id: 'retail', zh: '零售批发' },
  { id: 'it-tech', zh: 'IT/科技' },
  { id: 'finance', zh: '金融投资' },
  { id: 'real-estate', zh: '房地产' },
  { id: 'consulting', zh: '咨询服务' },
  { id: 'education', zh: '教育培训' },
  { id: 'medical', zh: '医疗健康' },
  { id: 'food-beverage', zh: '餐饮食品' },
  { id: 'tourism', zh: '旅游酒店' },
  { id: 'media', zh: '媒体/广告' },
  { id: 'other', zh: '其他' },
]

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

export function CustomerManagement({ onSelectCustomer }: CustomerManagementProps) {
  const [customers, setCustomers] = useState<CustomerRow[]>([])
  const [listLoading, setListLoading] = useState(true)
  const [listError, setListError] = useState<string | null>(null)
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRow | null>(null)
  const [detailOpportunities, setDetailOpportunities] = useState<CustomerOpportunityRow[]>([])
  const [detailLogs, setDetailLogs] = useState<CustomerActionLogRow[]>([])
  const [detailLoading, setDetailLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'opportunities' | 'followups' | 'companies' | 'contacts'>('opportunities')

  // Followups state
  const [followups, setFollowups] = useState<CustomerFollowupRow[]>([])
  const [followupsLoading, setFollowupsLoading] = useState(false)
  const [showAddFollowup, setShowAddFollowup] = useState(false)
  const [newFollowupForm, setNewFollowupForm] = useState({ content: '', followupType: 'general', nextAction: '', nextActionDate: '' })
  const [addingFollowup, setAddingFollowup] = useState(false)

  // Associated Companies state
  const [companies, setCompanies] = useState<AssociatedCompanyRow[]>([])
  const [companiesLoading, setCompaniesLoading] = useState(false)
  const [showAddCompany, setShowAddCompany] = useState(false)
  const [newCompanyForm, setNewCompanyForm] = useState({ companyName: '', companyType: 'foreign' as 'domestic' | 'foreign', registrationNo: '', country: 'ID' })
  const [addingCompany, setAddingCompany] = useState(false)

  // Contacts state
  const [contacts, setContacts] = useState<CustomerContactRow[]>([])
  const [contactsLoading, setContactsLoading] = useState(false)
  const [showAddContact, setShowAddContact] = useState(false)

  // Create Opportunity state
  const [showCreateOpportunity, setShowCreateOpportunity] = useState(false)
  const [newContactForm, setNewContactForm] = useState({ contactName: '', position: '', phone: '', email: '', wechat: '', isPrimary: false, notes: '' })
  const [addingContact, setAddingContact] = useState(false)

  // Create customer modal
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createForm, setCreateForm] = useState({ customerName: '', phone: '', email: '', wechat: '', level: 'L5', industry: '' })
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    setListLoading(true)
    getCustomersAction()
      .then((data) => { setCustomers(data); setListError(null) })
      .catch((err) => setListError(err.message ?? '加载失败'))
      .finally(() => setListLoading(false))
  }, [])

  const handleSelectCustomer = async (customer: CustomerRow) => {
    setSelectedCustomer(customer)
    setActiveTab('opportunities')
    setDetailLoading(true)
    setFollowups([])
    setCompanies([])
    setContacts([])
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

  const loadFollowups = async () => {
    if (!selectedCustomer) return
    setFollowupsLoading(true)
    try {
      const data = await getCustomerFollowupsAction(selectedCustomer.id)
      setFollowups(data)
    } catch (err) {
      console.error('[v0] load followups error:', err)
    } finally {
      setFollowupsLoading(false)
    }
  }

  const loadCompanies = async () => {
    if (!selectedCustomer) return
    setCompaniesLoading(true)
    try {
      const data = await getAssociatedCompaniesAction(selectedCustomer.id)
      setCompanies(data)
    } catch (err) {
      console.error('[v0] load companies error:', err)
    } finally {
      setCompaniesLoading(false)
    }
  }

  const loadContacts = async () => {
    if (!selectedCustomer) return
    setContactsLoading(true)
    try {
      const data = await getCustomerContactsAction(selectedCustomer.id)
      setContacts(data)
    } catch (err) {
      console.error('[v0] load contacts error:', err)
    } finally {
      setContactsLoading(false)
    }
  }

  const handleTabChange = (tab: 'opportunities' | 'followups' | 'companies' | 'contacts') => {
    setActiveTab(tab)
    if (tab === 'followups' && followups.length === 0) loadFollowups()
    if (tab === 'companies' && companies.length === 0) loadCompanies()
    if (tab === 'contacts' && contacts.length === 0) loadContacts()
  }

  const handleAddFollowup = async () => {
    if (!selectedCustomer || !newFollowupForm.content.trim()) return
    setAddingFollowup(true)
    try {
      const result = await addCustomerFollowupAction({
        customerId: selectedCustomer.id,
        followupType: newFollowupForm.followupType,
        content: newFollowupForm.content.trim(),
        nextAction: newFollowupForm.nextAction || null,
        nextActionDate: newFollowupForm.nextActionDate || null,
      })
      if (result) {
        setFollowups((prev) => [result, ...prev])
        setNewFollowupForm({ content: '', followupType: 'general', nextAction: '', nextActionDate: '' })
        setShowAddFollowup(false)
      }
    } catch (err) {
      console.error('[v0] add followup error:', err)
    } finally {
      setAddingFollowup(false)
    }
  }

  const handleAddCompany = async () => {
    if (!selectedCustomer || !newCompanyForm.companyName.trim()) return
    setAddingCompany(true)
    try {
      const result = await addAssociatedCompanyAction({
        customerId: selectedCustomer.id,
        companyType: newCompanyForm.companyType,
        companyName: newCompanyForm.companyName.trim(),
        registrationNo: newCompanyForm.registrationNo || null,
        country: newCompanyForm.country || null,
      })
      if (result) {
        setCompanies((prev) => [result, ...prev])
        setNewCompanyForm({ companyName: '', companyType: 'foreign', registrationNo: '', country: 'ID' })
        setShowAddCompany(false)
      }
    } catch (err) {
      console.error('[v0] add company error:', err)
    } finally {
      setAddingCompany(false)
    }
  }

  const handleAddContact = async () => {
    if (!selectedCustomer || !newContactForm.contactName.trim()) return
    setAddingContact(true)
    try {
      const result = await addCustomerContactAction({
        customerId: selectedCustomer.id,
        contactName: newContactForm.contactName.trim(),
        position: newContactForm.position || null,
        phone: newContactForm.phone || null,
        email: newContactForm.email || null,
        wechat: newContactForm.wechat || null,
        isPrimary: newContactForm.isPrimary,
        notes: newContactForm.notes || null,
      })
      if (result) {
        setContacts((prev) => [result, ...prev])
        setNewContactForm({ contactName: '', position: '', phone: '', email: '', wechat: '', isPrimary: false, notes: '' })
        setShowAddContact(false)
      }
    } catch (err) {
      console.error('[v0] add contact error:', err)
    } finally {
      setAddingContact(false)
    }
  }

  const handleCreateCustomer = async () => {
    if (!createForm.customerName.trim()) return
    setCreating(true)
    try {
const result = await createCustomerAction({
  customerName: createForm.customerName.trim(),
  phone: createForm.phone || null,
  email: createForm.email || null,
  wechat: createForm.wechat || null,
  level: createForm.level,
  industry: createForm.industry || null,
  })
      if (result) {
        setCustomers((prev) => [result, ...prev])
        setCreateForm({ customerName: '', phone: '', email: '', wechat: '', level: 'L5' })
        setShowCreateModal(false)
      }
    } catch (err) {
      console.error('[v0] create customer error:', err)
    } finally {
      setCreating(false)
    }
  }

  const filtered = useMemo(() => {
    return customers.filter((c) => {
      const matchesQuery = !searchQuery || (c.customerCode?.toLowerCase().includes(searchQuery.toLowerCase())) || c.customerId.toLowerCase().includes(searchQuery.toLowerCase()) || c.customerName.toLowerCase().includes(searchQuery.toLowerCase())
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
    filtered.forEach((c) => { if (grouped[c.level]) grouped[c.level].push(c) })
    return grouped
  }, [filtered])

  const getLevelLabel = (levelId: string) => CUSTOMER_LEVELS.find((l) => l.id === levelId)?.zh ?? levelId
  const totalRevenue = detailOpportunities.reduce((s, o) => s + (o.estimatedAmount ?? 0), 0)
  const activeOppCount = detailOpportunities.filter((o) => o.status === 'active').length
  const lastLog = detailLogs[0]

  return (
    <div className="flex h-full bg-white">
      {/* Left sidebar - customer list */}
      <div className="w-[280px] shrink-0 flex flex-col border-r border-[#e5e7eb]">
        <div className="p-3 border-b border-[#e5e7eb]">
          <div className="relative">
            <Search size={13} className="absolute left-2 top-[9px] text-[#9ca3af]" />
            <input type="text" placeholder="搜索客户编号或名称..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="h-8 w-full rounded-sm border border-[#e5e7eb] bg-white pl-7 pr-2 text-[12px] text-[#111827] placeholder-[#9ca3af] outline-none focus:border-[#2563eb]" />
          </div>
        </div>
        <div className="flex border-b border-[#e5e7eb] bg-[#f9fafb]">
          <button onClick={() => setSelectedLevel(null)} className={`flex-1 h-8 text-[11px] font-medium transition-colors ${selectedLevel === null ? 'bg-white text-[#2563eb] border-b-2 border-[#2563eb]' : 'text-[#6b7280] hover:text-[#111827]'}`}>全部</button>
          {CUSTOMER_LEVELS.map((lvl) => (
            <button key={lvl.id} onClick={() => setSelectedLevel(selectedLevel === lvl.id ? null : lvl.id)} className={`flex-1 h-8 text-[11px] font-medium transition-colors ${selectedLevel === lvl.id ? 'bg-white text-[#2563eb] border-b-2 border-[#2563eb]' : 'text-[#6b7280] hover:text-[#111827]'}`}>{lvl.id}</button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto">
          {listLoading ? <ListSkeleton /> : listError ? (
            <div className="p-4 text-center">
              <p className="text-[12px] text-red-500 mb-2">{listError}</p>
              <button onClick={() => { setListLoading(true); getCustomersAction().then(setCustomers).finally(() => setListLoading(false)) }} className="flex items-center gap-1 mx-auto text-[11px] text-[#2563eb] hover:underline"><RefreshCw size={11} /> 重试</button>
            </div>
          ) : CUSTOMER_LEVELS.filter((l) => !selectedLevel || l.id === selectedLevel).map((level) => {
            const levelCustomers = customersByLevel[level.id] || []
            if (levelCustomers.length === 0) return null
            return (
              <div key={level.id}>
                <div className="sticky top-0 bg-[#f9fafb] px-3 py-1.5 text-[11px] font-semibold text-[#6b7280] border-b border-[#e5e7eb] flex items-center justify-between">
                  <span>{level.id} · {level.zh}</span>
                  <span className="text-[10px] bg-[#e5e7eb] px-1.5 py-0.5 rounded-sm">{levelCustomers.length}</span>
                </div>
                {levelCustomers.map((customer) => (
                  <div key={customer.id} onClick={() => handleSelectCustomer(customer)} className={`px-3 py-2 border-b border-[#f3f4f6] cursor-pointer hover:bg-[#f9fafb] ${selectedCustomer?.id === customer.id ? 'bg-[#eff6ff]' : ''}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] text-[#2563eb]">{customer.customerCode || customer.customerId}</span>
                      {customer.isLocked && <Lock size={10} className="text-[#9ca3af]" />}
                    </div>
                    <div className="text-[12px] font-medium text-[#111827] truncate">{customer.customerName}</div>
                    {customer.phone && <div className="font-mono text-[10px] text-[#9ca3af] mt-0.5">{customer.phone}</div>}
                  </div>
                ))}
              </div>
            )
          })}
        </div>
        <div className="p-3 border-t border-[#e5e7eb]">
          <button onClick={() => setShowCreateModal(true)} className="w-full flex items-center justify-center gap-1.5 h-8 rounded-sm bg-[#2563eb] text-[12px] font-medium text-white hover:bg-[#1d4ed8]"><Plus size={13} />新增客户</button>
        </div>
      </div>

      {/* Right content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="h-10 border-b border-[#e5e7eb] bg-[#f9fafb] px-4 flex items-center gap-4">
          <div className="flex items-center gap-1 text-[11px] text-[#6b7280]"><Users size={12} /><span>共 {customers.length} 个客户</span></div>
          <div className="h-4 w-px bg-[#e5e7eb]" />
          {CUSTOMER_LEVELS.map((lvl) => (
            <div key={lvl.id} className="flex items-center gap-1">
              <span className={`px-1.5 py-0.5 rounded-sm text-[10px] font-semibold ${levelColors[lvl.id] ?? 'bg-slate-100 text-slate-600'}`}>{lvl.id}</span>
              <span className="text-[11px] font-mono text-[#6b7280]">{levelStats[lvl.id] ?? 0}</span>
            </div>
          ))}
        </div>

        {!selectedCustomer ? (
          <div className="flex-1 overflow-y-auto">
            {listLoading ? <DetailSkeleton /> : (
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="border-b border-[#e5e7eb] bg-[#f9fafb] text-[11px] text-[#6b7280]">
                    <th className="px-4 py-2 text-left font-semibold">客户编号</th>
                    <th className="px-4 py-2 text-left font-semibold">客户名称</th>
                    <th className="px-4 py-2 text-left font-semibold">等级</th>
                    <th className="px-4 py-2 text-left font-semibold">电话</th>
                    <th className="px-4 py-2 text-left font-semibold">邮箱</th>
                    <th className="px-4 py-2 text-left font-semibold">状态</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f3f4f6]">
                  {filtered.map((customer) => (
                    <tr key={customer.id} className="hover:bg-[#f9fafb] cursor-pointer" onClick={() => handleSelectCustomer(customer)}>
                      <td className="px-4 py-2 font-mono text-[#2563eb]">{customer.customerCode || customer.customerId}</td>
                      <td className="px-4 py-2 font-medium text-[#111827]">{customer.customerName}</td>
                      <td className="px-4 py-2"><span className={`px-1.5 py-0.5 rounded-sm text-[10px] font-semibold ${levelColors[customer.level] ?? 'bg-slate-100 text-slate-600'}`}>{customer.level}</span></td>
                      <td className="px-4 py-2 font-mono text-[11px] text-[#6b7280]">{customer.phone ?? '—'}</td>
                      <td className="px-4 py-2 text-[11px] text-[#6b7280]">{customer.email ?? '—'}</td>
                      <td className="px-4 py-2">{customer.isLocked ? <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-sm bg-amber-100 text-amber-700 text-[10px]"><Lock size={9} /> 已锁定</span> : <span className="px-1.5 py-0.5 rounded-sm bg-green-100 text-green-700 text-[10px]">正常</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {!listLoading && filtered.length === 0 && <div className="py-12 text-center text-[12px] text-[#9ca3af]">无匹配客户</div>}
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Customer detail header */}
            <div className="px-5 py-4 border-b border-[#e5e7eb] bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button onClick={() => setSelectedCustomer(null)} className="text-[12px] text-[#6b7280] hover:text-[#2563eb]">返回列表</button>
                  <ChevronRight size={12} className="text-[#9ca3af]" />
                  <span className="font-mono text-[12px] text-[#2563eb]">{selectedCustomer.customerCode || selectedCustomer.customerId}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowCreateOpportunity(true)}
                    className="h-7 px-3 rounded-sm bg-[#2563eb] text-white text-[11px] font-medium hover:bg-[#1d4ed8] flex items-center gap-1"
                  >
                    <Plus size={12} />
                    新建商机
                  </button>
                  <button className="h-7 px-2 rounded-sm border border-[#e5e7eb] text-[11px] text-[#6b7280] hover:bg-[#f9fafb]"><Edit2 size={12} /></button>
                  <button className="h-7 px-2 rounded-sm border border-[#e5e7eb] text-[11px] text-[#6b7280] hover:bg-[#f9fafb]"><Archive size={12} /></button>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <h2 className="text-[16px] font-semibold text-[#111827]">{selectedCustomer.customerName}</h2>
                <span className={`px-2 py-0.5 rounded-sm text-[11px] font-semibold ${levelColors[selectedCustomer.level] ?? 'bg-slate-100 text-slate-600'}`}>{selectedCustomer.level} · {getLevelLabel(selectedCustomer.level)}</span>
                {selectedCustomer.isLocked && <span className="flex items-center gap-1 px-2 py-0.5 rounded-sm bg-amber-100 text-amber-700 text-[11px]"><Lock size={10} /> 已锁定</span>}
              </div>
              <div className="mt-3 flex items-center gap-6 text-[12px]">
                <div><span className="text-[#9ca3af]">电话 </span><span className="font-mono text-[#111827]">{selectedCustomer.phone ?? '—'}</span></div>
                <div><span className="text-[#9ca3af]">邮箱 </span><span className="text-[#111827]">{selectedCustomer.email ?? '—'}</span></div>
                {selectedCustomer.wechat && <div><span className="text-[#9ca3af]">微信 </span><span className="font-mono text-[#111827]">{selectedCustomer.wechat}</span></div>}
              </div>
              <div className="mt-3 flex gap-6">
                <div><div className="font-mono text-[13px] font-semibold text-[#111827]">{detailOpportunities[0]?.currency === 'CNY' ? '¥' : 'Rp '}{(totalRevenue / 10000).toFixed(1)}万</div><div className="text-[11px] text-[#9ca3af]">累计金额</div></div>
                <div><div className="font-mono text-[13px] font-semibold text-[#111827]">{activeOppCount}</div><div className="text-[11px] text-[#9ca3af]">进行中商机</div></div>
                <div><div className="text-[12px] font-medium text-[#111827]">{lastLog ? new Date(lastLog.timestamp).toLocaleDateString('zh-CN') : '—'}</div><div className="text-[11px] text-[#9ca3af]">最后跟进</div></div>
              </div>
            </div>

            {/* Tabs */}
            <div className="h-10 border-b border-[#e5e7eb] flex">
              {[
{ id: 'opportunities' as const, label: '关联商机', count: detailOpportunities.length },
  { id: 'followups' as const, label: '跟进记录', count: followups.length },
  { id: 'companies' as const, label: '关联公司', count: companies.length },
  { id: 'contacts' as const, label: '关联联系人', count: contacts.length },
  ].map((tab) => (
                <button key={tab.id} onClick={() => handleTabChange(tab.id)} className={`px-4 h-full text-[12px] font-medium border-b-2 transition-colors ${activeTab === tab.id ? 'text-[#2563eb] border-[#2563eb]' : 'text-[#6b7280] border-transparent hover:text-[#111827]'}`}>{tab.label} ({tab.count})</button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto">
              {detailLoading ? <DetailSkeleton /> : activeTab === 'opportunities' ? (
                detailOpportunities.length === 0 ? <div className="py-12 text-center text-[12px] text-[#9ca3af]">暂无关联商机</div> : (
                  <table className="w-full text-[12px]">
                    <thead><tr className="border-b border-[#e5e7eb] bg-[#f9fafb] text-[11px] text-[#6b7280]"><th className="px-4 py-2 text-left font-semibold">商机编号</th><th className="px-4 py-2 text-left font-semibold">服务类型</th><th className="px-4 py-2 text-left font-semibold">阶段</th><th className="px-4 py-2 text-left font-semibold">金额</th><th className="px-4 py-2 text-left font-semibold">状态</th><th className="px-4 py-2 text-left font-semibold">关联企微群</th></tr></thead>
                    <tbody className="divide-y divide-[#f3f4f6]">
                      {detailOpportunities.map((opp) => (
                        <tr key={opp.id} className="hover:bg-[#f9fafb]">
                          <td className="px-4 py-2 font-mono text-[#2563eb]">{opp.opportunityCode}</td>
                          <td className="px-4 py-2 text-[#111827]">{opp.serviceTypeLabel}</td>
                          <td className="px-4 py-2"><span className={`px-1.5 py-0.5 rounded-sm text-[11px] font-semibold ${stageColors[opp.stageId] ?? 'bg-slate-100 text-slate-600'}`}>{opp.stageId}</span></td>
                          <td className="px-4 py-2 font-mono text-[#111827]">{opp.currency} {opp.estimatedAmount.toLocaleString()}</td>
                          <td className="px-4 py-2"><span className={`px-1.5 py-0.5 rounded-sm text-[11px] font-semibold ${opp.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{opp.status === 'active' ? '进行中' : opp.status}</span></td>
                          <td className="px-4 py-2 text-[#6b7280]">{opp.wechatGroupId ? `${opp.wechatGroupId}${opp.wechatGroupName || ''}` : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )
              ) : activeTab === 'followups' ? (
                <div className="p-4">
                  <div className="flex justify-end mb-3">
                    <button onClick={() => setShowAddFollowup(true)} className="flex items-center gap-1 h-7 px-3 rounded-sm bg-[#2563eb] text-[11px] font-medium text-white hover:bg-[#1d4ed8]"><Plus size={12} /> 添加跟进</button>
                  </div>
                  {followupsLoading ? <DetailSkeleton /> : followups.length === 0 ? <div className="py-8 text-center text-[12px] text-[#9ca3af]">暂无跟进记录，点击上方按钮添加</div> : (
                    <div className="space-y-3">
                      {followups.map((f) => (
                        <div key={f.id} className="border border-[#e5e7eb] rounded-sm p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className={`px-1.5 py-0.5 rounded-sm text-[10px] font-medium ${f.followupType === 'call' ? 'bg-blue-100 text-blue-700' : f.followupType === 'visit' ? 'bg-green-100 text-green-700' : f.followupType === 'meeting' ? 'bg-purple-100 text-purple-700' : f.followupType === 'email' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>{f.followupType === 'call' ? '电话' : f.followupType === 'visit' ? '拜访' : f.followupType === 'meeting' ? '会议' : f.followupType === 'email' ? '邮件' : '一般'}</span>
                              <span className="text-[11px] text-[#6b7280]">{f.operatorName}</span>
                            </div>
                            <span className="font-mono text-[10px] text-[#9ca3af]">{new Date(f.createdAt).toLocaleString('zh-CN')}</span>
                          </div>
                          <p className="text-[12px] text-[#374151] whitespace-pre-wrap">{f.content}</p>
                          {f.nextAction && (
                            <div className="mt-2 pt-2 border-t border-[#f3f4f6] flex items-center gap-2 text-[11px]">
                              <Calendar size={11} className="text-[#9ca3af]" />
                              <span className="text-[#6b7280]">下一步:</span>
                              <span className="text-[#111827]">{f.nextAction}</span>
                              {f.nextActionDate && <span className="font-mono text-[#9ca3af]">({new Date(f.nextActionDate).toLocaleDateString('zh-CN')})</span>}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : activeTab === 'companies' ? (
                <div className="p-4">
                  <div className="flex justify-end mb-3">
                    <button onClick={() => setShowAddCompany(true)} className="flex items-center gap-1 h-7 px-3 rounded-sm bg-[#2563eb] text-[11px] font-medium text-white hover:bg-[#1d4ed8]"><Plus size={12} /> 添加关联公司</button>
                  </div>
                  {companiesLoading ? <DetailSkeleton /> : companies.length === 0 ? <div className="py-8 text-center text-[12px] text-[#9ca3af]">暂无关联公司，点击上方按钮添加</div> : (
                    <table className="w-full text-[12px]">
                      <thead><tr className="border-b border-[#e5e7eb] bg-[#f9fafb] text-[11px] text-[#6b7280]"><th className="px-4 py-2 text-left font-semibold">公司名称</th><th className="px-4 py-2 text-left font-semibold">类型</th><th className="px-4 py-2 text-left font-semibold">注册号</th><th className="px-4 py-2 text-left font-semibold">国家/地区</th></tr></thead>
                      <tbody className="divide-y divide-[#f3f4f6]">
                        {companies.map((c) => (
                          <tr key={c.id} className="hover:bg-[#f9fafb]">
                            <td className="px-4 py-2 font-medium text-[#111827]"><div className="flex items-center gap-2"><Building2 size={14} className="text-[#9ca3af]" />{c.companyName}</div></td>
                            <td className="px-4 py-2"><span className={`px-1.5 py-0.5 rounded-sm text-[10px] font-medium ${c.companyType === 'foreign' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>{c.companyType === 'foreign' ? '境外公司' : '国内公司'}</span></td>
                            <td className="px-4 py-2 font-mono text-[11px] text-[#6b7280]">{c.registrationNo ?? '—'}</td>
                            <td className="px-4 py-2"><div className="flex items-center gap-1 text-[11px] text-[#6b7280]"><Globe size={11} />{c.country ?? '—'}</div></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              ) : activeTab === 'contacts' ? (
                <div className="p-4">
                  <div className="flex justify-end mb-3">
                    <button onClick={() => setShowAddContact(true)} className="flex items-center gap-1 h-7 px-3 rounded-sm bg-[#2563eb] text-[11px] font-medium text-white hover:bg-[#1d4ed8]"><Plus size={12} /> 添加联系人</button>
                  </div>
                  {contactsLoading ? <DetailSkeleton /> : contacts.length === 0 ? <div className="py-8 text-center text-[12px] text-[#9ca3af]">暂无联系人，点击上方按钮添加</div> : (
                    <div className="grid gap-3">
                      {contacts.map((contact) => (
                        <div key={contact.id} className="border border-[#e5e7eb] rounded-sm p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <User size={16} className="text-[#6b7280]" />
                              <span className="text-[13px] font-semibold text-[#111827]">{contact.contactName}</span>
                              {contact.isPrimary && <span className="px-1.5 py-0.5 rounded-sm text-[10px] font-medium bg-amber-100 text-amber-700">主要联系人</span>}
                              {contact.position && <span className="text-[11px] text-[#6b7280]">{contact.position}</span>}
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-4 text-[11px] text-[#6b7280]">
                            {contact.phone && <div className="flex items-center gap-1"><Phone size={11} />{contact.phone}</div>}
                            {contact.email && <div className="flex items-center gap-1"><Mail size={11} />{contact.email}</div>}
                            {contact.wechat && <div className="flex items-center gap-1"><MessageCircle size={11} />{contact.wechat}</div>}
                          </div>
                          {contact.notes && <p className="mt-2 text-[11px] text-[#9ca3af]">{contact.notes}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>

      {/* Add Followup Modal */}
      {showAddFollowup && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-[480px] bg-white rounded-sm shadow-lg">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#e5e7eb]">
              <h3 className="text-[14px] font-semibold text-[#111827]">添加跟进记录</h3>
              <button onClick={() => setShowAddFollowup(false)} className="text-[#9ca3af] hover:text-[#111827]"><X size={16} /></button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="block text-[12px] text-[#6b7280] mb-1">跟进类型</label>
                <select value={newFollowupForm.followupType} onChange={(e) => setNewFollowupForm((f) => ({ ...f, followupType: e.target.value }))} className="w-full h-8 px-2 text-[12px] border border-[#e5e7eb] rounded-sm outline-none focus:border-[#2563eb] bg-white">
                  <option value="general">一般</option>
                  <option value="call">电话</option>
                  <option value="visit">拜访</option>
                  <option value="meeting">会议</option>
                  <option value="email">邮件</option>
                </select>
              </div>
              <div>
                <label className="block text-[12px] text-[#6b7280] mb-1">跟进内容 *</label>
                <textarea value={newFollowupForm.content} onChange={(e) => setNewFollowupForm((f) => ({ ...f, content: e.target.value }))} rows={4} className="w-full px-2 py-1.5 text-[12px] border border-[#e5e7eb] rounded-sm outline-none focus:border-[#2563eb] resize-none" placeholder="请描述本次跟进的内容..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] text-[#6b7280] mb-1">下一步计划</label>
                  <input type="text" value={newFollowupForm.nextAction} onChange={(e) => setNewFollowupForm((f) => ({ ...f, nextAction: e.target.value }))} className="w-full h-8 px-2 text-[12px] border border-[#e5e7eb] rounded-sm outline-none focus:border-[#2563eb]" placeholder="可选" />
                </div>
                <div>
                  <label className="block text-[12px] text-[#6b7280] mb-1">下次跟进时间</label>
                  <input type="date" value={newFollowupForm.nextActionDate} onChange={(e) => setNewFollowupForm((f) => ({ ...f, nextActionDate: e.target.value }))} className="w-full h-8 px-2 text-[12px] border border-[#e5e7eb] rounded-sm outline-none focus:border-[#2563eb]" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 px-4 py-3 border-t border-[#e5e7eb]">
              <button onClick={() => setShowAddFollowup(false)} className="h-8 px-3 text-[12px] text-[#6b7280] hover:text-[#111827]">取消</button>
              <button onClick={handleAddFollowup} disabled={!newFollowupForm.content.trim() || addingFollowup} className="h-8 px-4 rounded-sm bg-[#2563eb] text-[12px] font-medium text-white hover:bg-[#1d4ed8] disabled:bg-[#d1d5db] disabled:cursor-not-allowed">{addingFollowup ? '保存中...' : '保存'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Company Modal */}
      {showAddCompany && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-[420px] bg-white rounded-sm shadow-lg">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#e5e7eb]">
              <h3 className="text-[14px] font-semibold text-[#111827]">添加关联公司</h3>
              <button onClick={() => setShowAddCompany(false)} className="text-[#9ca3af] hover:text-[#111827]"><X size={16} /></button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="block text-[12px] text-[#6b7280] mb-1">公司类型</label>
                <select value={newCompanyForm.companyType} onChange={(e) => setNewCompanyForm((f) => ({ ...f, companyType: e.target.value as 'domestic' | 'foreign' }))} className="w-full h-8 px-2 text-[12px] border border-[#e5e7eb] rounded-sm outline-none focus:border-[#2563eb] bg-white">
                  <option value="foreign">境外公司</option>
                  <option value="domestic">国内公司</option>
                </select>
              </div>
              <div>
                <label className="block text-[12px] text-[#6b7280] mb-1">公司名称 *</label>
                <input type="text" value={newCompanyForm.companyName} onChange={(e) => setNewCompanyForm((f) => ({ ...f, companyName: e.target.value }))} className="w-full h-8 px-2 text-[12px] border border-[#e5e7eb] rounded-sm outline-none focus:border-[#2563eb]" placeholder="请输入公司名称" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] text-[#6b7280] mb-1">{newCompanyForm.companyType === 'domestic' ? '统一社会信用代码' : '注册号'}</label>
                  <input type="text" value={newCompanyForm.registrationNo} onChange={(e) => setNewCompanyForm((f) => ({ ...f, registrationNo: e.target.value }))} className="w-full h-8 px-2 text-[12px] font-mono border border-[#e5e7eb] rounded-sm outline-none focus:border-[#2563eb]" placeholder="可选" />
                </div>
                <div>
                  <label className="block text-[12px] text-[#6b7280] mb-1">国家/地区</label>
                  <select value={newCompanyForm.country} onChange={(e) => setNewCompanyForm((f) => ({ ...f, country: e.target.value }))} className="w-full h-8 px-2 text-[12px] border border-[#e5e7eb] rounded-sm outline-none focus:border-[#2563eb] bg-white" disabled={newCompanyForm.companyType === 'domestic'}>
                    {newCompanyForm.companyType === 'domestic' ? <option value="CN">中国 CN</option> : (
                      <>
                        <option value="ID">印度尼西亚 ID</option>
                        <option value="SG">新加坡 SG</option>
                        <option value="MY">马来西亚 MY</option>
                        <option value="TH">泰国 TH</option>
                        <option value="VN">越南 VN</option>
                        <option value="PH">菲律宾 PH</option>
                        <option value="HK">中国香港 HK</option>
                        <option value="OTHER">其他</option>
                      </>
                    )}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 px-4 py-3 border-t border-[#e5e7eb]">
              <button onClick={() => setShowAddCompany(false)} className="h-8 px-3 text-[12px] text-[#6b7280] hover:text-[#111827]">取消</button>
              <button onClick={handleAddCompany} disabled={!newCompanyForm.companyName.trim() || addingCompany} className="h-8 px-4 rounded-sm bg-[#2563eb] text-[12px] font-medium text-white hover:bg-[#1d4ed8] disabled:bg-[#d1d5db] disabled:cursor-not-allowed">{addingCompany ? '保存中...' : '保存'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Create Customer Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-[420px] bg-white rounded-sm shadow-lg">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#e5e7eb]">
              <h3 className="text-[14px] font-semibold text-[#111827]">新增客户</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-[#9ca3af] hover:text-[#111827]"><X size={16} /></button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="block text-[12px] text-[#6b7280] mb-1">客户名称 *</label>
                <input type="text" value={createForm.customerName} onChange={(e) => setCreateForm((f) => ({ ...f, customerName: e.target.value }))} className="w-full h-8 px-2 text-[12px] border border-[#e5e7eb] rounded-sm outline-none focus:border-[#2563eb]" placeholder="请输入客户名称" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] text-[#6b7280] mb-1">电话</label>
                  <input type="text" value={createForm.phone} onChange={(e) => setCreateForm((f) => ({ ...f, phone: e.target.value }))} className="w-full h-8 px-2 text-[12px] font-mono border border-[#e5e7eb] rounded-sm outline-none focus:border-[#2563eb]" placeholder="手机号" />
                </div>
                <div>
                  <label className="block text-[12px] text-[#6b7280] mb-1">微信</label>
                  <input type="text" value={createForm.wechat} onChange={(e) => setCreateForm((f) => ({ ...f, wechat: e.target.value }))} className="w-full h-8 px-2 text-[12px] font-mono border border-[#e5e7eb] rounded-sm outline-none focus:border-[#2563eb]" placeholder="微信号" />
                </div>
              </div>
<div>
  <label className="block text-[12px] text-[#6b7280] mb-1">邮箱</label>
  <input type="text" value={createForm.email} onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))} className="w-full h-8 px-2 text-[12px] border border-[#e5e7eb] rounded-sm outline-none focus:border-[#2563eb]" placeholder="email@example.com" />
  </div>
  <div>
  <label className="block text-[12px] text-[#6b7280] mb-1">行业 *</label>
  <select value={createForm.industry} onChange={(e) => setCreateForm((f) => ({ ...f, industry: e.target.value }))} className="w-full h-8 px-2 text-[12px] border border-[#e5e7eb] rounded-sm outline-none focus:border-[#2563eb] bg-white">
  <option value="">请选择行业</option>
  {INDUSTRY_OPTIONS.map((ind) => <option key={ind.id} value={ind.id}>{ind.zh}</option>)}
  </select>
  </div>
  <div>
  <label className="block text-[12px] text-[#6b7280] mb-1">客户等级</label>
  <select value={createForm.level} onChange={(e) => setCreateForm((f) => ({ ...f, level: e.target.value }))} className="w-full h-8 px-2 text-[12px] border border-[#e5e7eb] rounded-sm outline-none focus:border-[#2563eb] bg-white">
  {CUSTOMER_LEVELS.map((l) => <option key={l.id} value={l.id}>{l.id} - {l.zh}</option>)}
  </select>
  </div>
            </div>
            <div className="flex justify-end gap-2 px-4 py-3 border-t border-[#e5e7eb]">
              <button onClick={() => setShowCreateModal(false)} className="h-8 px-3 text-[12px] text-[#6b7280] hover:text-[#111827]">取消</button>
              <button onClick={handleCreateCustomer} disabled={!createForm.customerName.trim() || creating} className="h-8 px-4 rounded-sm bg-[#2563eb] text-[12px] font-medium text-white hover:bg-[#1d4ed8] disabled:bg-[#d1d5db] disabled:cursor-not-allowed">{creating ? '创建中...' : '创建客户'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Contact Modal */}
      {showAddContact && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-[420px] bg-white rounded-sm shadow-lg">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#e5e7eb]">
              <h3 className="text-[14px] font-semibold text-[#111827]">添加联系人</h3>
              <button onClick={() => setShowAddContact(false)} className="text-[#9ca3af] hover:text-[#111827]"><X size={16} /></button>
            </div>
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] text-[#6b7280] mb-1">姓名 *</label>
                  <input type="text" value={newContactForm.contactName} onChange={(e) => setNewContactForm((f) => ({ ...f, contactName: e.target.value }))} className="w-full h-8 px-2 text-[12px] border border-[#e5e7eb] rounded-sm outline-none focus:border-[#2563eb]" placeholder="联系人姓名" />
                </div>
                <div>
                  <label className="block text-[12px] text-[#6b7280] mb-1">职位</label>
                  <input type="text" value={newContactForm.position} onChange={(e) => setNewContactForm((f) => ({ ...f, position: e.target.value }))} className="w-full h-8 px-2 text-[12px] border border-[#e5e7eb] rounded-sm outline-none focus:border-[#2563eb]" placeholder="例如：总经理" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] text-[#6b7280] mb-1">电话</label>
                  <input type="text" value={newContactForm.phone} onChange={(e) => setNewContactForm((f) => ({ ...f, phone: e.target.value }))} className="w-full h-8 px-2 text-[12px] font-mono border border-[#e5e7eb] rounded-sm outline-none focus:border-[#2563eb]" placeholder="手机号" />
                </div>
                <div>
                  <label className="block text-[12px] text-[#6b7280] mb-1">微信</label>
                  <input type="text" value={newContactForm.wechat} onChange={(e) => setNewContactForm((f) => ({ ...f, wechat: e.target.value }))} className="w-full h-8 px-2 text-[12px] font-mono border border-[#e5e7eb] rounded-sm outline-none focus:border-[#2563eb]" placeholder="微信号" />
                </div>
              </div>
              <div>
                <label className="block text-[12px] text-[#6b7280] mb-1">邮箱</label>
                <input type="text" value={newContactForm.email} onChange={(e) => setNewContactForm((f) => ({ ...f, email: e.target.value }))} className="w-full h-8 px-2 text-[12px] border border-[#e5e7eb] rounded-sm outline-none focus:border-[#2563eb]" placeholder="email@example.com" />
              </div>
              <div>
                <label className="block text-[12px] text-[#6b7280] mb-1">备注</label>
                <textarea value={newContactForm.notes} onChange={(e) => setNewContactForm((f) => ({ ...f, notes: e.target.value }))} rows={2} className="w-full px-2 py-1.5 text-[12px] border border-[#e5e7eb] rounded-sm outline-none focus:border-[#2563eb] resize-none" placeholder="可选备注信息" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isPrimary" checked={newContactForm.isPrimary} onChange={(e) => setNewContactForm((f) => ({ ...f, isPrimary: e.target.checked }))} className="w-4 h-4 rounded border-[#e5e7eb]" />
                <label htmlFor="isPrimary" className="text-[12px] text-[#6b7280]">设为主要联系人</label>
              </div>
            </div>
            <div className="flex justify-end gap-2 px-4 py-3 border-t border-[#e5e7eb]">
              <button onClick={() => setShowAddContact(false)} className="h-8 px-3 text-[12px] text-[#6b7280] hover:text-[#111827]">取消</button>
              <button onClick={handleAddContact} disabled={!newContactForm.contactName.trim() || addingContact} className="h-8 px-4 rounded-sm bg-[#2563eb] text-[12px] font-medium text-white hover:bg-[#1d4ed8] disabled:bg-[#d1d5db] disabled:cursor-not-allowed">{addingContact ? '保存中...' : '保存'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Create Opportunity Dialog */}
      {selectedCustomer && (
        <CreateOpportunityDialog
          customerId={selectedCustomer.id}
          customerName={selectedCustomer.customerName}
          isOpen={showCreateOpportunity}
          onClose={() => setShowCreateOpportunity(false)}
          onSuccess={() => {
            setShowCreateOpportunity(false)
            // 刷新商机列表
            if (selectedCustomer) {
              handleSelectCustomer(selectedCustomer)
            }
          }}
        />
      )}
    </div>
  )
}
