'use client'

import { useEffect, useState, useCallback, useTransition, useRef } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Collapsible,
  CollapsibleContent,
} from '@/components/ui/collapsible'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination'
import { Search, SlidersHorizontal, X, ArrowUpDown, ArrowUp, ArrowDown, InboxIcon } from 'lucide-react'
import { getOpportunityListAction, type OpportunityListRow, type OpportunityListResult } from '@/app/actions/opportunity-list'
import { getAssigneesAction, type AssigneeOption } from '@/app/actions/get-assignees'
import { DateRangePicker } from '@/components/opportunities/date-range-picker'

// ── Constants ──────────────────────────────────────────────────────────────────

const STAGES = [
  { value: 'P1', label: 'P1 初步接触' },
  { value: 'P2', label: 'P2 需求确认' },
  { value: 'P3', label: 'P3 方案制定' },
  { value: 'P4', label: 'P4 报价提交' },
  { value: 'P5', label: 'P5 谈判协商' },
  { value: 'P6', label: 'P6 合同审核' },
  { value: 'P7', label: 'P7 等待签约' },
  { value: 'P8', label: 'P8 已成交' },
]

const STATUS_OPTIONS = [
  { value: 'active', label: '进行中' },
  { value: 'won', label: '已成交' },
  { value: 'lost', label: '已丢失' },
]

const SERVICE_TYPE_OPTIONS = [
  { value: 'VISA', label: '签证服务' },
  { value: 'COMPANY_REGISTRATION', label: '公司注册' },
  { value: 'FACTORY_SETUP', label: '工厂落地' },
  { value: 'TAX_SERVICES', label: '税务服务' },
  { value: 'PERMIT_SERVICES', label: '许可证服务' },
  { value: 'FINANCIAL_SERVICES', label: '财务服务' },
  { value: 'IMMIGRATION', label: '移民服务' },
  { value: 'OTHER', label: '其他' },
]

const SERVICE_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  SERVICE_TYPE_OPTIONS.map((o) => [o.value, o.label])
)

const STAGE_COLORS: Record<string, string> = {
  P1: 'bg-slate-100 text-slate-600 border-slate-200',
  P2: 'bg-slate-100 text-slate-600 border-slate-200',
  P3: 'bg-blue-50 text-blue-700 border-blue-200',
  P4: 'bg-blue-50 text-blue-700 border-blue-200',
  P5: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  P6: 'bg-violet-50 text-violet-700 border-violet-200',
  P7: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  P8: 'bg-green-50 text-green-700 border-green-200',
}

const SORTABLE_COLUMNS = [
  { field: 'estimatedAmount', label: '预估金额' },
  { field: 'expectedCloseDate', label: '预计成交' },
  { field: 'createdAt', label: '创建时间' },
  { field: 'updatedAt', label: '更新时间' },
]

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatAmount(amount: number, currency: string): string {
  if (currency === 'IDR') return `Rp ${amount.toLocaleString('id-ID')}`
  if (currency === 'CNY') return `¥ ${amount.toLocaleString('zh-CN')}`
  return `${currency} ${amount.toLocaleString()}`
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { dot: string; label: string }> = {
    active: { dot: 'bg-blue-500', label: '进行中' },
    won:    { dot: 'bg-emerald-500', label: '已成交' },
    lost:   { dot: 'bg-red-400', label: '已丢失' },
  }
  const cfg = map[status] ?? { dot: 'bg-gray-400', label: status }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-[#374151]">
      <span className={`inline-block size-1.5 rounded-full shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

function SortIcon({ field, sortField, sortOrder }: { field: string; sortField: string; sortOrder: string }) {
  if (sortField !== field) return <ArrowUpDown className="size-3 ml-1 text-[#9ca3af]" />
  return sortOrder === 'asc'
    ? <ArrowUp className="size-3 ml-1 text-[#2563eb]" />
    : <ArrowDown className="size-3 ml-1 text-[#2563eb]" />
}

function getPageNumbers(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | 'ellipsis')[] = [1]
  if (current > 3) pages.push('ellipsis')
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i)
  if (current < total - 2) pages.push('ellipsis')
  pages.push(total)
  return pages
}

function fmtDate(d: string | null | undefined) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

// ── Main Component ─────────────────────────────────────────────────────────────

export function OpportunityListView() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  // ── URL state ──
  const search = searchParams.get('search') ?? ''
  const stages = searchParams.get('stages')?.split(',').filter(Boolean) ?? []
  const status = searchParams.get('status') ?? ''
  const serviceTypes = searchParams.get('serviceTypes')?.split(',').filter(Boolean) ?? []
  const assigneeId = searchParams.get('assigneeId') ?? ''
  const minAmount = searchParams.get('minAmount') ?? ''
  const maxAmount = searchParams.get('maxAmount') ?? ''
  const dateFrom = searchParams.get('dateFrom') ?? ''
  const dateTo = searchParams.get('dateTo') ?? ''
  const sortField = searchParams.get('sort') ?? 'createdAt'
  const sortOrder = (searchParams.get('order') ?? 'desc') as 'asc' | 'desc'
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1)
  const pageSize = parseInt(searchParams.get('pageSize') ?? '20', 10) || 20

  // ── Local state ──
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [result, setResult] = useState<OpportunityListResult>({
    rows: [], total: 0, page: 1, pageSize: 20, totalPages: 0,
  })
  const [loading, setLoading] = useState(true)
  const [assignees, setAssignees] = useState<AssigneeOption[]>([])

  // Draft filter state (applied on "Apply" click)
  const [draftStages, setDraftStages] = useState<string[]>(stages)
  const [draftStatus, setDraftStatus] = useState(status)
  const [draftServiceTypes, setDraftServiceTypes] = useState<string[]>(serviceTypes)
  const [draftAssigneeId, setDraftAssigneeId] = useState(assigneeId)
  const [draftMinAmount, setDraftMinAmount] = useState(minAmount)
  const [draftMaxAmount, setDraftMaxAmount] = useState(maxAmount)
  const [draftDateFrom, setDraftDateFrom] = useState(dateFrom)
  const [draftDateTo, setDraftDateTo] = useState(dateTo)

  const hasActiveFilters = !!(stages.length || status || serviceTypes.length || assigneeId || minAmount || maxAmount || dateFrom || dateTo)

  // Load assignees once
  useEffect(() => {
    getAssigneesAction().then(setAssignees)
  }, [])

  // Sync draft when URL changes (e.g. browser back)
  useEffect(() => {
    setDraftStages(stages)
    setDraftStatus(status)
    setDraftServiceTypes(serviceTypes)
    setDraftAssigneeId(assigneeId)
    setDraftMinAmount(minAmount)
    setDraftMaxAmount(maxAmount)
    setDraftDateFrom(dateFrom)
    setDraftDateTo(dateTo)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()])

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true)
    const data = await getOpportunityListAction({
      page,
      pageSize,
      search: search || undefined,
      stages: stages.length ? stages : undefined,
      status: status || undefined,
      serviceTypes: serviceTypes.length ? serviceTypes : undefined,
      assigneeId: assigneeId || undefined,
      minAmount: minAmount ? Number(minAmount) : undefined,
      maxAmount: maxAmount ? Number(maxAmount) : undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      sortField,
      sortOrder,
    })
    setResult(data)
    setLoading(false)
  }, [page, pageSize, search, stages.join(','), status, serviceTypes.join(','), assigneeId, minAmount, maxAmount, dateFrom, dateTo, sortField, sortOrder])

  useEffect(() => { fetchData() }, [fetchData])

  // ── URL helpers ──
  const pushParams = useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())
    for (const [k, v] of Object.entries(updates)) {
      if (v === null || v === '') params.delete(k)
      else params.set(k, v)
    }
    params.delete('page')
    startTransition(() => router.push(`${pathname}?${params.toString()}`, { scroll: false }))
  }, [searchParams, pathname, router])

  // Debounced search
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      pushParams({ search: val || null })
    }, 300)
  }, [pushParams])

  // Sort toggle
  const handleSort = useCallback((field: string) => {
    if (sortField === field) {
      pushParams({ sort: field, order: sortOrder === 'asc' ? 'desc' : 'asc' })
    } else {
      pushParams({ sort: field, order: 'desc' })
    }
  }, [sortField, sortOrder, pushParams])

  // Apply filters
  const applyFilters = useCallback(() => {
    pushParams({
      stages: draftStages.length ? draftStages.join(',') : null,
      status: draftStatus || null,
      serviceTypes: draftServiceTypes.length ? draftServiceTypes.join(',') : null,
      assigneeId: draftAssigneeId || null,
      minAmount: draftMinAmount || null,
      maxAmount: draftMaxAmount || null,
      dateFrom: draftDateFrom || null,
      dateTo: draftDateTo || null,
    })
    setFiltersOpen(false)
  }, [draftStages, draftStatus, draftServiceTypes, draftAssigneeId, draftMinAmount, draftMaxAmount, draftDateFrom, draftDateTo, pushParams])

  // Reset filters
  const resetFilters = useCallback(() => {
    setDraftStages([])
    setDraftStatus('')
    setDraftServiceTypes([])
    setDraftAssigneeId('')
    setDraftMinAmount('')
    setDraftMaxAmount('')
    setDraftDateFrom('')
    setDraftDateTo('')
  }, [])

  const clearAllFilters = useCallback(() => {
    pushParams({ stages: null, status: null, serviceTypes: null, assigneeId: null, minAmount: null, maxAmount: null, dateFrom: null, dateTo: null })
  }, [pushParams])

  const buildPageUrl = (p: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', String(p))
    return `${pathname}?${params.toString()}`
  }

  const handleViewOpp = useCallback((row: OpportunityListRow) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('nav', 'opportunities')
    params.set('oppId', row.id)
    startTransition(() => router.push(`${pathname}?${params.toString()}`, { scroll: false }))
  }, [searchParams, pathname, router])

  const toggleMulti = (arr: string[], val: string, set: (v: string[]) => void) => {
    set(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val])
  }

  const { rows, total, totalPages } = result
  const pageNumbers = getPageNumbers(page, totalPages)

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-[#e5e7eb] shrink-0">
        <div>
          <h1 className="text-[15px] font-semibold text-[#111827]">商机管理</h1>
          <p className="text-xs text-[#9ca3af] mt-0.5">共 {total} 条商机记录</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="px-6 py-3 border-b border-[#e5e7eb] shrink-0 space-y-2">
        {/* Row 1 */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-[#9ca3af]" />
            <Input
              placeholder="搜索商机编号或客户名称..."
              defaultValue={search}
              onChange={handleSearch}
              className="pl-8 h-8 text-[13px]"
            />
          </div>
          <Button
            variant={filtersOpen ? 'secondary' : 'outline'}
            size="sm"
            className="h-8 text-[12px] gap-1.5"
            onClick={() => setFiltersOpen((v) => !v)}
          >
            <SlidersHorizontal className="size-3.5" />
            高级筛选
            {hasActiveFilters && (
              <span className="ml-0.5 flex size-4 items-center justify-center rounded-full bg-[#2563eb] text-[10px] text-white font-bold">
                {[stages.length > 0, !!status, serviceTypes.length > 0, !!assigneeId, !!minAmount || !!maxAmount, !!dateFrom || !!dateTo].filter(Boolean).length}
              </span>
            )}
          </Button>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" className="h-8 text-[12px] text-[#6b7280] gap-1 px-2" onClick={clearAllFilters}>
              <X className="size-3" />
              清除筛选
            </Button>
          )}
        </div>

        {/* Row 2 — collapsible advanced filters */}
        <Collapsible open={filtersOpen}>
          <CollapsibleContent>
            <div className="rounded-lg border border-[#e5e7eb] bg-slate-50 p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">

                {/* Stage multi-select */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-[#6b7280] uppercase tracking-wide">所处阶段</label>
                  <div className="flex flex-wrap gap-1.5">
                    {STAGES.map((s) => (
                      <button
                        key={s.value}
                        type="button"
                        onClick={() => toggleMulti(draftStages, s.value, setDraftStages)}
                        className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium border transition-colors ${
                          draftStages.includes(s.value)
                            ? 'bg-[#2563eb] text-white border-[#2563eb]'
                            : 'bg-white text-[#374151] border-[#d1d5db] hover:border-[#2563eb]'
                        }`}
                      >
                        {s.value}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Status */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-[#6b7280] uppercase tracking-wide">状态</label>
                  <Select value={draftStatus || 'all'} onValueChange={(v) => setDraftStatus(v === 'all' ? '' : v)}>
                    <SelectTrigger className="h-8 text-[12px] bg-white">
                      <SelectValue placeholder="所有状态" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">所有状态</SelectItem>
                      {STATUS_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Service type multi-select */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-[#6b7280] uppercase tracking-wide">业务类型</label>
                  <div className="flex flex-wrap gap-1.5">
                    {SERVICE_TYPE_OPTIONS.map((o) => (
                      <button
                        key={o.value}
                        type="button"
                        onClick={() => toggleMulti(draftServiceTypes, o.value, setDraftServiceTypes)}
                        className={`inline-flex items-center rounded px-2 py-0.5 text-[11px] font-medium border transition-colors ${
                          draftServiceTypes.includes(o.value)
                            ? 'bg-[#2563eb] text-white border-[#2563eb]'
                            : 'bg-white text-[#374151] border-[#d1d5db] hover:border-[#2563eb]'
                        }`}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Assignee */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-[#6b7280] uppercase tracking-wide">负责人</label>
                  <Select value={draftAssigneeId || 'all'} onValueChange={(v) => setDraftAssigneeId(v === 'all' ? '' : v)}>
                    <SelectTrigger className="h-8 text-[12px] bg-white">
                      <SelectValue placeholder="所有负责人" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">所有负责人</SelectItem>
                      {assignees.map((a) => (
                        <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Amount range */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-[#6b7280] uppercase tracking-wide">金额区间</label>
                  <div className="flex items-center gap-1.5">
                    <Input
                      placeholder="最小金额"
                      value={draftMinAmount}
                      onChange={(e) => setDraftMinAmount(e.target.value)}
                      className="h-8 text-[12px] bg-white"
                      type="number"
                    />
                    <span className="text-[#9ca3af] text-xs shrink-0">—</span>
                    <Input
                      placeholder="最大金额"
                      value={draftMaxAmount}
                      onChange={(e) => setDraftMaxAmount(e.target.value)}
                      className="h-8 text-[12px] bg-white"
                      type="number"
                    />
                  </div>
                </div>

                {/* Date range */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-[#6b7280] uppercase tracking-wide">预计成交时间</label>
                  <DateRangePicker
                    from={draftDateFrom || undefined}
                    to={draftDateTo || undefined}
                    onChange={(f, t) => { setDraftDateFrom(f ?? ''); setDraftDateTo(t ?? '') }}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Filter actions */}
              <div className="flex items-center justify-end gap-2 pt-1 border-t border-[#e5e7eb]">
                <Button variant="ghost" size="sm" className="h-7 text-[12px]" onClick={resetFilters}>
                  重置
                </Button>
                <Button size="sm" className="h-7 text-[12px]" onClick={applyFilters}>
                  应用筛选
                </Button>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#f9fafb] hover:bg-[#f9fafb]">
              <TableHead className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-wide w-36 sticky top-0 bg-[#f9fafb] z-10 py-2">商机编号</TableHead>
              <TableHead className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-wide min-w-[180px] sticky top-0 bg-[#f9fafb] z-10 py-2">客户信息</TableHead>
              <TableHead className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-wide w-20 sticky top-0 bg-[#f9fafb] z-10 py-2">阶段</TableHead>
              <TableHead className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-wide w-24 sticky top-0 bg-[#f9fafb] z-10 py-2">业务类型</TableHead>
              <TableHead
                className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-wide text-right w-36 sticky top-0 bg-[#f9fafb] z-10 py-2 cursor-pointer select-none hover:text-[#111827]"
                onClick={() => handleSort('estimatedAmount')}
              >
                <span className="inline-flex items-center justify-end w-full">
                  预估金额
                  <SortIcon field="estimatedAmount" sortField={sortField} sortOrder={sortOrder} />
                </span>
              </TableHead>
              <TableHead className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-wide w-20 sticky top-0 bg-[#f9fafb] z-10 py-2">状态</TableHead>
              <TableHead className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-wide w-20 sticky top-0 bg-[#f9fafb] z-10 py-2">负责人</TableHead>
              <TableHead className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-wide w-24 sticky top-0 bg-[#f9fafb] z-10 py-2">目的地</TableHead>
              <TableHead
                className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-wide w-24 sticky top-0 bg-[#f9fafb] z-10 py-2 cursor-pointer select-none hover:text-[#111827]"
                onClick={() => handleSort('expectedCloseDate')}
              >
                <span className="inline-flex items-center">
                  预计成交
                  <SortIcon field="expectedCloseDate" sortField={sortField} sortOrder={sortOrder} />
                </span>
              </TableHead>
              <TableHead className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-wide w-24 sticky top-0 bg-[#f9fafb] z-10 py-2">实际成交</TableHead>
              <TableHead className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-wide sticky top-0 bg-[#f9fafb] z-10 py-2">企微群</TableHead>
              <TableHead
                className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-wide w-24 sticky top-0 bg-[#f9fafb] z-10 py-2 cursor-pointer select-none hover:text-[#111827]"
                onClick={() => handleSort('createdAt')}
              >
                <span className="inline-flex items-center">
                  创建时间
                  <SortIcon field="createdAt" sortField={sortField} sortOrder={sortOrder} />
                </span>
              </TableHead>
              <TableHead
                className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-wide w-24 sticky top-0 bg-[#f9fafb] z-10 py-2 cursor-pointer select-none hover:text-[#111827]"
                onClick={() => handleSort('updatedAt')}
              >
                <span className="inline-flex items-center">
                  更新时间
                  <SortIcon field="updatedAt" sortField={sortField} sortOrder={sortOrder} />
                </span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 13 }).map((_, j) => (
                    <TableCell key={j} className="py-2">
                      <div className="h-4 rounded bg-[#f3f4f6] animate-pulse" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={13} className="py-20">
                  <div className="flex flex-col items-center gap-3 text-center">
                    <InboxIcon className="size-10 text-[#d1d5db]" />
                    <div>
                      <p className="text-sm font-medium text-[#374151]">暂无商机数据</p>
                      <p className="text-xs text-[#9ca3af] mt-1">
                        {hasActiveFilters ? '尝试调整筛选条件' : '还没有任何商机记录'}
                      </p>
                    </div>
                    {hasActiveFilters && (
                      <Button variant="outline" size="sm" className="text-xs h-7" onClick={clearAllFilters}>
                        清除所有筛选
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="hover:bg-[#f9fafb] cursor-pointer group"
                  onClick={() => handleViewOpp(row)}
                >
                  <TableCell className="py-2">
                    <span
                      className="font-mono text-xs text-[#2563eb] font-medium hover:underline"
                      onClick={(e) => { e.stopPropagation(); handleViewOpp(row) }}
                    >
                      {row.opportunityCode}
                    </span>
                  </TableCell>
                  <TableCell className="py-2">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium text-[#111827] leading-tight">{row.customer?.customerName ?? '—'}</span>
                      {row.customer?.customerCode && (
                        <span className="text-[10px] text-[#9ca3af] font-mono">{row.customer.customerCode}</span>
                      )}
                      <div className="flex flex-wrap gap-x-2 mt-0.5">
                        {row.customer?.phone && <span className="text-[10px] text-[#6b7280]">📞 {row.customer.phone}</span>}
                        {row.customer?.wechat && <span className="text-[10px] text-[#6b7280]">💬 {row.customer.wechat}</span>}
                        {row.customer?.email && <span className="text-[10px] text-[#6b7280]">✉ {row.customer.email}</span>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-2">
                    <Badge className={`text-[10px] font-medium border px-1.5 py-0 ${STAGE_COLORS[row.stageId] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`} variant="outline">
                      {row.stageId}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-2 text-xs text-[#374151]">
                    {row.serviceTypeLabel || SERVICE_TYPE_LABELS[row.serviceType] || row.serviceType}
                  </TableCell>
                  <TableCell className="py-2 text-sm text-[#111827] text-right font-semibold tabular-nums">
                    {formatAmount(row.estimatedAmount, row.currency)}
                  </TableCell>
                  <TableCell className="py-2">
                    <StatusBadge status={row.status} />
                  </TableCell>
                  <TableCell className="py-2 text-xs text-[#374151]">{row.assignee?.name ?? '—'}</TableCell>
                  <TableCell className="py-2 text-xs text-[#6b7280]">{row.destination || '—'}</TableCell>
                  <TableCell className="py-2 text-xs text-[#6b7280]">{fmtDate(row.expectedCloseDate)}</TableCell>
                  <TableCell className="py-2 text-xs text-[#6b7280]">{fmtDate(row.actualCloseDate)}</TableCell>
                  <TableCell className="py-2 text-xs text-[#6b7280] whitespace-nowrap" title={row.wechatGroupName ?? undefined}>
                    {row.wechatGroupId && row.wechatGroupName ? `#${row.wechatGroupId} ${row.wechatGroupName}` : row.wechatGroupName || '—'}
                  </TableCell>
                  <TableCell className="py-2 text-xs text-[#6b7280]">{fmtDate(row.createdAt)}</TableCell>
                  <TableCell className="py-2 text-xs text-[#6b7280]">{fmtDate(row.updatedAt)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-6 py-3 border-t border-[#e5e7eb] shrink-0 bg-white">
        <div className="flex items-center gap-3">
          <span className="text-xs text-[#9ca3af]">共 {total} 条，第 {page} / {totalPages || 1} 页</span>
          <Select
            value={String(pageSize)}
            onValueChange={(v) => {
              const params = new URLSearchParams(searchParams.toString())
              params.set('pageSize', v)
              params.delete('page')
              startTransition(() => router.push(`${pathname}?${params.toString()}`, { scroll: false }))
            }}
          >
            <SelectTrigger className="h-7 w-24 text-[12px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 20, 50, 100].map((n) => (
                <SelectItem key={n} value={String(n)}>每页 {n} 条</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {totalPages > 1 && (
          <Pagination className="w-auto mx-0">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href={buildPageUrl(Math.max(1, page - 1))}
                  aria-disabled={page <= 1}
                  className={page <= 1 ? 'pointer-events-none opacity-40' : ''}
                />
              </PaginationItem>
              {pageNumbers.map((p, i) =>
                p === 'ellipsis' ? (
                  <PaginationItem key={`e-${i}`}><PaginationEllipsis /></PaginationItem>
                ) : (
                  <PaginationItem key={p}>
                    <PaginationLink href={buildPageUrl(p)} isActive={p === page}>{p}</PaginationLink>
                  </PaginationItem>
                )
              )}
              <PaginationItem>
                <PaginationNext
                  href={buildPageUrl(Math.min(totalPages, page + 1))}
                  aria-disabled={page >= totalPages}
                  className={page >= totalPages ? 'pointer-events-none opacity-40' : ''}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
    </div>
  )
}
