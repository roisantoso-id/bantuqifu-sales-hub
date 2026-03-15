'use client'

import { useEffect, useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Loader2,
  AlertCircle,
  User,
  Building2,
  Phone,
  Mail,
  MessageCircle,
  Briefcase,
  Target,
  Flame,
  Globe,
  CheckCircle2,
  Clock,
  Calendar
} from 'lucide-react'
import { getLeadFollowUpsAction, type LeadRow, type LeadFollowUpRow } from '@/app/actions/lead'
import { toast } from 'sonner'
import {
  getLeadStatusLabel,
  getLeadSourceLabel,
  getLeadUrgencyLabel,
  getLeadCategoryLabel,
  getFollowupTypeLabel,
} from '@/lib/lead-labels'

interface LeadDetailPanelProps {
  lead: LeadRow | null
  isOpen: boolean
  onClose: () => void
}

export function LeadDetailPanel({ lead, isOpen, onClose }: LeadDetailPanelProps) {
  const [followUps, setFollowUps] = useState<LeadFollowUpRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [followUpNote, setFollowUpNote] = useState('')

  // 判断是否已转化为商机（只读模式）
  const isReadOnly = lead?.status === 'CONVERTED'

  useEffect(() => {
    if (isOpen && lead?.id) {
      setIsLoading(true)
      // 一进入页面立刻拉取该线索的所有跟进记录
      getLeadFollowUpsAction(lead.id)
        .then(data => {
          setFollowUps(data)
          setIsLoading(false)
        })
        .catch(error => {
          console.error('Failed to load follow-ups:', error)
          setIsLoading(false)
        })
    }
  }, [isOpen, lead?.id])

  // 获取紧迫度样式
  const getUrgencyStyle = (urgency: string) => {
    const styles: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
      HOT: { bg: 'bg-red-50', text: 'text-red-700', icon: <Flame className="h-3.5 w-3.5" /> },
      WARM: { bg: 'bg-amber-50', text: 'text-amber-700', icon: <Flame className="h-3.5 w-3.5" /> },
      COLD: { bg: 'bg-blue-50', text: 'text-blue-700', icon: <Flame className="h-3.5 w-3.5" /> },
      HIGH: { bg: 'bg-red-50', text: 'text-red-700', icon: <Flame className="h-3.5 w-3.5" /> },
      MEDIUM: { bg: 'bg-amber-50', text: 'text-amber-700', icon: <Flame className="h-3.5 w-3.5" /> },
      LOW: { bg: 'bg-blue-50', text: 'text-blue-700', icon: <Flame className="h-3.5 w-3.5" /> },
    }
    return styles[urgency] || styles.MEDIUM
  }

  const urgencyStyle = lead ? getUrgencyStyle(lead.urgency) : null

  if (!lead) return null

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[650px] overflow-y-auto p-0">
        {/* Header with gradient */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 text-white">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-lg font-semibold">线索详情</h2>
                {isReadOnly && (
                  <Badge className="bg-white/20 text-white border-white/30">
                    已转化
                  </Badge>
                )}
              </div>
              <p className="text-sm text-blue-100 font-mono">{lead.leadCode}</p>
            </div>
            <Badge className={`${urgencyStyle?.bg} ${urgencyStyle?.text} border-0`}>
              <span className="flex items-center gap-1">
                {urgencyStyle?.icon}
                {getLeadUrgencyLabel(lead.urgency)}
              </span>
            </Badge>
          </div>
        </div>

        <div className="px-6 py-6 space-y-6">
          {/* 转化提示 */}
          {isReadOnly && (
            <Alert className="bg-blue-50 border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800 text-sm">
                该线索已转化为商机，基础信息不可修改。请前往商机页面继续跟进。
              </AlertDescription>
            </Alert>
          )}

          {/* 联系人信息卡片 */}
          <div className="rounded-lg border bg-white shadow-sm">
            <div className="px-4 py-3 border-b bg-slate-50">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <User className="h-4 w-4 text-slate-600" />
                联系人信息
              </h3>
            </div>
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-500 flex items-center gap-1.5">
                    <User className="h-3 w-3" />
                    姓名
                  </Label>
                  <Input
                    value={lead.personName}
                    disabled={isReadOnly}
                    className={`h-9 text-sm ${isReadOnly ? 'bg-slate-50 text-slate-600 border-slate-200' : ''}`}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-500 flex items-center gap-1.5">
                    <Building2 className="h-3 w-3" />
                    公司
                  </Label>
                  <Input
                    value={lead.company || ''}
                    placeholder="未填写"
                    disabled={isReadOnly}
                    className={`h-9 text-sm ${isReadOnly ? 'bg-slate-50 text-slate-600 border-slate-200' : ''}`}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-500 flex items-center gap-1.5">
                    <Phone className="h-3 w-3" />
                    电话
                  </Label>
                  <Input
                    value={lead.phone || ''}
                    placeholder="未填写"
                    disabled={isReadOnly}
                    className={`h-9 text-sm ${isReadOnly ? 'bg-slate-50 text-slate-600 border-slate-200' : ''}`}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-500 flex items-center gap-1.5">
                    <Mail className="h-3 w-3" />
                    邮箱
                  </Label>
                  <Input
                    value={lead.email || ''}
                    placeholder="未填写"
                    disabled={isReadOnly}
                    className={`h-9 text-sm ${isReadOnly ? 'bg-slate-50 text-slate-600 border-slate-200' : ''}`}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-500 flex items-center gap-1.5">
                    <MessageCircle className="h-3 w-3" />
                    微信
                  </Label>
                  <Input
                    value={lead.wechat || ''}
                    placeholder="未填写"
                    disabled={isReadOnly}
                    className={`h-9 text-sm ${isReadOnly ? 'bg-slate-50 text-slate-600 border-slate-200' : ''}`}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-500 flex items-center gap-1.5">
                    <Briefcase className="h-3 w-3" />
                    职位
                  </Label>
                  <Input
                    value={lead.position || ''}
                    placeholder="未填写"
                    disabled={isReadOnly}
                    className={`h-9 text-sm ${isReadOnly ? 'bg-slate-50 text-slate-600 border-slate-200' : ''}`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 线索信息卡片 */}
          <div className="rounded-lg border bg-white shadow-sm">
            <div className="px-4 py-3 border-b bg-slate-50">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Target className="h-4 w-4 text-slate-600" />
                线索信息
              </h3>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100">
                    <Target className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-500 mb-0.5">意向</p>
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {getLeadCategoryLabel(lead.category)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-100">
                    <Globe className="h-4 w-4 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-500 mb-0.5">来源</p>
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {getLeadSourceLabel(lead.source)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 col-span-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-100">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-500 mb-0.5">状态</p>
                    <Badge variant="outline" className="font-medium">
                      {getLeadStatusLabel(lead.status)}
                    </Badge>
                  </div>
                </div>
              </div>

              {lead.notes && (
                <div className="mt-4 space-y-1.5">
                  <Label className="text-xs text-slate-500">备注</Label>
                  <Textarea
                    value={lead.notes}
                    disabled={isReadOnly}
                    className={`min-h-[80px] text-sm ${isReadOnly ? 'bg-slate-50 text-slate-600 border-slate-200' : ''}`}
                  />
                </div>
              )}
            </div>
          </div>

          {/* 跟进记录时间轴 */}
          <div className="rounded-lg border bg-white shadow-sm">
            <div className="px-4 py-3 border-b bg-slate-50">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Clock className="h-4 w-4 text-slate-600" />
                跟进记录
                {followUps.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {followUps.length}
                  </Badge>
                )}
              </h3>
            </div>

            <div className="p-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                </div>
              ) : followUps.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm text-slate-500">暂无跟进记录</p>
                  <p className="text-xs text-slate-400 mt-1">添加第一条跟进记录开始追踪</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {followUps.map((followUp, index) => (
                    <div key={followUp.id} className="relative">
                      {/* Timeline line */}
                      {index !== followUps.length - 1 && (
                        <div className="absolute left-4 top-10 bottom-0 w-px bg-slate-200" />
                      )}

                      <div className="flex gap-3">
                        {/* Timeline dot */}
                        <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 ring-4 ring-white">
                          <Calendar className="h-4 w-4 text-blue-600" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 pb-4">
                          <div className="rounded-lg border bg-slate-50 p-3">
                            <div className="flex items-center justify-between mb-2">
                              <Badge variant="outline" className="text-xs font-medium">
                                {getFollowupTypeLabel(followUp.followupType)}
                              </Badge>
                              <span className="text-xs text-slate-500">
                                {new Date(followUp.createdAt).toLocaleString('zh-CN', {
                                  month: '2-digit',
                                  day: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                            <p className="text-sm text-slate-700 leading-relaxed">{followUp.content}</p>
                            {followUp.nextAction && (
                              <div className="mt-2 pt-2 border-t border-slate-200">
                                <div className="flex items-start gap-2">
                                  <CheckCircle2 className="h-3.5 w-3.5 text-blue-600 mt-0.5 shrink-0" />
                                  <div className="flex-1">
                                    <p className="text-xs font-medium text-slate-600 mb-0.5">下一步行动</p>
                                    <p className="text-xs text-slate-700">{followUp.nextAction}</p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 快速跟进 */}
          {!isReadOnly && (
            <div className="rounded-lg border bg-white shadow-sm">
              <div className="px-4 py-3 border-b bg-slate-50">
                <h3 className="text-sm font-semibold text-slate-900">快速跟进</h3>
              </div>
              <div className="p-4 space-y-3">
                <Textarea
                  placeholder="记录本次跟进的详细内容..."
                  value={followUpNote}
                  onChange={(e) => setFollowUpNote(e.target.value)}
                  className="min-h-[100px] text-sm resize-none"
                />
                <Button
                  size="sm"
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  onClick={() => toast.info('跟进功能开发中')}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  保存跟进记录
                </Button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
