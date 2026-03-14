'use client'

import type { Opportunity, SelectedProduct } from '@/lib/types'

interface P3QuoteViewProps {
  opportunity: Opportunity
  selectedProducts: SelectedProduct[]
}

export function P3QuoteView({ opportunity, selectedProducts }: P3QuoteViewProps) {
  const subtotal = selectedProducts.reduce((sum, sp) => sum + sp.subtotal, 0)
  const totalDiscount = selectedProducts.reduce(
    (sum, sp) => sum + sp.quantity * sp.product.price * (sp.discount / 100),
    0
  )

  return (
    <div className="h-full overflow-y-auto">
      {/* Quote Header */}
      <div className="mb-4 border-b border-[#e5e7eb] pb-3">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-[#6b7280]">
          报价单预览
        </div>
        <div className="mt-2 grid grid-cols-2 gap-x-8 gap-y-1 text-[12px]">
          <div className="flex justify-between">
            <span className="text-[#6b7280]">客户姓名</span>
            <span className="font-medium text-[#111827]">{opportunity.customer.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#6b7280]">护照号</span>
            <span className="font-mono text-[#111827]">{opportunity.customer.passportNo}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#6b7280]">服务类型</span>
            <span className="text-[#111827]">{opportunity.serviceTypeLabel}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#6b7280]">目的地</span>
            <span className="text-[#111827]">{opportunity.destination || '-'}</span>
          </div>
        </div>
      </div>

      {/* Product Table */}
      <div className="mb-4">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-[#e5e7eb] text-left text-[11px] font-semibold uppercase tracking-wide text-[#6b7280]">
              <th className="pb-1.5">产品/服务</th>
              <th className="pb-1.5 text-right">单价</th>
              <th className="pb-1.5 text-center">数量</th>
              <th className="pb-1.5 text-right">折扣</th>
              <th className="pb-1.5 text-right">小计</th>
            </tr>
          </thead>
          <tbody>
            {selectedProducts.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-4 text-center text-[#9ca3af]">
                  尚未选择产品
                </td>
              </tr>
            ) : (
              selectedProducts.map((sp) => (
                <tr key={sp.product.id} className="border-b border-[#e5e7eb]">
                  <td className="py-1.5">
                    <div className="font-medium text-[#111827]">{sp.product.name}</div>
                    <div className="text-[10px] text-[#6b7280]">{sp.product.category}</div>
                  </td>
                  <td className="py-1.5 text-right font-mono text-[#111827]">
                    ¥{sp.product.price.toLocaleString()}
                  </td>
                  <td className="py-1.5 text-center font-mono text-[#111827]">
                    {sp.quantity}
                  </td>
                  <td className="py-1.5 text-right font-mono text-[#111827]">
                    {sp.discount > 0 ? `${sp.discount}%` : '-'}
                  </td>
                  <td className="py-1.5 text-right font-mono font-medium text-[#111827]">
                    ¥{sp.subtotal.toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      {selectedProducts.length > 0 && (
        <div className="border-t border-[#e5e7eb] pt-3">
          <div className="flex justify-end">
            <div className="w-48">
              <div className="flex justify-between py-0.5 text-[12px]">
                <span className="text-[#6b7280]">产品合计</span>
                <span className="font-mono text-[#111827]">
                  ¥{(subtotal + totalDiscount).toLocaleString()}
                </span>
              </div>
              {totalDiscount > 0 && (
                <div className="flex justify-between py-0.5 text-[12px]">
                  <span className="text-[#6b7280]">折扣优惠</span>
                  <span className="font-mono text-[#ef4444]">
                    -¥{totalDiscount.toLocaleString()}
                  </span>
                </div>
              )}
              <div className="mt-1 flex justify-between border-t border-[#e5e7eb] pt-1.5 text-[14px]">
                <span className="font-semibold text-[#111827]">应付总额</span>
                <span className="font-mono font-bold text-[#2563eb]">
                  ¥{subtotal.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notes */}
      <div className="mt-4 border-t border-[#e5e7eb] pt-3">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-[#6b7280]">
          备注说明
        </div>
        <div className="mt-2 text-[12px] leading-relaxed text-[#6b7280]">
          {opportunity.requirements || '暂无需求说明'}
        </div>
        {opportunity.notes && (
          <div className="mt-2 text-[12px] leading-relaxed text-[#6b7280]">
            {opportunity.notes}
          </div>
        )}
      </div>
    </div>
  )
}
