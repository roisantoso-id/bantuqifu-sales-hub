'use client'

import { Copy, Check, X, Upload, Eye, AlertCircle, Lock } from 'lucide-react'
import { useState, useRef } from 'react'
import type { OpportunityP5Data, Opportunity } from '@/lib/types'

interface P5FinanceProps {
  opportunity: Opportunity
  p5Data?: OpportunityP5Data
  onDataChange: (data: OpportunityP5Data) => void
  onConfirmPayment?: () => void
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
  onConfirmPayment,
}: P5FinanceProps) {
  const [copied, setCopied] = useState<'account' | 'code' | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      onDataChange({
        ...currentData,
        receiptFileUrl: URL.createObjectURL(file),
        receiptFileName: file.name,
        receiptUploadedAt: new Date().toISOString(),
      })
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onDataChange({
        ...currentData,
        receiptFileUrl: URL.createObjectURL(file),
        receiptFileName: file.name,
        receiptUploadedAt: new Date().toISOString(),
      })
    }
  }

  const handleConfirmAudit = () => {
    const actualAmount = parseInt(auditForm.actualAmount.replace(/\D/g, ''), 10) || 0
    onDataChange({
      ...currentData,
      receivedAmount: actualAmount,
      paymentStatus: 'verified',
      confirmedAt: new Date().toISOString(),
    })
    if (onConfirmPayment) onConfirmPayment()
    setAuditForm({ paymentDate: '', actualAmount: '', notes: '' })
  }

  const handleRejectSubmit = () => {
    if (rejectionForm.trim()) {
      onDataChange({
        ...currentData,
        paymentStatus: 'rejected',
        rejectionReason: rejectionForm,
      })
      setRejectionForm('')
      setShowRejectionUI(false)
    }
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
              }`}
            >
              {currentData.receiptFileUrl ? (
                <>
                  <Eye size={28} className="text-[#10b981]" />
                  <p className="text-[12px] font-medium text-[#047857]">凭证已上传</p>
                  <p className="text-[11px] text-[#9ca3af]">{currentData.receiptFileName}</p>
                  <button
                    onClick={() =>
                      onDataChange({
                        ...currentData,
                        receiptFileUrl: undefined,
                        receiptFileName: undefined,
                      })
                    }
                    className="mt-1 flex h-6 items-center gap-1 rounded-sm bg-[#fee2e2] px-2 text-[11px] text-[#dc2626] hover:bg-[#fecaca]"
                  >
                    <X size={12} />
                    重新上传
                  </button>
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
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-1.5 flex h-7 items-center gap-1 rounded-sm bg-[#2563eb] px-3 text-[11px] font-medium text-white hover:bg-[#1d4ed8]"
                  >
                    <Upload size={12} />
                    选择文件
                  </button>
                </>
              )}
            </div>
            {currentData.receiptUploadedAt && (
              <p className="mt-1 text-[10px] text-[#9ca3af]">
                上传于 {new Date(currentData.receiptUploadedAt).toLocaleString('zh-CN')}
              </p>
            )}
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
                  />
                </div>

                {/* 操作按钮 */}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleConfirmAudit}
                    disabled={!auditForm.paymentDate || !auditForm.actualAmount}
                    className="flex-1 flex h-8 items-center justify-center gap-1.5 rounded-sm bg-[#10b981] text-[12px] font-semibold text-white hover:bg-[#059669] disabled:bg-[#d1d5db] disabled:cursor-not-allowed"
                  >
                    <Check size={13} />
                    确认到账并解锁 P6
                  </button>
                  <button
                    onClick={() => setShowRejectionUI(true)}
                    className="flex-1 flex h-8 items-center justify-center gap-1.5 rounded-sm border border-[#dc2626] text-[12px] font-semibold text-[#dc2626] hover:bg-[#fee2e2]"
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
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleRejectSubmit}
                      disabled={!rejectionForm.trim()}
                      className="flex-1 h-7 rounded-sm bg-[#dc2626] text-[11px] font-medium text-white hover:bg-[#b91c1c] disabled:bg-[#d1d5db] disabled:cursor-not-allowed"
                    >
                      提交驳回
                    </button>
                    <button
                      onClick={() => setShowRejectionUI(false)}
                      className="flex-1 h-7 rounded-sm border border-[#e5e7eb] text-[11px] text-[#6b7280] hover:bg-[#f3f4f6]"
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
    </div>
  )
}
