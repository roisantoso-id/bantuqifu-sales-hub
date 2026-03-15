'use client'

import { useEffect, useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Loader2, AlertCircle } from 'lucide-react'
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

  if (!lead) return null

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[600px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            线索详情 - {lead.leadCode}
            {isReadOnly && (
              <Badge variant="secondary" className="text-xs">
                已转化
              </Badge>
            )}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* 转化提示 */}
          {isReadOnly && (
            <Alert className="bg-blue-50 border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                该线索已转化为商机，基础信息不可修改。请前往商机页面继续跟进。
              </AlertDescription>
            </Alert>
          )}

          {/* 基础信息 */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">基础信息</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-slate-600">联系人姓名</Label>
                <Input
                  value={lead.personName}
                  disabled={isReadOnly}
                  className={isReadOnly ? 'bg-slate-50 text-slate-500' : ''}
                />
              </div>

              <div>
                <Label className="text-xs text-slate-600">公司</Label>
                <Input
                  value={lead.company || ''}
                  disabled={isReadOnly}
                  className={isReadOnly ? 'bg-slate-50 text-slate-500' : ''}
                />
              </div>

              <div>
                <Label className="text-xs text-slate-600">电话</Label>
                <Input
                  value={lead.phone || ''}
                  disabled={isReadOnly}
                  className={isReadOnly ? 'bg-slate-50 text-slate-500' : ''}
                />
              </div>

              <div>
                <Label className="text-xs text-slate-600">邮箱</Label>
                <Input
                  value={lead.email || ''}
                  disabled={isReadOnly}
                  className={isReadOnly ? 'bg-slate-50 text-slate-500' : ''}
                />
              </div>

              <div>
                <Label className="text-xs text-slate-600">微信</Label>
                <Input
                  value={lead.wechat || ''}
                  disabled={isReadOnly}
                  className={isReadOnly ? 'bg-slate-50 text-slate-500' : ''}
                />
              </div>

              <div>
                <Label className="text-xs text-slate-600">职位</Label>
                <Input
                  value={lead.position || ''}
                  disabled={isReadOnly}
                  className={isReadOnly ? 'bg-slate-50 text-slate-500' : ''}
                />
              </div>
            </div>
          </div>

          {/* 线索信息 */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">线索信息</h3>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-600">意向分类:</span>
                <span className="ml-2 font-medium">{getLeadCategoryLabel(lead.category)}</span>
              </div>
              <div>
                <span className="text-slate-600">紧迫度:</span>
                <span className="ml-2 font-medium">{getLeadUrgencyLabel(lead.urgency)}</span>
              </div>
              <div>
                <span className="text-slate-600">来源:</span>
                <span className="ml-2 font-medium">{getLeadSourceLabel(lead.source)}</span>
              </div>
              <div>
                <span className="text-slate-600">状态:</span>
                <Badge variant="outline" className="ml-2">
                  {getLeadStatusLabel(lead.status)}
                </Badge>
              </div>
            </div>

            {lead.notes && (
              <div>
                <Label className="text-xs text-slate-600">备注</Label>
                <Textarea
                  value={lead.notes}
                  disabled={isReadOnly}
                  className={`min-h-[80px] ${isReadOnly ? 'bg-slate-50 text-slate-500' : ''}`}
                />
              </div>
            )}
          </div>

          {/* 跟进记录时间轴 */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">跟进记录</h3>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
              </div>
            ) : followUps.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">
                暂无跟进记录
              </div>
            ) : (
              <div className="space-y-3">
                {followUps.map((followUp) => (
                  <div
                    key={followUp.id}
                    className="border-l-2 border-blue-200 pl-4 py-2 bg-slate-50 rounded-r"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <Badge variant="outline" className="text-xs">
                        {getFollowupTypeLabel(followUp.followupType)}
                      </Badge>
                      <span className="text-xs text-slate-500">
                        {new Date(followUp.createdAt).toLocaleString('zh-CN')}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700">{followUp.content}</p>
                    {followUp.nextAction && (
                      <div className="mt-2 text-xs text-slate-600">
                        <span className="font-medium">下一步:</span> {followUp.nextAction}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 快速跟进 */}
          {!isReadOnly && (
            <div className="space-y-3">
              <h3 className="font-semibold text-sm">快速跟进</h3>
              <Textarea
                placeholder="添加跟进备注..."
                value={followUpNote}
                onChange={(e) => setFollowUpNote(e.target.value)}
                className="min-h-[100px]"
              />
              <Button
                size="sm"
                className="w-full"
                onClick={() => toast.info('跟进功能开发中')}
              >
                保存跟进记录
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
