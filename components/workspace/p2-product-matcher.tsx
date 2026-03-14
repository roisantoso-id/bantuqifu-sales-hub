'use client'

import { Plus, Minus } from 'lucide-react'
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
  const stars = '★'.repeat(difficulty) + '☆'.repeat(5 - difficulty)
  return stars
}

function convertPrice(priceInCNY: number, toCurrency: Currency): number {
  return priceInCNY * EXCHANGE_RATES[toCurrency]
}

export function P2ProductMatcher({
  allProducts,
  selectedProducts,
  currentCurrency,
  onProductsChange,
  onCurrencyChange,
}: P2ProductMatcherProps) {
  const grouped = groupByCategory(allProducts)
  const sortedCategories = useMemo(
    () => [
      ...CATEGORY_ORDER.filter((c) => grouped[c]),
      ...Object.keys(grouped).filter((c) => !CATEGORY_ORDER.includes(c)),
    ],
    [grouped]
  )

  const [activeTab, setActiveTab] = useState<string>(sortedCategories[0] || '')

  const isSelected = (productId: string) =>
    selectedProducts.some((sp) => sp.product.id === productId)

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
          const multiplier = sp.billingCycle
            ? (sp.product.billingCycles?.indexOf(sp.billingCycle) ?? 0)
            : 0
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
          const multiplier = sp.billingCycle
            ? (sp.product.billingCycles?.indexOf(sp.billingCycle) ?? 0)
            : 0
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
        ? (sp.product.billingCycles?.indexOf(sp.billingCycle) ?? 0)
        : 0
      const basePrice = displayPrice * (multiplier + 1)
      const unitPrice = basePrice * (1 - sp.discount / 100)
      return sum + unitPrice * sp.quantity
    }, 0)
  }, [selectedProducts, currentCurrency])

  const formatPrice = (price: number, currency: Currency) => {
    const symbol = currency === 'CNY' ? '¥' : 'Rp'
    return `${symbol}${Math.round(price).toLocaleString()}`
  }

  const currentProducts = grouped[activeTab] || []

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header: Title + Currency Toggle */}
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

      {/* Category Tabs */}
      <div className="flex items-center border-b border-[#e5e7eb] bg-[#f9fafb] px-4">
        {sortedCategories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveTab(cat)}
            className={`relative px-3 py-2 text-[12px] font-medium transition-colors ${
              activeTab === cat
                ? 'text-[#2563eb]'
                : 'text-[#6b7280] hover:text-[#374151]'
            }`}
          >
            {cat}
            {activeTab === cat && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#2563eb]" />
            )}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Product List for active tab */}
        <div className="flex-1 overflow-y-auto border-r border-[#e5e7eb] p-4">
          <div className="space-y-1">
            {currentProducts.map((product) => {
              const selected = isSelected(product.id)
              const displayPrice = convertPrice(product.price, currentCurrency)
              return (
                <div
                  key={product.id}
                  className={`flex items-center gap-3 rounded-sm border px-3 py-2 transition-colors ${
                    selected
                      ? 'border-[#2563eb] bg-[#eff6ff]'
                      : 'border-[#e5e7eb] hover:border-[#d1d5db] hover:bg-[#f9fafb]'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-[13px] font-medium text-[#111827]">{product.name}</p>
                      {product.difficulty && (
                        <span className="text-[10px] text-[#f59e0b]">
                          {getDifficultyLabel(product.difficulty)}
                        </span>
                      )}
                    </div>
                    {product.description && (
                      <p className="mt-0.5 text-[11px] text-[#9ca3af]">{product.description}</p>
                    )}
                    {product.billingCycles && product.billingCycles.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {product.billingCycles.map((cycle) => (
                          <span
                            key={cycle}
                            className="rounded-sm bg-[#f3f4f6] px-1.5 py-0.5 text-[10px] text-[#6b7280]"
                          >
                            {cycle}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="shrink-0 font-mono text-[12px] font-semibold text-[#374151]">
                    {formatPrice(displayPrice, currentCurrency)}
                  </span>
                  <button
                    onClick={() => (selected ? removeProduct(product.id) : addProduct(product))}
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-sm transition-colors ${
                      selected
                        ? 'bg-[#fee2e2] text-[#dc2626] hover:bg-[#fecaca]'
                        : 'bg-[#2563eb] text-white hover:bg-[#1d4ed8]'
                    }`}
                    aria-label={selected ? '移除' : '添加'}
                  >
                    {selected ? <Minus size={14} /> : <Plus size={14} />}
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right: Selected Products Table */}
        <div className="flex w-[480px] shrink-0 flex-col p-4">
          <div className="mb-2 flex items-center justify-between border-b border-[#e5e7eb] pb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#9ca3af]">
              已选产品
            </span>
            <span className="text-[12px] font-medium text-[#374151]">
              {selectedProducts.length} 项
            </span>
          </div>

          {selectedProducts.length === 0 ? (
            <div className="flex flex-1 items-center justify-center text-[13px] text-[#9ca3af]">
              从左侧添加产品
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div className="mb-1 grid grid-cols-[1fr_70px_50px_50px_80px_24px] gap-2 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af]">
                <div>产品</div>
                <div>周期</div>
                <div className="text-center">数量</div>
                <div className="text-center">折扣</div>
                <div className="text-right">小计</div>
                <div></div>
              </div>

              {/* Table Rows */}
              <div className="flex-1 space-y-1 overflow-y-auto">
                {selectedProducts.map((sp) => {
                  const displayPrice = convertPrice(sp.product.price, currentCurrency)
                  const multiplier = sp.billingCycle
                    ? (sp.product.billingCycles?.indexOf(sp.billingCycle) ?? 0)
                    : 0
                  const basePrice = displayPrice * (multiplier + 1)
                  const unitPrice = basePrice * (1 - sp.discount / 100)
                  const subtotal = unitPrice * sp.quantity

                  return (
                    <div
                      key={sp.product.id}
                      className="grid grid-cols-[1fr_70px_50px_50px_80px_24px] items-center gap-2 rounded-sm border border-[#e5e7eb] bg-white px-2 py-1.5 text-[12px]"
                    >
                      {/* Product name */}
                      <div className="min-w-0 truncate text-[#111827] font-medium">
                        {sp.product.name}
                      </div>

                      {/* Billing cycle */}
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

                      {/* Quantity */}
                      <input
                        type="number"
                        min={1}
                        value={sp.quantity}
                        onChange={(e) => updateQty(sp.product.id, parseInt(e.target.value, 10))}
                        className="h-6 w-full rounded-sm border border-[#e5e7eb] px-1 text-center font-mono text-[11px] text-[#111827] outline-none focus:border-[#2563eb]"
                      />

                      {/* Discount */}
                      <div className="flex items-center">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={sp.discount}
                          onChange={(e) =>
                            updateDiscount(sp.product.id, parseInt(e.target.value, 10))
                          }
                          className="h-6 w-full rounded-sm border border-[#e5e7eb] px-1 text-center font-mono text-[11px] text-[#111827] outline-none focus:border-[#2563eb]"
                        />
                        <span className="ml-0.5 text-[10px] text-[#9ca3af]">%</span>
                      </div>

                      {/* Subtotal */}
                      <div className="text-right font-mono font-semibold text-[#111827]">
                        {formatPrice(subtotal, currentCurrency)}
                      </div>

                      {/* Remove */}
                      <button
                        onClick={() => removeProduct(sp.product.id)}
                        className="flex h-6 w-6 items-center justify-center rounded-sm text-[#9ca3af] hover:bg-[#fee2e2] hover:text-[#dc2626]"
                        aria-label="移除"
                      >
                        <Minus size={12} />
                      </button>
                    </div>
                  )
                })}
              </div>

              {/* Total */}
              <div className="mt-3 flex items-center justify-between border-t border-[#e5e7eb] pt-3">
                <span className="text-[13px] font-medium text-[#6b7280]">合计</span>
                <span className="font-mono text-[16px] font-semibold text-[#111827]">
                  {formatPrice(totalAmount, currentCurrency)}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
