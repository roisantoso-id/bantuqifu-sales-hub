'use client'

import { Plus, Minus } from 'lucide-react'
import type { Product, SelectedProduct } from '@/lib/types'

interface P2ProductMatcherProps {
  allProducts: Product[]
  selectedProducts: SelectedProduct[]
  onProductsChange: (products: SelectedProduct[]) => void
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

export function P2ProductMatcher({ allProducts, selectedProducts, onProductsChange }: P2ProductMatcherProps) {
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
      subtotal: product.price,
    }
    onProductsChange([...selectedProducts, newItem])
  }

  const removeProduct = (productId: string) => {
    onProductsChange(selectedProducts.filter((sp) => sp.product.id !== productId))
  }

  const updateQty = (productId: string, qty: number) => {
    if (qty < 1) return
    onProductsChange(
      selectedProducts.map((sp) =>
        sp.product.id === productId
          ? { ...sp, quantity: qty, subtotal: sp.product.price * qty * (1 - sp.discount / 100) }
          : sp
      )
    )
  }

  const updateDiscount = (productId: string, discount: number) => {
    const d = Math.min(100, Math.max(0, discount))
    onProductsChange(
      selectedProducts.map((sp) =>
        sp.product.id === productId
          ? { ...sp, discount: d, subtotal: sp.product.price * sp.quantity * (1 - d / 100) }
          : sp
      )
    )
  }

  const totalAmount = selectedProducts.reduce((sum, sp) => sum + sp.subtotal, 0)

  const sortedCategories = [
    ...CATEGORY_ORDER.filter((c) => grouped[c]),
    ...Object.keys(grouped).filter((c) => !CATEGORY_ORDER.includes(c)),
  ]

  return (
    <div className="flex gap-4 h-full">
      {/* Left: product catalog */}
      <div className="flex-1 overflow-y-auto min-w-0">
        {sortedCategories.map((category) => (
          <div key={category} className="mb-4">
            <div className="mb-1 border-b border-[#e5e7eb] pb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#9ca3af]">
                {category}
              </span>
            </div>
            <div className="space-y-0">
              {grouped[category].map((product) => {
                const selected = isSelected(product.id)
                return (
                  <div
                    key={product.id}
                    className={[
                      'flex items-center gap-3 rounded-sm px-2 py-2 transition-colors',
                      selected ? 'bg-[#eff6ff]' : 'hover:bg-[#f9fafb]',
                    ].join(' ')}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-[#111827] truncate">{product.name}</p>
                      {product.description && (
                        <p className="text-[11px] text-[#9ca3af] truncate">{product.description}</p>
                      )}
                    </div>
                    <span className="font-mono text-[12px] text-[#374151] whitespace-nowrap">
                      ¥{product.price.toLocaleString()}
                    </span>
                    <button
                      onClick={() => selected ? removeProduct(product.id) : addProduct(product)}
                      className={[
                        'flex h-6 w-6 shrink-0 items-center justify-center rounded-sm transition-colors',
                        selected
                          ? 'bg-[#fee2e2] text-[#dc2626] hover:bg-[#fecaca]'
                          : 'bg-[#f3f4f6] text-[#6b7280] hover:bg-[#e5e7eb] hover:text-[#111827]',
                      ].join(' ')}
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

      {/* Right: selected products */}
      <div className="w-[260px] shrink-0 flex flex-col border-l border-[#e5e7eb] pl-4">
        <div className="mb-2 border-b border-[#e5e7eb] pb-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#9ca3af]">
            已选产品 ({selectedProducts.length})
          </span>
        </div>

        {selectedProducts.length === 0 ? (
          <p className="mt-4 text-center text-[12px] text-[#9ca3af]">从左侧添加产品</p>
        ) : (
          <ul className="flex-1 space-y-2 overflow-y-auto">
            {selectedProducts.map((sp) => (
              <li key={sp.product.id} className="rounded-sm border border-[#e5e7eb] bg-white p-2">
                <div className="mb-1.5 flex items-start justify-between gap-1">
                  <span className="text-[12px] font-medium text-[#111827] leading-tight">
                    {sp.product.name}
                  </span>
                  <button
                    onClick={() => removeProduct(sp.product.id)}
                    className="shrink-0 text-[#9ca3af] hover:text-[#dc2626]"
                    aria-label="移除"
                  >
                    <Minus size={11} />
                  </button>
                </div>

                {/* Qty + discount row */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateQty(sp.product.id, sp.quantity - 1)}
                      className="flex h-5 w-5 items-center justify-center rounded-sm border border-[#e5e7eb] text-[#6b7280] hover:bg-[#f3f4f6]"
                    >
                      <Minus size={10} />
                    </button>
                    <span className="w-5 text-center font-mono text-[12px] text-[#111827]">
                      {sp.quantity}
                    </span>
                    <button
                      onClick={() => updateQty(sp.product.id, sp.quantity + 1)}
                      className="flex h-5 w-5 items-center justify-center rounded-sm border border-[#e5e7eb] text-[#6b7280] hover:bg-[#f3f4f6]"
                    >
                      <Plus size={10} />
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="text-[11px] text-[#9ca3af]">折扣</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={sp.discount}
                      onChange={(e) => updateDiscount(sp.product.id, Number(e.target.value))}
                      className="h-5 w-10 rounded-sm border border-[#e5e7eb] px-1 font-mono text-[11px] text-[#111827] outline-none focus:border-[#2563eb]"
                    />
                    <span className="text-[11px] text-[#9ca3af]">%</span>
                  </div>
                </div>

                {/* Subtotal */}
                <div className="mt-1.5 flex justify-end">
                  <span className="font-mono text-[12px] font-semibold text-[#111827]">
                    ¥{sp.subtotal.toLocaleString()}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* Total */}
        {selectedProducts.length > 0 && (
          <div className="mt-3 border-t border-[#e5e7eb] pt-2">
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-[#6b7280]">合计</span>
              <span className="font-mono text-[14px] font-semibold text-[#111827]">
                ¥{totalAmount.toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
