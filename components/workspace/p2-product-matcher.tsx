'use client'

import { Plus, Minus, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

export interface DraftOpportunityItem {
  tempId: string
  productId: string
  productName: string
  targetName: string
  basePrice: number
  currency: 'CNY' | 'IDR'
}

interface ProductLike {
  id: string
  name: string
  price: number
  currency: 'CNY' | 'IDR' | string
  description?: string | null
  difficulty?: number
  categoryId?: string | null
  categoryNameZh?: string | null
  category?: {
    nameZh?: string | null
  } | null
}

interface P2ProductMatcherProps {
  allProducts: ProductLike[]
  productCategories?: Array<{ id: string; nameZh: string }>
  selectedData: DraftOpportunityItem[]
  onDataChange: (data: DraftOpportunityItem[]) => void
}

function getCategoryName(product: ProductLike) {
  return product.categoryNameZh || product.category?.nameZh || product.categoryId || '未分类'
}

function groupByCategory(products: ProductLike[]): Record<string, ProductLike[]> {
  const groups: Record<string, ProductLike[]> = {}

  for (const product of products) {
    const categoryName = getCategoryName(product)
    if (!groups[categoryName]) groups[categoryName] = []
    groups[categoryName].push(product)
  }

  return groups
}

function createTempId() {
  return `draft-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function getDifficultyStars(difficulty?: number): string {
  if (!difficulty) return ''
  return '★'.repeat(difficulty) + '☆'.repeat(Math.max(0, 5 - difficulty))
}

export function P2ProductMatcher({
  allProducts,
  productCategories,
  selectedData,
  onDataChange,
}: P2ProductMatcherProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const grouped = useMemo(() => groupByCategory(allProducts), [allProducts])

  const categories = useMemo(
    () => (productCategories && productCategories.length > 0
      ? productCategories.map((category) => category.nameZh)
      : Object.keys(grouped)),
    [grouped, productCategories]
  )

  const [activeTab, setActiveTab] = useState<string>('')

  useEffect(() => {
    setSearchQuery('')
    setActiveTab('')
  }, [selectedData])

  const currentTab = activeTab || categories[0] || ''

  const filteredProducts = useMemo(() => {
    const inCategory = grouped[currentTab] || []
    if (!searchQuery.trim()) return inCategory

    const q = searchQuery.toLowerCase()
    return inCategory.filter(
      (product) =>
        product.name.toLowerCase().includes(q) ||
        getCategoryName(product).toLowerCase().includes(q) ||
        product.description?.toLowerCase().includes(q)
    )
  }, [grouped, currentTab, searchQuery])

  const addProductInstance = (product: ProductLike) => {
    const newItem: DraftOpportunityItem = {
      tempId: createTempId(),
      productId: product.id,
      productName: product.name,
      targetName: '',
      basePrice: product.price,
      currency: product.currency === 'CNY' ? 'CNY' : 'IDR',
    }

    onDataChange([...selectedData, newItem])
  }

  const removeProductInstance = (tempId: string) => {
    onDataChange(selectedData.filter((item) => item.tempId !== tempId))
  }

  const updateTargetName = (tempId: string, targetName: string) => {
    onDataChange(
      selectedData.map((item) =>
        item.tempId === tempId ? { ...item, targetName } : item
      )
    )
  }

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="border-b border-[#e5e7eb] px-4 py-2.5">
        <h3 className="text-[13px] font-semibold text-[#111827]">P2: 确定服务方案</h3>
      </div>

      <div className="flex overflow-x-auto border-b border-[#e5e7eb] bg-[#f9fafb]">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setActiveTab(category)}
            className={`relative whitespace-nowrap px-3 py-1.5 text-[12px] font-medium transition-colors ${
              currentTab === category
                ? 'text-[#2563eb]'
                : 'text-[#6b7280] hover:text-[#374151]'
            }`}
          >
            {category}
            {currentTab === category && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#2563eb]" />
            )}
          </button>
        ))}
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex min-w-0 w-1/2 flex-col border-r border-[#e5e7eb]">
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

          <div className="flex-1 overflow-y-auto p-2">
            <div className="space-y-1">
              {filteredProducts.map((product) => {
                const categoryName = getCategoryName(product)

                return (
                  <div
                    key={product.id}
                    className="flex items-start gap-2 rounded-sm border border-[#e5e7eb] px-2 py-1.5 transition-colors hover:border-[#d1d5db]"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate text-[13px] font-medium text-[#111827]">
                          {product.name}
                        </p>
                        {product.difficulty ? (
                          <span className="shrink-0 text-[10px] text-[#f59e0b]">
                            {getDifficultyStars(product.difficulty)}
                          </span>
                        ) : null}
                      </div>

                      <p className="mt-0.5 text-[11px] text-[#6b7280]">{categoryName}</p>

                      {product.description ? (
                        <p className="mt-0.5 line-clamp-1 text-[11px] text-[#9ca3af]">
                          {product.description}
                        </p>
                      ) : null}

                      <p className="mt-1 font-mono text-[11px] text-[#374151]">
                        {product.currency === 'CNY' ? '¥' : 'Rp'}
                        {Math.round(product.price).toLocaleString()}
                      </p>
                    </div>

                    <button
                      onClick={() => addProductInstance(product)}
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm bg-[#2563eb] text-white transition-colors hover:bg-[#1d4ed8]"
                      aria-label="添加"
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                )
              })}

              {filteredProducts.length === 0 && (
                <div className="flex items-center justify-center rounded-sm border border-dashed border-[#e5e7eb] py-8 text-[12px] text-[#9ca3af]">
                  当前分类下暂无匹配产品
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex w-1/2 shrink-0 flex-col p-2">
          <div className="mb-2 border-b border-[#e5e7eb] pb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#9ca3af]">
              已选服务实例
            </span>
          </div>

          {selectedData.length === 0 ? (
            <div className="flex flex-1 items-center justify-center text-[13px] text-[#9ca3af]">
              从左侧添加服务实例
            </div>
          ) : (
            <div className="flex-1 space-y-2 overflow-y-auto">
              {selectedData.map((item, index) => (
                <div
                  key={item.tempId}
                  className="rounded-sm border border-[#e5e7eb] bg-white p-3 transition-colors hover:border-[#d1d5db]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-[13px] font-medium text-[#111827]">
                          {item.productName}
                        </p>
                        <span className="rounded-sm bg-[#f3f4f6] px-1.5 py-0.5 text-[10px] text-[#6b7280]">
                          实例 {index + 1}
                        </span>
                      </div>

                      <p className="mt-1 font-mono text-[11px] text-[#6b7280]">
                        {item.currency === 'CNY' ? '¥' : 'Rp'}
                        {Math.round(item.basePrice).toLocaleString()}
                      </p>
                    </div>

                    <button
                      onClick={() => removeProductInstance(item.tempId)}
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm bg-[#fee2e2] text-[#dc2626] transition-colors hover:bg-[#fecaca]"
                      aria-label="移除"
                    >
                      <Minus size={13} />
                    </button>
                  </div>

                  <div className="mt-3">
                    <label className="mb-1 block text-[11px] font-medium text-[#6b7280]">
                      办理人 / 标的
                    </label>
                    <input
                      type="text"
                      value={item.targetName}
                      onChange={(e) => updateTargetName(item.tempId, e.target.value)}
                      placeholder="请输入办理人姓名，如: 张三"
                      className="h-8 w-full rounded-sm border border-[#e5e7eb] bg-white px-2 text-[12px] text-[#111827] outline-none placeholder:text-[#9ca3af] focus:border-[#2563eb]"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
