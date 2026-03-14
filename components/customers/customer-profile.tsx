'use client'

import { useState, useMemo } from 'react'
import { ChevronLeft, Plus, Edit2, Archive, ExternalLink, X, Search, Building2, Globe } from 'lucide-react'
import type { ChinaEntity } from '@/lib/types'
import type { CustomerOpportunityRow, CustomerActionLogRow } from '@/app/actions/customer'
import { ChinaEntitySearchDialog } from './china-entity-search-dialog'
import { DomesticEntityCard } from './domestic-entity-card'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'

interface CustomerProfileProps {
  customerId: string
  customerName: string
  level?: string
  phone?: string | null
  email?: string | null
  opportunities: CustomerOpportunityRow[]
  actionLogs: CustomerActionLogRow[]
  onBack: () => void
  onCreateOpportunity?: () => void
}

type TabId = 'opportunities' | 'actions' | 'companies'

interface ForeignEntity {
  id: string
  companyName: string
  country: string
  registrationNumber?: string
  legalPerson?: string
  regCapital?: string
}

export function CustomerProfile({
  customerId,
  customerName,
  level,
  phone,
  email,
  opportunities,
  actionLogs,
  onBack,
  onCreateOpportunity,
}: CustomerProfileProps) {
  const [activeTab, setActiveTab] = useState<TabId>('opportunities')
  const [chinaEntityDialogOpen, setChinaEntityDialogOpen] = useState(false)
  const [chinaEntities, setChinaEntities] = useState<ChinaEntity[]>([])
  const [foreignEntities, setForeignEntities] = useState<ForeignEntity[]>([])
  const [foreignFormOpen, setForeignFormOpen] = useState(false)

  // 商机已经按 customerId 过滤（由父组件传入），直接使用
  const customerOpportunities = opportunities

  const consolidatedActions = useMemo(() => {
    return [...actionLogs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }, [actionLogs])

  const metrics = useMemo(
    () => ({
      totalRevenue: customerOpportunities.reduce((sum, o) => sum + (o.estimatedAmount || 0), 0),
      activeOpportunities: customerOpportunities.filter((o) => o.status === 'active').length,
      lastInteraction: consolidatedActions[0]?.timestamp || '',
    }),
    [customerOpportunities, consolidatedActions]
  )

  const totalCompanies = chinaEntities.length + foreignEntities.length

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header */}
      <div className="border-b border-[#e5e7eb] px-5 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="flex h-8 w-8 items-center justify-center rounded-sm border border-[#e5e7eb] text-[#6b7280] hover:bg-[#f9fafb]"
            >
              <ChevronLeft size={16} />
            </button>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-[12px] text-[#2563eb]">{customerId}</span>
                <span className="text-[14px] font-semibold text-[#111827]">{customerName}</span>
              </div>
              <div className="mt-1 flex gap-1">
                <span className="inline-flex rounded-sm bg-[#f0f9ff] px-1.5 py-0.5 text-[10px] text-[#0369a1]">#制造业</span>
                <span className="inline-flex rounded-sm bg-[#f0f9ff] px-1.5 py-0.5 text-[10px] text-[#0369a1]">#外资PMA</span>
              </div>
            </div>
          </div>

          <div className="flex gap-6">
            <div className="text-center">
              <div className="font-mono text-[13px] font-semibold text-[#111827]">
                ¥{(metrics.totalRevenue / 10000).toFixed(1)}万
              </div>
              <div className="text-[11px] text-[#9ca3af]">累计成交额</div>
            </div>
            <div className="text-center">
              <div className="font-mono text-[13px] font-semibold text-[#111827]">{metrics.activeOpportunities}</div>
              <div className="text-[11px] text-[#9ca3af]">合作中商机</div>
            </div>
            <div className="text-right">
              <div className="text-[12px] font-medium text-[#111827]">
                {metrics.lastInteraction ? new Date(metrics.lastInteraction).toLocaleDateString('zh-CN') : '—'}
              </div>
              <div className="text-[11px] text-[#9ca3af]">最后跟进</div>
            </div>
          </div>

          <div className="flex gap-1.5">
            <button
              onClick={onCreateOpportunity}
              className="flex h-8 items-center gap-1 rounded-sm bg-[#2563eb] px-2 text-[12px] font-medium text-white hover:bg-[#1d4ed8]"
            >
              <Plus size={14} />
              新建商机
            </button>
            <button className="flex h-8 w-8 items-center justify-center rounded-sm border border-[#e5e7eb] text-[#6b7280] hover:bg-[#f9fafb]">
              <Edit2 size={14} />
            </button>
            <button className="flex h-8 w-8 items-center justify-center rounded-sm border border-[#e5e7eb] text-[#6b7280] hover:bg-[#f9fafb]">
              <Archive size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-[#e5e7eb] px-5">
        <div className="flex gap-6">
          {([
            { id: 'opportunities', label: `关联商机 (${customerOpportunities.length})` },
            { id: 'actions',       label: `全量跟进记录 (${consolidatedActions.length})` },
            { id: 'companies',     label: `关联企业${totalCompanies > 0 ? ` (${totalCompanies})` : ''}` },
          ] as const).map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`h-10 text-[13px] font-medium transition-colors ${
                activeTab === id
                  ? 'border-b-2 border-[#2563eb] text-[#2563eb]'
                  : 'border-b-2 border-transparent text-[#6b7280] hover:text-[#111827]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'opportunities' && <OpportunitiesTab opportunities={customerOpportunities} />}
        {activeTab === 'actions' && <ActionsTab actions={consolidatedActions} />}
        {activeTab === 'companies' && (
          <CompaniesTab
            chinaEntities={chinaEntities}
            foreignEntities={foreignEntities}
            onAddChina={() => setChinaEntityDialogOpen(true)}
            onRemoveChina={(id) => setChinaEntities((prev) => prev.filter((e) => e.id !== id))}
            onAddForeign={() => setForeignFormOpen(true)}
            onRemoveForeign={(id) => setForeignEntities((prev) => prev.filter((e) => e.id !== id))}
          />
        )}
      </div>

      {/* China Entity Search Dialog */}
      <ChinaEntitySearchDialog
        open={chinaEntityDialogOpen}
        onOpenChange={setChinaEntityDialogOpen}
        onSelect={(entity) => setChinaEntities((prev) => [...prev, entity])}
      />

      {/* Foreign Entity Form */}
      <ForeignEntityForm
        open={foreignFormOpen}
        onOpenChange={setForeignFormOpen}
        onSave={(entity) => setForeignEntities((prev) => [...prev, entity])}
      />
    </div>
  )
}

// ─── Companies Tab ────────────────────────────────────────────────────────────
function CompaniesTab({
  chinaEntities,
  foreignEntities,
  onAddChina,
  onRemoveChina,
  onAddForeign,
  onRemoveForeign,
}: {
  chinaEntities: ChinaEntity[]
  foreignEntities: ForeignEntity[]
  onAddChina: () => void
  onRemoveChina: (id: string) => void
  onAddForeign: () => void
  onRemoveForeign: (id: string) => void
}) {
  const getStatusColor = (status: string) => {
    if (status === '存续') return { bg: '#f0fdf4', text: '#166534', border: '#bbf7d0' }
    if (status === '吊销') return { bg: '#fef2f2', text: '#991b1b', border: '#fecaca' }
    return { bg: '#f3f4f6', text: '#374151', border: '#e5e7eb' }
  }

  return (
    <div className="p-5 space-y-6">
      {/* 中国境内企业 Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Building2 size={14} className="text-[#128BED]" />
            <span className="text-[13px] font-semibold text-[#111827]">中国境内企业</span>
            <span className="font-mono text-[11px] text-[#9ca3af]">via 天眼查</span>
          </div>
          <button
            onClick={onAddChina}
            className="flex h-7 items-center gap-1 rounded-sm border border-[#128BED] bg-[#f0f9ff] px-2 text-[11px] font-medium text-[#128BED] hover:bg-[#e0f2fe]"
          >
            <Plus size={12} />
            搜索关联
          </button>
        </div>

        {chinaEntities.length === 0 ? (
          <div
            onClick={onAddChina}
            className="flex cursor-pointer flex-col items-center justify-center rounded-sm border border-dashed border-[#d1d5db] bg-[#fafbfc] py-8 text-center hover:border-[#128BED] hover:bg-[#f0f9ff] transition-colors"
          >
            <Building2 size={20} className="mb-2 text-[#9ca3af]" />
            <p className="text-[12px] text-[#6b7280]">点击从天眼查搜索并关联</p>
            <p className="mt-1 text-[11px] text-[#9ca3af]">可关联多个国内主体</p>
          </div>
        ) : (
          <div className="space-y-3">
            {chinaEntities.map((entity) => {
              const sc = getStatusColor(entity.status)
              return (
                <div key={entity.id} className="rounded-sm border border-[#e5e7eb] overflow-hidden">
                  <div className="border-l-4 border-l-[#128BED]">
                    <div className="px-4 py-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold text-[#111827] truncate">{entity.companyName}</p>
                          <p className="mt-0.5 font-mono text-[11px] text-[#6b7280]">{entity.creditCode}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <span
                            className="rounded-sm px-1.5 py-0.5 text-[10px] font-semibold"
                            style={{ background: sc.bg, color: sc.text, border: `1px solid ${sc.border}` }}
                          >
                            {entity.status}
                          </span>
                          <a
                            href={`https://www.tianyancha.com/search?key=${entity.creditCode}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex h-6 w-6 items-center justify-center rounded-sm text-[#9ca3af] hover:bg-[#f3f4f6] hover:text-[#111827]"
                          >
                            <ExternalLink size={12} />
                          </a>
                          <button
                            onClick={() => onRemoveChina(entity.id)}
                            className="flex h-6 w-6 items-center justify-center rounded-sm text-[#9ca3af] hover:bg-[#fee2e2] hover:text-[#dc2626]"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      </div>
                      <div className="mt-2 grid grid-cols-3 gap-3 text-[11px]">
                        <div>
                          <p className="text-[#9ca3af]">法定代表人</p>
                          <p className="mt-0.5 font-medium text-[#374151]">{entity.legalPerson}</p>
                        </div>
                        <div>
                          <p className="text-[#9ca3af]">注册资本</p>
                          <p className="mt-0.5 font-mono font-medium text-[#374151]">{entity.regCapital}</p>
                        </div>
                        {entity.registrationLocation && (
                          <div>
                            <p className="text-[#9ca3af]">注册地</p>
                            <p className="mt-0.5 font-medium text-[#374151]">{entity.registrationLocation}</p>
                          </div>
                        )}
                      </div>
                      {entity.industry && (
                        <p className="mt-2 text-[11px] text-[#6b7280]">行业：{entity.industry}</p>
                      )}
                      {entity.status === '吊销' && (
                        <div className="mt-2 rounded-sm border border-[#fecaca] bg-[#fef2f2] px-2 py-1">
                          <p className="text-[11px] text-[#991b1b]">该实体已吊销，请注意收款风险</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
            <button
              onClick={onAddChina}
              className="flex w-full h-8 items-center justify-center gap-1 rounded-sm border border-dashed border-[#d1d5db] text-[11px] text-[#6b7280] hover:border-[#128BED] hover:text-[#128BED] transition-colors"
            >
              <Plus size={12} />
              继续关联
            </button>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-[#e5e7eb]" />

      {/* 其他国家企业 Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Globe size={14} className="text-[#6b7280]" />
            <span className="text-[13px] font-semibold text-[#111827]">其他国家企业</span>
            <span className="text-[11px] text-[#9ca3af]">手动录入</span>
          </div>
          <button
            onClick={onAddForeign}
            className="flex h-7 items-center gap-1 rounded-sm border border-[#e5e7eb] bg-white px-2 text-[11px] font-medium text-[#374151] hover:bg-[#f9fafb]"
          >
            <Plus size={12} />
            添加企业
          </button>
        </div>

        {foreignEntities.length === 0 ? (
          <div
            onClick={onAddForeign}
            className="flex cursor-pointer flex-col items-center justify-center rounded-sm border border-dashed border-[#d1d5db] bg-[#fafbfc] py-8 text-center hover:border-[#9ca3af] hover:bg-[#f9fafb] transition-colors"
          >
            <Globe size={20} className="mb-2 text-[#9ca3af]" />
            <p className="text-[12px] text-[#6b7280]">手动录入印尼、新加坡等海外企业信息</p>
            <p className="mt-1 text-[11px] text-[#9ca3af]">可关联多个海外主体</p>
          </div>
        ) : (
          <div className="space-y-3">
            {foreignEntities.map((entity) => (
              <div key={entity.id} className="rounded-sm border border-[#e5e7eb] px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-[#111827] truncate">{entity.companyName}</p>
                    <p className="mt-0.5 text-[11px] text-[#6b7280]">{entity.country}</p>
                  </div>
                  <button
                    onClick={() => onRemoveForeign(entity.id)}
                    className="flex h-6 w-6 items-center justify-center rounded-sm text-[#9ca3af] hover:bg-[#fee2e2] hover:text-[#dc2626] shrink-0"
                  >
                    <X size={12} />
                  </button>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-3 text-[11px]">
                  {entity.registrationNumber && (
                    <div>
                      <p className="text-[#9ca3af]">注册号</p>
                      <p className="mt-0.5 font-mono font-medium text-[#374151]">{entity.registrationNumber}</p>
                    </div>
                  )}
                  {entity.legalPerson && (
                    <div>
                      <p className="text-[#9ca3af]">法定代表人</p>
                      <p className="mt-0.5 font-medium text-[#374151]">{entity.legalPerson}</p>
                    </div>
                  )}
                  {entity.regCapital && (
                    <div>
                      <p className="text-[#9ca3af]">注册资本</p>
                      <p className="mt-0.5 font-mono font-medium text-[#374151]">{entity.regCapital}</p>
                    </div>
                  )}
                </div>
                {entity.notes && (
                  <p className="mt-2 text-[11px] text-[#6b7280]">{entity.notes}</p>
                )}
              </div>
            ))}
            <button
              onClick={onAddForeign}
              className="flex w-full h-8 items-center justify-center gap-1 rounded-sm border border-dashed border-[#d1d5db] text-[11px] text-[#6b7280] hover:border-[#9ca3af] hover:text-[#374151] transition-colors"
            >
              <Plus size={12} />
              继续添加
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Foreign Entity Form ──────────────────────────────────────────────────────
const COUNTRIES = ['印度尼西亚', '新加坡', '马来西亚', '香港', '澳门', '泰国', '越南', '美国', '英国', '澳大利亚', '其他']

function ForeignEntityForm({
  open,
  onOpenChange,
  onSave,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onSave: (entity: ForeignEntity) => void
}) {
  const [form, setForm] = useState({
    companyName: '',
    country: '印度尼西亚',
    registrationNumber: '',
    legalPerson: '',
    regCapital: '',
    businessScope: '',
    notes: '',
  })

  const handleSave = () => {
    if (!form.companyName.trim()) return
    onSave({
      id: `FE-${Date.now()}`,
      ...form,
    })
    setForm({ companyName: '', country: '印度尼西亚', registrationNumber: '', legalPerson: '', regCapital: '', businessScope: '', notes: '' })
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[420px] overflow-y-auto" aria-describedby={undefined}>
        <SheetHeader>
          <SheetTitle className="text-[14px] font-semibold">添加海外关联企业</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-3">
          <div>
            <label className="text-[12px] font-medium text-[#6b7280]">企业全名 *</label>
            <input
              type="text"
              value={form.companyName}
              onChange={(e) => setForm((p) => ({ ...p, companyName: e.target.value }))}
              placeholder="PT. Example Indonesia"
              className="mt-1 h-8 w-full rounded-sm border border-[#e5e7eb] bg-white px-2 text-[12px] placeholder-[#9ca3af] outline-none focus:border-[#2563eb]"
            />
          </div>
          <div>
            <label className="text-[12px] font-medium text-[#6b7280]">注册国家 / 地区 *</label>
            <select
              value={form.country}
              onChange={(e) => setForm((p) => ({ ...p, country: e.target.value }))}
              className="mt-1 h-8 w-full rounded-sm border border-[#e5e7eb] bg-white px-2 text-[12px] outline-none focus:border-[#2563eb]"
            >
              {COUNTRIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[12px] font-medium text-[#6b7280]">注册号 / 营业执照号</label>
            <input
              type="text"
              value={form.registrationNumber}
              onChange={(e) => setForm((p) => ({ ...p, registrationNumber: e.target.value }))}
              placeholder="如 NIB: 8120000000000"
              className="mt-1 h-8 w-full rounded-sm border border-[#e5e7eb] bg-white px-2 font-mono text-[12px] placeholder-[#9ca3af] outline-none focus:border-[#2563eb]"
            />
          </div>
          <div>
            <label className="text-[12px] font-medium text-[#6b7280]">法定代表人</label>
            <input
              type="text"
              value={form.legalPerson}
              onChange={(e) => setForm((p) => ({ ...p, legalPerson: e.target.value }))}
              placeholder="Direktur Utama"
              className="mt-1 h-8 w-full rounded-sm border border-[#e5e7eb] bg-white px-2 text-[12px] placeholder-[#9ca3af] outline-none focus:border-[#2563eb]"
            />
          </div>
          <div>
            <label className="text-[12px] font-medium text-[#6b7280]">注册资本</label>
            <input
              type="text"
              value={form.regCapital}
              onChange={(e) => setForm((p) => ({ ...p, regCapital: e.target.value }))}
              placeholder="如 IDR 1.000.000.000"
              className="mt-1 h-8 w-full rounded-sm border border-[#e5e7eb] bg-white px-2 font-mono text-[12px] placeholder-[#9ca3af] outline-none focus:border-[#2563eb]"
            />
          </div>
          <div>
            <label className="text-[12px] font-medium text-[#6b7280]">经营范围</label>
            <textarea
              value={form.businessScope}
              onChange={(e) => setForm((p) => ({ ...p, businessScope: e.target.value }))}
              placeholder="主营业务简述..."
              rows={2}
              className="mt-1 w-full resize-none rounded-sm border border-[#e5e7eb] bg-white p-2 text-[12px] placeholder-[#9ca3af] outline-none focus:border-[#2563eb]"
            />
          </div>
          <div>
            <label className="text-[12px] font-medium text-[#6b7280]">备注</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              placeholder="补充说明..."
              rows={2}
              className="mt-1 w-full resize-none rounded-sm border border-[#e5e7eb] bg-white p-2 text-[12px] placeholder-[#9ca3af] outline-none focus:border-[#2563eb]"
            />
          </div>
          <div className="flex gap-2 border-t border-[#e5e7eb] pt-4">
            <button
              onClick={() => onOpenChange(false)}
              className="flex-1 h-8 rounded-sm border border-[#e5e7eb] text-[12px] font-medium text-[#374151] hover:bg-[#f9fafb]"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              disabled={!form.companyName.trim()}
              className="flex-1 h-8 rounded-sm bg-[#2563eb] text-[12px] font-medium text-white hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:bg-[#d1d5db]"
            >
              保存
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ─── Opportunities Tab ────────────────────────────────────────────────────────
function OpportunitiesTab({ opportunities }: { opportunities: CustomerOpportunityRow[] }) {
  return (
    <div className="p-4">
      {opportunities.length === 0 ? (
        <div className="flex h-40 items-center justify-center text-[13px] text-[#9ca3af]">暂无关联商机</div>
      ) : (
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#e5e7eb] bg-[#f9fafb]">
              {['商机编号', '产品/服务', '阶段', '金额', '状态', '创建日期'].map((h) => (
                <th key={h} className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-[#9ca3af]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {opportunities.map((opp) => (
              <tr key={opp.id} className="border-b border-[#f3f4f6] hover:bg-[#f9fafb]">
                <td className="px-3 py-2 font-mono text-[12px] text-[#2563eb]">{opp.opportunityCode}</td>
                <td className="px-3 py-2 text-[13px] text-[#111827]">{opp.serviceTypeLabel}</td>
                <td className="px-3 py-2">
                  <span className="inline-flex rounded-sm bg-[#e0e7ff] px-1.5 py-0.5 text-[11px] font-medium text-[#4f46e5]">{opp.stageId}</span>
                </td>
                <td className="px-3 py-2 text-right font-mono text-[13px] text-[#111827]">
                  {opp.currency} {opp.estimatedAmount?.toLocaleString()}
                </td>
                <td className="px-3 py-2">
                  <span className={`inline-flex rounded-sm px-1.5 py-0.5 text-[11px] font-medium ${
                    opp.status === 'active' ? 'bg-[#dcfce7] text-[#16a34a]' :
                    opp.status === 'won'    ? 'bg-[#dbeafe] text-[#0284c7]' :
                    'bg-[#fee2e2] text-[#dc2626]'
                  }`}>
                    {opp.status === 'active' ? '活跃' : opp.status === 'won' ? '成交' : '丢失'}
                  </span>
                </td>
                <td className="px-3 py-2 font-mono text-[11px] text-[#9ca3af]">
                  {new Date(opp.createdAt).toLocaleDateString('zh-CN')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

// ─── Leads Tab ────────────────────────────────────────────────────────────────
function LeadsTab({ leads }: { leads: Lead[] }) {
  return (
    <div className="p-4">
      {leads.length === 0 ? (
        <div className="flex h-40 items-center justify-center text-[13px] text-[#9ca3af]">暂无关联线索记录</div>
      ) : (
        <div className="space-y-3">
          {leads.map((lead) => (
            <div key={lead.id} className="rounded-sm border border-[#e5e7eb] p-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[13px] font-medium text-[#111827]">{lead.wechatName}</div>
                  <div className="mt-1 text-[12px] text-[#6b7280]">{lead.initialIntent}</div>
                </div>
                <span className="text-[11px] text-[#9ca3af]">{new Date(lead.createdAt).toLocaleDateString('zh-CN')}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Actions Tab ─────────────────────────────────────────────────────────────
function ActionsTab({ actions, newNote, onNewNoteChange, onAddNote }: {
  actions: ConsolidatedAction[]
  newNote: string
  onNewNoteChange: (v: string) => void
  onAddNote: () => void
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-[#e5e7eb] p-4">
        <div className="flex gap-2">
          <textarea
            value={newNote}
            onChange={(e) => onNewNoteChange(e.target.value)}
            placeholder="添加客户级备注..."
            rows={2}
            className="flex-1 resize-none rounded-sm border border-[#e5e7eb] p-2 text-[12px] placeholder-[#9ca3af] outline-none focus:border-[#2563eb]"
          />
          <button onClick={onAddNote} className="h-16 rounded-sm bg-[#2563eb] px-3 text-[12px] font-medium text-white hover:bg-[#1d4ed8]">添加</button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {actions.length === 0 ? (
          <div className="flex h-40 items-center justify-center text-[13px] text-[#9ca3af]">暂无跟进记录</div>
        ) : actions.map((action, idx) => (
          <div key={action.id} className="relative pb-4">
            <div className="absolute left-[5px] top-2 h-3 w-3 rounded-full bg-[#2563eb]" />
            {idx < actions.length - 1 && <div className="absolute left-[14px] top-5 bottom-0 w-px bg-[#e5e7eb]" />}
            <div className="ml-8">
              <div className="flex items-baseline gap-2">
                <span className="text-[12px] font-medium text-[#111827]">{action.operatorName}</span>
                <span className="text-[11px] text-[#6b7280]">{action.actionLabel}</span>
                {action.opportunityId && (
                  <span className="inline-flex rounded-sm bg-[#f3f4f6] px-1 py-0.5 font-mono text-[10px] text-[#2563eb]">
                    {action.opportunityId} / {action.opportunityStage}
                  </span>
                )}
              </div>
              <div className="mt-1 text-[12px] text-[#6b7280]">{action.remark}</div>
              <div className="mt-1 text-[11px] text-[#9ca3af]">{new Date(action.timestamp).toLocaleString('zh-CN')}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

interface CustomerProfileProps {
  customerId: string
  customerName: string
  opportunities: Opportunity[]
  leads: Lead[]
  actionLogs: Record<string, ActionLog[]>
  onBack: () => void
  onCreateOpportunity?: () => void
  onAddNote?: (note: string) => void
}

type TabId = 'opportunities' | 'leads' | 'actions'

interface ConsolidatedAction {
  id: string
  timestamp: string
  operatorName: string
  actionType: string
  actionLabel: string
  opportunityId?: string
  opportunityStage?: string
  remark: string
  files?: any[]
}

export function CustomerProfile({
  customerId,
  customerName,
  opportunities,
  leads,
  actionLogs,
  onBack,
  onCreateOpportunity,
  onAddNote,
}: CustomerProfileProps) {
  const [activeTab, setActiveTab] = useState<TabId>('opportunities')
  const [newNote, setNewNote] = useState('')
  const [chinaEntityDialogOpen, setChinaEntityDialogOpen] = useState(false)
  const [associatedEntity, setAssociatedEntity] = useState<ChinaEntity | null>(null)

  // Filter customer's opportunities and leads
  const customerOpportunities = useMemo(
    () => opportunities.filter((o) => o.customerId === customerId),
    [opportunities, customerId]
  )

  const customerLeads = useMemo(
    () => leads.filter((l) => l.convertedOpportunityId && customerOpportunities.some((o) => o.id === l.convertedOpportunityId)),
    [leads, customerOpportunities]
  )

  // Consolidate action logs from all customer opportunities
  const consolidatedActions = useMemo(() => {
    const allActions: ConsolidatedAction[] = []
    
    customerOpportunities.forEach((opp) => {
      const logs = actionLogs[opp.id] ?? []
      logs.forEach((log) => {
        allActions.push({
          id: log.id,
          timestamp: log.timestamp,
          operatorName: log.operatorName,
          actionType: log.actionType,
          actionLabel: log.actionLabel,
          opportunityId: opp.id,
          opportunityStage: opp.stageId,
          remark: log.remark,
          files: log.files,
        })
      })
    })

    // Sort by timestamp descending
    return allActions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }, [customerOpportunities, actionLogs])

  // Calculate core metrics
  const metrics = useMemo(
    () => ({
      totalRevenue: customerOpportunities.reduce((sum, o) => sum + (o.estimatedAmount || 0), 0),
      activeOpportunities: customerOpportunities.filter((o) => o.status === 'active').length,
      lastInteraction: consolidatedActions[0]?.timestamp || '',
    }),
    [customerOpportunities, consolidatedActions]
  )

  const handleAddNote = () => {
    if (newNote.trim()) {
      onAddNote?.(newNote)
      setNewNote('')
    }
  }

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header */}
      <div className="border-b border-[#e5e7eb] px-5 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="flex h-8 w-8 items-center justify-center rounded-sm border border-[#e5e7eb] text-[#6b7280] hover:bg-[#f9fafb]"
            >
              <ChevronLeft size={16} />
            </button>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-[12px] text-[#2563eb]">{customerId}</span>
                <span className="text-[14px] font-semibold text-[#111827]">{customerName}</span>
              </div>
              <div className="mt-1 flex gap-1">
                <span className="inline-flex rounded-sm bg-[#f0f9ff] px-1.5 py-0.5 text-[10px] text-[#0369a1]">#制造业</span>
                <span className="inline-flex rounded-sm bg-[#f0f9ff] px-1.5 py-0.5 text-[10px] text-[#0369a1]">#外资PMA</span>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex gap-6">
            <div className="text-center">
              <div className="font-mono text-[13px] font-semibold text-[#111827]">
                ¥{(metrics.totalRevenue / 10000).toFixed(1)}万
              </div>
              <div className="text-[11px] text-[#9ca3af]">累计成交额</div>
            </div>
            <div className="text-center">
              <div className="font-mono text-[13px] font-semibold text-[#111827]">{metrics.activeOpportunities}</div>
              <div className="text-[11px] text-[#9ca3af]">合作中商机</div>
            </div>
            <div className="text-right">
              <div className="text-[12px] font-medium text-[#111827]">
                {metrics.lastInteraction
                  ? new Date(metrics.lastInteraction).toLocaleDateString('zh-CN')
                  : '—'}
              </div>
              <div className="text-[11px] text-[#9ca3af]">最后跟进</div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-1.5">
            <button
              onClick={onCreateOpportunity}
              className="flex h-8 items-center gap-1 rounded-sm bg-[#2563eb] px-2 text-[12px] font-medium text-white hover:bg-[#1d4ed8]"
            >
              <Plus size={14} />
              新建商机
            </button>
            {!associatedEntity && (
              <button
                onClick={() => setChinaEntityDialogOpen(true)}
                className="flex h-8 items-center gap-1 rounded-sm border border-[#128BED] bg-[#f0f9ff] px-2 text-[12px] font-medium text-[#128BED] hover:bg-[#e0f2fe]"
                title="关联国内实体"
              >
                <Plus size={14} />
                国内实体
              </button>
            )}
            <button className="flex h-8 w-8 items-center justify-center rounded-sm border border-[#e5e7eb] text-[#6b7280] hover:bg-[#f9fafb]">
              <Edit2 size={14} />
            </button>
            <button className="flex h-8 w-8 items-center justify-center rounded-sm border border-[#e5e7eb] text-[#6b7280] hover:bg-[#f9fafb]">
              <Archive size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-[#e5e7eb] px-5">
        <div className="flex gap-6">
          {(['opportunities', 'leads', 'actions'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`h-10 text-[13px] font-medium transition-colors ${
                activeTab === tab
                  ? 'border-b-2 border-[#2563eb] text-[#2563eb]'
                  : 'border-b-2 border-transparent text-[#6b7280] hover:text-[#111827]'
              }`}
            >
              {tab === 'opportunities' && `关联商机 (${customerOpportunities.length})`}
              {tab === 'leads' && `关联线索 (${customerLeads.length})`}
              {tab === 'actions' && '全量跟进记录'}
            </button>
          ))}
        </div>
      </div>

      {/* Domestic Entity Card */}
      {associatedEntity && (
        <div className="border-b border-[#e5e7eb] px-5 py-4">
          <DomesticEntityCard
            entity={associatedEntity}
            industry="制造业"
            contactPerson={customerName}
            businessMatch="high"
            riskLevel="low"
            onRemove={() => setAssociatedEntity(null)}
          />
        </div>
      )}

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'opportunities' && (
          <OpportunitiesTab opportunities={customerOpportunities} />
        )}
        {activeTab === 'leads' && (
          <LeadsTab leads={customerLeads} />
        )}
        {activeTab === 'actions' && (
          <ActionsTab 
            actions={consolidatedActions} 
            newNote={newNote}
            onNewNoteChange={setNewNote}
            onAddNote={handleAddNote}
          />
        )}
      </div>

      {/* China Entity Search Dialog */}
      <ChinaEntitySearchDialog
        open={chinaEntityDialogOpen}
        onOpenChange={setChinaEntityDialogOpen}
        onSelect={(entity) => setAssociatedEntity(entity)}
      />
    </div>
  )
}

function OpportunitiesTab({ opportunities }: { opportunities: Opportunity[] }) {
  return (
    <div className="p-4">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[#e5e7eb] bg-[#f9fafb]">
            <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-[#9ca3af]">商机编号</th>
            <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-[#9ca3af]">产品名称</th>
            <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-[#9ca3af]">阶段</th>
            <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wider text-[#9ca3af]">金额</th>
            <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-[#9ca3af]">创建人</th>
            <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-[#9ca3af]">状态</th>
          </tr>
        </thead>
        <tbody>
          {opportunities.map((opp) => (
            <tr key={opp.id} className="border-b border-[#f3f4f6] hover:bg-[#f9fafb]">
              <td className="px-3 py-2">
                <span className="font-mono text-[12px] text-[#2563eb]">{opp.id}</span>
              </td>
              <td className="px-3 py-2 text-[13px] text-[#111827]">{opp.serviceTypeLabel}</td>
              <td className="px-3 py-2">
                <span className="inline-flex rounded-sm bg-[#e0e7ff] px-1.5 py-0.5 text-[11px] font-medium text-[#4f46e5]">
                  {opp.stageId}
                </span>
              </td>
              <td className="px-3 py-2 text-right font-mono text-[13px] text-[#111827]">
                ¥{opp.estimatedAmount?.toLocaleString()}
              </td>
              <td className="px-3 py-2 text-[13px] text-[#6b7280]">{opp.assignee}</td>
              <td className="px-3 py-2">
                <span className={`inline-flex rounded-sm px-1.5 py-0.5 text-[11px] font-medium ${
                  opp.status === 'active' ? 'bg-[#dcfce7] text-[#16a34a]' :
                  opp.status === 'won' ? 'bg-[#dbeafe] text-[#0284c7]' :
                  'bg-[#fee2e2] text-[#dc2626]'
                }`}>
                  {opp.status === 'active' ? '活跃' : opp.status === 'won' ? '成交' : '丢失'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function LeadsTab({ leads }: { leads: Lead[] }) {
  return (
    <div className="p-4">
      {leads.length === 0 ? (
        <div className="flex h-40 items-center justify-center text-[13px] text-[#9ca3af]">
          暂无关联线索记录
        </div>
      ) : (
        <div className="space-y-3">
          {leads.map((lead) => (
            <div key={lead.id} className="rounded-sm border border-[#e5e7eb] bg-white p-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[13px] font-medium text-[#111827]">{lead.wechatName}</div>
                  <div className="mt-1 text-[12px] text-[#6b7280]">{lead.initialIntent}</div>
                </div>
                <span className="text-[11px] text-[#9ca3af]">
                  {new Date(lead.createdAt).toLocaleDateString('zh-CN')}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-2 text-[11px] text-[#6b7280]">
                <span className="inline-flex rounded-sm bg-[#f3f4f6] px-1.5 py-0.5">来源：{lead.source}</span>
                <span className="inline-flex rounded-sm bg-[#f3f4f6] px-1.5 py-0.5">
                  转化：{lead.convertedOpportunityId ? '已转化' : '未转化'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ActionsTab({
  actions,
  newNote,
  onNewNoteChange,
  onAddNote,
}: {
  actions: ConsolidatedAction[]
  newNote: string
  onNewNoteChange: (note: string) => void
  onAddNote: () => void
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Quick Add Note */}
      <div className="border-b border-[#e5e7eb] p-4">
        <div className="flex gap-2">
          <textarea
            value={newNote}
            onChange={(e) => onNewNoteChange(e.target.value)}
            placeholder="添加客户级备注..."
            rows={2}
            className="flex-1 rounded-sm border border-[#e5e7eb] bg-white p-2 text-[12px] text-[#111827] placeholder-[#9ca3af] outline-none focus:border-[#2563eb] resize-none"
          />
          <button
            onClick={onAddNote}
            className="h-16 rounded-sm bg-[#2563eb] px-3 text-[12px] font-medium text-white hover:bg-[#1d4ed8]"
          >
            添加
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {actions.length === 0 ? (
            <div className="flex h-40 items-center justify-center text-[13px] text-[#9ca3af]">
              暂无跟进记录
            </div>
          ) : (
            actions.map((action, idx) => (
              <div key={action.id} className="relative pb-4">
                {/* Timeline dot and line */}
                <div className="absolute left-[5px] top-2 h-3 w-3 rounded-full bg-[#2563eb]" />
                {idx < actions.length - 1 && (
                  <div className="absolute left-[14px] top-5 bottom-0 w-px bg-[#e5e7eb]" />
                )}

                {/* Content */}
                <div className="ml-8">
                  <div className="flex items-baseline gap-2">
                    <span className="text-[12px] font-medium text-[#111827]">{action.operatorName}</span>
                    <span className="text-[11px] text-[#6b7280]">{action.actionLabel}</span>
                    {action.opportunityId && (
                      <span className="inline-flex rounded-sm bg-[#f3f4f6] px-1 py-0.5 font-mono text-[10px] text-[#2563eb]">
                        {action.opportunityId} / {action.opportunityStage}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-[12px] text-[#6b7280]">{action.remark}</div>
                  <div className="mt-1 text-[11px] text-[#9ca3af]">
                    {new Date(action.timestamp).toLocaleString('zh-CN')}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
