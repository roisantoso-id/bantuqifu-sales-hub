'use client'

import { Plus, Minus, DollarSign } from 'lucide-react'
import { useMemo, useState } from 'react'
import { EXCHANGE_RATES } from '@/lib/mock-data'
import type { Product, SelectedProduct, Currency } from '@/lib/types'

interface P2ProductMatcherProps {
  allProducts: Product[]
  selectedProducts: SelectedProduct[]
  currentCurrency: Currency
  onProductsChange: (products: SelectedProduct[]) => void
  onCurrencyChange: (currency: Currency) => void
}

const CATEGORY_ORDER = ['签证服务', '移民服务', '留学服务', '工作签证', '增值服务']

function groupByCategory(products: Product[]): Record<string, Product[]> {
  const groups: Record<string, Product[]> = {}
  for (const p of products) {
    if (!groups[p.category]) groups[p.category] = []
    groups[p.category].push(p)
  }
  return groups
}

function getDifficultyLabel(difficulty?: number): string {
  if (!difficulty) return ''
  return `难度: ${difficulty}/5`
}

function convertPrice(priceInCNY: number, toCurrency: Currency): number {
  // All product prices are stored in CNY, convert to target currency
  return priceInCNY * EXCHANGE_RATES[toCurrency]
}

export function P2ProductMatcher({
  allProducts,
  selectedProducts,
  currentCurrency,
  onProductsChange,
  onCurrencyChange,
}: P2ProductMatcherProps) {
  const [expandedCycles, setExpandedCycles] = useState<Record<string, string>>({})

  const grouped = groupByCategory(allProducts)

  const isSelected = (productId: string) =>
    selectedProducts.some((sp) => sp.product.id === productId)

  const getSelected = (productId: string) =>
    selectedProducts.find((sp) => sp.product.id === productId)

  const addProduct = (product: Product) => {
    if (isSelected(product.id)) return
    const newItem: SelectedProduct = {
      product,
      quantity: 1,
      discount: 0,
      currency: currentCurrency,
      billingCycle: product.billingCycles?.[0],
      subtotal: convertPrice(product.price, currentCurrency),
    }
    onProductsChange([...selectedProducts, newItem])
  }

  const removeProduct = (productId: string) => {
    onProductsChange(selectedProducts.filter((sp) => sp.product.id !== productId))
  }

  const updateQty = (productId: string, qty: number) => {
    if (qty < 1) return
    onProductsChange(
      selectedProducts.map((sp) => {
        if (sp.product.id === productId) {
          const priceConverted = convertPrice(sp.product.price, currentCurrency)
          const multiplier = sp.billingCycle ? sp.product.billingCycles?.indexOf(sp.billingCycle) ?? 0 : 0
          const basePrice = priceConverted * (multiplier + 1)
          return {
            ...sp,
            quantity: qty,
            currency: currentCurrency,
            subtotal: basePrice * qty * (1 - sp.discount / 100),
          }
        }
        return sp
      })
    )
  }

  const updateDiscount = (productId: string, discount: number) => {
    const d = Math.min(100, Math.max(0, discount))
    onProductsChange(
      selectedProducts.map((sp) => {
        if (sp.product.id === productId) {
          const priceConverted = convertPrice(sp.product.price, currentCurrency)
          const multiplier = sp.billingCycle ? sp.product.billingCycles?.indexOf(sp.billingCycle) ?? 0 : 0
          const basePrice = priceConverted * (multiplier + 1)
          return {
            ...sp,
            discount: d,
            currency: currentCurrency,
            subtotal: basePrice * sp.quantity * (1 - d / 100),
          }
        }
        return sp
      })
    )
  }

  const updateBillingCycle = (productId: string, cycle: string) => {
    onProductsChange(
      selectedProducts.map((sp) => {
        if (sp.product.id === productId && sp.product.billingCycles) {
          const multiplier = sp.product.billingCycles.indexOf(cycle)
          const priceConverted = convertPrice(sp.product.price, currentCurrency)
          const basePrice = priceConverted * (multiplier + 1)
          return {
            ...sp,
            billingCycle: cycle,
            currency: currentCurrency,
            subtotal: basePrice * sp.quantity * (1 - sp.discount / 100),
          }
        }
        return sp
      })
    )
  }

  const totalAmount = useMemo(() => {
    return selectedProducts.reduce((sum, sp) => {
      const displayPrice = convertPrice(sp.product.price, currentCurrency)
      const multiplier = sp.billingCycle
        ? sp.product.billingCycles?.indexOf(sp.billingCycle) ?? 0
        : 0
      const basePrice = displayPrice * (multiplier + 1)
      const unitPrice = basePrice * (1 - sp.discount / 100)
      return sum + unitPrice * sp.quantity
    }, 0)
  }, [selectedProducts, currentCurrency])

  const sortedCategories = [
    ...CATEGORY_ORDER.filter((c) => grouped[c]),
    ...Object.keys(grouped).filter((c) => !CATEGORY_ORDER.includes(c)),
  ]

  const formatPrice = (price: number, currency: Currency) => {
    const symbol = currency === 'CNY' ? '¥' : 'Rp'
    return `${symbol}${Math.round(price).toLocaleString()}`
  }

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header with currency toggle */}
      <div className="flex items-center justify-between border-b border-[#e5e7eb] px-4 py-2">
        <h3 className="text-[13px] font-semibold text-[#111827]">方案匹配</h3>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onCurrencyChange('CNY')}
            className={`rounded-sm px-2 py-1 text-[12px] font-medium transition-colors ${
              currentCurrency === 'CNY'
                ? 'bg-[#2563eb] text-white'
                : 'bg-[#f3f4f6] text-[#6b7280] hover:bg-[#e5e7eb]'
            }`}
          >
            CNY
          </button>
          <button
            onClick={() => onCurrencyChange('IDR')}
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

      {/* Main content */}
      <div className="flex flex-1 gap-4 overflow-hidden p-4">
        {/* Left: product catalog */}
        <div className="flex-1 overflow-y-auto">
          {sortedCategories.map((category) => (
            <div key={category} className="mb-3">
              <div className="mb-1.5 border-b border-[#e5e7eb] pb-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#9ca3af]">
                  {category}
                </span>
              </div>
              <div className="space-y-1">
                {grouped[category].map((product) => {
                  const selected = isSelected(product.id)
                  const displayPrice = convertPrice(product.price, 'CNY', currentCurrency)
                  return (
                    <div
                      key={product.id}
                      className={`flex items-center gap-2 rounded-sm px-2 py-1.5 transition-colors ${
                        selected ? 'bg-[#eff6ff]' : 'hover:bg-[#f9fafb]'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-2">
                          <p className="text-[13px] font-medium text-[#111827]">{product.name}</p>
                          {product.difficulty && (
                            <span className="shrink-0 text-[11px] text-[#9ca3af]">
                              {getDifficultyLabel(product.difficulty)}
                            </span>
                          )}
                        </div>
                        {product.description && (
                          <p className="text-[11px] text-[#9ca3af]">{product.description}</p>
                        )}
                      </div>
                      <span className="shrink-0 font-mono text-[12px] text-[#374151] whitespace-nowrap">
                        {formatPrice(displayPrice, currentCurrency)}
                      </span>
                      <button
                        onClick={() =>
                          selected ? removeProduct(product.id) : addProduct(product)
                        }
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-sm transition-colors ${
                          selected
                            ? 'bg-[#fee2e2] text-[#dc2626] hover:bg-[#fecaca]'
                            : 'bg-[#f3f4f6] text-[#6b7280] hover:bg-[#e5e7eb] hover:text-[#111827]'
                        }`}
                        aria-label={selected ? '移除' : '添加'}
                      >
                        {selected ? <Minus size={12} /> : <Plus size={12} />}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Right: selected products table */}
        <div className="w-[520px] shrink-0 flex flex-col border-l border-[#e5e7eb] pl-4">
          <div className="mb-2 border-b border-[#e5e7eb] pb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#9ca3af]">
              已选产品 ({selectedProducts.length})
            </span>
          </div>

          {selectedProducts.length === 0 ? (
            <div className="flex flex-1 items-center justify-center text-[13px] text-[#9ca3af]">
              从左侧添加产品
            </div>
          ) : (
            <>
              {/* Table header */}
              <div className="mb-1 grid grid-cols-[30px_1fr_80px_60px_60px_60px_40px] gap-2 px-2 py-1 text-[11px] font-semibold text-[#6b7280]">
                <div>序号</div>
                <div>产品名</div>
                <div className="text-right">周期</div>
                <div className="text-right">数量</div>
                <div className="text-right">折扣%</div>
                <div className="text-right">单价</div>
                <div className="text-right">小计</div>
              </div>

              {/* Table rows */}
              <div className="flex-1 overflow-y-auto">
                {selectedProducts.map((sp, idx) => {
                  const displayPrice = convertPrice(sp.product.price, currentCurrency)
                  const multiplier = sp.billingCycle
                    ? sp.product.billingCycles?.indexOf(sp.billingCycle) ?? 0
                    : 0
                  const basePrice = displayPrice * (multiplier + 1)
                  const unitPrice = basePrice * (1 - sp.discount / 100)
                  const subtotal = unitPrice * sp.quantity

                  return (
                    <div
                      key={sp.product.id}
                      className="mb-1 grid grid-cols-[30px_1fr_80px_60px_60px_60px_40px] gap-2 rounded-sm border border-[#e5e7eb] bg-white px-2 py-1 text-[12px] items-center"
                    >
                      {/* Row number */}
                      <div className="text-[#9ca3af] text-center">{idx + 1}</div>

                      {/* Product name */}
                      <div className="min-w-0 truncate">
                        <p className="text-[#111827] font-medium truncate">{sp.product.name}</p>
                      </div>

                      {/* Billing cycle select */}
                      <div>
                        {sp.product.billingCycles && sp.product.billingCycles.length > 0 ? (
                          <select
                            value={sp.billingCycle || ''}
                            onChange={(e) => updateBillingCycle(sp.product.id, e.target.value)}
                            className="h-6 w-full rounded-sm border border-[#e5e7eb] bg-white px-1 text-[11px] text-[#111827] outline-none focus:border-[#2563eb]"
                          >
                            {sp.product.billingCycles.map((cycle) => (
                              <option key={cycle} value={cycle}>
                                {cycle}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-[#9ca3af]">—</span>
                        )}
                      </div>

                      {/* Quantity input */}
                      <div>
                        <input
                          type="number"
                          min={1}
                          value={sp.quantity}
                          onChange={(e) =>
                            updateQty(sp.product.id, parseInt(e.target.value, 10))
                          }
                          className="h-6 w-full rounded-sm border border-[#e5e7eb] px-1 font-mono text-[11px] text-[#111827] text-center outline-none focus:border-[#2563eb]"
                        />
                      </div>

                      {/* Discount input */}
                      <div className="flex items-center gap-0.5">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={sp.discount}
                          onChange={(e) =>
                            updateDiscount(sp.product.id, parseInt(e.target.value, 10))
                          }
                          className="h-6 flex-1 rounded-sm border border-[#e5e7eb] px-1 font-mono text-[11px] text-[#111827] text-center outline-none focus:border-[#2563eb]"
                        />
                        <span className="text-[#9ca3af] text-[10px]">%</span>
                      </div>

                      {/* Unit price */}
                      <div className="font-mono text-right text-[#111827]">
                        {formatPrice(unitPrice, currentCurrency)}
                      </div>

                      {/* Subtotal */}
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-semibold text-[#111827]">
                          {formatPrice(subtotal, currentCurrency)}
                        </span>
                        <button
                          onClick={() => removeProduct(sp.product.id)}
                          className="shrink-0 text-[#9ca3af] hover:text-[#dc2626]"
                          aria-label="移除"
                        >
                          <Minus size={12} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Total footer */}
              <div className="mt-2 border-t border-[#e5e7eb] pt-2">
                <div className="flex items-center justify-between px-2">
                  <span className="text-[12px] text-[#6b7280] font-medium">总额</span>
                  <span className="font-mono text-[14px] font-semibold text-[#111827]">
                    {formatPrice(totalAmount, currentCurrency)}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
