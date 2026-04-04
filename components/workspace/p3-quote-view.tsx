'use client'

import { Send, FileText } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { Opportunity, Product, Currency, OpportunityP3Data } from '@/lib/types'
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

  const productMap = useMemo(() => {
    return new Map(allProducts.map((p) => [p.id, p]))
  }, [allProducts])


  useEffect(() => {
    if (p3Data.length > 0 || !opportunity.p2Data || opportunity.p2Data.length === 0) return

    const initialized: OpportunityP3Data[] = opportunity.p2Data.map((item) => ({
      tempId: item.tempId,
      productId: item.productId,
      productName: item.productName,
      targetName: item.targetName,
      lockedPrice: item.basePrice,
      currency: item.currency,
      costFloor: item.costFloor,
      profitMargin: item.profitMargin,
      approvalStatus: 'auto-approved',
    }))

    onP3DataChange(initialized)
  }, [p3Data, opportunity.p2Data, onP3DataChange])

  const displayData = useMemo(() => {
    if (p3Data.length > 0) return p3Data
    return []
  }, [p3Data])

  const updatePrice = (tempId: string, price: number) => {
    onP3DataChange(
      displayData.map((item) => {
        if (item.tempId !== tempId) return item
        const costFloor = item.costFloor
        const profitMargin = typeof costFloor === 'number' && costFloor > 0
          ? Number((((price - costFloor) / costFloor) * 100).toFixed(2))
          : undefined
        return {
          ...item,
          lockedPrice: price,
          currency: currentCurrency,
          profitMargin,
          approvalStatus: 'auto-approved' as const,
        }
      })
    )
  }

  const subtotal = useMemo(() => {
    return displayData.reduce((sum, item) => {
      const inCNY = item.lockedPrice / EXCHANGE_RATES[item.currency]
      const inDisplayCurrency = inCNY * EXCHANGE_RATES[currentCurrency]
      return sum + inDisplayCurrency
    }, 0)
  }, [displayData, currentCurrency])

  const tax = Math.round(subtotal * 0.06)
  const total = subtotal + tax

  const formatPrice = (price: number, currency: Currency = currentCurrency) => {
    const symbol = currency === 'CNY' ? '¥' : 'Rp'
    return `${symbol}${Math.round(price).toLocaleString()}`
  }

  const formatMargin = (profitMargin?: number) => {
    if (typeof profitMargin !== 'number' || Number.isNaN(profitMargin)) return '—'
    return `${profitMargin.toFixed(2)}%`
  }

  const convertToDisplay = (price: number, fromCurrency: Currency) => {
    if (fromCurrency === currentCurrency) return price
    const inCNY = price / EXCHANGE_RATES[fromCurrency]
    return inCNY * EXCHANGE_RATES[currentCurrency]
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
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

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
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
              <p className="font-mono text-[12px] text-[#374151]">
                {formatDate(opportunity.updatedAt)}
              </p>
            </div>
          </div>

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

        {displayData.length === 0 ? (
          <div className="flex items-center justify-center rounded-sm border border-[#e5e7eb] bg-white py-8 text-[13px] text-[#9ca3af]">
            暂无服务实例，请先在 P2 阶段添加
          </div>
        ) : (
          <div className="rounded-sm border border-[#e5e7eb] bg-white overflow-hidden">
            <div className="grid grid-cols-[1fr_120px_90px_70px_68px] gap-1 border-b border-[#e5e7eb] bg-[#f9fafb] px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af]">
              <div>服务实例</div>
              <div>办理人/标的</div>
              <div className="text-right">单价</div>
              <div className="text-right">小计</div>
              <div className="text-center">审批</div>
            </div>

            <div className="divide-y divide-[#f3f4f6]">
              {displayData.map((item) => {
                const product = productMap.get(item.productId)
                const displayPrice = convertToDisplay(item.lockedPrice, item.currency)
                const lineTotal = displayPrice

                return (
                  <div
                    key={item.tempId}
                    className="grid grid-cols-[1fr_120px_90px_70px_68px] gap-1 items-center px-3 py-1.5 text-[12px] bg-white"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-[#111827] truncate">{item.productName}</p>
                      <p className="text-[10px] text-[#9ca3af]">{product?.categoryNameZh || product?.category || ''}</p>
                      <div className="mt-0.5 flex flex-wrap gap-x-2 gap-y-0.5 text-[10px] text-[#6b7280]">
                        <span>成本底线 {typeof item.costFloor === 'number' ? formatPrice(convertToDisplay(item.costFloor, item.currency), currentCurrency) : '—'}</span>
                        <span>利润率 {formatMargin(item.profitMargin)}</span>
                      </div>
                    </div>

                    <div className="truncate text-[#374151]">{item.targetName || '—'}</div>

                    <div>
                      <input
                        type="number"
                        value={item.lockedPrice}
                        onChange={(e) => updatePrice(item.tempId, parseFloat(e.target.value) || 0)}
                        className="h-6 w-full rounded-sm border border-[#e5e7eb] bg-white px-1 font-mono text-[11px] text-right text-[#111827] outline-none focus:border-[#2563eb]"
                      />
                    </div>

                    <div className="font-mono text-right text-[12px] font-semibold text-[#111827]">
                      {formatPrice(lineTotal, currentCurrency)}
                    </div>

                    <div className="text-center">
                      <span className="inline-flex items-center rounded-sm bg-[#dcfce7] px-1.5 py-0.5 text-[10px] font-semibold text-[#16a34a]">
                        通过
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>

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
            </div>
          </div>
        )}
      </div>

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
