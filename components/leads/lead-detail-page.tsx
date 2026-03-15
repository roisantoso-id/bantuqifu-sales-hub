'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  ChevronLeft, Phone, Edit, Save, Loader2, Send,
  ExternalLink, ArrowUpRight, Flame, Thermometer, Snowflake
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import {
  updateLeadAction,
  advanceLeadStatusAction,
  addLeadFollowUpAction,
  discardLeadAction,
  type LeadRow,
  type LeadFollowUpRow,
} from '@/app/actions/lead'
import {
  getLeadStatusLabel,
  getLeadSourceLabel,
  getLeadUrgencyLabel,
  getLeadCategoryLabel,
} from '@/lib/lead-labels'
import { LeadTimeline } from './lead-timeline'
import { ConvertToOppDialog } from './convert-to-opp-dialog'

const URGENCY_CONFIG: Record<string, { label: string; icon: React.ReactNode; cls: string; bg: string }> = {
  HIGH: { label: 'HOT', icon: <Flame className="h-3 w-3" />, cls: 'text-red-600', bg: 'bg-red-50 text-red-700 border-red-200' },
  HOT:  { label: 'HOT', icon: <Flame className="h-3 w-3" />, cls: 'text-red-600', bg: 'bg-red-50 text-red-700 border-red-200' },
  MEDIUM: { label: 'WARM', icon: <Thermometer className="h-3 w-3" />, cls: 'text-amber-600', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
  WARM:   { label: 'WARM', icon: <Thermometer className="h-3 w-3" />, cls: 'text-amber-600', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
  LOW:  { label: 'COLD', icon: <Snowflake className="h-3 w-3" />, cls: 'text-blue-600', bg: 'bg-blue-50 text-blue-700 border-blue-200' },
  COLD: { label: 'COLD', icon: <Snowflake className="h-3 w-3" />, cls: 'text-blue-600', bg: 'bg-blue-50 text-blue-700 border-blue-200' },
}

const STATUS_OPTIONS = [
  { value: 'new', label: '新线索' },
  { value: 'contacted', label: '已联系' },
  { value: 'ready_for_opportunity', label: '待转化' },
  { value: 'no_interest', label: '无意向' },
]

const STATUS_BADGE: Record<string, string> = {
  new: 'bg-[#eff6ff] text-[#2563eb] border-[#bfdbfe]',
  contacted: 'bg-[#f0fdf4] text-[#16a34a] border-[#bbf7d0]',
  ready_for_opportunity: 'bg-[#fefce8] text-[#ca8a04] border-[#fde68a]',
  no_interest: 'bg-[#f9fafb] text-[#6b7280] border-[#e5e7eb]',
  converted: 'bg-[#dbeafe] text-[#1e40af] border-[#93c5fd]',
  discarded: 'bg-[#fef2f2] text-[#dc2626] border-[#fca5a5]',
  public_pool: 'bg-[#f3f4f6] text-[#374151] border-[#d1d5db]',
}

interface LeadDetailPageProps {
  lead: LeadRow
  initialFollowUps: LeadFollowUpRow[]
}

export function LeadDetailPage({ lead: initialLead, initialFollowUps }: LeadDetailPageProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()

  const [lead, setLead] = useState(initialLead)
  const [followUps, setFollowUps] = useState(initialFollowUps)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [followUpNote, setFollowUpNote] = useState('')
  const [isSendingNote, setIsSendingNote] = useState(false)
  const [convertOpen, setConvertOpen] = useState(false)

  const [editForm, setEditForm] = useState({
    wechatName: lead.wechatName ?? '',
    phone: lead.phone ?? '',
    initialIntent: lead.initialIntent ?? '',
    notes: lead.notes ?? '',
  })

  const isReadOnly = lead.status === 'converted' || !!lead.convertedOpportunityId
  const urgency = URGENCY_CONFIG[lead.urgency] ?? URGENCY_CONFIG['MEDIUM']

  const handleSaveEdit = async () => {
    setIsSaving(true)
    try {
      const result = await updateLeadAction(lead.id, editForm)
      if (result.success) {
        toast.success('线索信息已更新')
        setLead({ ...lead, ...editForm })
        setIsEditing(false)
      } else {
        toast.error(result.error ?? '更新失败')
      }
    } catch {
      toast.error('更新失败，请重试')
    } finally {
      setIsSaving(false)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    setIsSaving(true)
    try {
      const result = await advanceLeadStatusAction(
        lead.id,
        newStatus as 'contacted' | 'ready_for_opportunity' | 'no_interest' | 'new'
      )
      if (result.success) {
        toast.success('状态已更新')
        setLead({ ...lead, status: newStatus as LeadRow['status'] })
        startTransition(() => router.refresh())
      } else {
        toast.error(result.error ?? '更新失败')
      }
    } catch {
      toast.error('更新失败，请重试')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSendFollowUp = async () => {
    if (!followUpNote.trim()) return
    setIsSendingNote(true)
    try {
      const result = await addLeadFollowUpAction({
        leadId: lead.id,
        followupType: 'general',
        content: followUpNote.trim(),
      })
      if (result) {
        toast.success('跟进记录已保存')
        setFollowUpNote('')
        // Prepend new record to timeline
        setFollowUps([result as any, ...followUps])
      } else {
        toast.error('保存失败，请重试')
      }
    } catch {
      toast.error('保存失败，请重试')
    } finally {
      setIsSendingNote(false)
    }
  }

  const handleReturnToPool = async () => {
    if (!confirm(`确定要将线索 ${lead.leadCode} 退回公海吗？`)) return
    try {
      const result = await discardLeadAction(lead.id, 'return_to_pool')
      if (result) {
        toast.success('已退回公海')
        router.push('/?nav=leads')
      } else {
        toast.error('操作失败')
      }
    } catch {
      toast.error('操作失败，请重试')
    }
  }

  return (
    <div className="flex h-full flex-col bg-[#f9fafb]">
      {/* ─── Top bar ─── */}
      <div className="flex items-center justify-between border-b border-[#e5e7eb] bg-white px-6 py-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 px-2 text-[12px] text-[#6b7280] hover:text-[#111827]"
            onClick={() => router.push('/?nav=leads')}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            线索管理
          </Button>
          <span className="text-[#d1d5db]">/</span>
          <span className="font-mono text-[12px] font-medium text-[#111827]">{lead.leadCode}</span>
        </div>

        <div className="flex items-center gap-2">
          {!isReadOnly && (
            <>
              {isEditing ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1.5 text-[12px]"
                  onClick={handleSaveEdit}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Save className="h-3.5 w-3.5" />
                  )}
                  保存更改
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1.5 text-[12px]"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit className="h-3.5 w-3.5" />
                  编辑
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-[12px] text-[#dc2626] hover:border-[#fca5a5] hover:text-[#dc2626]"
                onClick={handleReturnToPool}
              >
                退回公海
              </Button>
              <Button
                size="sm"
                className="h-8 bg-[#2563eb] text-[12px] hover:bg-[#1d4ed8]"
                onClick={() => setConvertOpen(true)}
              >
                <ArrowUpRight className="mr-1.5 h-3.5 w-3.5" />
                转为商机
              </Button>
            </>
          )}
          {isReadOnly && (
            <Badge className="border border-[#93c5fd] bg-[#dbeafe] text-[11px] font-medium text-[#1e40af]">
              已转化为商机
            </Badge>
          )}
        </div>
      </div>

      {/* ─── Body: two-column layout ─── */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Left column — info */}
        <div className="w-[340px] shrink-0 overflow-y-auto border-r border-[#e5e7eb] bg-white">
          {/* Hero: name + meta */}
          <div className="border-b border-[#f3f4f6] px-5 py-4">
            <h1 className="text-[15px] font-semibold text-[#111827]">
              {isEditing ? (
                <Input
                  value={editForm.wechatName}
                  onChange={(e) => setEditForm({ ...editForm, wechatName: e.target.value })}
                  className="h-8 text-[14px] font-semibold"
                />
              ) : (
                lead.wechatName || lead.personName
              )}
            </h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <Badge
                variant="outline"
                className={`h-5 border text-[10px] font-normal ${STATUS_BADGE[lead.status] ?? STATUS_BADGE['new']}`}
              >
                {getLeadStatusLabel(lead.status)}
              </Badge>
              <Badge
                variant="outline"
                className={`flex h-5 items-center gap-1 border text-[10px] font-normal ${urgency.bg}`}
              >
                {urgency.icon}
                {urgency.label}
              </Badge>
            </div>
          </div>

          {/* Contact info */}
          <div className="px-5 py-4">
            <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wide text-[#9ca3af]">联系方式</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 shrink-0 text-[#9ca3af]" />
                {isEditing ? (
                  <Input
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    placeholder="联系电话"
                    className="h-7 text-[12px]"
                  />
                ) : (
                  <span className="text-[12px] text-[#374151]">{lead.phone || '—'}</span>
                )}
              </div>
              {lead.customer && (
                <div className="flex items-center gap-2">
                  <ExternalLink className="h-3.5 w-3.5 shrink-0 text-[#9ca3af]" />
                  <span className="text-[12px] text-[#2563eb]">
                    {lead.customer.customerName}
                  </span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Lead attributes */}
          <div className="px-5 py-4">
            <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wide text-[#9ca3af]">线索属性</p>
            <dl className="space-y-2.5">
              {[
                { label: '意向分类', value: getLeadCategoryLabel(lead.category) },
                { label: '来源渠道', value: getLeadSourceLabel(lead.source) },
                { label: '预算币种', value: lead.budgetCurrency || '—' },
                {
                  label: '预算范围',
                  value:
                    lead.budgetMin || lead.budgetMax
                      ? `${lead.budgetMin ?? '—'} ~ ${lead.budgetMax ?? '—'}`
                      : '—',
                },
                {
                  label: '创建时间',
                  value: new Date(lead.createdAt).toLocaleDateString('zh-CN'),
                },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-start justify-between gap-2">
                  <dt className="shrink-0 text-[11px] text-[#9ca3af]">{label}</dt>
                  <dd className="text-right text-[12px] text-[#374151]">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <Separator />

          {/* Status changer */}
          {!isReadOnly && (
            <>
              <div className="px-5 py-4">
                <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wide text-[#9ca3af]">更改状态</p>
                <Select
                  value={lead.status}
                  onValueChange={handleStatusChange}
                  disabled={isSaving}
                >
                  <SelectTrigger className="h-8 text-[12px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value} className="text-[12px]">
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Separator />
            </>
          )}

          {/* Initial intent */}
          <div className="px-5 py-4">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#9ca3af]">初步意向</p>
            {isEditing ? (
              <Textarea
                value={editForm.initialIntent}
                onChange={(e) => setEditForm({ ...editForm, initialIntent: e.target.value })}
                className="min-h-[80px] text-[12px] leading-relaxed"
                placeholder="描述客户初步意向..."
              />
            ) : (
              <p className="text-[12px] leading-relaxed text-[#374151]">
                {lead.initialIntent || '—'}
              </p>
            )}
          </div>

          {/* Notes */}
          {(lead.notes || isEditing) && (
            <>
              <Separator />
              <div className="px-5 py-4">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#9ca3af]">备注</p>
                {isEditing ? (
                  <Textarea
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    className="min-h-[60px] text-[12px] leading-relaxed"
                    placeholder="添加备注..."
                  />
                ) : (
                  <p className="text-[12px] leading-relaxed text-[#374151]">{lead.notes}</p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Right column — timeline */}
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-[#f9fafb]">
          {/* Quick follow-up input */}
          {!isReadOnly && (
            <div className="border-b border-[#e5e7eb] bg-white px-5 py-3">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#9ca3af]">快速跟进</p>
              <div className="flex gap-2">
                <Textarea
                  value={followUpNote}
                  onChange={(e) => setFollowUpNote(e.target.value)}
                  placeholder="记录本次跟进内容..."
                  className="min-h-[60px] flex-1 resize-none text-[12px] leading-relaxed"
                  disabled={isSendingNote}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      handleSendFollowUp()
                    }
                  }}
                />
                <Button
                  size="sm"
                  className="h-auto self-end bg-[#2563eb] px-3 py-2 hover:bg-[#1d4ed8]"
                  onClick={handleSendFollowUp}
                  disabled={isSendingNote || !followUpNote.trim()}
                >
                  {isSendingNote ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
              <p className="mt-1 text-[10px] text-[#9ca3af]">⌘ + Enter 快速发送</p>
            </div>
          )}

          {/* Timeline scroll area */}
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9ca3af]">
                跟进记录
              </p>
              {followUps.length > 0 && (
                <span className="text-[10px] text-[#9ca3af]">{followUps.length} 条</span>
              )}
            </div>
            <LeadTimeline followUps={followUps} />
          </div>
        </div>
      </div>

      {/* Convert to opportunity dialog */}
      <ConvertToOppDialog
        lead={lead}
        isOpen={convertOpen}
        onClose={() => setConvertOpen(false)}
        onSuccess={() => {
          setConvertOpen(false)
          router.push('/?nav=leads')
          router.refresh()
        }}
      />
    </div>
  )
}
