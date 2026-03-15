'use client'

import { useEffect, useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Loader2,
  X,
  Phone,
  Mail,
  MessageCircle,
  Building2,
  Briefcase,
  Clock,
  Send,
  Edit,
  Save,
} from 'lucide-react'
import { getLeadFollowUpsAction, addLeadFollowUpAction, updateLeadAction, type LeadRow, type LeadFollowUpRow } from '@/app/actions/lead'
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
  const [isSaving, setIsSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    wechatName: '',
    phone: '',
    initialIntent: '',
    notes: '',
  })

  // 判断是否已转化为商机（只读模式）
  const isReadOnly = lead?.status === 'CONVERTED' || lead?.convertedOpportunityId

  useEffect(() => {
    if (isOpen && lead?.id) {
      setIsLoading(true)
      setIsEditing(false)
      setEditForm({
        wechatName: lead.wechatName || '',
        phone: lead.phone || '',
        initialIntent: lead.initialIntent || '',
        notes: lead.notes || '',
      })
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

  const handleSaveFollowUp = async () => {
    if (!lead?.id || !followUpNote.trim()) {
      toast.error('请输入跟进内容')
      return
    }

    setIsSaving(true)

    try {
      const result = await addLeadFollowUpAction({
        leadId: lead.id,
        followupType: 'general',
        content: followUpNote.trim(),
      })

      if (result) {
        toast.success('跟进记录已保存')
        setFollowUpNote('')
        // 重新加载跟进记录
        const updatedFollowUps = await getLeadFollowUpsAction(lead.id)
        setFollowUps(updatedFollowUps)
      } else {
        toast.error('保存失败，请重试')
      }
    } catch (error) {
      console.error('Save follow-up error:', error)
      toast.error('保存失败，请重试')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveEdit = async () => {
    if (!lead?.id) return

    setIsSaving(true)
    try {
      const result = await updateLeadAction(lead.id, editForm)
      if (result.success) {
        toast.success('线索信息已更新')
        setIsEditing(false)
        // 刷新页面以显示最新数据
        window.location.reload()
      } else {
        toast.error(result.error || '更新失败')
      }
    } catch (error) {
      console.error('Update lead error:', error)
      toast.error('更新失败，请重试')
    } finally {
      setIsSaving(false)
    }
  }

  if (!lead) return null

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[500px] sm:max-w-[500px] p-0 overflow-hidden flex flex-col">
        {/* 可访问性标题 - 视觉隐藏 */}
        <SheetHeader className="sr-only">
          <SheetTitle>线索详情 - {lead.leadCode}</SheetTitle>
          <SheetDescription>
            查看和编辑线索 {lead.personName} 的详细信息
          </SheetDescription>
        </SheetHeader>

        {/* 极简头部 */}
        <div className="border-b border-[#e5e7eb] bg-white px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <h2 className="text-[13px] font-semibold text-[#111827] truncate">
                  {lead.wechatName}
                </h2>
                {isReadOnly && (
                  <Badge className="h-4 text-[10px] bg-[#dbeafe] text-[#1e40af] border-0">
                    已转化
                  </Badge>
                )}
              </div>
              <p className="text-[11px] text-[#6b7280] font-mono">{lead.leadCode}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="h-5 text-[10px] bg-[#f3f4f6] text-[#374151] border-0">
                {getLeadUrgencyLabel(lead.urgency)}
              </Badge>
              {!isReadOnly && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-[#6b7280] hover:text-[#111827] hover:bg-[#f3f4f6]"
                  onClick={() => isEditing ? handleSaveEdit() : setIsEditing(true)}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : isEditing ? (
                    <Save className="h-3 w-3" />
                  ) : (
                    <Edit className="h-3 w-3" />
                  )}
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-[#6b7280] hover:text-[#111827] hover:bg-[#f3f4f6]"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* 高密度信息区 */}
        <div className="flex-1 overflow-y-auto">
          {/* 转化提示 */}
          {isReadOnly && (
            <div className="mx-4 mt-3 mb-2 px-3 py-2 bg-[#eff6ff] border border-[#bfdbfe] rounded-sm">
              <p className="text-[11px] text-[#1e40af]">
                该线索已转化为商机，基础信息不可修改
              </p>
            </div>
          )}

          {/* 基本信息 - 紧凑布局 */}
          <div className="px-4 py-3 space-y-2">
            <div className="text-[11px] font-medium text-[#6b7280] mb-2">基本信息</div>

            {/* 微信名 */}
            <div className="space-y-1">
              <div className="text-[10px] text-[#9ca3af]">微信名/称呼</div>
              {isEditing ? (
                <Input
                  value={editForm.wechatName}
                  onChange={(e) => setEditForm({...editForm, wechatName: e.target.value})}
                  className="h-7 text-[12px]"
                />
              ) : (
                <div className="text-[12px] text-[#6b7280]">{lead.wechatName || '—'}</div>
              )}
            </div>

            {/* 电话 */}
            <div className="space-y-1">
              <div className="text-[10px] text-[#9ca3af]">电话</div>
              {isEditing ? (
                <Input
                  value={editForm.phone}
                  onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                  className="h-7 text-[12px]"
                />
              ) : (
                <div className="flex items-center gap-2 text-[12px]">
                  <Phone className="h-3 w-3 text-[#9ca3af]" />
                  <span className="text-[#6b7280]">{lead.phone || '—'}</span>
                </div>
              )}
            </div>

            {/* 初步意向 */}
            <div className="space-y-1">
              <div className="text-[10px] text-[#9ca3af]">初步意向</div>
              {isEditing ? (
                <Textarea
                  value={editForm.initialIntent}
                  onChange={(e) => setEditForm({...editForm, initialIntent: e.target.value})}
                  className="min-h-[60px] text-[12px]"
                />
              ) : (
                <div className="text-[12px] text-[#6b7280] leading-relaxed">
                  {lead.initialIntent || '—'}
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* 线索属性 - 紧凑标签 */}
          <div className="px-4 py-3">
            <div className="text-[11px] font-medium text-[#6b7280] mb-2">线索属性</div>
            <div className="flex flex-wrap gap-1.5">
              <div className="inline-flex items-center gap-1 px-2 py-1 bg-[#f3f4f6] rounded-sm">
                <span className="text-[10px] text-[#9ca3af]">意向</span>
                <span className="text-[11px] text-[#111827] font-medium">
                  {getLeadCategoryLabel(lead.category)}
                </span>
              </div>
              <div className="inline-flex items-center gap-1 px-2 py-1 bg-[#f3f4f6] rounded-sm">
                <span className="text-[10px] text-[#9ca3af]">来源</span>
                <span className="text-[11px] text-[#111827] font-medium">
                  {getLeadSourceLabel(lead.source)}
                </span>
              </div>
              <div className="inline-flex items-center gap-1 px-2 py-1 bg-[#f3f4f6] rounded-sm">
                <span className="text-[10px] text-[#9ca3af]">状态</span>
                <span className="text-[11px] text-[#111827] font-medium">
                  {getLeadStatusLabel(lead.status)}
                </span>
              </div>
            </div>

            {(lead.notes || isEditing) && (
              <div className="mt-3">
                <div className="text-[10px] text-[#9ca3af] mb-1">备注</div>
                {isEditing ? (
                  <Textarea
                    value={editForm.notes}
                    onChange={(e) => setEditForm({...editForm, notes: e.target.value})}
                    className="min-h-[60px] text-[11px]"
                    placeholder="添加备注..."
                  />
                ) : (
                  <p className="text-[11px] text-[#374151] leading-relaxed">
                    {lead.notes}
                  </p>
                )}
              </div>
            )}
          </div>

          <Separator />

          {/* 跟进记录 - 高密度时间轴 */}
          <div className="px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[11px] font-medium text-[#6b7280]">跟进记录</div>
              {followUps.length > 0 && (
                <span className="text-[10px] text-[#9ca3af]">
                  {followUps.length} 条
                </span>
              )}
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-4 w-4 animate-spin text-[#9ca3af]" />
              </div>
            ) : followUps.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="h-8 w-8 text-[#e5e7eb] mx-auto mb-2" />
                <p className="text-[11px] text-[#9ca3af]">暂无跟进记录</p>
              </div>
            ) : (
              <div className="space-y-3">
                {followUps.map((followUp, index) => (
                  <div key={followUp.id} className="relative">
                    {/* 时间轴线 */}
                    {index !== followUps.length - 1 && (
                      <div className="absolute left-1 top-5 bottom-0 w-px bg-[#e5e7eb]" />
                    )}

                    <div className="flex gap-2">
                      {/* 时间轴点 */}
                      <div className="relative flex h-2.5 w-2.5 shrink-0 items-center justify-center rounded-full bg-[#2563eb] mt-1.5 ring-2 ring-white" />

                      {/* 内容 */}
                      <div className="flex-1 pb-2">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="h-4 text-[10px] font-normal border-[#e5e7eb]">
                            {getFollowupTypeLabel(followUp.followupType)}
                          </Badge>
                          <span className="text-[10px] text-[#9ca3af]">
                            {new Date(followUp.createdAt).toLocaleString('zh-CN', {
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          {followUp.operator && (
                            <span className="text-[10px] text-[#6b7280]">
                              · {followUp.operator.name || followUp.operator.email}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#374151] leading-relaxed">
                          {followUp.content}
                        </p>
                        {followUp.nextAction && (
                          <div className="mt-1 pl-2 border-l-2 border-[#dbeafe]">
                            <p className="text-[10px] text-[#6b7280]">
                              下一步: {followUp.nextAction}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 快速跟进 */}
          {!isReadOnly && (
            <>
              <Separator />
              <div className="px-4 py-3">
                <div className="text-[11px] font-medium text-[#6b7280] mb-2">快速跟进</div>
                <Textarea
                  placeholder="记录本次跟进..."
                  value={followUpNote}
                  onChange={(e) => setFollowUpNote(e.target.value)}
                  className="min-h-[60px] text-[11px] resize-none mb-2"
                  disabled={isSaving}
                />
                <Button
                  size="sm"
                  className="w-full h-7 text-[11px] bg-[#2563eb] hover:bg-[#1d4ed8]"
                  onClick={handleSaveFollowUp}
                  disabled={isSaving || !followUpNote.trim()}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                      保存中...
                    </>
                  ) : (
                    <>
                      <Send className="h-3 w-3 mr-1.5" />
                      保存跟进
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
