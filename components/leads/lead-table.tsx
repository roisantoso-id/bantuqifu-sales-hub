'use client'

import { useState } from 'react'
import { UserPlus, MoreHorizontal, AlertCircle } from 'lucide-react'
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
import { claimLeadAction, returnToPoolAction, type LeadRow } from '@/app/actions/lead'
import { ConvertToOppDialog } from './convert-to-opp-dialog'
import {
  getLeadStatusLabel,
  getLeadSourceLabel,
  getLeadUrgencyLabel,
  getLeadCategoryLabel,
} from '@/lib/lead-labels'

function getStagnantDays(lead: LeadRow): number {
  const lastAction = lead.updatedAt ? new Date(lead.updatedAt) : new Date(lead.createdAt)
  return Math.floor((Date.now() - lastAction.getTime()) / (1000 * 60 * 60 * 24))
}

function formatBudget(min?: number | null, max?: number | null): string {
  if (!min && !max) return '—'
  const formatNum = (n: number) => n.toLocaleString('en-US')
  if (min && max) return `${formatNum(min)} - ${formatNum(max)}`
  if (min) return `${formatNum(min)} +`
  if (max) return `< ${formatNum(max)}`
  return '—'
}

export function LeadTable({
  leads,
  viewMode,
  onSelect,
  onRefresh,
  selectedLeadId,
}: {
  leads: LeadRow[]
  viewMode: 'my_leads' | 'public_pool'
  onSelect?: (lead: LeadRow) => void
  onRefresh?: () => void
  selectedLeadId?: string | null
}) {
  const [claiming, setClaiming] = useState<string | null>(null)
  const [convertDialogOpen, setConvertDialogOpen] = useState(false)
  const [leadToConvert, setLeadToConvert] = useState<LeadRow | null>(null)
  const [returnDialogOpen, setReturnDialogOpen] = useState(false)
  const [leadToReturn, setLeadToReturn] = useState<LeadRow | null>(null)

  const handleRowClick = (lead: LeadRow, e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return
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
    } catch (error) {
      toast.error('认领失败，请重试')
      console.error('Claim error:', error)
    } finally {
      setClaiming(null)
    }
  }

  const handleReturnToPool = async (lead: LeadRow, e: React.MouseEvent) => {
    e.stopPropagation()
    setLeadToReturn(lead)
    setReturnDialogOpen(true)
  }

  const confirmReturnToPool = async () => {
    if (!leadToReturn) return
    try {
      const result = await returnToPoolAction(leadToReturn.id, 'RETURN_TO_POOL')
      if (result) {
        toast.success('线索已退回公海')
        onRefresh?.()
      } else {
        toast.error('操作失败')
      }
    } catch (error) {
      toast.error('操作失败，请重试')
      console.error('Return to pool error:', error)
    } finally {
      setReturnDialogOpen(false)
      setLeadToReturn(null)
    }
  }

  const handleWriteFollowUp = (lead: LeadRow, e: React.MouseEvent) => {
    e.stopPropagation()
    onSelect?.(lead)
  }

  const handleConvertToOpp = (lead: LeadRow, e: React.MouseEvent) => {
    e.stopPropagation()
    setLeadToConvert(lead)
    setConvertDialogOpen(true)
  }

  if (leads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-500">
        <div className="text-4xl mb-3">📭</div>
        <p className="text-sm">
          {viewMode === 'public_pool' ? '公海暂无可认领线索' : '暂无线索，点击右上角按钮新增'}
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full">
          {/* 表头 - 极小字号、大写、深灰色 */}
          <thead className="bg-slate-50/80">
            <tr className="border-b border-slate-100">
              <th className="text-left py-2 px-3 text-[11px] font-semibold text-slate-600 uppercase tracking-wide">编号</th>
              <th className="text-left py-2 px-3 text-[11px] font-semibold text-slate-600 uppercase tracking-wide">微信昵称</th>
              <th className="text-left py-2 px-3 text-[11px] font-semibold text-slate-600 uppercase tracking-wide">手机号</th>
              <th className="text-left py-2 px-3 text-[11px] font-semibold text-slate-600 uppercase tracking-wide">来源</th>
              <th className="text-right py-2 px-3 text-[11px] font-semibold text-slate-600 uppercase tracking-wide">预算区间 ({leads[0]?.budgetCurrency || 'CNY'})</th>
              <th className="text-center py-2 px-3 text-[11px] font-semibold text-slate-600 uppercase tracking-wide">紧迫度</th>
              <th className="text-center py-2 px-3 text-[11px] font-semibold text-slate-600 uppercase tracking-wide">状态</th>
              <th className="text-center py-2 px-3 text-[11px] font-semibold text-slate-600 uppercase tracking-wide">停滞天数</th>
              <th className="text-left py-2 px-3 text-[11px] font-semibold text-slate-600 uppercase tracking-wide">企微群</th>
              <th className="text-right py-2 px-3 text-[11px] font-semibold text-slate-600 uppercase tracking-wide w-[40px]"></th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => {
              const stagnantDays = getStagnantDays(lead)
              const isStagnant = stagnantDays > 7
              const isConverted = lead.status === 'converted' || lead.convertedOpportunityId
              const isSelected = selectedLeadId === lead.id

              return (
                <tr
                  key={lead.id}
                  onClick={(e) => handleRowClick(lead, e)}
                  className={`border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors ${
                    isConverted ? 'opacity-50 bg-slate-50/50' : ''
                  } ${isSelected ? 'bg-blue-50/60' : ''}`}
                >
                  {/* 线索编号 - 等宽字体、极小 */}
                  <td className="py-2 px-3">
                    <span className="font-mono text-[11px] text-slate-500">{lead.leadCode}</span>
                  </td>

                  {/* 微信昵称 - 加深字体 */}
                  <td className="py-2 px-3">
                    <span className="font-medium text-[12px] text-slate-900">{lead.wechatName}</span>
                  </td>

                  {/* 手机号 */}
                  <td className="py-2 px-3">
                    <span className="text-[12px] text-slate-600">{lead.phone || '—'}</span>
                  </td>

                  {/* 来源 - 极简淡灰色 Badge */}
                  <td className="py-2 px-3">
                    <span className="inline-flex items-center h-5 px-1.5 bg-slate-100 text-slate-600 text-[10px] rounded">
                      {getLeadSourceLabel(lead.source)}
                    </span>
                  </td>

                  {/* 预算区间 - 右对齐、等宽字体 */}
                  <td className="py-2 px-3 text-right">
                    <span className="font-mono text-[11px] text-slate-700">
                      {formatBudget(lead.budgetMin, lead.budgetMax)}
                    </span>
                  </td>

                  {/* 紧迫度 - 极小定制 Badge */}
                  <td className="py-2 px-3 text-center">
                    {lead.urgency === 'HIGH' && (
                      <span className="inline-flex items-center h-5 px-1.5 bg-red-500 text-white text-[10px] font-medium uppercase rounded">
                        HIGH
                      </span>
                    )}
                    {lead.urgency === 'MEDIUM' && (
                      <span className="inline-flex items-center h-5 px-1.5 border border-yellow-500 text-yellow-700 text-[10px] font-medium uppercase rounded bg-white">
                        MED
                      </span>
                    )}
                    {lead.urgency === 'LOW' && (
                      <span className="inline-flex items-center h-5 px-1.5 bg-slate-100 text-slate-500 text-[10px] font-medium uppercase rounded">
                        LOW
                      </span>
                    )}
                  </td>

                  {/* 状态 - 微型 Badge */}
                  <td className="py-2 px-3 text-center">
                    <span className={`inline-flex items-center h-5 px-1.5 text-[10px] font-medium rounded ${
                      lead.status === 'new' ? 'bg-blue-100 text-blue-700' :
                      lead.status === 'contacted' ? 'bg-amber-100 text-amber-700' :
                      lead.status === 'ready_for_opportunity' ? 'bg-green-100 text-green-700' :
                      lead.status === 'converted' ? 'bg-slate-100 text-slate-500' :
                      'bg-slate-100 text-slate-500'
                    }`}>
                      {getLeadStatusLabel(lead.status)}
                    </span>
                  </td>

                  {/* 停滞天数 */}
                  <td className="py-2 px-3 text-center">
                    {isStagnant ? (
                      <span className="inline-flex items-center gap-0.5 text-red-600 font-bold text-[11px]">
                        <AlertCircle className="h-3 w-3" />
                        {stagnantDays}天
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px]">{stagnantDays}天</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 text-[11px]">
                    {lead.wechatGroupId ? `${lead.wechatGroupId}${lead.wechatGroupName ? ' ' + lead.wechatGroupName : ''}` : '—'}
                  </td>
                  <td className="py-2.5 px-3 text-slate-500">
                    {new Date(lead.createdAt).toLocaleDateString('zh-CN')}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {viewMode === 'public_pool' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 text-[10px] gap-1 px-2"
                        onClick={(e) => handleClaimLead(lead, e)}
                        disabled={claiming === lead.id || !!isConverted}
                      >
                        <UserPlus className="h-3 w-3" />
                        {claiming === lead.id ? '...' : '认领'}
                      </Button>
                    ) : isConverted ? (
                      <span className="text-slate-400 text-[10px]">已转化</span>
                    ) : (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="h-4 w-4 text-slate-400" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="text-[12px]">
                          <DropdownMenuItem onClick={(e) => handleWriteFollowUp(lead, e as unknown as React.MouseEvent)}>
                            写跟进
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => handleConvertToOpp(lead, e as unknown as React.MouseEvent)}>
                            转为商机
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={(e) => handleReturnToPool(lead, e as unknown as React.MouseEvent)}
                            className="text-red-600"
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
        onClose={() => {
          setConvertDialogOpen(false)
          setLeadToConvert(null)
        }}
        onSuccess={() => {
          onRefresh?.()
        }}
      />

      {/* 退回公海确认对话框 */}
      <AlertDialog open={returnDialogOpen} onOpenChange={setReturnDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认退回公海</AlertDialogTitle>
            <AlertDialogDescription>
              确定要将线索 <span className="font-semibold text-slate-900">{leadToReturn?.leadCode}</span> 退回公海吗？
              <br />
              退回后，该线索将重新进入公海池，其他销售可以认领。
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
