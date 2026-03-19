'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination'
import { Button } from '@/components/ui/button'
import { MoreHorizontal } from 'lucide-react'
import type { OpportunityListRow, OpportunityListResult } from '@/app/actions/opportunity-list'

// ── Helpers ──────────────────────────────────────────────────────────────────

const STAGE_COLORS: Record<string, string> = {
  P1: 'bg-slate-100 text-slate-700 border-slate-200',
  P2: 'bg-blue-50 text-blue-700 border-blue-200',
  P3: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  P4: 'bg-violet-50 text-violet-700 border-violet-200',
  P5: 'bg-amber-50 text-amber-700 border-amber-200',
  P6: 'bg-orange-50 text-orange-700 border-orange-200',
  P7: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  P8: 'bg-green-50 text-green-700 border-green-200',
}

const SERVICE_TYPE_LABELS: Record<string, string> = {
  VISA: '签证服务',
  COMPANY_REGISTRATION: '公司注册',
  FACTORY_SETUP: '工厂落地',
  TAX_SERVICES: '税务服务',
  PERMIT_SERVICES: '许可证服务',
  FINANCIAL_SERVICES: '财务服务',
  IMMIGRATION: '移民服务',
  OTHER: '其他',
}

function formatAmount(amount: number, currency: string): string {
  if (currency === 'IDR') {
    return `Rp ${amount.toLocaleString('id-ID')}`
  }
  if (currency === 'CNY') {
    return `¥ ${amount.toLocaleString('zh-CN')}`
  }
  return `${currency} ${amount.toLocaleString()}`
}

function StatusDot({ status }: { status: string }) {
  const map: Record<string, { dot: string; label: string }> = {
    active: { dot: 'bg-blue-500', label: '进行中' },
    won: { dot: 'bg-emerald-500', label: '已成交' },
    lost: { dot: 'bg-red-400', label: '已丢失' },
  }
  const cfg = map[status] ?? { dot: 'bg-gray-400', label: status }
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px] text-[#374151]">
      <span className={`inline-block size-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

// ── Pagination helper ─────────────────────────────────────────────────────────

function buildPageUrl(
  pathname: string,
  searchParams: URLSearchParams,
  page: number
): string {
  const p = new URLSearchParams(searchParams.toString())
  p.set('page', String(page))
  return `${pathname}?${p.toString()}`
}

function getPageNumbers(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | 'ellipsis')[] = [1]
  if (current > 3) pages.push('ellipsis')
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
    pages.push(i)
  }
  if (current < total - 2) pages.push('ellipsis')
  pages.push(total)
  return pages
}

// ── Main component ────────────────────────────────────────────────────────────

export function OpportunityListTable({ result }: { result: OpportunityListResult }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const { rows, page, totalPages, total } = result

  const handleView = (row: OpportunityListRow) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('nav', 'opportunities')
    params.set('oppId', row.id)
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false })
    })
  }

  const pageNumbers = getPageNumbers(page, totalPages)

  return (
    <div className="flex flex-col gap-3">
      {/* Table */}
      <div className="rounded-md border border-[#e5e7eb] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#f9fafb] hover:bg-[#f9fafb]">
              <TableHead className="text-[12px] font-medium text-[#6b7280] w-36">商机编号</TableHead>
              <TableHead className="text-[12px] font-medium text-[#6b7280]">客户名称</TableHead>
              <TableHead className="text-[12px] font-medium text-[#6b7280] w-20">阶段</TableHead>
              <TableHead className="text-[12px] font-medium text-[#6b7280] w-28">业务类型</TableHead>
              <TableHead className="text-[12px] font-medium text-[#6b7280] text-right w-36">预估金额</TableHead>
              <TableHead className="text-[12px] font-medium text-[#6b7280] w-24">状态</TableHead>
              <TableHead className="text-[12px] font-medium text-[#6b7280] w-24">负责人</TableHead>
              <TableHead className="text-[12px] font-medium text-[#6b7280] w-28">预计成交</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-12 text-[13px] text-[#9ca3af]">
                  暂无商机数据
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="hover:bg-[#f9fafb] cursor-pointer"
                  onClick={() => handleView(row)}
                >
                  <TableCell className="font-mono text-[12px] text-[#2563eb] font-medium">
                    {row.opportunityCode}
                  </TableCell>
                  <TableCell className="text-[13px] text-[#111827]">
                    {row.customer?.customerName ?? '—'}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={`text-[11px] font-medium border ${STAGE_COLORS[row.stageId] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}
                      variant="outline"
                    >
                      {row.stageId}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[12px] text-[#374151]">
                    {row.serviceTypeLabel || SERVICE_TYPE_LABELS[row.serviceType] || row.serviceType}
                  </TableCell>
                  <TableCell className="text-[13px] text-[#111827] text-right font-medium tabular-nums">
                    {formatAmount(row.estimatedAmount, row.currency)}
                  </TableCell>
                  <TableCell>
                    <StatusDot status={row.status} />
                  </TableCell>
                  <TableCell className="text-[12px] text-[#374151]">
                    {row.assignee?.name ?? '—'}
                  </TableCell>
                  <TableCell className="text-[12px] text-[#6b7280]">
                    {row.expectedCloseDate
                      ? new Date(row.expectedCloseDate).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
                      : '—'}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleView(row)}>
                          查看详情
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleView(row)}>
                          编辑商机
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Footer: count + pagination */}
      <div className="flex items-center justify-between px-1">
        <span className="text-[12px] text-[#9ca3af]">
          共 {total} 条记录
        </span>

        {totalPages > 1 && (
          <Pagination className="w-auto mx-0">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href={buildPageUrl(pathname, new URLSearchParams(searchParams.toString()), Math.max(1, page - 1))}
                  aria-disabled={page <= 1}
                  className={page <= 1 ? 'pointer-events-none opacity-40' : ''}
                />
              </PaginationItem>

              {pageNumbers.map((p, i) =>
                p === 'ellipsis' ? (
                  <PaginationItem key={`e-${i}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={p}>
                    <PaginationLink
                      href={buildPageUrl(pathname, new URLSearchParams(searchParams.toString()), p)}
                      isActive={p === page}
                    >
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                )
              )}

              <PaginationItem>
                <PaginationNext
                  href={buildPageUrl(pathname, new URLSearchParams(searchParams.toString()), Math.min(totalPages, page + 1))}
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
