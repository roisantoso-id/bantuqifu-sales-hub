'use client'

import { useState } from 'react'
import { Flame, Thermometer, Snowflake, AlertCircle, Clock, UserPlus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { claimLeadAction, type LeadRow } from '@/app/actions/lead'

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

function getRecycleCountdown(lead: LeadRow): number | null {
  if (lead.status !== 'NEW') return null
  const created = new Date(lead.createdAt)
  const hoursSince = Math.floor((Date.now() - created.getTime()) / (1000 * 60 * 60))
  const remaining = 48 - hoursSince
  return remaining > 0 ? remaining : 0
}

export function LeadTable({
  leads,
  viewMode,
  onSelect,
  onRefresh
}: {
  leads: LeadRow[]
  viewMode: 'my_leads' | 'public_pool'
  onSelect?: (lead: LeadRow) => void
  onRefresh?: () => void
}) {
  const [selectedLead, setSelectedLead] = useState<LeadRow | null>(null)
  const [followUpNote, setFollowUpNote] = useState('')
  const [claiming, setClaiming] = useState<string | null>(null)

  const handleRowClick = (lead: LeadRow, e: React.MouseEvent) => {
    // 如果点击的是按钮，不触发行点击
    if ((e.target as HTMLElement).closest('button')) {
      return
    }
    setSelectedLead(lead)
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
              {viewMode === 'public_pool' && (
                <th className="text-center py-2 px-3 font-medium text-slate-600">操作</th>
              )}
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => {
              const stagnant = isStagnant(lead)
              const countdown = getRecycleCountdown(lead)
              const urgency = getUrgencyIcon(lead.urgency)

              return (
                <tr
                  key={lead.id}
                  onClick={(e) => handleRowClick(lead, e)}
                  className={`border-b hover:bg-slate-50 cursor-pointer transition-colors ${
                    stagnant ? 'bg-red-50/50' : ''
                  }`}
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
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="font-medium text-slate-900">{lead.personName}</div>
                    {lead.company && <div className="text-slate-500 text-[11px]">{lead.company}</div>}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="mr-1">{getCategoryIcon(lead.category)}</span>
                    <span className="text-slate-700">{lead.category}</span>
                  </td>
                  <td className="py-2.5 px-3">
                    <div className={`flex items-center gap-1 ${urgency.cls}`}>
                      {urgency.icon}
                      <span>{lead.urgency}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3">
                    <Badge variant="outline" className="text-[11px]">
                      {lead.status}
                    </Badge>
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">{lead.source}</td>
                  {viewMode === 'my_leads' && (
                    <td className="py-2.5 px-3">
                      {countdown !== null && (
                        <div className={`flex items-center gap-1 ${countdown < 12 ? 'text-red-600' : 'text-amber-600'}`}>
                          <Clock className="h-3 w-3" />
                          <span>{countdown}h</span>
                        </div>
                      )}
                    </td>
                  )}
                  <td className="py-2.5 px-3 text-slate-500">
                    {new Date(lead.createdAt).toLocaleDateString('zh-CN')}
                  </td>
                  {viewMode === 'public_pool' && (
                    <td className="py-2.5 px-3 text-center">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-[11px] gap-1"
                        onClick={(e) => handleClaimLead(lead, e)}
                        disabled={claiming === lead.id}
                      >
                        <UserPlus className="h-3 w-3" />
                        {claiming === lead.id ? '认领中...' : '认领'}
                      </Button>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* 右侧抽屉 */}
      <Sheet open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
        <SheetContent className="w-[500px]">
          <SheetHeader>
            <SheetTitle>线索详情 - {selectedLead?.leadCode}</SheetTitle>
          </SheetHeader>

          {selectedLead && (
            <div className="mt-6 space-y-4">
              <div className="space-y-2">
                <div className="text-sm font-medium">联系人信息</div>
                <div className="text-sm text-slate-600">
                  <div>姓名: {selectedLead.personName}</div>
                  {selectedLead.phone && <div>电话: {selectedLead.phone}</div>}
                  {selectedLead.email && <div>邮箱: {selectedLead.email}</div>}
                  {selectedLead.wechat && <div>微信: {selectedLead.wechat}</div>}
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">快速跟进</div>
                <Textarea
                  placeholder="添加跟进备注..."
                  value={followUpNote}
                  onChange={(e) => setFollowUpNote(e.target.value)}
                  className="min-h-[100px]"
                />
                <Button size="sm" className="w-full">
                  保存跟进记录
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}
