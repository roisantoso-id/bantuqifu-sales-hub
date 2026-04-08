'use client'

import { Copy, Check, X, Upload, Eye, AlertCircle, Lock, Loader2 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ImagePreviewDialog, isImagePreviewable } from '@/components/ui/image-preview-dialog'
import type { OpportunityP5Data, Opportunity } from '@/lib/types'

interface P5FinanceProps {
  opportunity: Opportunity
  p5Data?: OpportunityP5Data
  onDataChange: (data: OpportunityP5Data) => void
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

export function P5Finance({
  opportunity,
  p5Data,
  onDataChange,
  onUploadReceipt,
  onRejectReceipt,
  onConfirmPayment,
  isReadonly = false,
}: P5FinanceProps) {
  const [copied, setCopied] = useState<'account' | 'code' | null>(null)
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

  const isImageReceipt = useMemo(
    () => isImagePreviewable({ url: previewUrl, fileName: currentData.receiptFileName }),
    [currentData.receiptFileName, previewUrl]
  )

  const bankInfo = {
    accountHolder: currentData.accountHolder || 'PT Bantu Global',
    account: currentData.bankAccount || '1234567890123456',
    bankName: currentData.bankName || 'Bank Mandiri',
    swiftCode: currentData.swiftCode || 'BMDRJDD',
  }

  const handleCopy = (text: string, type: 'account' | 'code') => {
    navigator.clipboard.writeText(text)
    setCopied(type)
    setTimeout(() => setCopied(null), 2000)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const uploadReceipt = async (file: File) => {
    if (isReadonly || isUploading) {
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
    if (file) {
      await uploadReceipt(file)
    }
  }

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      await uploadReceipt(file)
    }
  }

  const handleConfirmAudit = async () => {
    if (isReadonly || isConfirming) {
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
      {/* Header */}
      <div className="border-b border-[#e5e7eb] px-5 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[13px] font-semibold text-[#111827]">P5: 财务确认与对账</h3>
            <p className="mt-1 text-[11px] text-[#9ca3af]">
              销售上传打款凭证 → 财务审核 → 自动解锁 P6
            </p>
          </div>
          <div className={`inline-flex items-center gap-2 rounded-sm px-2.5 py-1 ${badge.bg}`}>
            <span className={`h-2 w-2 rounded-full ${badge.color} inline-block`} />
            <span className={`text-[12px] font-semibold ${badge.color}`}>{badge.label}</span>
          </div>
        </div>
      </div>

      {/* Main Content - Left/Right Split */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Payment Instruction (40%) */}
        <div className="w-2/5 flex flex-col overflow-y-auto border-r border-[#e5e7eb] p-4">
          {/* 付款指引卡片 */}
          <div className="mb-4 rounded-sm border-2 border-[#2563eb] bg-[#eff6ff] p-3.5">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[#1e40af]">
              付款指引
            </p>
            <div className="space-y-2 text-[12px]">
              <div>
                <span className="text-[#6b7280]">户名：</span>
                <span className="font-medium text-[#111827]">{bankInfo.accountHolder}</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[#6b7280]">账号：</span>
                  <span className="font-mono font-medium text-[#111827]">{bankInfo.account}</span>
                </div>
                <button
                  onClick={() => handleCopy(bankInfo.account, 'account')}
                  className="flex h-6 w-6 items-center justify-center rounded-sm text-[#6b7280] hover:bg-white"
                >
                  {copied === 'account' ? (
                    <Check size={12} className="text-[#10b981]" />
                  ) : (
                    <Copy size={12} />
                  )}
                </button>
              </div>
              <div>
                <span className="text-[#6b7280]">开户行：</span>
                <span className="font-medium text-[#111827]">{bankInfo.bankName}</span>
              </div>
              <div className="flex items-center justify-between border-t border-[#bfdbfe] pt-2">
                <div>
                  <span className="text-[#6b7280]">SWIFT Code：</span>
                  <span className="font-mono font-medium text-[#111827]">
                    {bankInfo.swiftCode}
                  </span>
                </div>
                <button
                  onClick={() => handleCopy(bankInfo.swiftCode, 'code')}
                  className="flex h-6 w-6 items-center justify-center rounded-sm text-[#6b7280] hover:bg-white"
                >
                  {copied === 'code' ? (
                    <Check size={12} className="text-[#10b981]" />
                  ) : (
                    <Copy size={12} />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* 待收金额展示 */}
          <div className="mb-4 rounded-sm border border-[#e5e7eb] bg-white p-3.5">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af]">
              应收金额
            </p>
            <p className="font-mono text-[24px] font-bold text-[#2563eb]">
              {formatCurrency(currentData.dueAmount, opportunity.currency as any)}
            </p>
          </div>

          {/* 金额对账 */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-sm border border-[#e5e7eb] bg-[#f9fafb] p-2.5">
              <p className="text-[10px] text-[#9ca3af]">已收</p>
              <p className="mt-1 font-mono text-[16px] font-semibold text-[#111827]">
                {formatCurrency(currentData.receivedAmount, opportunity.currency as any)}
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
                {formatCurrency(amountRemaining, opportunity.currency as any)}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Upload & Audit (60%) */}
        <div className="flex-1 flex flex-col overflow-y-auto p-4">
          {/* 凭证上传区 */}
          <div className="mb-4">
            <p className="mb-1.5 text-[12px] font-semibold text-[#111827]">打款凭证上传</p>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`flex flex-col items-center justify-center gap-2 rounded-sm border-2 border-dashed p-6 transition-colors ${
                isDragging
                  ? 'border-[#2563eb] bg-[#eff6ff]'
                  : currentData.receiptFileUrl
                    ? 'border-[#10b981] bg-[#ecfdf5]'
                    : 'border-[#d1d5db] bg-[#f9fafb]'
              } ${isReadonly ? 'opacity-70' : ''}`}
            >
              {currentData.receiptFileUrl ? (
                <>
                  <Eye size={28} className="text-[#10b981]" />
                  <p className="text-[12px] font-medium text-[#047857]">凭证已上传</p>
                  <p className="text-[11px] text-[#9ca3af]">{currentData.receiptFileName}</p>
                  <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
                    {previewUrl ? (
                      isImageReceipt ? (
                        <button
                          type="button"
                          onClick={() => setPreviewOpen(true)}
                          className="flex h-6 items-center gap-1 rounded-sm bg-white px-2 text-[11px] text-[#2563eb] hover:bg-[#dbeafe]"
                        >
                          <Eye size={12} />
                          预览图片
                        </button>
                      ) : (
                        <a
                          href={previewUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex h-6 items-center gap-1 rounded-sm bg-white px-2 text-[11px] text-[#2563eb] hover:bg-[#dbeafe]"
                        >
                          <Eye size={12} />
                          预览文件
                        </a>
                      )
                    ) : null}
                    {!isReadonly ? (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex h-6 items-center gap-1 rounded-sm bg-[#fee2e2] px-2 text-[11px] text-[#dc2626] hover:bg-[#fecaca]"
                        disabled={isUploading}
                      >
                        {isUploading ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}
                        重新上传
                      </button>
                    ) : null}
                  </div>
                </>
              ) : (
                <>
                  <Upload size={24} className="text-[#9ca3af]" />
                  <p className="text-[13px] font-medium text-[#374151]">
                    点击或拖拽打款截图/银行流水
                  </p>
                  <p className="text-[11px] text-[#9ca3af]">支持 PNG/JPG/PDF，限 50MB</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".png,.jpg,.jpeg,.pdf"
                    onChange={handleFileInput}
                    className="hidden"
                    disabled={isReadonly || isUploading}
                  />
                  {!isReadonly ? (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-1.5 flex h-7 items-center gap-1 rounded-sm bg-[#2563eb] px-3 text-[11px] font-medium text-white hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-70"
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
                </>
              )}
            </div>
            {currentData.receiptUploadedAt && (
              <p className="mt-1 text-[10px] text-[#9ca3af]">
                上传于 {new Date(currentData.receiptUploadedAt).toLocaleString('zh-CN')}
              </p>
            )}
            {errorMessage ? (
              <div className="mt-2 flex items-start gap-2 rounded-sm border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-[11px] text-[#b91c1c]">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            ) : null}
          </div>

          {/* 财务对账操作区 */}
          {currentData.paymentStatus === 'pending' && currentData.receiptFileUrl && (
            <>
              <p className="mb-2 text-[12px] font-semibold text-[#111827]">财务审核</p>
              <div className="space-y-2">
                {/* 到账日期 */}
                <div>
                  <label className="text-[11px] text-[#6b7280]">到账日期</label>
                  <input
                    type="date"
                    value={auditForm.paymentDate}
                    onChange={(e) => setAuditForm({ ...auditForm, paymentDate: e.target.value })}
                    className="mt-0.5 h-7 w-full rounded-sm border border-[#e5e7eb] px-2 text-[12px] outline-none focus:border-[#2563eb]"
                    disabled={isReadonly || isConfirming}
                  />
                </div>

                {/* 实际到账金额 */}
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
                      disabled={isReadonly || isConfirming}
                    />
                  </div>
                </div>

                {/* 财务备注 */}
                <div>
                  <label className="text-[11px] text-[#6b7280]">财务备注</label>
                  <textarea
                    value={auditForm.notes}
                    onChange={(e) => setAuditForm({ ...auditForm, notes: e.target.value })}
                    placeholder="输入审核备注..."
                    className="mt-0.5 h-16 w-full rounded-sm border border-[#e5e7eb] px-2 py-1.5 text-[12px] outline-none placeholder:text-[#9ca3af] focus:border-[#2563eb]"
                    disabled={isReadonly || isConfirming}
                  />
                </div>

                {/* 操作按钮 */}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleConfirmAudit}
                    disabled={!auditForm.paymentDate || !auditForm.actualAmount || isReadonly || isConfirming}
                    className="flex-1 flex h-8 items-center justify-center gap-1.5 rounded-sm bg-[#10b981] text-[12px] font-semibold text-white hover:bg-[#059669] disabled:bg-[#d1d5db] disabled:cursor-not-allowed"
                  >
                    {isConfirming ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                    {isConfirming ? '确认中...' : '确认到账并解锁 P6'}
                  </button>
                  <button
                    onClick={() => setShowRejectionUI(true)}
                    disabled={isReadonly || isRejecting}
                    className="flex-1 flex h-8 items-center justify-center gap-1.5 rounded-sm border border-[#dc2626] text-[12px] font-semibold text-[#dc2626] hover:bg-[#fee2e2] disabled:border-[#d1d5db] disabled:text-[#9ca3af] disabled:hover:bg-transparent"
                  >
                    <X size={13} />
                    驳回凭证
                  </button>
                </div>
              </div>

              {/* 驳回表单 */}
              {showRejectionUI && (
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
                      onClick={handleRejectSubmit}
                      disabled={!rejectionForm.trim() || isReadonly || isRejecting}
                      className="flex-1 h-7 rounded-sm bg-[#dc2626] text-[11px] font-medium text-white hover:bg-[#b91c1c] disabled:bg-[#d1d5db] disabled:cursor-not-allowed"
                    >
                      {isRejecting ? '提交中...' : '提交驳回'}
                    </button>
                    <button
                      onClick={() => setShowRejectionUI(false)}
                      className="flex-1 h-7 rounded-sm border border-[#e5e7eb] text-[11px] text-[#6b7280] hover:bg-[#f3f4f6]"
                      disabled={isRejecting}
                    >
                      取消
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* 已验证/驳回状态 */}
          {currentData.paymentStatus === 'verified' && (
            <div className="rounded-sm border-2 border-[#86efac] bg-[#f0fdf4] p-3">
              <div className="flex items-start gap-2">
                <Check size={20} className="mt-0.5 text-[#16a34a] flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold text-[#166534]">已确认到账</p>
                  <p className="mt-1 text-[12px] text-[#15803d]">
                    确认金额：
                    <span className="font-mono font-semibold">
                      {formatCurrency(
                        currentData.receivedAmount,
                        opportunity.currency as any
                      )}
                    </span>
                  </p>
                  {currentData.confirmedAt && (
                    <p className="mt-1 text-[11px] text-[#9ca3af]">
                      确认时间：{new Date(currentData.confirmedAt).toLocaleString('zh-CN')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {currentData.paymentStatus === 'rejected' && (
            <div className="rounded-sm border-2 border-[#fca5a5] bg-[#fef2f2] p-3">
              <div className="flex items-start gap-2">
                <AlertCircle size={20} className="mt-0.5 text-[#dc2626] flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold text-[#991b1b]">凭证已驳回</p>
                  <p className="mt-1 text-[12px] text-[#7f1d1d]">
                    {currentData.rejectionReason || '未指定'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sticky Footer - P6 Lock Notice */}
      {currentData.paymentStatus !== 'verified' && (
        <div className="border-t border-[#fde68a] bg-[#fffbeb] px-5 py-2.5">
          <div className="flex items-center gap-2">
            <Lock size={16} className="text-[#92400e]" />
            <span className="text-[12px] text-[#92400e]">
              P6 资料提交模块已锁定，需等待财务确认首款后自动解锁
            </span>
          </div>
        </div>
      )}
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
