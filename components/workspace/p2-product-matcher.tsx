'use client'

import { Plus, Minus, Search } from 'lucide-react'
import { useState, useMemo } from 'react'
import type { OpportunityP2Data } from '@/lib/types'

interface ProductLike {
  id: string
  name: string
  category: string
  price: number
  currency: string
  description?: string | null
  difficulty?: number
}

interface P2ProductMatcherProps {
  allProducts: ProductLike[]
  selectedData: OpportunityP2Data[]
  onDataChange: (data: OpportunityP2Data[]) => void
}

const CATEGORY_ORDER = ['签证服务', '移民服务', '留学服务', '工作签证', '增值服务']

function groupByCategory(products: ProductLike[]): Record<string, ProductLike[]> {
  const groups: Record<string, ProductLike[]> = {}
  for (const p of products) {
    if (!groups[p.category]) groups[p.category] = []
    groups[p.category].push(p)
  }
  return groups
}

function getDifficultyStars(difficulty?: number): string {
  if (!difficulty) return ''
  return '★'.repeat(difficulty) + '☆'.repeat(5 - difficulty)
}

export function P2ProductMatcher({
  allProducts,
  selectedData,
  onDataChange,
}: P2ProductMatcherProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<string>('')

  const grouped = groupByCategory(allProducts)
  const sortedCategories = useMemo(
    () => [
      ...CATEGORY_ORDER.filter((c) => grouped[c]),
      ...Object.keys(grouped).filter((c) => !CATEGORY_ORDER.includes(c)),
    ],
    [grouped]
  )

  // 初始化 activeTab
  if (!activeTab && sortedCategories.length > 0) {
    setActiveTab(sortedCategories[0])
  }

  const isSelected = (productId: string) => selectedData.some((sd) => sd.productId === productId)

  const filteredProducts = useMemo(() => {
    const inCategory = grouped[activeTab] || []
    if (!searchQuery.trim()) return inCategory
    const q = searchQuery.toLowerCase()
    return inCategory.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
    )
  }, [grouped, activeTab, searchQuery])

  const addProduct = (product: ProductLike) => {
    if (isSelected(product.id)) return
    const newData: OpportunityP2Data = {
      productId: product.id,
    }
    onDataChange([...selectedData, newData])
  }

  const removeProduct = (productId: string) => {
    onDataChange(selectedData.filter((sd) => sd.productId !== productId))
  }

  const updateCycle = (productId: string, cycle: string) => {
    onDataChange(
      selectedData.map((sd) => (sd.productId === productId ? { ...sd, cycle } : sd))
    )
  }

  const selectedProductsMap = useMemo(() => {
    return new Map(
      selectedData.map((sd) => [
        sd.productId,
        allProducts.find((p) => p.id === sd.productId),
      ])
    )
  }, [selectedData, allProducts])

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header */}
      <div className="border-b border-[#e5e7eb] px-4 py-2.5">
        <h3 className="text-[13px] font-semibold text-[#111827]">P2: 确定服务方案</h3>
      </div>

      {/* Category Tabs */}
      <div className="flex border-b border-[#e5e7eb] bg-[#f9fafb] overflow-x-auto">
        {sortedCategories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveTab(cat)}
            className={`relative px-3 py-1.5 text-[12px] font-medium transition-colors whitespace-nowrap ${
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
        {/* Left: Product Catalog */}
        <div className="w-1/2 flex flex-col min-w-0 border-r border-[#e5e7eb]">
          {/* Search */}
          <div className="border-b border-[#e5e7eb] p-2">
            <div className="flex items-center gap-1 rounded-sm border border-[#e5e7eb] bg-white px-2 py-1">
              <Search size={12} className="text-[#9ca3af]" />
              <input
                type="text"
                placeholder="搜索产品..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-[12px] text-[#111827] outline-none placeholder:text-[#9ca3af]"
              />
            </div>
          </div>

          {/* Product List */}
          <div className="flex-1 overflow-y-auto p-2">
            <div className="space-y-1">
              {filteredProducts.map((product) => {
                const selected = isSelected(product.id)
                return (
                  <div
                    key={product.id}
                    className={`flex items-start gap-2 rounded-sm border px-2 py-1.5 transition-colors ${
                      selected
                        ? 'border-[#2563eb] bg-[#eff6ff]'
                        : 'border-[#e5e7eb] hover:border-[#d1d5db]'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="text-[13px] font-medium text-[#111827] truncate">
                          {product.name}
                        </p>
                        {product.difficulty && (
                          <span className="shrink-0 text-[10px] text-[#f59e0b]">
                            {getDifficultyStars(product.difficulty)}
                          </span>
                        )}
                      </div>
                      {product.description && (
                        <p className="mt-0.5 text-[11px] text-[#9ca3af] line-clamp-1">
                          {product.description}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => (selected ? removeProduct(product.id) : addProduct(product))}
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-sm transition-colors ${
                        selected
                          ? 'bg-[#fee2e2] text-[#dc2626] hover:bg-[#fecaca]'
                          : 'bg-[#2563eb] text-white hover:bg-[#1d4ed8]'
                      }`}
                      aria-label={selected ? '移除' : '添加'}
                    >
                      {selected ? <Minus size={13} /> : <Plus size={13} />}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Right: Selected Services */}
        <div className="w-1/2 shrink-0 flex flex-col p-2">
          <div className="mb-2 pb-1 border-b border-[#e5e7eb]">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#9ca3af]">
              已选服务清单
            </span>
          </div>

          {selectedData.length === 0 ? (
            <div className="flex flex-1 items-center justify-center text-[13px] text-[#9ca3af]">
              从左侧添加服务
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              {/* Table header */}
              <div className="grid grid-cols-[1fr_60px_24px] items-center gap-x-2 border-b border-[#e5e7eb] px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af]">
                <span>服务名称</span>
                <span>难度</span>
                <span />
              </div>

              {/* Table rows */}
              {selectedData.map((sd, idx) => {
                const product = selectedProductsMap.get(sd.productId)
                if (!product) return null

                return (
                  <div
                    key={sd.productId}
                    className={`grid grid-cols-[1fr_60px_24px] items-center gap-x-2 px-2 py-1.5 text-[12px] ${
                      idx % 2 === 0 ? 'bg-white' : 'bg-[#f9fafb]'
                    } hover:bg-[#eff6ff]`}
                  >
                    {/* Name */}
                    <span className="truncate font-medium text-[#111827]" title={product.name}>
                      {product.name}
                    </span>

                    {/* Difficulty */}
                    <span className="text-[10px] text-[#f59e0b] tracking-tighter">
                      {getDifficultyStars(product.difficulty) || '—'}
                    </span>

                    {/* Remove */}
                    <button
                      onClick={() => removeProduct(sd.productId)}
                      className="flex h-5 w-5 items-center justify-center rounded-sm text-[#9ca3af] hover:bg-[#fee2e2] hover:text-[#dc2626]"
                      aria-label="移除"
                    >
                      <Minus size={11} />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
