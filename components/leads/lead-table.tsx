'use client'

import { useState } from 'react'
import { Flame, Thermometer, Snowflake, AlertCircle, Clock, UserPlus, MoreHorizontal } from 'lucide-react'
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
import { LeadDetailPanel } from './lead-detail-panel'
import {
  getLeadStatusLabel,
  getLeadSourceLabel,
  getLeadUrgencyLabel,
  getLeadCategoryLabel,
} from '@/lib/lead-labels'

function getUrgencyIcon(urgency: string) {
  const map: Record<string, { icon: React.ReactNode; cls: string }> = {
    HOT: { icon: <Flame className="h-3 w-3" />, cls: 'text-red-600' },
    WARM: { icon: <Thermometer className="h-3 w-3" />, cls: 'text-amber-600' },
    COLD: { icon: <Snowflake className="h-3 w-3" />, cls: 'text-blue-600' },
  }
  return map[urgency] ?? { icon: null, cls: '' }
}

function getCategoryIcon(category: string) {
  const icons: Record<string, string> = {
    VISA: '🛂', COMPANY_REGISTRATION: '🏢', TAX_SERVICES: '💰',
    FINANCIAL_SERVICES: '📊', PERMIT_SERVICES: '📋', OTHER: '📌'
  }
  return icons[category] ?? '📌'
}

function isStagnant(lead: LeadRow): boolean {
  if (lead.status !== 'PUSHING') return false
  const lastAction = lead.updatedAt ? new Date(lead.updatedAt) : new Date(lead.createdAt)
  const daysSince = Math.floor((Date.now() - lastAction.getTime()) / (1000 * 60 * 60 * 24))
  return daysSince > 7
}

function getRecycleCountdown(lead: LeadRow): { hours: number; isUrgent: boolean } | null {
  // 已转化的线索不显示倒计时
  if (lead.convertedOpportunityId || lead.status === 'CONVERTED') return null

  // 只有已分配的线索才有回收倒计时
  if (!lead.assigneeId) return null

  const lastAction = lead.lastActionAt ? new Date(lead.lastActionAt) : new Date(lead.createdAt)
  const hoursSince = Math.floor((Date.now() - lastAction.getTime()) / (1000 * 60 * 60))
  const remaining = 7 * 24 - hoursSince // 7天 = 168小时

  if (remaining <= 0) return { hours: 0, isUrgent: true }
  if (remaining <= 24) return { hours: remaining, isUrgent: true } // 最后24小时标红

  return { hours: remaining, isUrgent: false }
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

  // 根据 selectedLeadId 找到选中的线索
  const selectedLead = selectedLeadId ? leads.find(l => l.id === selectedLeadId) : null

  const handleRowClick = (lead: LeadRow, e: React.MouseEvent) => {
    // 如果点击的是按钮，不触发行点击
    if ((e.target as HTMLElement).closest('button')) {
      return
    }
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
      const result = await discardLeadAction(leadToReturn.id, 'return_to_pool')
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
    onSelect?.(lead) // 打开详情面板
  }

  const handleConvertToOpp = (lead: LeadRow, e: React.MouseEvent) => {
    e.stopPropagation()
    console.log('🚀 Converting lead to opportunity:', lead.leadCode)
    setLeadToConvert(lead)
    setConvertDialogOpen(true)
    console.log('Dialog state:', { convertDialogOpen: true, leadToConvert: lead })
  }

  return (
    <>
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-[12px]">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="text-left py-2 px-3 font-medium text-slate-600">线索ID</th>
              <th className="text-left py-2 px-3 font-medium text-slate-600">联系人</th>
              <th className="text-left py-2 px-3 font-medium text-slate-600">意向</th>
              <th className="text-left py-2 px-3 font-medium text-slate-600">紧迫度</th>
              <th className="text-left py-2 px-3 font-medium text-slate-600">状态</th>
              <th className="text-left py-2 px-3 font-medium text-slate-600">来源</th>
              {viewMode === 'my_leads' && (
                <th className="text-left py-2 px-3 font-medium text-slate-600">回收倒计时</th>
              )}
              <th className="text-left py-2 px-3 font-medium text-slate-600">创建时间</th>
              <th className="text-center py-2 px-3 font-medium text-slate-600">操作</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => {
              const stagnant = isStagnant(lead)
              const countdown = getRecycleCountdown(lead)
              const urgency = getUrgencyIcon(lead.urgency)
              const isConverted = lead.status === 'CONVERTED'

              return (
                <tr
                  key={lead.id}
                  onClick={(e) => handleRowClick(lead, e)}
                  className={`border-b hover:bg-slate-50 cursor-pointer transition-colors ${
                    stagnant ? 'bg-red-50/50' : ''
                  } ${isConverted ? 'opacity-60 bg-slate-50' : ''}`}
                >
                  <td className="py-2.5 px-3">
                    <button className="text-blue-600 hover:underline font-mono">
                      {lead.leadCode}
                    </button>
                    {stagnant && (
                      <Badge variant="destructive" className="ml-2 text-[10px] h-4">
                        停滞7天
                      </Badge>
                    )}
                    {isConverted && (
                      <Badge variant="secondary" className="ml-2 text-[10px] h-4">
                        已转化
                      </Badge>
                    )}
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="font-medium text-slate-900">{lead.wechatName}</div>
                    {lead.company && <div className="text-slate-500 text-[11px]">{lead.company}</div>}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="mr-1">{getCategoryIcon(lead.category)}</span>
                    <span className="text-slate-700">{getLeadCategoryLabel(lead.category)}</span>
                  </td>
                  <td className="py-2.5 px-3">
                    <div className={`flex items-center gap-1 ${urgency.cls}`}>
                      {urgency.icon}
                      <span>{getLeadUrgencyLabel(lead.urgency)}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3">
                    <Badge variant="outline" className="text-[11px]">
                      {getLeadStatusLabel(lead.status)}
                    </Badge>
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">{getLeadSourceLabel(lead.source)}</td>
                  {viewMode === 'my_leads' && (
                    <td className="py-2.5 px-3">
                      {countdown && (
                        <div className={`flex items-center gap-1 ${countdown.isUrgent ? 'text-red-600' : 'text-amber-600'}`}>
                          <Clock className="h-3 w-3" />
                          <span>{countdown.hours}h</span>
                        </div>
                      )}
                    </td>
                  )}
                  <td className="py-2.5 px-3 text-slate-500">
                    {new Date(lead.createdAt).toLocaleDateString('zh-CN')}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {viewMode === 'public_pool' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-[11px] gap-1"
                        onClick={(e) => handleClaimLead(lead, e)}
                        disabled={claiming === lead.id || isConverted}
                      >
                        <UserPlus className="h-3 w-3" />
                        {claiming === lead.id ? '认领中...' : '认领'}
                      </Button>
                    ) : isConverted ? (
                      <div className="flex items-center justify-center gap-1 text-slate-400 text-[11px]">
                        <span>已转化为商机</span>
                      </div>
                    ) : (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => handleWriteFollowUp(lead, e)}>
                            ✍️ 写跟进
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => handleConvertToOpp(lead, e)}>
                            🚀 转为商机
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={(e) => handleReturnToPool(lead, e)}
                            className="text-red-600"
                          >
                            ♻️ 退回公海
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

      {/* 右侧抽屉 - 使用新的 LeadDetailPanel 组件 */}
      <LeadDetailPanel
        lead={selectedLead}
        isOpen={!!selectedLead}
        onClose={() => window.history.back()}
      />

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
