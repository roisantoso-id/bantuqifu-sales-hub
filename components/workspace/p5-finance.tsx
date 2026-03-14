'use client'

import { Copy, Check, X, Image as ImageIcon } from 'lucide-react'
import { useState } from 'react'
import type { OpportunityP5Data } from '@/lib/types'

interface P5FinanceProps {
  p5Data?: OpportunityP5Data
  onDataChange: (data: OpportunityP5Data) => void
}

const STATUS_LABEL: Record<string, string> = {
  pending: '待收款',
  verified: '已确认',
  rejected: '驳回',
}

export function P5Finance({ p5Data, onDataChange }: P5FinanceProps) {
  const [copied, setCopied] = useState(false)
  const [showRejectReason, setShowRejectReason] = useState(false)

  const currentData = p5Data || {
    dueAmount: 0,
    receivedAmount: 0,
    paymentStatus: 'pending',
  }

  const handleCopyAccount = () => {
    if (currentData.bankAccount) {
      navigator.clipboard.writeText(currentData.bankAccount)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleConfirmPayment = () => {
    onDataChange({
      ...currentData,
      paymentStatus: 'verified',
      confirmedAt: new Date().toISOString(),
    })
  }

  const handleRejectPayment = () => {
    setShowRejectReason(true)
  }

  const submitRejection = (reason: string) => {
    onDataChange({
      ...currentData,
      paymentStatus: 'rejected',
      rejectionReason: reason,
    })
    setShowRejectReason(false)
  }

  const amountRemaining = Math.max(0, currentData.dueAmount - currentData.receivedAmount)

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header */}
      <div className="border-b border-[#e5e7eb] px-4 py-2.5">
        <h3 className="text-[13px] font-semibold text-[#111827]">P5: 财务确认</h3>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Payment Details */}
        <div className="flex-1 flex flex-col gap-3 border-r border-[#e5e7eb] p-4 overflow-y-auto">
          {/* Bank Account */}
          <div className="rounded-sm border border-[#e5e7eb] bg-[#f9fafb] p-3">
            <p className="mb-1 text-[11px] font-medium text-[#6b7280]">公司银行账号</p>
            <div className="flex items-center gap-2">
              <span className="flex-1 font-mono text-[13px] text-[#111827]">
                {currentData.bankAccount || '未设置'}
              </span>
              {currentData.bankAccount && (
                <button
                  onClick={handleCopyAccount}
                  className="flex h-6 w-6 items-center justify-center rounded-sm text-[#6b7280] hover:bg-white"
                  title={copied ? '已复制' : '复制'}
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                </button>
              )}
            </div>
          </div>

          {/* Amount Summary */}
          <div className="grid grid-cols-2 gap-2">
            {/* Due Amount */}
            <div className="rounded-sm border border-[#e5e7eb] bg-white p-3">
              <p className="mb-1 text-[10px] uppercase tracking-wider text-[#9ca3af]">
                应收金额
              </p>
              <p className="font-mono text-[20px] font-bold text-[#111827]">
                ¥{currentData.dueAmount.toLocaleString()}
              </p>
            </div>

            {/* Received Amount */}
            <div className="rounded-sm border border-[#e5e7eb] bg-white p-3">
              <p className="mb-1 text-[10px] uppercase tracking-wider text-[#9ca3af]">
                已收金额
              </p>
              <p className="font-mono text-[20px] font-bold text-[#10b981]">
                ¥{currentData.receivedAmount.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Remaining */}
          <div className="rounded-sm border border-[#fbbf24] bg-[#fffbeb] p-3">
            <p className="mb-1 text-[11px] text-[#92400e]">待收余额</p>
            <p className="font-mono text-[18px] font-semibold text-[#d97706]">
              ¥{amountRemaining.toLocaleString()}
            </p>
          </div>

          {/* Status */}
          <div className="rounded-sm border border-[#e5e7eb] bg-white p-2">
            <p className="text-[11px] text-[#6b7280]">收款状态</p>
            <div className="mt-1 flex items-center gap-2">
              <span
                className={`inline-block h-2 w-2 rounded-full ${
                  currentData.paymentStatus === 'pending'
                    ? 'bg-[#f59e0b]'
                    : currentData.paymentStatus === 'verified'
                      ? 'bg-[#10b981]'
                      : 'bg-[#dc2626]'
                }`}
              />
              <span className="text-[12px] font-medium text-[#111827]">
                {STATUS_LABEL[currentData.paymentStatus]}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Receipt & Actions */}
        <div className="w-72 shrink-0 flex flex-col border-l border-[#e5e7eb] p-3">
          {/* Receipt Thumbnail */}
          <div className="mb-3">
            <p className="mb-1 text-[11px] font-medium text-[#6b7280]">付款凭证</p>
            {currentData.receiptFileUrl ? (
              <div className="flex h-40 items-center justify-center rounded-sm border border-[#e5e7eb] bg-[#f3f4f6]">
                <button className="flex h-7 items-center gap-1 rounded-sm bg-[#2563eb] px-2 text-[10px] text-white hover:bg-[#1d4ed8]">
                  <ImageIcon size={12} />
                  查看大图
                </button>
              </div>
            ) : (
              <div className="flex h-40 items-center justify-center rounded-sm border-2 border-dashed border-[#d1d5db] bg-[#f9fafb]">
                <p className="text-[12px] text-[#9ca3af]">无凭证</p>
              </div>
            )}
          </div>

          {/* Rejection Reason (if rejected) */}
          {currentData.paymentStatus === 'rejected' && (
            <div className="mb-3 rounded-sm border border-[#fee2e2] bg-[#fef2f2] p-2">
              <p className="mb-1 text-[10px] font-medium text-[#dc2626]">驳回原因</p>
              <p className="text-[11px] text-[#991b1b]">
                {currentData.rejectionReason || '未指定'}
              </p>
            </div>
          )}

          {/* Actions */}
          {currentData.paymentStatus === 'pending' && (
            <div className="mt-auto flex flex-col gap-2">
              <button
                onClick={handleConfirmPayment}
                className="flex h-8 items-center justify-center rounded-sm bg-[#10b981] text-[12px] font-medium text-white hover:bg-[#059669]"
              >
                <Check size={13} className="mr-1" />
                确认收款
              </button>
              <button
                onClick={handleRejectPayment}
                className="flex h-8 items-center justify-center rounded-sm border border-[#dc2626] text-[12px] font-medium text-[#dc2626] hover:bg-[#fee2e2]"
              >
                <X size={13} className="mr-1" />
                驳回
              </button>
            </div>
          )}

          {/* Rejection Form */}
          {showRejectReason && (
            <div className="mt-auto flex flex-col gap-2 rounded-sm border border-[#e5e7eb] bg-white p-2">
              <textarea
                placeholder="输入驳回原因..."
                className="h-16 w-full rounded-sm border border-[#e5e7eb] p-1.5 text-[11px] text-[#111827] outline-none placeholder:text-[#9ca3af] focus:border-[#dc2626]"
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setShowRejectReason(false)
                }}
              />
              <div className="flex gap-1">
                <button
                  onClick={(e) => {
                    const target = (e.target as HTMLButtonElement).parentElement?.querySelector('textarea')
                    if (target) submitRejection((target as HTMLTextAreaElement).value)
                  }}
                  className="flex-1 h-6 rounded-sm bg-[#dc2626] text-[10px] font-medium text-white hover:bg-[#b91c1c]"
                >
                  提交
                </button>
                <button
                  onClick={() => setShowRejectReason(false)}
                  className="flex-1 h-6 rounded-sm border border-[#e5e7eb] text-[10px] text-[#6b7280] hover:bg-[#f3f4f6]"
                >
                  取消
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
