'use client'

import { Send, FileText } from 'lucide-react'
import { useState, useMemo } from 'react'
import type { Opportunity, Product, OpportunityP3Data, Currency } from '@/lib/types'
import { EXCHANGE_RATES } from '@/lib/mock-data'

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

export function P3QuoteView({
  opportunity,
  allProducts,
  p3Data,
  onP3DataChange,
  onQuoteSent,
}: P3QuoteViewProps) {
  const [currentCurrency, setCurrentCurrency] = useState<Currency>('CNY')

  // Auto-initialize p3Data from p2Data if empty
  const displayData = useMemo(() => {
    if (p3Data.length > 0) return p3Data
    if (!opportunity.p2Data || opportunity.p2Data.length === 0) return []
    
    // Initialize from P2 data
    const initialized = opportunity.p2Data.map((p2Item) => {
      const product = allProducts.find((p) => p.id === p2Item.productId)
      return {
        productId: p2Item.productId,
        lockedPrice: product?.basePrice ?? 0,
        currency: 'CNY' as Currency,
        recommendedPrice: product?.recommendedPrice,
        costFloor: product?.costPrice,
        profitMargin: product ? ((product.basePrice - (product.costPrice ?? 0)) / (product.costPrice ?? 1)) * 100 : 0,
        approvalStatus: 'auto-approved' as const,
      } as OpportunityP3Data
    })
    
    // Save to opportunity
    onP3DataChange(initialized)
    return initialized
  }, [p3Data, opportunity.p2Data, allProducts, onP3DataChange])

  const updatePrice = (productId: string, price: number) => {
    onP3DataChange(
      p3Data.map((item) => {
        if (item.productId !== productId) return item
        const product = productMap.get(productId)
        const profitMargin = product && product.costPrice ? ((price - product.costPrice) / product.costPrice) * 100 : 0
        const approvalStatus = product && product.recommendedPrice && price < product.recommendedPrice ? 'admin-required' : 'auto-approved'
        return {
          ...item,
          lockedPrice: price,
          currency: currentCurrency,
          recommendedPrice: product?.recommendedPrice,
          costFloor: product?.costPrice,
          profitMargin,
          approvalStatus,
        }
      })
    )
  }

  const updateCurrency = (productId: string, currency: Currency) => {
    onP3DataChange(
      p3Data.map((item) =>
        item.productId === productId ? { ...item, currency } : item
      )
    )
  }

  const productMap = useMemo(() => {
    return new Map(allProducts.map((p) => [p.id, p]))
  }, [allProducts])

  // Enrich display data with product details
  const enrichedDisplayData = useMemo(() => {
    return displayData.map((item) => ({
      ...item,
      product: productMap.get(item.productId),
    }))
  }, [displayData, productMap])

  const subtotal = useMemo(() => {
    return enrichedDisplayData.reduce((sum, item) => {
      const inCNY = item.lockedPrice / EXCHANGE_RATES[item.currency]
      const inDisplayCurrency = inCNY * EXCHANGE_RATES[currentCurrency]
      return sum + inDisplayCurrency
    }, 0)
  }, [enrichedDisplayData, currentCurrency])

  const tax = Math.round(subtotal * 0.06)
  const total = subtotal + tax

  const formatPrice = (price: number, currency: Currency = currentCurrency) => {
    const symbol = currency === 'CNY' ? '¥' : 'Rp'
    return `${symbol}${Math.round(price).toLocaleString()}`
  }

  const convertToDisplay = (price: number, fromCurrency: Currency) => {
    if (fromCurrency === currentCurrency) return price
    const inCNY = price / EXCHANGE_RATES[fromCurrency]
    return inCNY * EXCHANGE_RATES[currentCurrency]
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header with Currency Toggle */}
      <div className="border-b border-[#e5e7eb] px-4 py-2.5 flex items-center justify-between">
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

      {/* Quote Content */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {/* Quote Header Card */}
        <div className="rounded-sm border border-[#e5e7eb] bg-white p-3">
          <div className="mb-2 flex items-start justify-between">
            <div>
              <h4 className="text-[13px] font-semibold text-[#111827]">服务报价单</h4>
              <p className="font-mono text-[11px] text-[#9ca3af]">
                QUO-{opportunity.id.replace('opp-', '').toUpperCase()}-{new Date().getFullYear()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-[#9ca3af]">生成日期</p>
              <p className="font-mono text-[12px] text-[#374151]">
                {formatDate(new Date().toISOString())}
              </p>
            </div>
          </div>

          {/* Client Info */}
          <div className="border-t border-[#e5e7eb] pt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[12px]">
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

        {/* Line Items Table */}
        {displayData.length === 0 ? (
          <div className="flex items-center justify-center rounded-sm border border-[#e5e7eb] bg-white py-8 text-[13px] text-[#9ca3af]">
            暂无产品，请在 P2 阶段添加产品
          </div>
        ) : (
          <div className="rounded-sm border border-[#e5e7eb] bg-white overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-[1fr_90px_90px_70px_70px] gap-1 border-b border-[#e5e7eb] bg-[#f9fafb] px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af]">
              <div>产品名</div>
              <div className="text-right">当前售价</div>
              <div className="text-right">推荐价格</div>
              <div className="text-right">成本线</div>
              <div className="text-center">审批状态</div>
            </div>

            {/* Table Rows */}
            <div className="divide-y divide-[#f3f4f6]">
              {enrichedDisplayData.map((item) => {
                if (!item.product) return null
                const displayPrice = convertToDisplay(item.lockedPrice, item.currency)
                const displayRecommended = item.recommendedPrice ? convertToDisplay(item.recommendedPrice, 'CNY') : 0
                const displayCostFloor = item.costFloor ? convertToDisplay(item.costFloor, 'CNY') : 0
                const isLowPrice = displayPrice < displayRecommended
                const profitMarginPercent = item.profitMargin?.toFixed(1) ?? '0'

                return (
                  <div
                    key={item.productId}
                    className={`grid grid-cols-[1fr_90px_90px_70px_70px] gap-1 items-center px-3 py-1 text-[12px] ${
                      isLowPrice ? 'bg-[#fef2f2]' : 'bg-white'
                    }`}
                  >
                    {/* Product name + difficulty + cycle */}
                    <div className="min-w-0">
                      <p className="font-medium text-[#111827] truncate">{item.product.name}</p>
                      <p className="text-[10px] text-[#9ca3af]">
                        {item.product.difficulty ? `★${item.product.difficulty}` : ''}{' '}
                        {item.product.billingCycles?.[0] ?? ''}
                      </p>
                    </div>

                    {/* Current Price Input */}
                    <div>
                      <input
                        type="number"
                        value={item.lockedPrice}
                        onChange={(e) => updatePrice(item.productId, parseFloat(e.target.value) || 0)}
                        className={`h-6 w-full rounded-sm border px-1 font-mono text-[11px] text-right outline-none ${
                          isLowPrice
                            ? 'border-[#fca5a5] bg-[#fef2f2] text-[#dc2626] focus:border-[#dc2626]'
                            : 'border-[#e5e7eb] bg-white text-[#111827] focus:border-[#2563eb]'
                        }`}
                      />
                      <p className="text-[10px] text-[#9ca3af] text-right mt-0.5">
                        {currentCurrency === 'CNY' ? '¥' : 'Rp'}
                      </p>
                    </div>

                    {/* Recommended Price (Read-only) */}
                    <div className="font-mono text-right text-[#9ca3af] text-[11px]">
                      {displayRecommended > 0 ? (
                        <>
                          <p>{formatPrice(displayRecommended, currentCurrency)}</p>
                          <p className="text-[9px]">（推荐）</p>
                        </>
                      ) : (
                        '—'
                      )}
                    </div>

                    {/* Cost Floor (Read-only, red italic) */}
                    <div className="font-mono text-right text-[#dc2626] italic text-[10px]">
                      {displayCostFloor > 0 ? formatPrice(displayCostFloor, currentCurrency) : '—'}
                    </div>

                    {/* Approval Status Badge */}
                    <div className="text-center">
                      {isLowPrice ? (
                        <span className="inline-flex items-center gap-0.5 rounded-sm bg-[#fee2e2] px-1.5 py-0.5 text-[10px] font-semibold text-[#dc2626]">
                          ⚠ 审核中
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 rounded-sm bg-[#dcfce7] px-1.5 py-0.5 text-[10px] font-semibold text-[#16a34a]">
                          ✓ 通过
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Totals */}
            <div className="border-t border-[#e5e7eb] bg-[#f9fafb] px-3 py-1 space-y-0.5 text-[12px]">
              <div className="flex justify-between">
                <span className="text-[#6b7280]">小计</span>
                <span className="font-mono text-[#111827]">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6b7280]">税费 (6%)</span>
                <span className="font-mono text-[#111827]">{formatPrice(tax)}</span>
              </div>
              <div className="flex justify-between border-t border-[#e5e7eb] pt-0.5 font-semibold">
                <span className="text-[#111827]">总计</span>
                <span className="font-mono text-[#111827]">{formatPrice(total)}</span>
              </div>
              {/* Average profit margin */}
              <div className="flex justify-between text-[11px] text-[#9ca3af]">
                <span>平均毛利</span>
                <span className="font-mono">
                  {enrichedDisplayData.length > 0
                    ? ((enrichedDisplayData.reduce((sum, d) => sum + (d.profitMargin ?? 0), 0) / enrichedDisplayData.length) || 0).toFixed(1)
                    : '0'}
                  %
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Approval Section */}
        <div className="rounded-sm border border-[#e5e7eb] bg-white p-3">
          <h4 className="text-[12px] font-semibold text-[#111827] mb-2">审批状态概览</h4>
          <div className="space-y-1.5 text-[11px]">
            {(() => {
              const autoApproved = enrichedDisplayData.filter((d) => d.approvalStatus === 'auto-approved').length
              const adminRequired = enrichedDisplayData.filter((d) => d.approvalStatus === 'admin-required').length
              const total = enrichedDisplayData.length

              return (
                <>
                  <div className="flex items-center justify-between rounded-sm bg-[#dcfce7] px-2 py-1.5 border border-[#86efac]">
                    <span className="text-[#16a34a] font-medium">✓ 自动审批通过</span>
                    <span className="font-mono text-[#15803d] font-semibold">{autoApproved}/{total}</span>
                  </div>
                  {adminRequired > 0 && (
                    <div className="flex items-center justify-between rounded-sm bg-[#fee2e2] px-2 py-1.5 border border-[#fca5a5]">
                      <span className="text-[#dc2626] font-medium">⚠ 需要管理员审核</span>
                      <span className="font-mono text-[#991b1b] font-semibold">{adminRequired}/{total}</span>
                    </div>
                  )}
                  {adminRequired === 0 && total > 0 && (
                    <p className="text-[#16a34a] italic">所有产品已通过自动审批，可提交财务确认</p>
                  )}
                  {total === 0 && (
                    <p className="text-[#9ca3af] italic">请先在 P2 阶段添加产品</p>
                  )}
                </>
              )
            })()}
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="border-t border-[#e5e7eb] bg-[#f9fafb] px-4 py-2 flex gap-2">
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
