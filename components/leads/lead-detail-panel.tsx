'use client'

import { useEffect, useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Loader2,
  X,
  Phone,
  Clock,
  Send,
  Save,
  ArrowRight,
  RotateCcw,
} from 'lucide-react'
import { getLeadFollowUpsAction, addLeadFollowUpAction, updateLeadAction, advanceLeadStatusAction, type LeadRow, type LeadFollowUpRow } from '@/app/actions/lead'
import { getCustomersAction, type CustomerRow } from '@/app/actions/customer'
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
  onConvertToOpportunity?: (lead: LeadRow) => void
  onReturnToPool?: (lead: LeadRow) => void
}

export function LeadDetailPanel({ lead, isOpen, onClose, onConvertToOpportunity, onReturnToPool }: LeadDetailPanelProps) {
  const [followUps, setFollowUps] = useState<LeadFollowUpRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [followUpNote, setFollowUpNote] = useState('')
  const [followUpType, setFollowUpType] = useState<'NOTE' | 'CALL' | 'VISIT'>('NOTE')
  const [isSaving, setIsSaving] = useState(false)
  const [customers, setCustomers] = useState<CustomerRow[]>([])
  const [activeTab, setActiveTab] = useState('details')
  const [editForm, setEditForm] = useState({
    wechatName: '',
    phone: '',
    source: '',
    category: '',
    budgetMin: '',
    budgetMax: '',
    budgetCurrency: 'IDR',
    urgency: 'MEDIUM',
    initialIntent: '',
    notes: '',
    customerId: '',
    nextFollowDate: '',
  })

  // 判断是否已转化为商机（只读模式）
  const isReadOnly = lead?.status === 'converted' || lead?.convertedOpportunityId

  useEffect(() => {
    if (isOpen && lead?.id) {
      setIsLoading(true)
      setActiveTab('details')
      setEditForm({
        wechatName: lead.wechatName || '',
        phone: lead.phone || '',
        source: lead.source || '',
        category: lead.category || '',
        budgetMin: lead.budgetMin?.toString() || '',
        budgetMax: lead.budgetMax?.toString() || '',
        budgetCurrency: lead.budgetCurrency || 'IDR',
        urgency: lead.urgency || 'MEDIUM',
        initialIntent: lead.initialIntent || '',
        notes: lead.notes || '',
        customerId: lead.customerId || '',
        nextFollowDate: lead.nextFollowDate || '',
      })
      
      Promise.all([
        getLeadFollowUpsAction(lead.id),
        getCustomersAction()
      ])
        .then(([followUpsData, customersData]) => {
          setFollowUps(followUpsData)
          setCustomers(customersData)
          setIsLoading(false)
        })
        .catch(error => {
          console.error('Failed to load data:', error)
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
        followupType: followUpType,
        content: followUpNote.trim(),
      })

      if (result) {
        toast.success('跟进记录已保存')
        setFollowUpNote('')
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
      const result = await updateLeadAction(lead.id, {
        wechatName: editForm.wechatName,
        phone: editForm.phone,
        source: editForm.source,
        category: editForm.category,
        budgetMin: editForm.budgetMin ? parseFloat(editForm.budgetMin) : undefined,
        budgetMax: editForm.budgetMax ? parseFloat(editForm.budgetMax) : undefined,
        budgetCurrency: editForm.budgetCurrency,
        urgency: editForm.urgency,
        initialIntent: editForm.initialIntent,
        notes: editForm.notes,
        customerId: editForm.customerId || undefined,
        nextFollowDate: editForm.nextFollowDate || undefined,
      })
      if (result.success) {
        toast.success('线索信息已更新')
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

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-blue-500 text-white border-0'
      case 'contacted':
        return 'bg-amber-500 text-white border-0'
      case 'ready_for_opportunity':
        return 'bg-green-500 text-white border-0'
      case 'converted':
        return 'bg-slate-500 text-white border-0'
      case 'no_interest':
        return 'bg-slate-300 text-slate-700 border-0'
      default:
        return 'bg-slate-100 text-slate-700 border-0'
    }
  }

  const getUrgencyBadgeStyle = (urgency: string) => {
    switch (urgency) {
      case 'HIGH':
        return 'border-red-500 text-red-600 bg-transparent'
      case 'MEDIUM':
        return 'border-amber-500 text-amber-600 bg-transparent'
      case 'LOW':
        return 'border-slate-300 text-slate-500 bg-transparent'
      default:
        return 'border-slate-300 text-slate-500 bg-transparent'
    }
  }

  if (!lead) return null

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[500px] sm:max-w-[500px] p-0 flex flex-col border-l border-slate-200 bg-white">
        {/* 可访问性标题 - 视觉隐藏 */}
        <SheetHeader className="sr-only">
          <SheetTitle>线索详情 - {lead.leadCode}</SheetTitle>
          <SheetDescription>
            查看和编辑线索 {lead.wechatName} 的详细信息
          </SheetDescription>
        </SheetHeader>

        {/* 紧凑头部 */}
        <div className="border-b border-slate-200 px-4 py-3">
          {/* 第一行：ID + 状态 + 紧迫度 */}
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[11px] text-slate-500">{lead.leadCode}</span>
            <Badge className={`h-4 px-1.5 text-[10px] font-medium ${getStatusBadgeStyle(lead.status)}`}>
              {getLeadStatusLabel(lead.status)}
            </Badge>
            <Badge variant="outline" className={`h-4 px-1.5 text-[10px] font-medium ${getUrgencyBadgeStyle(lead.urgency)}`}>
              {getLeadUrgencyLabel(lead.urgency)}
            </Badge>
          </div>
          {/* 第二行：客户名 */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 truncate">{lead.wechatName}</h2>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Tabs 导航 */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <div className="px-4 pt-2">
            <TabsList className="h-8 bg-slate-100/50 p-0.5 w-full">
              <TabsTrigger value="details" className="text-xs flex-1 h-7 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                详细信息
              </TabsTrigger>
              <TabsTrigger value="followups" className="text-xs flex-1 h-7 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                跟进记录 {followUps.length > 0 && `(${followUps.length})`}
              </TabsTrigger>
            </TabsList>
          </div>

          {/* 详细信息 Tab */}
          <TabsContent value="details" className="flex-1 overflow-y-auto mt-0 px-4 py-3">
            {isReadOnly && (
              <div className="mb-3 px-3 py-2 bg-blue-50 border border-blue-200 rounded">
                <p className="text-[11px] text-blue-700">该线索已转化为商机，基础信息不可修改</p>
              </div>
            )}

            {/* 高密度表单区 - Grid 布局 */}
            <div className="grid grid-cols-2 gap-3">
              {/* 微信昵称 */}
              <div className="space-y-1">
                <label className="text-[11px] text-slate-500">微信昵称</label>
                <Input
                  value={editForm.wechatName}
                  onChange={(e) => setEditForm({...editForm, wechatName: e.target.value})}
                  className="h-8 text-xs focus-visible:ring-0 focus-visible:border-blue-500"
                  disabled={isReadOnly}
                />
              </div>

              {/* 手机号码 */}
              <div className="space-y-1">
                <label className="text-[11px] text-slate-500">手机号码</label>
                <Input
                  value={editForm.phone}
                  onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                  className="h-8 text-xs font-mono focus-visible:ring-0 focus-visible:border-blue-500"
                  disabled={isReadOnly}
                  placeholder="—"
                />
              </div>

              {/* 意向服务 */}
              <div className="space-y-1">
                <label className="text-[11px] text-slate-500">意向服务</label>
                <Select
                  value={editForm.category}
                  onValueChange={(v) => setEditForm({...editForm, category: v})}
                  disabled={isReadOnly}
                >
                  <SelectTrigger className="h-8 text-xs focus:ring-0 focus:border-blue-500">
                    <SelectValue placeholder="请选择" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VISA">签证服务</SelectItem>
                    <SelectItem value="COMPANY_REGISTRATION">公司注册</SelectItem>
                    <SelectItem value="TAX_SERVICES">税务服务</SelectItem>
                    <SelectItem value="FINANCIAL_SERVICES">财务服务</SelectItem>
                    <SelectItem value="PERMIT_SERVICES">许可证服务</SelectItem>
                    <SelectItem value="OTHER">其他</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 线索来源 */}
              <div className="space-y-1">
                <label className="text-[11px] text-slate-500">线索来源</label>
                <Select
                  value={editForm.source}
                  onValueChange={(v) => setEditForm({...editForm, source: v})}
                  disabled={isReadOnly}
                >
                  <SelectTrigger className="h-8 text-xs focus:ring-0 focus:border-blue-500">
                    <SelectValue placeholder="请选择" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="wechat">山海图微信群</SelectItem>
                    <SelectItem value="referral">老客户推荐</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="website">官网</SelectItem>
                    <SelectItem value="cold_outreach">冷拉</SelectItem>
                    <SelectItem value="other">其他</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 预算下限 */}
              <div className="space-y-1">
                <label className="text-[11px] text-slate-500">预算下限</label>
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-mono">
                    {editForm.budgetCurrency}
                  </span>
                  <Input
                    type="number"
                    value={editForm.budgetMin}
                    onChange={(e) => setEditForm({...editForm, budgetMin: e.target.value})}
                    className="h-8 text-xs font-mono pl-9 focus-visible:ring-0 focus-visible:border-blue-500"
                    disabled={isReadOnly}
                    placeholder="0"
                  />
                </div>
              </div>

              {/* 预算上限 */}
              <div className="space-y-1">
                <label className="text-[11px] text-slate-500">预算上限</label>
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-mono">
                    {editForm.budgetCurrency}
                  </span>
                  <Input
                    type="number"
                    value={editForm.budgetMax}
                    onChange={(e) => setEditForm({...editForm, budgetMax: e.target.value})}
                    className="h-8 text-xs font-mono pl-9 focus-visible:ring-0 focus-visible:border-blue-500"
                    disabled={isReadOnly}
                    placeholder="0"
                  />
                </div>
              </div>

              {/* 紧迫度 */}
              <div className="space-y-1">
                <label className="text-[11px] text-slate-500">紧迫度</label>
                <Select
                  value={editForm.urgency}
                  onValueChange={(v) => setEditForm({...editForm, urgency: v})}
                  disabled={isReadOnly}
                >
                  <SelectTrigger className="h-8 text-xs focus:ring-0 focus:border-blue-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HIGH">高 - 急迫</SelectItem>
                    <SelectItem value="MEDIUM">中 - 一般</SelectItem>
                    <SelectItem value="LOW">低 - 不急</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 关联客户 */}
              <div className="space-y-1">
                <label className="text-[11px] text-slate-500">关联客户</label>
                <Select
                  value={editForm.customerId || 'none'}
                  onValueChange={(v) => setEditForm({...editForm, customerId: v === 'none' ? '' : v})}
                  disabled={isReadOnly}
                >
                  <SelectTrigger className="h-8 text-xs focus:ring-0 focus:border-blue-500">
                    <SelectValue placeholder="选择客户" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">不关联</SelectItem>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.customerName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 初始需求说明 - 全宽 */}
              <div className="col-span-2 space-y-1">
                <label className="text-[11px] text-slate-500">初始需求说明</label>
                <Textarea
                  value={editForm.initialIntent}
                  onChange={(e) => setEditForm({...editForm, initialIntent: e.target.value})}
                  className="min-h-[80px] text-xs resize-none focus-visible:ring-0 focus-visible:border-blue-500"
                  disabled={isReadOnly}
                  placeholder="记录客户的初步需求..."
                />
              </div>

              {/* 备注 - 全宽 */}
              <div className="col-span-2 space-y-1">
                <label className="text-[11px] text-slate-500">备注</label>
                <Textarea
                  value={editForm.notes}
                  onChange={(e) => setEditForm({...editForm, notes: e.target.value})}
                  className="min-h-[60px] text-xs resize-none focus-visible:ring-0 focus-visible:border-blue-500"
                  disabled={isReadOnly}
                  placeholder="其他备注信息..."
                />
              </div>
            </div>
          </TabsContent>

          {/* 跟进记录 Tab */}
          <TabsContent value="followups" className="flex-1 overflow-y-auto mt-0 px-4 py-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
              </div>
            ) : followUps.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="h-10 w-10 text-slate-200 mx-auto mb-2" />
                <p className="text-xs text-slate-400">暂无跟进记录</p>
              </div>
            ) : (
              <div className="space-y-3">
                {followUps.map((followUp, index) => (
                  <div key={followUp.id} className="relative">
                    {index !== followUps.length - 1 && (
                      <div className="absolute left-1 top-5 bottom-0 w-px bg-slate-200" />
                    )}
                    <div className="flex gap-2.5">
                      <div className="relative flex h-2.5 w-2.5 shrink-0 items-center justify-center rounded-full bg-blue-500 mt-1.5 ring-2 ring-white" />
                      <div className="flex-1 pb-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="h-4 px-1.5 text-[10px] font-normal border-slate-200">
                            {getFollowupTypeLabel(followUp.followupType)}
                          </Badge>
                          <span className="text-[10px] text-slate-400">
                            {new Date(followUp.createdAt).toLocaleString('zh-CN', {
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          {followUp.operator && (
                            <span className="text-[10px] text-slate-500">
                              · {followUp.operator.name || followUp.operator.email}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-700 leading-relaxed">
                          {followUp.content}
                        </p>
                        {followUp.nextAction && (
                          <div className="mt-1.5 pl-2 border-l-2 border-blue-100">
                            <p className="text-[10px] text-slate-500">下一步: {followUp.nextAction}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 快速跟进输入 */}
            {!isReadOnly && (
              <div className="mt-4 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] text-slate-500">新增跟进</label>
                  <Select value={followUpType} onValueChange={(v) => setFollowUpType(v as 'NOTE' | 'CALL' | 'VISIT')}>
                    <SelectTrigger className="h-6 w-[80px] text-[10px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NOTE">备注</SelectItem>
                      <SelectItem value="CALL">电话</SelectItem>
                      <SelectItem value="VISIT">拜访</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Textarea
                  placeholder="记录本次跟进内容..."
                  value={followUpNote}
                  onChange={(e) => setFollowUpNote(e.target.value)}
                  className="min-h-[60px] text-xs resize-none mb-2 focus-visible:ring-0 focus-visible:border-blue-500"
                  disabled={isSaving}
                />
                <Button
                  size="sm"
                  className="w-full h-8 text-xs bg-blue-600 hover:bg-blue-700"
                  onClick={handleSaveFollowUp}
                  disabled={isSaving || !followUpNote.trim()}
                >
                  {isSaving ? (
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5 mr-1.5" />
                  )}
                  保存跟进
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* 固定底部操作区 */}
        {!isReadOnly && (
          <div className="border-t border-slate-200 bg-slate-50 px-4 py-3 flex items-center justify-between">
            {/* 左侧：业务流转按钮 */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                className="h-8 text-xs bg-blue-600 hover:bg-blue-700"
                onClick={() => onConvertToOpportunity?.(lead)}
              >
                <ArrowRight className="h-3.5 w-3.5 mr-1.5" />
                转为商机
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => onReturnToPool?.(lead)}
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                退回公海
              </Button>
            </div>

            {/* 右侧：保存按钮 */}
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={handleSaveEdit}
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5 mr-1.5" />
              )}
              保存修改
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
