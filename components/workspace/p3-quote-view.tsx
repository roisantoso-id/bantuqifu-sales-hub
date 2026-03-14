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

  const updatePrice = (productId: string, price: number) => {
    onP3DataChange(
      p3Data.map((item) =>
        item.productId === productId ? { ...item, lockedPrice: price, currency: currentCurrency } : item
      )
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

  const displayData = useMemo(() => {
    return p3Data.map((item) => ({
      ...item,
      product: productMap.get(item.productId),
    }))
  }, [p3Data, productMap])

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
            <div className="grid grid-cols-[1fr_100px_80px_80px] gap-2 border-b border-[#e5e7eb] bg-[#f9fafb] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#9ca3af]">
              <div>产品名</div>
              <div className="text-right">单价</div>
              <div className="text-right">币种</div>
              <div className="text-right">小计</div>
            </div>

            {/* Table Rows */}
            <div className="divide-y divide-[#f3f4f6]">
              {displayData.map((item) => {
                if (!item.product) return null
                const displayPrice = convertToDisplay(item.lockedPrice, item.currency)

                return (
                  <div
                    key={item.productId}
                    className="grid grid-cols-[1fr_100px_80px_80px] gap-2 items-center px-3 py-1.5 text-[12px]"
                  >
                    {/* Product name */}
                    <div className="text-[#111827] font-medium truncate">{item.product.name}</div>

                    {/* Unit Price Input */}
                    <div>
                      <input
                        type="number"
                        value={item.lockedPrice}
                        onChange={(e) => updatePrice(item.productId, parseFloat(e.target.value))}
                        className="h-6 w-full rounded-sm border border-[#e5e7eb] px-1 font-mono text-[11px] text-[#111827] text-right outline-none focus:border-[#2563eb]"
                      />
                    </div>

                    {/* Currency Select */}
                    <div>
                      <select
                        value={item.currency}
                        onChange={(e) => updateCurrency(item.productId, e.target.value as Currency)}
                        className="h-6 w-full rounded-sm border border-[#e5e7eb] bg-white px-1 text-[11px] text-[#111827] outline-none focus:border-[#2563eb]"
                      >
                        <option value="CNY">RMB</option>
                        <option value="IDR">IDR</option>
                      </select>
                    </div>

                    {/* Subtotal */}
                    <div className="font-mono text-right text-[#111827] font-medium">
                      {formatPrice(displayPrice, currentCurrency)}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Totals */}
            <div className="border-t border-[#e5e7eb] bg-[#f9fafb] px-3 py-1.5 space-y-1 text-[12px]">
              <div className="flex justify-between">
                <span className="text-[#6b7280]">小计</span>
                <span className="font-mono text-[#111827]">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6b7280]">税费 (6%)</span>
                <span className="font-mono text-[#111827]">{formatPrice(tax)}</span>
              </div>
              <div className="flex justify-between border-t border-[#e5e7eb] pt-1 font-semibold">
                <span className="text-[#111827]">总计</span>
                <span className="font-mono text-[#111827]">{formatPrice(total)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Approval Section */}
        <div className="rounded-sm border border-[#e5e7eb] bg-white p-3">
          <h4 className="text-[12px] font-semibold text-[#111827] mb-2">财务审核</h4>
          <div className="space-y-1.5 text-[11px]">
            <div className="flex items-center gap-2 rounded-sm bg-[#eff6ff] px-2 py-1.5 border border-[#bfdbfe]">
              <span className="w-2 h-2 rounded-full bg-[#2563eb]" />
              <span className="text-[#1e40af]">待提交审核</span>
            </div>
            <p className="text-[#9ca3af] italic">点击下方按钮提交报价供财务审核</p>
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
