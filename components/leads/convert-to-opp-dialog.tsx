'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Check, ChevronRight } from 'lucide-react'
import { getCustomersAction, type CustomerRow } from '@/app/actions/customer'
import { convertLeadToOpportunityAction, type LeadRow } from '@/app/actions/lead'
import { getLeadCategoryLabel, getLeadSourceLabel } from '@/lib/lead-labels'
import { toast } from 'sonner'

interface ConvertToOppDialogProps {
  lead: LeadRow | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

type Step = 1 | 2 | 3

const STEPS = [
  { step: 1 as Step, label: '确认线索' },
  { step: 2 as Step, label: '关联客户' },
  { step: 3 as Step, label: '业务概括' },
]

// ─── Step indicator ────────────────────────────────────────────────────────────
function StepIndicator({ current }: { current: Step }) {
  return (
    <div className="flex items-center gap-0">
      {STEPS.map((s, i) => {
        const done = s.step < current
        const active = s.step === current
        return (
          <div key={s.step} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={[
                  'flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold transition-colors',
                  done ? 'bg-[#2563eb] text-white' : active ? 'bg-[#2563eb] text-white ring-4 ring-blue-100' : 'bg-[#f3f4f6] text-[#9ca3af]',
                ].join(' ')}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : s.step}
              </div>
              <span
                className={`text-[10px] whitespace-nowrap ${active ? 'font-semibold text-[#111827]' : done ? 'text-[#2563eb]' : 'text-[#9ca3af]'}`}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`mx-2 mb-5 h-px w-10 ${s.step < current ? 'bg-[#2563eb]' : 'bg-[#e5e7eb]'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────
export function ConvertToOppDialog({
  lead,
  isOpen,
  onClose,
  onSuccess,
}: ConvertToOppDialogProps) {
  const [step, setStep] = useState<Step>(1)
  const [customers, setCustomers] = useState<CustomerRow[]>([])
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [wechatGroupName, setWechatGroupName] = useState('')
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setStep(1)
      setSelectedCustomerId(lead?.customerId ?? '')
      setWechatGroupName('')
      setIsLoadingCustomers(true)
      getCustomersAction()
        .then((data) => {
          setCustomers(data)
        })
        .catch(() => toast.error('加载客户列表失败'))
        .finally(() => setIsLoadingCustomers(false))
    }
  }, [isOpen, lead?.customerId])

  const handleConvert = async () => {
    if (!lead) return
    setIsSubmitting(true)
    try {
      const result = await convertLeadToOpportunityAction(
        lead.id,
        selectedCustomerId,
        wechatGroupName.trim()
      )
      if (result.success) {
        toast.success(`转化成功！商机已创建`)
        onSuccess()
        onClose()
      } else {
        toast.error(result.error ?? '转化失败')
      }
    } catch {
      toast.error('转化失败，请重试')
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId)

  if (!lead) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="border-b border-[#e5e7eb] px-6 py-4">
          <DialogTitle className="text-[14px] font-semibold text-[#111827]">
            转为商机
          </DialogTitle>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex justify-center border-b border-[#f3f4f6] bg-[#fafafa] px-6 py-4">
          <StepIndicator current={step} />
        </div>

        {/* Step body */}
        <div className="min-h-[200px] px-6 py-5">
          {/* ── Step 1: Confirm lead info ── */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-[12px] text-[#6b7280]">请确认以下线索信息无误，转化后将不可修改。</p>
              <div className="rounded-md border border-[#e5e7eb] bg-[#f9fafb] p-4">
                <dl className="space-y-2.5">
                  {[
                    { label: '线索编号', value: lead.leadCode },
                    { label: '联系人', value: lead.wechatName || lead.personName },
                    { label: '意向分类', value: getLeadCategoryLabel(lead.category) },
                    { label: '来源渠道', value: getLeadSourceLabel(lead.source) },
                    ...(lead.phone ? [{ label: '电话', value: lead.phone }] : []),
                    ...(lead.initialIntent ? [{ label: '初步意向', value: lead.initialIntent }] : []),
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-start gap-3">
                      <dt className="w-20 shrink-0 text-[11px] text-[#9ca3af]">{label}</dt>
                      <dd className="text-[12px] text-[#374151]">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-2.5">
                <p className="text-[11px] text-amber-700">
                  转化后线索将被锁定为只读状态，商机进入 P1 初步接触阶段。
                </p>
              </div>
            </div>
          )}

          {/* ── Step 2: Select customer ── */}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-[12px] text-[#6b7280]">选择此商机关联的客户主体。</p>

              {isLoadingCustomers ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-[#9ca3af]" />
                  <span className="ml-2 text-[12px] text-[#9ca3af]">加载客户列表...</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="customer-select" className="text-[12px] font-medium text-[#374151]">
                    关联客户 <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={selectedCustomerId || undefined}
                    onValueChange={setSelectedCustomerId}
                    disabled={!!lead.customerId}
                  >
                    <SelectTrigger id="customer-select" className="h-9 text-[12px]">
                      <SelectValue placeholder="请选择客户..." />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.length === 0 ? (
                        <div className="px-4 py-3 text-center text-[12px] text-[#9ca3af]">
                          暂无客户，请先创建客户
                        </div>
                      ) : (
                        customers.map((c) => (
                          <SelectItem key={c.id} value={c.id} className="text-[12px]">
                            <div className="flex flex-col">
                              <span>{c.customerName}</span>
                              <span className="text-[11px] text-[#9ca3af]">
                                {c.customerCode || c.customerId}
                              </span>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {lead.customerId && (
                    <p className="text-[11px] text-[#6b7280]">该线索已关联客户，将自动使用。</p>
                  )}
                </div>
              )}

              {selectedCustomer && (
                <div className="rounded-md border border-[#e5e7eb] bg-[#f9fafb] p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[12px] font-medium text-[#111827]">{selectedCustomer.customerName}</p>
                      <p className="text-[11px] text-[#9ca3af]">
                        {selectedCustomer.customerCode || selectedCustomer.customerId}
                        {' · '}等级 {selectedCustomer.level}
                      </p>
                    </div>
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100">
                      <Check className="h-3.5 w-3.5 text-green-600" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Step 3: Group name / summary ── */}
          {step === 3 && (
            <div className="space-y-4">
              <p className="text-[12px] text-[#6b7280]">
                填写企微群业务概括，系统将据此自动命名商机。
              </p>
              <div className="space-y-2">
                <Label htmlFor="group-name" className="text-[12px] font-medium text-[#374151]">
                  企微群业务概括 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="group-name"
                  value={wechatGroupName}
                  onChange={(e) => setWechatGroupName(e.target.value)}
                  placeholder="例如：米雪冰城落地"
                  className="h-9 text-[12px]"
                  autoFocus
                />
                <p className="text-[11px] text-[#9ca3af]">
                  系统自动分配商机编号如：2026789米雪冰城落地 并创建企微群聊
                </p>
              </div>

              {/* Preview card */}
              {wechatGroupName.trim() && (
                <div className="rounded-md border border-[#e5e7eb] bg-[#f9fafb] p-4">
                  <p className="mb-2 text-[11px] text-[#9ca3af]">商机预览</p>
                  <dl className="space-y-2">
                    {[
                      { label: '客户', value: selectedCustomer?.customerName ?? '—' },
                      { label: '业务概括', value: wechatGroupName.trim() },
                      { label: '意向分类', value: getLeadCategoryLabel(lead.category) },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex gap-3">
                        <dt className="w-16 shrink-0 text-[11px] text-[#9ca3af]">{label}</dt>
                        <dd className="text-[12px] text-[#374151]">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between border-t border-[#e5e7eb] bg-[#fafafa] px-6 py-4">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-[12px] text-[#6b7280]"
            onClick={step === 1 ? onClose : () => setStep((s) => (s - 1) as Step)}
          >
            {step === 1 ? '取消' : '上一步'}
          </Button>

          <div className="flex items-center gap-2">
            {/* Dot progress */}
            <div className="flex items-center gap-1 mr-2">
              {STEPS.map((s) => (
                <div
                  key={s.step}
                  className={`h-1.5 rounded-full transition-all ${s.step === step ? 'w-4 bg-[#2563eb]' : s.step < step ? 'w-1.5 bg-[#93c5fd]' : 'w-1.5 bg-[#e5e7eb]'}`}
                />
              ))}
            </div>

            {step < 3 ? (
              <Button
                size="sm"
                className="h-8 gap-1.5 bg-[#2563eb] text-[12px] hover:bg-[#1d4ed8]"
                disabled={step === 2 && !selectedCustomerId}
                onClick={() => setStep((s) => (s + 1) as Step)}
              >
                下一步
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button
                size="sm"
                className="h-8 bg-[#2563eb] text-[12px] hover:bg-[#1d4ed8]"
                disabled={isSubmitting || !wechatGroupName.trim()}
                onClick={handleConvert}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    转化中...
                  </>
                ) : (
                  '确认转化'
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
