'use client'

import { useState } from 'react'
import { Flame, Thermometer, Snowflake, Clock, UserPlus, MoreHorizontal, ArrowUpRight } from 'lucide-react'
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
import { toast } from 'sonner'
import { claimLeadAction, discardLeadAction, type LeadRow } from '@/app/actions/lead'
import { ConvertToOppDialog } from './convert-to-opp-dialog'
import {
  getLeadStatusLabel,
  getLeadSourceLabel,
  getLeadUrgencyLabel,
  getLeadCategoryLabel,
} from '@/lib/lead-labels'

// 紧迫度配色
const URGENCY_COLORS: Record<string, string> = {
  HIGH: 'text-red-600',
  HOT: 'text-red-600',
  MEDIUM: 'text-amber-600',
  WARM: 'text-amber-600',
  LOW: 'text-blue-500',
  COLD: 'text-blue-500',
}

const URGENCY_ICONS: Record<string, React.ReactNode> = {
  HIGH: <Flame className="h-3.5 w-3.5" />,
  HOT: <Flame className="h-3.5 w-3.5" />,
  MEDIUM: <Thermometer className="h-3.5 w-3.5" />,
  WARM: <Thermometer className="h-3.5 w-3.5" />,
  LOW: <Snowflake className="h-3.5 w-3.5" />,
  COLD: <Snowflake className="h-3.5 w-3.5" />,
}

// 状态配色
const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-50 text-blue-700 border-blue-200',
  contacted: 'bg-green-50 text-green-700 border-green-200',
  ready_for_opportunity: 'bg-amber-50 text-amber-700 border-amber-200',
  no_interest: 'bg-slate-100 text-slate-600 border-slate-200',
  converted: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  discarded: 'bg-red-50 text-red-600 border-red-200',
  public_pool: 'bg-slate-50 text-slate-600 border-slate-200',
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

  if (leads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-4xl mb-3">📭</div>
        <p className="text-sm text-slate-500">暂无线索数据</p>
        <p className="text-xs text-slate-400 mt-1">尝试切换视图或修改搜索条件</p>
      </div>
    )
  }

  return (
    <>
      <div className="overflow-hidden rounded-lg border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">线索编号</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">联系人</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">意向</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">紧迫度</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">状态</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">来源</th>
              {viewMode === 'my_leads' && (
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">倒计时</th>
              )}
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">创建时间</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-100">
            {leads.map((lead) => {
              const stagnant = isStagnant(lead)
              const countdown = getRecycleCountdown(lead)
              const isConverted = lead.status === 'converted' || !!lead.convertedOpportunityId
              const isSelected = selectedLeadId === lead.id
              const urgencyColor = URGENCY_COLORS[lead.urgency] ?? 'text-slate-500'
              const urgencyIcon = URGENCY_ICONS[lead.urgency] ?? <Thermometer className="h-3.5 w-3.5" />

              return (
                <tr
                  key={lead.id}
                  onClick={(e) => handleRowClick(lead, e)}
                  className={[
                    'cursor-pointer transition-colors',
                    isSelected ? 'bg-blue-50' : 'hover:bg-slate-50',
                    stagnant && !isSelected ? 'bg-amber-50/50' : '',
                    isConverted ? 'opacity-60' : '',
                  ].filter(Boolean).join(' ')}
                >
                  {/* 线索编号 */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-medium text-blue-600">{lead.leadCode}</span>
                      {stagnant && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700">
                          停滞
                        </span>
                      )}
                      {isConverted && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-700">
                          已转化
                        </span>
                      )}
                    </div>
                  </td>

                  {/* 联系人 */}
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-slate-900">{lead.wechatName || lead.personName || '—'}</div>
                    {lead.phone && (
                      <div className="text-xs text-slate-500">{lead.phone}</div>
                    )}
                  </td>

                  {/* 意向分类 */}
                  <td className="px-4 py-3 text-sm text-slate-700">
                    {getLeadCategoryLabel(lead.category) || '—'}
                  </td>

                  {/* 紧迫度 */}
                  <td className="px-4 py-3">
                    <div className={`flex items-center gap-1.5 ${urgencyColor}`}>
                      {urgencyIcon}
                      <span className="text-sm">{getLeadUrgencyLabel(lead.urgency)}</span>
                    </div>
                  </td>

                  {/* 状态 */}
                  <td className="px-4 py-3">
                    <Badge
                      variant="outline"
                      className={`text-xs font-normal ${STATUS_COLORS[lead.status] ?? STATUS_COLORS['new']}`}
                    >
                      {getLeadStatusLabel(lead.status)}
                    </Badge>
                  </td>

                  {/* 来源 */}
                  <td className="px-4 py-3 text-sm text-slate-500">
                    {getLeadSourceLabel(lead.source) || '—'}
                  </td>

                  {/* 回收倒计时 (仅我的线索) */}
                  {viewMode === 'my_leads' && (
                    <td className="px-4 py-3">
                      {countdown ? (
                        <div className={`flex items-center gap-1 text-sm ${countdown.isUrgent ? 'text-red-600 font-medium' : 'text-amber-600'}`}>
                          <Clock className="h-3.5 w-3.5" />
                          <span className="tabular-nums">{countdown.hours}h</span>
                        </div>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                  )}

                  {/* 创建时间 */}
                  <td className="px-4 py-3 text-sm text-slate-500">
                    {new Date(lead.createdAt).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })}
                  </td>

                  {/* 操作 */}
                  <td className="px-4 py-3 text-center">
                    {viewMode === 'public_pool' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 gap-1.5 text-xs"
                        onClick={(e) => handleClaimLead(lead, e)}
                        disabled={claiming === lead.id || isConverted}
                      >
                        <UserPlus className="h-3.5 w-3.5" />
                        {claiming === lead.id ? '认领中...' : '认领'}
                      </Button>
                    ) : isConverted ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 gap-1.5 text-xs text-blue-600 hover:text-blue-700"
                        onClick={(e) => {
                          e.stopPropagation()
                          onSelect?.(lead)
                        }}
                      >
                        <ArrowUpRight className="h-3.5 w-3.5" />
                        查看
                      </Button>
                    ) : (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="h-4 w-4 text-slate-400" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              onSelect?.(lead)
                            }}
                          >
                            查看详情
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              setLeadToConvert(lead)
                              setConvertDialogOpen(true)
                            }}
                          >
                            <ArrowUpRight className="mr-2 h-3.5 w-3.5 text-blue-600" />
                            转为商机
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600"
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
      </div>

      {/* 转商机对话框 */}
      <ConvertToOppDialog
        lead={leadToConvert}
        isOpen={convertDialogOpen}
        onClose={() => { setConvertDialogOpen(false); setLeadToConvert(null) }}
        onSuccess={() => { onRefresh?.() }}
      />

      {/* 退回公海确认 */}
      <AlertDialog open={returnDialogOpen} onOpenChange={setReturnDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认退回公海</AlertDialogTitle>
            <AlertDialogDescription>
              确定要将线索 <span className="font-semibold text-slate-900">{leadToReturn?.leadCode}</span> 退回公海吗？退回后其他销售可以认领该线索。
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
    </>
  )
}
