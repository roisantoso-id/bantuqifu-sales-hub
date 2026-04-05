'use client'

import { Send, FileText } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { Opportunity, Product, Currency, OpportunityP3Data } from '@/lib/types'

interface P3QuoteViewProps {
  opportunity: Opportunity
  allProducts: Product[]
  p3Data: OpportunityP3Data[]
  onP3DataChange: (data: OpportunityP3Data[]) => void
  onQuoteSent: () => void
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

function formatCurrency(price?: number, currency: Currency = 'CNY') {
  if (typeof price !== 'number' || Number.isNaN(price)) return '—'
  if (currency === 'IDR') {
    return `Rp ${Math.round(price).toLocaleString('id-ID')}`
  }
  return `¥${Math.round(price).toLocaleString('zh-CN')}`
}

export function P3QuoteView({
  opportunity,
  allProducts,
  p3Data,
  onP3DataChange,
  onQuoteSent,
}: P3QuoteViewProps) {
  const [currentCurrency, setCurrentCurrency] = useState<Currency>('CNY')

  useEffect(() => {
    if (p3Data.length > 0) {
      setCurrentCurrency(p3Data[0].currency)
      return
    }

    if (opportunity.p2Data && opportunity.p2Data.length > 0) {
      setCurrentCurrency(opportunity.p2Data[0].currency)
      return
    }

    setCurrentCurrency('CNY')
  }, [opportunity.id, opportunity.p2Data, p3Data])

  const productMap = useMemo(() => {
    return new Map(allProducts.map((p) => [p.id, p]))
  }, [allProducts])

  const displayData = useMemo(() => {
    if (p3Data.length > 0) return p3Data
    if (!opportunity.p2Data || opportunity.p2Data.length === 0) return []

    return opportunity.p2Data.map((item) => {
      const initialLockedPrice = currentCurrency === 'CNY' ? item.retailPriceCny : item.retailPriceIdr
      const initialCostFloor = currentCurrency === 'CNY' ? item.costPriceCny : item.costPriceIdr
      const lockedPrice = typeof initialLockedPrice === 'number' ? initialLockedPrice : item.basePrice
      const profitMargin = typeof initialCostFloor === 'number' && initialCostFloor > 0
        ? Number((((lockedPrice - initialCostFloor) / initialCostFloor) * 100).toFixed(2))
        : undefined

      return {
        tempId: item.tempId,
        productId: item.productId,
        productName: item.productName,
        targetName: item.targetName,
        lockedPrice,
        currency: currentCurrency,
        costFloor: initialCostFloor,
        profitMargin,
        costPriceCny: item.costPriceCny,
        costPriceIdr: item.costPriceIdr,
        partnerPriceCny: item.partnerPriceCny,
        partnerPriceIdr: item.partnerPriceIdr,
        retailPriceCny: item.retailPriceCny,
        retailPriceIdr: item.retailPriceIdr,
        approvalStatus: 'auto-approved' as const,
      }
    })
  }, [currentCurrency, opportunity.p2Data, p3Data])

  useEffect(() => {
    if (p3Data.length === 0 || displayData.length === 0) return

    onP3DataChange(
      displayData.map((item) => {
        const nextRetailPrice = currentCurrency === 'CNY' ? item.retailPriceCny : item.retailPriceIdr
        const nextCostFloor = currentCurrency === 'CNY' ? item.costPriceCny : item.costPriceIdr
        const nextLockedPrice = typeof nextRetailPrice === 'number' ? nextRetailPrice : 0
        const profitMargin = typeof nextCostFloor === 'number' && nextCostFloor > 0
          ? Number((((nextLockedPrice - nextCostFloor) / nextCostFloor) * 100).toFixed(2))
          : undefined

        return {
          ...item,
          lockedPrice: nextLockedPrice,
          currency: currentCurrency,
          costFloor: nextCostFloor,
          profitMargin,
          approvalStatus: 'auto-approved' as const,
        }
      })
    )
  }, [currentCurrency, displayData, onP3DataChange, p3Data.length])

  const updatePrice = (tempId: string, price: number) => {
    onP3DataChange(
      displayData.map((item) => {
        if (item.tempId !== tempId) return item

        const nextCostFloor = currentCurrency === 'CNY'
          ? item.costPriceCny
          : item.costPriceIdr

        const profitMargin = typeof nextCostFloor === 'number' && nextCostFloor > 0
          ? Number((((price - nextCostFloor) / nextCostFloor) * 100).toFixed(2))
          : undefined

        return {
          ...item,
          lockedPrice: price,
          currency: currentCurrency,
          costFloor: nextCostFloor,
          profitMargin,
          approvalStatus: 'auto-approved' as const,
        }
      })
    )
  }

  const subtotal = useMemo(() => {
    return displayData.reduce((sum, item) => {
      if (item.currency !== currentCurrency) return sum
      return sum + item.lockedPrice
    }, 0)
  }, [displayData, currentCurrency])

  const totalCost = useMemo(() => {
    return displayData.reduce((sum, item) => {
      const activeCost = currentCurrency === 'CNY' ? item.costPriceCny : item.costPriceIdr
      return sum + (activeCost || 0)
    }, 0)
  }, [displayData, currentCurrency])

  const totalProfit = subtotal - totalCost

  const formatMargin = (profitMargin?: number) => {
    if (typeof profitMargin !== 'number' || Number.isNaN(profitMargin)) return '—'
    return `${profitMargin.toFixed(2)}%`
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-[#e5e7eb] px-4 py-2.5">
        <h3 className="text-[13px] font-semibold text-[#111827]">P3: 报价单与币种</h3>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentCurrency('CNY')}
            className={`rounded-sm px-2 py-1 text-[12px] font-medium transition-colors ${
              currentCurrency === 'CNY'
                ? 'bg-[#2563eb] text-white'
                : 'bg-[#f3f4f6] text-[#6b7280] hover:bg-[#e5e7eb]'
            }`}
          >
            RMB
          </button>
          <button
            onClick={() => setCurrentCurrency('IDR')}
            className={`rounded-sm px-2 py-1 text-[12px] font-medium transition-colors ${
              currentCurrency === 'IDR'
                ? 'bg-[#2563eb] text-white'
                : 'bg-[#f3f4f6] text-[#6b7280] hover:bg-[#e5e7eb]'
            }`}
          >
            IDR
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
        <div className="rounded-sm border border-[#e5e7eb] bg-white p-3">
          <div className="mb-2 flex items-start justify-between">
            <div>
              <h4 className="text-[13px] font-semibold text-[#111827]">服务报价单</h4>
              <p className="font-mono text-[11px] text-[#9ca3af]">
                QUO-{(opportunity.opportunityCode ?? opportunity.id).replace('opp-', '').toUpperCase()}-{formatDate(opportunity.createdAt).split('/')[0]}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-[#9ca3af]">生成日期</p>
              <p className="font-mono text-[12px] text-[#374151]">{formatDate(opportunity.updatedAt)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-1 border-t border-[#e5e7eb] pt-2 text-[12px]">
            <div className="flex justify-between">
              <span className="text-[#9ca3af]">客户姓名</span>
              <span className="font-medium text-[#111827]">{opportunity.customer.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#9ca3af]">护照号</span>
              <span className="font-mono text-[#374151]">{opportunity.customer.passportNo}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#9ca3af]">服务类型</span>
              <span className="text-[#374151]">{opportunity.serviceTypeLabel}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#9ca3af]">目的地</span>
              <span className="text-[#374151]">{opportunity.destination ?? '—'}</span>
            </div>
          </div>
        </div>

        {displayData.length === 0 ? (
          <div className="flex items-center justify-center rounded-sm border border-[#e5e7eb] bg-white py-8 text-[13px] text-[#9ca3af]">
            暂无服务实例，请先在 P2 阶段添加
          </div>
        ) : (
          <div className="overflow-hidden rounded-sm border border-[#e5e7eb] bg-white">
            <div className="grid grid-cols-[1fr_120px_110px_120px_120px_120px_68px] gap-1 border-b border-[#e5e7eb] bg-[#f9fafb] px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af]">
              <div>服务实例</div>
              <div>办理人/标的</div>
              <div className="text-right">报价单价</div>
              <div className="text-right">成本价</div>
              <div className="text-right">合伙人价</div>
              <div className="text-right">零售价</div>
              <div className="text-center">状态</div>
            </div>

            <div className="divide-y divide-[#f3f4f6]">
              {displayData.map((item) => {
                const product = productMap.get(item.productId)
                const currentCost = currentCurrency === 'CNY' ? item.costPriceCny : item.costPriceIdr
                const currentPartner = currentCurrency === 'CNY' ? item.partnerPriceCny : item.partnerPriceIdr
                const currentRetail = currentCurrency === 'CNY' ? item.retailPriceCny : item.retailPriceIdr
                const isBelowCost = typeof currentCost === 'number' && item.lockedPrice < currentCost

                return (
                  <div
                    key={item.tempId}
                    className={`grid grid-cols-[1fr_120px_110px_120px_120px_120px_68px] gap-1 items-center px-3 py-1.5 text-[12px] ${
                      isBelowCost ? 'bg-[#fef2f2]' : 'bg-white'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-[#111827]">{item.productName}</p>
                      <p className="text-[10px] text-[#9ca3af]">{product?.categoryNameZh || product?.category || ''}</p>
                      <div className="mt-0.5 flex flex-wrap gap-x-2 gap-y-0.5 text-[10px] text-[#6b7280]">
                        <span className={isBelowCost ? 'text-[#dc2626]' : ''}>利润率 {formatMargin(item.profitMargin)}</span>
                      </div>
                    </div>

                    <div className="truncate text-[#374151]">{item.targetName || '—'}</div>

                    <div>
                      <input
                        type="number"
                        value={item.currency === currentCurrency ? item.lockedPrice : ''}
                        onChange={(e) => updatePrice(item.tempId, parseFloat(e.target.value) || 0)}
                        className={`h-6 w-full rounded-sm border bg-white px-1 font-mono text-[11px] text-right outline-none focus:border-[#2563eb] ${
                          isBelowCost
                            ? 'border-[#fca5a5] text-[#dc2626] bg-[#fef2f2]'
                            : 'border-[#e5e7eb] text-[#111827]'
                        }`}
                        placeholder={item.currency}
                      />
                    </div>

                    <div className="font-mono text-right text-[12px] text-[#111827]">
                      {formatCurrency(currentCost, currentCurrency)}
                    </div>

                    <div className="font-mono text-right text-[12px] text-[#111827]">
                      {formatCurrency(currentPartner, currentCurrency)}
                    </div>

                    <div className="font-mono text-right text-[12px] text-[#111827]">
                      {formatCurrency(currentRetail, currentCurrency)}
                    </div>

                    <div className="text-center">
                      <span className={`inline-flex items-center rounded-sm px-1.5 py-0.5 text-[10px] font-semibold ${
                        isBelowCost
                          ? 'bg-[#fee2e2] text-[#dc2626]'
                          : 'bg-[#dcfce7] text-[#16a34a]'
                      }`}>
                        {isBelowCost ? '低于成本' : '正常'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="space-y-0.5 border-t border-[#e5e7eb] bg-[#f9fafb] px-3 py-2 text-[12px]">
              <div className="flex justify-between">
                <span className="text-[#6b7280]">报价小计</span>
                <span className="font-mono text-[#111827]">{formatCurrency(subtotal, currentCurrency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6b7280]">成本小计</span>
                <span className="font-mono text-[#111827]">{formatCurrency(totalCost, currentCurrency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6b7280]">毛利</span>
                <span className="font-mono text-[#111827]">{formatCurrency(totalProfit, currentCurrency)}</span>
              </div>
              <div className="flex justify-between border-t border-[#e5e7eb] pt-0.5 font-semibold">
                <span className="text-[#111827]">总计</span>
                <span className="font-mono text-[#111827]">{formatCurrency(subtotal, currentCurrency)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2 border-t border-[#e5e7eb] bg-[#f9fafb] px-4 py-2">
        <button
          className="flex h-8 items-center gap-1.5 rounded-sm border border-[#e5e7eb] bg-white px-3 text-[13px] text-[#374151] hover:bg-white"
          aria-label="导出PDF"
        >
          <FileText size={14} />
          导出 PDF
        </button>
        <button
          onClick={onQuoteSent}
          className="flex h-8 items-center gap-1.5 rounded-sm bg-[#2563eb] px-3 text-[13px] font-medium text-white hover:bg-[#1d4ed8]"
          aria-label="提交财务审核"
        >
          <Send size={13} />
          提交财务审核
        </button>
      </div>
    </div>
  )
}
