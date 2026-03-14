'use client'

import { Upload, X, Plus, DollarSign } from 'lucide-react'
import { useState } from 'react'
import type { Opportunity, OpportunityP8Data, RefundItem, ExpenseItem } from '@/lib/types'

interface P8SettlementProps {
  opportunity: Opportunity
  p8Data?: OpportunityP8Data
  onDataChange: (data: OpportunityP8Data) => void
  onCompleteSettlement: () => void
}

const EXPENSE_CATEGORIES = {
  'gov-fee': '政府规费',
  'expedite': '加急费',
  'travel': '差旅费',
  'other': '其他',
}

export function P8Settlement({
  opportunity,
  p8Data,
  onDataChange,
  onCompleteSettlement,
}: P8SettlementProps) {
  const [isDraggingBalance, setIsDraggingBalance] = useState(false)
  const [newExpense, setNewExpense] = useState({ description: '', amount: 0, category: 'other' as const })

  // 自动计算财务数据
  const currentData = p8Data || {
    totalAmount: opportunity.p3Data?.reduce((sum, p) => sum + p.lockedPrice, 0) || 0,
    paidAmount: opportunity.p5Data?.receivedAmount || 0,
    balanceDue: 0,
    balanceStatus: 'pending',
    refunds: [],
    totalRefund: 0,
    expenses: [],
    totalExpense: 0,
    netBalance: 0,
    archived: false,
  }

  const balanceDue = currentData.totalAmount - currentData.paidAmount
  const netBalance = balanceDue + currentData.totalExpense - currentData.totalRefund

  const handleAddExpense = () => {
    if (!newExpense.description || newExpense.amount <= 0) return
    const expense: ExpenseItem = {
      id: `exp-${Date.now()}`,
      description: newExpense.description,
      amount: newExpense.amount,
      category: newExpense.category,
      createdBy: 'current-user',
      createdAt: new Date().toISOString(),
    }
    onDataChange({
      ...currentData,
      expenses: [...currentData.expenses, expense],
      totalExpense: currentData.totalExpense + newExpense.amount,
    })
    setNewExpense({ description: '', amount: 0, category: 'other' })
  }

  const removeExpense = (id: string) => {
    const expense = currentData.expenses.find((e) => e.id === id)
    if (!expense) return
    onDataChange({
      ...currentData,
      expenses: currentData.expenses.filter((e) => e.id !== id),
      totalExpense: currentData.totalExpense - expense.amount,
    })
  }

  const handleProcessRefund = (serviceId: string, refundedAmount: number) => {
    // 这里添加退款逻辑
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value)
  }

  const canSettle =
    currentData.balanceStatus === 'received' &&
    currentData.refunds.every((r) => r.refundedAt) &&
    currentData.archived === false

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header */}
      <div className="border-b border-[#e5e7eb] px-5 py-3">
        <h3 className="text-[13px] font-semibold text-[#111827]">P8: 财务结算</h3>
        <p className="mt-1 text-[11px] text-[#9ca3af]">尾款、退款、报销与最终结算</p>
      </div>

      {/* Financial Summary - Four Cards */}
      <div className="flex gap-2 border-b border-[#e5e7eb] bg-[#f9fafb] px-5 py-3">
        <div className="flex-1 rounded-sm border border-[#d1d5db] bg-white p-2.5">
          <p className="text-[10px] uppercase tracking-wider text-[#9ca3af]">合同总额</p>
          <p className="mt-1 font-mono text-[16px] font-bold text-[#111827]">
            ¥{currentData.totalAmount.toLocaleString()}
          </p>
        </div>
        <div className="flex-1 rounded-sm border border-[#d1d5db] bg-white p-2.5">
          <p className="text-[10px] uppercase tracking-wider text-[#9ca3af]">已收首款</p>
          <p className="mt-1 font-mono text-[16px] font-bold text-[#10b981]">
            ¥{currentData.paidAmount.toLocaleString()}
          </p>
        </div>
        <div className="flex-1 rounded-sm border border-[#d1d5db] bg-white p-2.5">
          <p className="text-[10px] uppercase tracking-wider text-[#9ca3af]">调整项</p>
          <div className="mt-1 font-mono text-[14px] font-bold">
            <span className="text-[#10b981]">+¥{currentData.totalExpense.toLocaleString()}</span>
            <span className="mx-1 text-[#9ca3af]">/</span>
            <span className="text-[#ef4444]">-¥{currentData.totalRefund.toLocaleString()}</span>
          </div>
        </div>
        <div className="flex-1 rounded-sm border border-[#1f2937] bg-[#111827] p-2.5">
          <p className="text-[10px] uppercase tracking-wider text-[#9ca3af]">最终待收</p>
          <p className={`mt-1 font-mono text-[18px] font-bold ${netBalance > 0 ? 'text-[#3b82f6]' : 'text-[#10b981]'}`}>
            ¥{netBalance.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Three Pillars - Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Balance Handling */}
        <div className="flex-1 flex flex-col border-r border-[#e5e7eb] p-4 overflow-y-auto">
          <h4 className="mb-2 text-[12px] font-semibold text-[#111827]">尾款处理</h4>
          <div className="mb-3 rounded-sm border border-[#e5e7eb] bg-[#f9fafb] p-2.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[#6b7280]">应收尾款</span>
              <span className="font-mono font-bold text-[#111827]">¥{balanceDue.toLocaleString()}</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px]">
              <span className="text-[#6b7280]">状态</span>
              <span className={`rounded-sm px-2 py-0.5 text-[10px] font-medium ${
                currentData.balanceStatus === 'received'
                  ? 'bg-[#d1fae5] text-[#047857]'
                  : currentData.balanceStatus === 'partial'
                    ? 'bg-[#fef3c7] text-[#b45309]'
                    : 'bg-[#fee2e2] text-[#991b1b]'
              }`}>
                {currentData.balanceStatus === 'received' ? '已收' : currentData.balanceStatus === 'partial' ? '部分' : '待收'}
              </span>
            </div>
          </div>

          {/* Upload Balance Receipt */}
          <div
            onDragOver={(e) => {
              e.preventDefault()
              setIsDraggingBalance(true)
            }}
            onDragLeave={() => setIsDraggingBalance(false)}
            onDrop={(e) => {
              e.preventDefault()
              setIsDraggingBalance(false)
              const file = e.dataTransfer.files?.[0]
              if (file) {
                onDataChange({
                  ...currentData,
                  balanceReceiptUrl: URL.createObjectURL(file),
                  balanceReceivedAt: new Date().toISOString(),
                  balanceStatus: 'received',
                })
              }
            }}
            className={`mb-3 flex flex-col items-center justify-center rounded-sm border-2 border-dashed p-4 transition-colors ${
              isDraggingBalance
                ? 'border-[#2563eb] bg-[#eff6ff]'
                : currentData.balanceReceiptUrl
                  ? 'border-[#10b981] bg-[#ecfdf5]'
                  : 'border-[#d1d5db] bg-[#f9fafb]'
            }`}
          >
            {currentData.balanceReceiptUrl ? (
              <>
                <p className="text-[11px] text-[#047857]">✓ 尾款凭证已上传</p>
                <button
                  onClick={() =>
                    onDataChange({
                      ...currentData,
                      balanceReceiptUrl: undefined,
                      balanceStatus: 'pending',
                    })
                  }
                  className="mt-1 text-[10px] text-[#dc2626] hover:underline"
                >
                  重新上传
                </button>
              </>
            ) : (
              <>
                <Upload size={16} className="mb-1 text-[#9ca3af]" />
                <p className="text-[11px] text-[#374151]">上传尾款水单</p>
                <input
                  type="file"
                  id="balance-upload"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      onDataChange({
                        ...currentData,
                        balanceReceiptUrl: URL.createObjectURL(file),
                        balanceReceivedAt: new Date().toISOString(),
                        balanceStatus: 'received',
                      })
                    }
                  }}
                  className="hidden"
                />
                <label
                  htmlFor="balance-upload"
                  className="mt-2 text-[10px] text-[#2563eb] cursor-pointer hover:underline"
                >
                  或点击选择
                </label>
              </>
            )}
          </div>
        </div>

        {/* Middle: Refund Handling */}
        <div className="flex-1 flex flex-col border-r border-[#e5e7eb] p-4 overflow-y-auto">
          <h4 className="mb-2 text-[12px] font-semibold text-[#111827]">失败项处理</h4>
          {currentData.refunds.length === 0 ? (
            <p className="text-[11px] text-[#9ca3af]">无需退款项</p>
          ) : (
            <div className="space-y-1.5">
              {currentData.refunds.map((refund) => (
                <div key={refund.id} className="rounded-sm border border-[#e5e7eb] bg-white p-2">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-medium text-[#111827]">{refund.serviceName}</p>
                      <p className="text-[10px] text-[#6b7280]">{refund.reason}</p>
                    </div>
                    <span className="ml-2 shrink-0 font-mono text-[11px] font-bold text-[#ef4444]">
                      -¥{refund.refundedAmount.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Expense Recording */}
        <div className="flex-1 flex flex-col border-l border-[#e5e7eb] p-4 overflow-y-auto">
          <h4 className="mb-2 text-[12px] font-semibold text-[#111827]">报销记录</h4>
          {currentData.expenses.length > 0 && (
            <div className="mb-2 space-y-1 text-[10px]">
              {currentData.expenses.map((exp) => (
                <div key={exp.id} className="flex items-center justify-between rounded-sm bg-[#f3f4f6] px-2 py-1">
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium text-[#111827]">{exp.description}</p>
                    <p className="text-[#9ca3af]">{EXPENSE_CATEGORIES[exp.category]}</p>
                  </div>
                  <div className="ml-2 flex shrink-0 items-center gap-1">
                    <span className="font-mono font-bold text-[#10b981]">+¥{exp.amount.toLocaleString()}</span>
                    <button
                      onClick={() => removeExpense(exp.id)}
                      className="text-[#9ca3af] hover:text-[#dc2626]"
                    >
                      <X size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Quick Add Expense */}
          <div className="mt-auto space-y-1 rounded-sm border border-[#e5e7eb] bg-[#f9fafb] p-2">
            <input
              type="text"
              placeholder="事由"
              value={newExpense.description}
              onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
              className="w-full rounded-sm border border-[#e5e7eb] bg-white px-2 py-1 text-[10px] outline-none focus:border-[#2563eb]"
            />
            <div className="flex gap-1">
              <input
                type="number"
                placeholder="金额"
                value={newExpense.amount || ''}
                onChange={(e) => setNewExpense({ ...newExpense, amount: parseFloat(e.target.value) || 0 })}
                className="flex-1 rounded-sm border border-[#e5e7eb] bg-white px-2 py-1 text-[10px] outline-none focus:border-[#2563eb]"
              />
              <select
                value={newExpense.category}
                onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value as any })}
                className="rounded-sm border border-[#e5e7eb] bg-white px-1 py-1 text-[10px] outline-none focus:border-[#2563eb]"
              >
                {Object.entries(EXPENSE_CATEGORIES).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleAddExpense}
              className="w-full flex h-6 items-center justify-center gap-1 rounded-sm bg-[#2563eb] text-[10px] font-medium text-white hover:bg-[#1d4ed8]"
            >
              <Plus size={12} />
              添加
            </button>
          </div>
        </div>
      </div>

      {/* Final Close Console - Bottom */}
      <div className="border-t border-[#e5e7eb] bg-[#f9fafb] px-5 py-2">
        <div className="flex items-center justify-between">
          <div className="text-[11px] text-[#6b7280]">
            <span>
              最终应收: <span className="font-mono font-bold text-[#111827]">¥{netBalance.toLocaleString()}</span>
            </span>
          </div>
          <button
            onClick={() => {
              onDataChange({
                ...currentData,
                archived: true,
                settledAt: new Date().toISOString(),
              })
              onCompleteSettlement()
            }}
            disabled={!canSettle}
            className="flex h-8 items-center gap-1.5 rounded-sm bg-[#2563eb] px-3 text-[13px] font-medium text-white hover:bg-[#1d4ed8] disabled:bg-[#d1d5db] disabled:cursor-not-allowed"
          >
            <DollarSign size={13} />
            {canSettle ? '确认结算并归档' : '待条件满足'}
          </button>
        </div>
      </div>
    </div>
  )
}
