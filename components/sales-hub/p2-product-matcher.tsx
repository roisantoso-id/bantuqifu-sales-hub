'use client'

import { useState, useMemo } from 'react'
import { Search, Plus, Minus, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Product, SelectedProduct } from '@/lib/types'

interface P2ProductMatcherProps {
  products: Product[]
  selectedProducts: SelectedProduct[]
  onProductsChange: (products: SelectedProduct[]) => void
}

export function P2ProductMatcher({
  products,
  selectedProducts,
  onProductsChange,
}: P2ProductMatcherProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const categories = useMemo(() => {
    return Array.from(new Set(products.map((p) => p.category)))
  }, [products])

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = !selectedCategory || p.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [products, searchQuery, selectedCategory])

  const addProduct = (product: Product) => {
    const existing = selectedProducts.find((sp) => sp.product.id === product.id)
    if (existing) {
      onProductsChange(
        selectedProducts.map((sp) =>
          sp.product.id === product.id
            ? { ...sp, quantity: sp.quantity + 1, subtotal: (sp.quantity + 1) * sp.product.price * (1 - sp.discount / 100) }
            : sp
        )
      )
    } else {
      onProductsChange([
        ...selectedProducts,
        { product, quantity: 1, discount: 0, subtotal: product.price },
      ])
    }
  }

  const updateQuantity = (productId: string, delta: number) => {
    onProductsChange(
      selectedProducts
        .map((sp) => {
          if (sp.product.id !== productId) return sp
          const newQty = Math.max(0, sp.quantity + delta)
          if (newQty === 0) return null
          return {
            ...sp,
            quantity: newQty,
            subtotal: newQty * sp.product.price * (1 - sp.discount / 100),
          }
        })
        .filter(Boolean) as SelectedProduct[]
    )
  }

  const updateDiscount = (productId: string, discount: number) => {
    onProductsChange(
      selectedProducts.map((sp) =>
        sp.product.id === productId
          ? { ...sp, discount, subtotal: sp.quantity * sp.product.price * (1 - discount / 100) }
          : sp
      )
    )
  }

  const removeProduct = (productId: string) => {
    onProductsChange(selectedProducts.filter((sp) => sp.product.id !== productId))
  }

  const totalAmount = selectedProducts.reduce((sum, sp) => sum + sp.subtotal, 0)

  return (
    <div className="flex h-full gap-4">
      {/* Left: Product Selector */}
      <div className="flex w-1/2 flex-col border-r border-[#e5e7eb] pr-4">
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#6b7280]">
          产品目录
        </div>
        
        {/* Search */}
        <div className="relative mb-2">
          <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-[#6b7280]" />
          <input
            type="text"
            placeholder="搜索产品..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-7 w-full rounded-sm border border-[#e5e7eb] bg-white pl-7 pr-2 text-[12px] placeholder:text-[#9ca3af] focus:border-[#2563eb] focus:outline-none"
          />
        </div>
        
        {/* Category Filter */}
        <div className="mb-2 flex flex-wrap gap-1">
          <button
            onClick={() => setSelectedCategory(null)}
            className={cn(
              'h-5 rounded-sm px-1.5 text-[10px] font-medium transition-colors',
              !selectedCategory
                ? 'bg-[#2563eb] text-white'
                : 'bg-[#f3f4f6] text-[#6b7280] hover:bg-[#e5e7eb]'
            )}
          >
            全部
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                'h-5 rounded-sm px-1.5 text-[10px] font-medium transition-colors',
                selectedCategory === cat
                  ? 'bg-[#2563eb] text-white'
                  : 'bg-[#f3f4f6] text-[#6b7280] hover:bg-[#e5e7eb]'
              )}
            >
              {cat}
            </button>
          ))}
        </div>
        
        {/* Product List */}
        <div className="flex-1 overflow-y-auto">
          {filteredProducts.map((product) => (
            <button
              key={product.id}
              onClick={() => addProduct(product)}
              className="flex w-full items-center justify-between border-b border-[#e5e7eb] px-1 py-1.5 text-left transition-colors hover:bg-[#f9fafb]"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate text-[12px] font-medium text-[#111827]">
                  {product.name}
                </div>
                <div className="text-[10px] text-[#6b7280]">{product.category}</div>
              </div>
              <div className="ml-2 flex items-center gap-2">
                <span className="font-mono text-[12px] font-medium text-[#111827]">
                  ¥{product.price.toLocaleString()}
                </span>
                <Plus className="h-3.5 w-3.5 text-[#2563eb]" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Right: Selected Products */}
      <div className="flex w-1/2 flex-col">
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#6b7280]">
          已选方案
        </div>
        
        {selectedProducts.length === 0 ? (
          <div className="flex flex-1 items-center justify-center text-[12px] text-[#9ca3af]">
            点击左侧产品添加至方案
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto">
              {selectedProducts.map((sp) => (
                <div
                  key={sp.product.id}
                  className="mb-2 rounded-sm border border-[#e5e7eb] bg-white p-2"
                >
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="text-[12px] font-medium text-[#111827]">
                        {sp.product.name}
                      </div>
                      <div className="mt-0.5 font-mono text-[11px] text-[#6b7280]">
                        单价: ¥{sp.product.price.toLocaleString()}
                      </div>
                    </div>
                    <button
                      onClick={() => removeProduct(sp.product.id)}
                      className="ml-2 text-[#9ca3af] hover:text-[#ef4444]"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  
                  <div className="mt-2 flex items-center gap-3">
                    {/* Quantity */}
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-[#6b7280]">数量</span>
                      <div className="flex items-center rounded-sm border border-[#e5e7eb]">
                        <button
                          onClick={() => updateQuantity(sp.product.id, -1)}
                          className="flex h-5 w-5 items-center justify-center text-[#6b7280] hover:bg-[#f3f4f6]"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-6 text-center font-mono text-[11px]">
                          {sp.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(sp.product.id, 1)}
                          className="flex h-5 w-5 items-center justify-center text-[#6b7280] hover:bg-[#f3f4f6]"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Discount */}
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-[#6b7280]">折扣</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={sp.discount}
                        onChange={(e) =>
                          updateDiscount(sp.product.id, Number(e.target.value))
                        }
                        className="h-5 w-10 rounded-sm border border-[#e5e7eb] px-1 text-center font-mono text-[11px] focus:border-[#2563eb] focus:outline-none"
                      />
                      <span className="text-[10px] text-[#6b7280]">%</span>
                    </div>
                    
                    {/* Subtotal */}
                    <div className="ml-auto font-mono text-[12px] font-medium text-[#111827]">
                      ¥{sp.subtotal.toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Total */}
            <div className="mt-2 flex items-center justify-between border-t border-[#e5e7eb] pt-2">
              <span className="text-[12px] font-semibold text-[#6b7280]">方案总计</span>
              <span className="font-mono text-[14px] font-bold text-[#2563eb]">
                ¥{totalAmount.toLocaleString()}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
