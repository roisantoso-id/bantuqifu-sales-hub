'use client'

import { useState } from 'react'
import {
  Flame, Thermometer, Snowflake, Clock,
  UserPlus, MoreHorizontal, ArrowUpRight,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { toast } from 'sonner'
import { claimLeadAction, discardLeadAction, type LeadRow } from '@/app/actions/lead'
import { ConvertToOppDialog } from './convert-to-opp-dialog'
import {
  getLeadStatusLabel,
  getLeadSourceLabel,
  getLeadUrgencyLabel,
  getLeadCategoryLabel,
} from '@/lib/lead-labels'

// Urgency indicator
const URGENCY_MAP: Record<string, { icon: React.ReactNode; cls: string; dot: string }> = {
  HIGH:   { icon: <Flame className="h-3 w-3" />,       cls: 'text-red-600',   dot: 'bg-red-500'    },
  HOT:    { icon: <Flame className="h-3 w-3" />,       cls: 'text-red-600',   dot: 'bg-red-500'    },
  MEDIUM: { icon: <Thermometer className="h-3 w-3" />, cls: 'text-amber-600', dot: 'bg-amber-400'  },
  WARM:   { icon: <Thermometer className="h-3 w-3" />, cls: 'text-amber-600', dot: 'bg-amber-400'  },
  LOW:    { icon: <Snowflake className="h-3 w-3" />,   cls: 'text-blue-500',  dot: 'bg-blue-400'   },
  COLD:   { icon: <Snowflake className="h-3 w-3" />,   cls: 'text-blue-500',  dot: 'bg-blue-400'   },
}

const STATUS_BADGE: Record<string, string> = {
  new:                   'bg-[#eff6ff] text-[#2563eb] border-[#bfdbfe]',
  contacted:             'bg-[#f0fdf4] text-[#16a34a] border-[#bbf7d0]',
  ready_for_opportunity: 'bg-[#fefce8] text-[#ca8a04] border-[#fde68a]',
  no_interest:           'bg-[#f9fafb] text-[#6b7280] border-[#e5e7eb]',
  converted:             'bg-[#dbeafe] text-[#1e40af] border-[#93c5fd]',
  discarded:             'bg-[#fef2f2] text-[#dc2626] border-[#fca5a5]',
  public_pool:           'bg-[#f3f4f6] text-[#374151] border-[#d1d5db]',
}

function isStagnant(lead: LeadRow): boolean {
  if (lead.status !== 'contacted' && lead.status !== 'ready_for_opportunity') return false
  const lastAction = lead.updatedAt ? new Date(lead.updatedAt) : new Date(lead.createdAt)
  const daysSince = Math.floor((Date.now() - lastAction.getTime()) / (1000 * 60 * 60 * 24))
  return daysSince > 7
}

function getRecycleCountdown(lead: LeadRow): { hours: number; isUrgent: boolean } | null {
  if (lead.convertedOpportunityId || lead.status === 'converted') return null
  if (!lead.assigneeId) return null
  const lastAction = lead.lastActionAt ? new Date(lead.lastActionAt) : new Date(lead.createdAt)
  const hoursSince = Math.floor((Date.now() - lastAction.getTime()) / (1000 * 60 * 60))
  const remaining = 7 * 24 - hoursSince
  if (remaining <= 0) return { hours: 0, isUrgent: true }
  if (remaining <= 24) return { hours: remaining, isUrgent: true }
  return { hours: remaining, isUrgent: false }
}

// Component
export function LeadTable({
  leads,
  viewMode,
  onRefresh,
  onSelect,
  selectedLeadId,
}: {
  leads: LeadRow[]
  viewMode: 'my_leads' | 'public_pool'
  onRefresh?: () => void
  onSelect?: (lead: LeadRow) => void
  selectedLeadId?: string
}) {
  const [claiming, setClaiming] = useState<string | null>(null)
  const [convertDialogOpen, setConvertDialogOpen] = useState(false)
  const [leadToConvert, setLeadToConvert] = useState<LeadRow | null>(null)
  const [returnDialogOpen, setReturnDialogOpen] = useState(false)
  const [leadToReturn, setLeadToReturn] = useState<LeadRow | null>(null)

  const handleRowClick = (lead: LeadRow, e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, [role="menuitem"]')) return
    onSelect?.(lead)
  }

  const handleClaimLead = async (lead: LeadRow, e: React.MouseEvent) => {
    e.stopPropagation()
    setClaiming(lead.id)
    try {
      const result = await claimLeadAction(lead.id)
      if (result) {
        toast.success(`成功认领线索 ${lead.leadCode}`)
        onRefresh?.()
      } else {
        toast.error('认领失败，该线索可能已被他人认领')
      }
    } catch {
      toast.error('认领失败，请重试')
    } finally {
      setClaiming(null)
    }
  }

  const confirmReturnToPool = async () => {
    if (!leadToReturn) return
    try {
      const result = await discardLeadAction(leadToReturn.id, 'return_to_pool')
      if (result) {
        toast.success('线索已退回公海')
        onRefresh?.()
      } else {
        toast.error('操作失败')
      }
    } catch {
      toast.error('操作失败，请重试')
    } finally {
      setReturnDialogOpen(false)
      setLeadToReturn(null)
    }
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="rounded-md border border-[#e5e7eb] overflow-hidden">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-[#e5e7eb] bg-[#f9fafb]">
              <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-[#6b7280]" style={{ width: 128 }}>线索编号</th>
              <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-[#6b7280]" style={{ minWidth: 140 }}>联系人</th>
              <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-[#6b7280]" style={{ width: 110 }}>意向分类</th>
              <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-[#6b7280]" style={{ width: 72 }}>紧迫度</th>
              <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-[#6b7280]" style={{ width: 90 }}>状态</th>
              <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-[#6b7280]" style={{ width: 90 }}>来源</th>
              {viewMode === 'my_leads' && (
                <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-[#6b7280]" style={{ width: 88 }}>回收倒计时</th>
              )}
              <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-[#6b7280]" style={{ width: 90 }}>创建时间</th>
              <th className="px-3 py-2.5 text-center text-[11px] font-semibold text-[#6b7280]" style={{ width: 64 }}>操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f3f4f6]">
            {leads.map((lead) => {
              const stagnant = isStagnant(lead)
              const countdown = getRecycleCountdown(lead)
              const urgency = URGENCY_MAP[lead.urgency] ?? URGENCY_MAP['MEDIUM']
              const isConverted = lead.status === 'converted' || !!lead.convertedOpportunityId
              const isSelected = selectedLeadId === lead.id

              return (
                <tr
                  key={lead.id}
                  onClick={(e) => handleRowClick(lead, e)}
                  className={[
                    'cursor-pointer transition-colors hover:bg-[#f9fafb]',
                    stagnant ? 'bg-amber-50/60' : '',
                    isConverted ? 'bg-[#f9fafb] opacity-70' : '',
                    isSelected ? 'bg-[#eff6ff]' : '',
                  ].join(' ')}
                >
                  {/* Lead code */}
                  <td className="px-3 py-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-mono text-[12px] font-medium text-[#2563eb]">
                        {lead.leadCode}
                      </span>
                      <div className="flex gap-1">
                        {stagnant && (
                          <span className="rounded-sm bg-amber-100 px-1 py-0.5 text-[9px] font-medium text-amber-700">
                            停滞
                          </span>
                        )}
                        {isConverted && (
                          <span className="rounded-sm bg-blue-100 px-1 py-0.5 text-[9px] font-medium text-blue-700">
                            已转化
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Contact */}
                  <td className="px-3 py-3">
                    <div className="font-medium text-[#111827]">{lead.wechatName || lead.personName}</div>
                    {lead.customer?.customerName && (
                      <div className="mt-0.5 text-[11px] text-[#9ca3af]">{lead.customer.customerName}</div>
                    )}
                  </td>

                  {/* Category */}
                  <td className="px-3 py-3 text-[#374151]">
                    {getLeadCategoryLabel(lead.category)}
                  </td>

                  {/* Urgency */}
                  <td className="px-3 py-3">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className={`flex items-center gap-1 ${urgency.cls}`}>
                          <span className={`h-2 w-2 rounded-full ${urgency.dot}`} />
                          <span>{getLeadUrgencyLabel(lead.urgency)}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p className="text-[11px]">紧迫度: {getLeadUrgencyLabel(lead.urgency)}</p>
                      </TooltipContent>
                    </Tooltip>
                  </td>

                  {/* Status */}
                  <td className="px-3 py-3">
                    <Badge
                      variant="outline"
                      className={`h-5 text-[10px] font-normal ${STATUS_BADGE[lead.status] ?? STATUS_BADGE['new']}`}
                    >
                      {getLeadStatusLabel(lead.status)}
                    </Badge>
                  </td>

                  {/* Source */}
                  <td className="px-3 py-3 text-[#6b7280]">
                    {getLeadSourceLabel(lead.source)}
                  </td>

                  {/* Countdown (my_leads only) */}
                  {viewMode === 'my_leads' && (
                    <td className="px-3 py-3">
                      {countdown ? (
                        <div className={`flex items-center gap-1 ${countdown.isUrgent ? 'text-red-600' : 'text-amber-600'}`}>
                          <Clock className="h-3 w-3" />
                          <span className="tabular-nums">{countdown.hours}h</span>
                        </div>
                      ) : (
                        <span className="text-[#d1d5db]">—</span>
                      )}
                    </td>
                  )}

                  {/* Created at */}
                  <td className="px-3 py-3 text-[#9ca3af]">
                    {new Date(lead.createdAt).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit', year: '2-digit' })}
                  </td>

                  {/* Actions */}
                  <td className="px-3 py-3 text-center">
                    {viewMode === 'public_pool' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 gap-1 text-[11px]"
                        onClick={(e) => handleClaimLead(lead, e)}
                        disabled={claiming === lead.id || isConverted}
                      >
                        <UserPlus className="h-3 w-3" />
                        {claiming === lead.id ? '认领中' : '认领'}
                      </Button>
                    ) : isConverted ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 gap-1 text-[11px] text-[#2563eb]"
                            onClick={(e) => {
                              e.stopPropagation()
                              onSelect?.(lead)
                            }}
                          >
                            <ArrowUpRight className="h-3 w-3" />
                            查看
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          <p className="text-[11px]">查看线索详情</p>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="h-4 w-4 text-[#9ca3af]" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="text-[12px]">
                          <DropdownMenuItem
                            className="text-[12px]"
                            onClick={(e) => {
                              e.stopPropagation()
                              onSelect?.(lead)
                            }}
                          >
                            查看详情
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-[12px]"
                            onClick={(e) => {
                              e.stopPropagation()
                              setLeadToConvert(lead)
                              setConvertDialogOpen(true)
                            }}
                          >
                            <ArrowUpRight className="mr-1.5 h-3.5 w-3.5 text-[#2563eb]" />
                            转为商机
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-[12px] text-red-600 focus:text-red-600"
                            onClick={(e) => {
                              e.stopPropagation()
                              setLeadToReturn(lead)
                              setReturnDialogOpen(true)
                            }}
                          >
                            退回公海
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {leads.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-[13px] text-[#6b7280]">暂无线索</p>
            <p className="mt-1 text-[12px] text-[#9ca3af]">尝试切换视图或修改搜索条件</p>
          </div>
        )}
      </div>

      {/* Convert dialog */}
      <ConvertToOppDialog
        lead={leadToConvert}
        isOpen={convertDialogOpen}
        onClose={() => { setConvertDialogOpen(false); setLeadToConvert(null) }}
        onSuccess={() => { onRefresh?.() }}
      />

      {/* Return to pool confirm */}
      <AlertDialog open={returnDialogOpen} onOpenChange={setReturnDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认退回公海</AlertDialogTitle>
            <AlertDialogDescription>
              确定要将线索{' '}
              <span className="font-semibold text-[#111827]">{leadToReturn?.leadCode}</span>{' '}
              退回公海吗？退回后其他销售可以认领该线索。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmReturnToPool}
              className="bg-red-600 hover:bg-red-700"
            >
              确认退回
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  )
}
