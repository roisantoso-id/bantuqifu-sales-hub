'use client'

import { Send, FileText } from 'lucide-react'
import type { Opportunity, SelectedProduct } from '@/lib/types'

interface P3QuoteViewProps {
  opportunity: Opportunity
  selectedProducts: SelectedProduct[]
  onQuoteSent: () => void
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

export function P3QuoteView({ opportunity, selectedProducts, onQuoteSent }: P3QuoteViewProps) {
  const subtotal = selectedProducts.reduce((s, p) => s + p.subtotal, 0)
  const tax = Math.round(subtotal * 0.06)
  const total = subtotal + tax

  return (
    <div className="space-y-5">
      {/* Quote header card */}
      <div className="rounded-sm border border-[#e5e7eb] bg-white p-4">
        <div className="mb-3 flex items-start justify-between">
          <div>
            <h3 className="text-[14px] font-semibold text-[#111827]">服务报价单</h3>
            <p className="font-mono text-[11px] text-[#9ca3af]">
              QUO-{opportunity.id.replace('opp-', '').toUpperCase()}-{new Date().getFullYear()}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-[#9ca3af]">生成日期</p>
            <p className="font-mono text-[12px] text-[#374151]">{formatDate(new Date().toISOString())}</p>
          </div>
        </div>

        {/* Client & service summary */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 border-t border-[#e5e7eb] pt-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[#9ca3af]">客户姓名</span>
            <span className="text-[12px] font-medium text-[#111827]">{opportunity.customer.name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[#9ca3af]">护照号码</span>
            <span className="font-mono text-[12px] text-[#374151]">{opportunity.customer.passportNo}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[#9ca3af]">服务类型</span>
            <span className="text-[12px] text-[#374151]">{opportunity.serviceTypeLabel}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[#9ca3af]">目的地</span>
            <span className="text-[12px] text-[#374151]">{opportunity.destination ?? '—'}</span>
          </div>
          {opportunity.travelDate && (
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[#9ca3af]">出行日期</span>
              <span className="font-mono text-[12px] text-[#374151]">
                {formatDate(opportunity.travelDate)}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[#9ca3af]">负责人</span>
            <span className="text-[12px] text-[#374151]">{opportunity.assignee}</span>
          </div>
        </div>
      </div>

      {/* Line items */}
      <div className="rounded-sm border border-[#e5e7eb] bg-white">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#e5e7eb]">
              <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-[#9ca3af]">
                服务项目
              </th>
              <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wider text-[#9ca3af]">
                单价
              </th>
              <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wider text-[#9ca3af]">
                数量
              </th>
              <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wider text-[#9ca3af]">
                折扣
              </th>
              <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wider text-[#9ca3af]">
                小计
              </th>
            </tr>
          </thead>
          <tbody>
            {selectedProducts.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-6 text-center text-[12px] text-[#9ca3af]">
                  暂无产品，请在 P2 阶段添加产品
                </td>
              </tr>
            ) : (
              selectedProducts.map((sp) => (
                <tr key={sp.product.id} className="border-b border-[#f3f4f6]">
                  <td className="px-3 py-2">
                    <p className="text-[13px] text-[#111827]">{sp.product.name}</p>
                    {sp.product.description && (
                      <p className="text-[11px] text-[#9ca3af]">{sp.product.description}</p>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-[12px] text-[#374151]">
                    ¥{sp.product.price.toLocaleString()}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-[12px] text-[#374151]">
                    {sp.quantity}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-[12px] text-[#374151]">
                    {sp.discount > 0 ? `${sp.discount}%` : '—'}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-[12px] font-medium text-[#111827]">
                    ¥{sp.subtotal.toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Totals */}
        {selectedProducts.length > 0 && (
          <div className="border-t border-[#e5e7eb] px-3 py-2 space-y-1">
            <div className="flex justify-between text-[12px]">
              <span className="text-[#6b7280]">小计</span>
              <span className="font-mono text-[#374151]">¥{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-[12px]">
              <span className="text-[#6b7280]">税费 (6%)</span>
              <span className="font-mono text-[#374151]">¥{tax.toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-t border-[#e5e7eb] pt-1.5 text-[13px] font-semibold">
              <span className="text-[#111827]">总计</span>
              <span className="font-mono text-[#111827]">¥{total.toLocaleString()}</span>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          className="flex h-8 items-center gap-1.5 rounded-sm border border-[#e5e7eb] bg-white px-3 text-[13px] text-[#374151] hover:bg-[#f9fafb]"
          aria-label="导出PDF"
        >
          <FileText size={14} />
          导出 PDF
        </button>
        <button
          onClick={onQuoteSent}
          className="flex h-8 items-center gap-1.5 rounded-sm bg-[#2563eb] px-3 text-[13px] font-medium text-white hover:bg-[#1d4ed8]"
          aria-label="发送报价"
        >
          <Send size={13} />
          发送报价
        </button>
      </div>
    </div>
  )
}
