'use client'

import { AlertCircle, Check, Copy, Eye, Loader2, Lock, Upload } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ImagePreviewDialog, isImagePreviewable } from '@/components/ui/image-preview-dialog'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { OpportunityP5Data, Opportunity, AvailableContractEntityOption } from '@/lib/types'

interface P5FinanceProps {
  opportunity: Opportunity
  p5Data?: OpportunityP5Data
  onDataChange: (data: OpportunityP5Data) => void
  onSaveContractEntity: (contractEntityId: string) => Promise<{ success: boolean; error?: string }>
  onUploadReceipt: (formData: FormData) => Promise<{ success: boolean; error?: string }>
  onRejectReceipt: (reason: string) => Promise<{ success: boolean; error?: string }>
  onConfirmPayment: (payload: { receivedAmount: number }) => Promise<{ success: boolean; error?: string }>
  isReadonly?: boolean
}

const STATUS_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  pending: {
    label: '等待凭证',
    color: 'text-[#f59e0b]',
    bg: 'bg-[#fef3c7]',
  },
  verified: {
    label: '已确认',
    color: 'text-[#10b981]',
    bg: 'bg-[#d1fae5]',
  },
  rejected: {
    label: '已驳回',
    color: 'text-[#dc2626]',
    bg: 'bg-[#fee2e2]',
  },
}

function formatCurrency(amount: number, currency: 'CNY' | 'IDR' = 'CNY'): string {
  const symbol = currency === 'CNY' ? '¥' : 'Rp'
  return `${symbol} ${amount.toLocaleString()}`
}

function getAccountTail(bankAccountNo?: string) {
  const digits = bankAccountNo?.replace(/\s+/g, '') ?? ''
  if (!digits) {
    return null
  }

  return digits.slice(-4)
}

function formatEntityOptionLabel(entity: AvailableContractEntityOption) {
  const tail = getAccountTail(entity.bankAccountNo)
  const suffix = [entity.currency, tail ? `尾号 ${tail}` : null].filter(Boolean).join(' · ')
  return suffix ? `${entity.shortName} · ${suffix}` : entity.shortName
}

export function P5Finance({
  opportunity,
  p5Data,
  onDataChange,
  onSaveContractEntity,
  onUploadReceipt,
  onRejectReceipt,
  onConfirmPayment,
  isReadonly = false,
}: P5FinanceProps) {
  const [copied, setCopied] = useState<'account' | 'bank' | 'swift' | null>(null)
  const [isSavingEntity, setIsSavingEntity] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [auditForm, setAuditForm] = useState({
    paymentDate: '',
    actualAmount: '',
    notes: '',
  })
  const [rejectionForm, setRejectionForm] = useState('')
  const [showRejectionUI, setShowRejectionUI] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const currentData = p5Data || {
    dueAmount: 0,
    receivedAmount: 0,
    paymentStatus: 'pending',
  }

  useEffect(() => {
    setIsDragging(false)
    setPreviewOpen(false)
    setIsSavingEntity(false)
    setIsUploading(false)
    setIsConfirming(false)
    setIsRejecting(false)
    setErrorMessage(null)
    setRejectionForm('')
    setShowRejectionUI(false)
    setAuditForm({
      paymentDate: '',
      actualAmount: currentData.receivedAmount ? String(currentData.receivedAmount) : '',
      notes: '',
    })
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [opportunity.id, p5Data, currentData.receivedAmount])

  const previewUrl = useMemo(() => {
    if (!currentData.receiptPreviewUrl && !currentData.receiptFileUrl) {
      return undefined
    }

    return currentData.receiptPreviewUrl ?? currentData.receiptFileUrl
  }, [currentData.receiptPreviewUrl, currentData.receiptFileUrl])

  const availableEntities = currentData.availableContractEntities || []
  const effectiveEntity = currentData.selectedContractEntity
    || availableEntities.find((entity) => entity.id === currentData.recommendedContractEntityId)
  const effectiveEntityId = effectiveEntity?.id
  const accountTail = getAccountTail(effectiveEntity?.bankAccountNo)
  const hasValidEntity = Boolean(effectiveEntity)
  const hasReceipt = Boolean(currentData.receiptFileUrl)
  const canConfirm = Boolean(
    hasValidEntity
    && hasReceipt
    && auditForm.paymentDate
    && auditForm.actualAmount
    && !isReadonly
    && !isConfirming
  )
  const lockHint = currentData.paymentStatus === 'verified'
    ? 'P6 已解锁'
    : 'P6 尚未解锁'

  useEffect(() => {
    if (
      isReadonly
      || !effectiveEntityId
      || currentData.contractEntityId
      || isSavingEntity
      || availableEntities.length === 0
    ) {
      return
    }

    let cancelled = false

    setIsSavingEntity(true)
    onSaveContractEntity(effectiveEntityId)
      .then((result) => {
        if (!result.success && !cancelled) {
          setErrorMessage(result.error || '保存推荐付款主体失败')
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsSavingEntity(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [availableEntities.length, currentData.contractEntityId, effectiveEntityId, isReadonly, isSavingEntity, onSaveContractEntity])

  const isImageReceipt = useMemo(
    () => isImagePreviewable({ url: previewUrl, fileName: currentData.receiptFileName }),
    [currentData.receiptFileName, previewUrl]
  )

  const handleSelectEntity = async (entityId: string) => {
    if (isReadonly || isSavingEntity || currentData.contractEntityId === entityId) {
      return
    }

    setErrorMessage(null)
    setIsSavingEntity(true)
    const result = await onSaveContractEntity(entityId)
    setIsSavingEntity(false)

    if (!result.success) {
      setErrorMessage(result.error || '保存付款主体失败')
    }
  }

  const handleCopy = async (text: string, type: 'account' | 'bank' | 'swift') => {
    if (!text) {
      return
    }

    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text)
      } else if (typeof document !== 'undefined') {
        const textarea = document.createElement('textarea')
        textarea.value = text
        textarea.setAttribute('readonly', '')
        textarea.style.position = 'absolute'
        textarea.style.left = '-9999px'
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
      } else {
        throw new Error('Clipboard API unavailable')
      }

      setCopied(type)
      setTimeout(() => setCopied(null), 2000)
    } catch {
      setErrorMessage('当前环境不支持复制，请手动复制')
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (!hasValidEntity || isReadonly || hasReceipt) {
      return
    }
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const uploadReceipt = async (file: File) => {
    if (isReadonly || isUploading || !hasValidEntity) {
      return
    }

    setErrorMessage(null)
    setIsUploading(true)

    const formData = new FormData()
    formData.set('file', file)
    formData.set('dueAmount', String(currentData.dueAmount || 0))

    const result = await onUploadReceipt(formData)

    setIsUploading(false)

    if (!result.success) {
      setErrorMessage(result.error || '打款凭证上传失败')
      return
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file && hasValidEntity) {
      await uploadReceipt(file)
    }
  }

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && hasValidEntity) {
      await uploadReceipt(file)
    }
  }

  const handleConfirmAudit = async () => {
    if (!canConfirm) {
      return
    }

    const actualAmount = parseInt(auditForm.actualAmount.replace(/\D/g, ''), 10) || 0
    setErrorMessage(null)
    setIsConfirming(true)
    const result = await onConfirmPayment({ receivedAmount: actualAmount })
    setIsConfirming(false)

    if (!result.success) {
      setErrorMessage(result.error || '确认到账失败')
      return
    }

    setAuditForm({ paymentDate: '', actualAmount: '', notes: '' })
  }

  const handleRejectSubmit = async () => {
    const trimmedReason = rejectionForm.trim()

    if (!trimmedReason || isReadonly || isRejecting) {
      return
    }

    setErrorMessage(null)
    setIsRejecting(true)
    const result = await onRejectReceipt(trimmedReason)
    setIsRejecting(false)

    if (!result.success) {
      setErrorMessage(result.error || '驳回凭证失败')
      return
    }

    setRejectionForm('')
    setShowRejectionUI(false)
  }

  const amountRemaining = Math.max(0, currentData.dueAmount - currentData.receivedAmount)
  const badge = STATUS_BADGE[currentData.paymentStatus]

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="border-b border-[#e5e7eb] px-5 py-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-[13px] font-semibold text-[#111827]">P5: 财务确认与对账</h3>
              <div className="inline-flex items-center gap-1 rounded-full border border-[#e5e7eb] bg-white px-2 py-0.5">
                <Lock size={11} className={currentData.paymentStatus === 'verified' ? 'text-[#16a34a]' : 'text-[#9ca3af]'} />
                <span className="text-[11px] text-[#6b7280]">{lockHint}</span>
              </div>
            </div>
          </div>
          <div className={`inline-flex items-center gap-2 rounded-sm px-2.5 py-1 ${badge.bg}`}>
            <span className={`inline-block h-2 w-2 rounded-full ${badge.color}`} />
            <span className={`text-[12px] font-semibold ${badge.color}`}>{badge.label}</span>
          </div>
        </div>
        <Alert className="mt-3 border-[#dbeafe] bg-[#f8fbff] text-[#1e3a8a]">
          <AlertCircle className="text-[#2563eb]" />
          <AlertTitle className="text-[12px] font-semibold">流程说明</AlertTitle>
          <AlertDescription className="text-[12px] text-[#5b6b8c]">
            <p>销售上传打款凭证，财务完成到账确认后自动解锁 P6。</p>
          </AlertDescription>
        </Alert>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex w-2/5 flex-col overflow-y-auto border-r border-[#e5e7eb] p-4">
          <div className="rounded-sm border border-[#dbeafe] bg-[#f8fbff] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#2563eb]">当前收款主体</p>
                <p className="mt-1 text-[12px] text-[#6b7280]">默认展示已绑定或系统推荐的最佳可用主体。</p>
              </div>
              {effectiveEntity && currentData.recommendedContractEntityId === effectiveEntity.id ? (
                <span className="rounded-sm bg-[#dbeafe] px-2 py-1 text-[10px] font-medium text-[#1d4ed8]">
                  推荐
                </span>
              ) : null}
            </div>

            {availableEntities.length > 0 ? (
              <div className="mt-4 space-y-4">
                <div>
                  <label className="mb-1.5 block text-[11px] font-medium text-[#6b7280]">切换收款主体</label>
                  <Select
                    value={effectiveEntityId}
                    onValueChange={(value) => void handleSelectEntity(value)}
                    disabled={isReadonly || isSavingEntity}
                  >
                    <SelectTrigger className="w-full justify-between bg-white text-left text-[12px]">
                      <SelectValue placeholder="请选择可用收款主体" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableEntities.map((entity) => (
                        <SelectItem key={entity.id} value={entity.id}>
                          {formatEntityOptionLabel(entity)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {effectiveEntity ? (
                  <div className="rounded-sm border border-[#bfdbfe] bg-white p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[13px] font-semibold text-[#111827]">{effectiveEntity.shortName}</p>
                        <p className="mt-1 text-[11px] text-[#6b7280]">{effectiveEntity.entityName}</p>
                        <p className="mt-1 text-[11px] text-[#6b7280]">
                          {currentData.contractEntityId
                            ? '当前已绑定付款主体'
                            : currentData.recommendedContractEntityId === effectiveEntity.id
                              ? '系统推荐主体'
                              : '当前选择主体'}
                        </p>
                      </div>
                      <div className="rounded-sm bg-[#f3f4f6] px-2 py-1 text-[10px] font-medium text-[#4b5563]">
                        {effectiveEntity.currency}
                        {accountTail ? ` · 尾号 ${accountTail}` : ''}
                      </div>
                    </div>

                    <div className="mt-4 space-y-3 text-[12px]">
                      <div>
                        <p className="text-[#6b7280]">户名</p>
                        <p className="mt-1 font-medium text-[#111827]">
                          {effectiveEntity.bankAccountName || effectiveEntity.entityName || '—'}
                        </p>
                      </div>

                      <div className="rounded-sm border border-[#e5e7eb] px-3 py-2">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="text-[#6b7280]">银行账号</p>
                            <p className="mt-1 font-mono font-medium text-[#111827]">{effectiveEntity.bankAccountNo || '—'}</p>
                            {accountTail ? <p className="mt-1 text-[11px] text-[#9ca3af]">尾号 {accountTail}</p> : null}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopy(effectiveEntity.bankAccountNo || '', 'account')}
                            className="flex h-7 w-7 items-center justify-center rounded-sm text-[#6b7280] hover:bg-[#f3f4f6]"
                          >
                            {copied === 'account' ? <Check size={13} className="text-[#10b981]" /> : <Copy size={13} />}
                          </button>
                        </div>
                      </div>

                      <div className="rounded-sm border border-[#e5e7eb] px-3 py-2">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="text-[#6b7280]">开户行</p>
                            <p className="mt-1 font-medium text-[#111827]">{effectiveEntity.bankName || '—'}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopy(effectiveEntity.bankName || '', 'bank')}
                            className="flex h-7 w-7 items-center justify-center rounded-sm text-[#6b7280] hover:bg-[#f3f4f6]"
                          >
                            {copied === 'bank' ? <Check size={13} className="text-[#10b981]" /> : <Copy size={13} />}
                          </button>
                        </div>
                      </div>

                      <div className="rounded-sm border border-[#e5e7eb] px-3 py-2">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="text-[#6b7280]">SWIFT</p>
                            <p className="mt-1 font-mono font-medium text-[#111827]">{effectiveEntity.swiftCode || '—'}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopy(effectiveEntity.swiftCode || '', 'swift')}
                            className="flex h-7 w-7 items-center justify-center rounded-sm text-[#6b7280] hover:bg-[#f3f4f6] disabled:opacity-40"
                            disabled={!effectiveEntity.swiftCode}
                          >
                            {copied === 'swift' ? <Check size={13} className="text-[#10b981]" /> : <Copy size={13} />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="mt-4 rounded-sm border border-dashed border-[#bfdbfe] bg-white px-3 py-4 text-[12px] text-[#6b7280]">
                当前商机暂无可实际打款的收款主体，请先补齐开户行与银行账号信息。
              </div>
            )}
          </div>

          <div className="mt-4 rounded-sm border border-[#e5e7eb] bg-white p-3.5">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af]">应收金额</p>
            <p className="font-mono text-[24px] font-bold text-[#2563eb]">
              {formatCurrency(currentData.dueAmount, opportunity.currency as 'CNY' | 'IDR')}
            </p>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-sm border border-[#e5e7eb] bg-[#f9fafb] p-2.5">
              <p className="text-[10px] text-[#9ca3af]">已收</p>
              <p className="mt-1 font-mono text-[16px] font-semibold text-[#111827]">
                {formatCurrency(currentData.receivedAmount, opportunity.currency as 'CNY' | 'IDR')}
              </p>
            </div>
            <div
              className={`rounded-sm border p-2.5 ${
                amountRemaining > 0
                  ? 'border-[#fca5a5] bg-[#fef2f2]'
                  : 'border-[#86efac] bg-[#f0fdf4]'
              }`}
            >
              <p className="text-[10px] text-[#9ca3af]">待收</p>
              <p
                className={`mt-1 font-mono text-[16px] font-semibold ${
                  amountRemaining > 0 ? 'text-[#dc2626]' : 'text-[#16a34a]'
                }`}
              >
                {formatCurrency(amountRemaining, opportunity.currency as 'CNY' | 'IDR')}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-1 flex-col overflow-y-auto p-4">
          <div className="mb-4 rounded-sm border border-[#e5e7eb] bg-white p-4">
            <div className="mb-3">
              <p className="text-[12px] font-semibold text-[#111827]">打款凭证上传</p>
              {hasValidEntity ? (
                <p className="mt-1 text-[12px] text-[#6b7280]">
                  请上传客户汇往{accountTail ? `尾号 ${accountTail}` : '当前选中账户'} 的打款凭证。
                </p>
              ) : (
                <p className="mt-1 text-[12px] text-[#b45309]">
                  当前没有可用收款主体，暂时无法上传打款凭证。
                </p>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".png,.jpg,.jpeg,.pdf"
              onChange={handleFileInput}
              className="hidden"
              disabled={isReadonly || isUploading || !hasValidEntity}
            />

            {!hasValidEntity ? (
              <div className="rounded-sm border border-dashed border-[#fcd34d] bg-[#fffbeb] px-4 py-6">
                <div className="flex items-start gap-2">
                  <Lock size={18} className="mt-0.5 text-[#d97706]" />
                  <div>
                    <p className="text-[12px] font-semibold text-[#92400e]">上传已阻断</p>
                    <p className="mt-1 text-[12px] text-[#b45309]">
                      请先选择一个带开户行和银行账号的有效收款主体。
                    </p>
                  </div>
                </div>
              </div>
            ) : hasReceipt ? (
              <div className="rounded-sm border border-[#86efac] bg-[#f0fdf4] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2">
                    <Eye size={20} className="mt-0.5 text-[#16a34a]" />
                    <div>
                      <p className="text-[12px] font-semibold text-[#166534]">凭证已上传</p>
                      <p className="mt-1 text-[12px] text-[#15803d]">{currentData.receiptFileName || '未命名文件'}</p>
                      {currentData.receiptUploadedAt ? (
                        <p className="mt-1 text-[11px] text-[#4ade80]">
                          上传于 {new Date(currentData.receiptUploadedAt).toLocaleString('zh-CN')}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {previewUrl ? (
                      isImageReceipt ? (
                        <button
                          type="button"
                          onClick={() => setPreviewOpen(true)}
                          className="flex h-8 items-center gap-1 rounded-sm border border-[#bbf7d0] bg-white px-3 text-[11px] text-[#166534] hover:bg-[#f0fdf4]"
                        >
                          <Eye size={12} />
                          预览图片
                        </button>
                      ) : (
                        <a
                          href={previewUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex h-8 items-center gap-1 rounded-sm border border-[#bbf7d0] bg-white px-3 text-[11px] text-[#166534] hover:bg-[#f0fdf4]"
                        >
                          <Eye size={12} />
                          预览文件
                        </a>
                      )
                    ) : null}
                    {!isReadonly ? (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex h-8 items-center gap-1 rounded-sm bg-[#2563eb] px-3 text-[11px] font-medium text-white hover:bg-[#1d4ed8] disabled:opacity-70"
                        disabled={isUploading}
                      >
                        {isUploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                        重新上传
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`flex flex-col items-center justify-center gap-2 rounded-sm border-2 border-dashed p-6 transition-colors ${
                  isDragging ? 'border-[#2563eb] bg-[#eff6ff]' : 'border-[#d1d5db] bg-[#f9fafb]'
                } ${isReadonly ? 'opacity-70' : ''}`}
              >
                <Upload size={24} className="text-[#9ca3af]" />
                <p className="text-[13px] font-medium text-[#374151]">点击或拖拽打款截图/银行流水</p>
                <p className="text-[11px] text-[#9ca3af]">支持 PNG/JPG/PDF，限 50MB</p>
                {!isReadonly ? (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-1.5 flex h-8 items-center gap-1 rounded-sm bg-[#2563eb] px-3 text-[11px] font-medium text-white hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-70"
                    disabled={isUploading}
                  >
                    {isUploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                    {isUploading ? '上传中...' : '选择文件'}
                  </button>
                ) : (
                  <div className="mt-1.5 inline-flex items-center gap-1 rounded-sm bg-[#f3f4f6] px-2.5 py-1 text-[11px] text-[#6b7280]">
                    <Lock size={12} />
                    当前阶段只读
                  </div>
                )}
              </div>
            )}

            {errorMessage ? (
              <div className="mt-3 flex items-start gap-2 rounded-sm border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-[11px] text-[#b91c1c]">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            ) : null}
          </div>

          {currentData.paymentStatus === 'pending' && (
            <div className="rounded-sm border border-[#e5e7eb] bg-white p-4">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <p className="text-[12px] font-semibold text-[#111827]">财务审核</p>
                  <p className="mt-1 text-[12px] text-[#6b7280]">确认到账金额后，将自动解锁 P6。</p>
                </div>
                <div className="rounded-sm bg-[#f3f4f6] px-2 py-1 text-[10px] text-[#6b7280]">
                  {hasValidEntity ? '主体已就绪' : '待选择主体'} · {hasReceipt ? '凭证已上传' : '待上传凭证'}
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[11px] text-[#6b7280]">到账日期</label>
                  <input
                    type="date"
                    value={auditForm.paymentDate}
                    onChange={(e) => setAuditForm({ ...auditForm, paymentDate: e.target.value })}
                    className="mt-0.5 h-8 w-full rounded-sm border border-[#e5e7eb] px-2 text-[12px] outline-none focus:border-[#2563eb]"
                    disabled={isReadonly || isConfirming || !hasReceipt}
                  />
                </div>

                <div>
                  <label className="text-[11px] text-[#6b7280]">实际到账金额</label>
                  <div className="mt-0.5 flex items-center gap-1 rounded-sm border border-[#e5e7eb]">
                    <span className="px-2 text-[12px] text-[#6b7280]">
                      {opportunity.currency === 'CNY' ? '¥' : 'Rp'}
                    </span>
                    <input
                      type="text"
                      value={auditForm.actualAmount}
                      onChange={(e) => {
                        const num = e.target.value.replace(/\D/g, '')
                        setAuditForm({
                          ...auditForm,
                          actualAmount: num ? parseInt(num).toLocaleString() : '',
                        })
                      }}
                      placeholder="0"
                      className="flex-1 px-2 py-1.5 text-[12px] font-mono outline-none"
                      disabled={isReadonly || isConfirming || !hasReceipt}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-[#6b7280]">财务备注</label>
                  <textarea
                    value={auditForm.notes}
                    onChange={(e) => setAuditForm({ ...auditForm, notes: e.target.value })}
                    placeholder="输入审核备注..."
                    className="mt-0.5 h-16 w-full rounded-sm border border-[#e5e7eb] px-2 py-1.5 text-[12px] outline-none placeholder:text-[#9ca3af] focus:border-[#2563eb]"
                    disabled={isReadonly || isConfirming || !hasReceipt}
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleConfirmAudit}
                    disabled={!canConfirm}
                    className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-sm bg-[#10b981] text-[12px] font-semibold text-white hover:bg-[#059669] disabled:bg-[#d1d5db] disabled:cursor-not-allowed"
                  >
                    {isConfirming ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                    {isConfirming ? '确认中...' : '确认到账并解锁 P6'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowRejectionUI(true)}
                    disabled={isReadonly || isRejecting || !hasReceipt}
                    className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-sm border border-[#dc2626] text-[12px] font-semibold text-[#dc2626] hover:bg-[#fee2e2] disabled:border-[#d1d5db] disabled:text-[#9ca3af] disabled:hover:bg-transparent"
                  >
                    驳回凭证
                  </button>
                </div>
              </div>

              {showRejectionUI ? (
                <div className="mt-3 rounded-sm border border-[#fca5a5] bg-[#fef2f2] p-2.5">
                  <p className="mb-1.5 text-[11px] font-semibold text-[#dc2626]">驳回原因</p>
                  <textarea
                    value={rejectionForm}
                    onChange={(e) => setRejectionForm(e.target.value)}
                    placeholder="请输入驳回原因..."
                    className="mb-1.5 h-14 w-full rounded-sm border border-[#fca5a5] bg-white px-2 py-1.5 text-[12px] outline-none focus:border-[#dc2626]"
                    disabled={isReadonly || isRejecting}
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleRejectSubmit}
                      disabled={!rejectionForm.trim() || isReadonly || isRejecting}
                      className="h-7 flex-1 rounded-sm bg-[#dc2626] text-[11px] font-medium text-white hover:bg-[#b91c1c] disabled:bg-[#d1d5db] disabled:cursor-not-allowed"
                    >
                      {isRejecting ? '提交中...' : '提交驳回'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowRejectionUI(false)}
                      className="h-7 flex-1 rounded-sm border border-[#e5e7eb] text-[11px] text-[#6b7280] hover:bg-[#f3f4f6]"
                      disabled={isRejecting}
                    >
                      取消
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {currentData.paymentStatus === 'verified' ? (
            <div className="rounded-sm border-2 border-[#86efac] bg-[#f0fdf4] p-3">
              <div className="flex items-start gap-2">
                <Check size={20} className="mt-0.5 shrink-0 text-[#16a34a]" />
                <div className="flex-1">
                  <p className="font-semibold text-[#166534]">已确认到账</p>
                  <p className="mt-1 text-[12px] text-[#15803d]">
                    确认金额：
                    <span className="font-mono font-semibold">
                      {formatCurrency(currentData.receivedAmount, opportunity.currency as 'CNY' | 'IDR')}
                    </span>
                  </p>
                  {currentData.confirmedAt ? (
                    <p className="mt-1 text-[11px] text-[#9ca3af]">
                      确认时间：{new Date(currentData.confirmedAt).toLocaleString('zh-CN')}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}

          {currentData.paymentStatus === 'rejected' ? (
            <div className="mt-4 rounded-sm border-2 border-[#fca5a5] bg-[#fef2f2] p-3">
              <div className="flex items-start gap-2">
                <AlertCircle size={20} className="mt-0.5 shrink-0 text-[#dc2626]" />
                <div className="flex-1">
                  <p className="font-semibold text-[#991b1b]">凭证已驳回</p>
                  <p className="mt-1 text-[12px] text-[#7f1d1d]">{currentData.rejectionReason || '未指定'}</p>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {previewUrl && isImageReceipt ? (
        <ImagePreviewDialog
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          src={previewUrl}
          title={currentData.receiptFileName || '打款凭证预览'}
        />
      ) : null}
    </div>
  )
}
