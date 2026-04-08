'use client'

import { Check, Minus, Plus, Search } from 'lucide-react'
import { useMemo, useState } from 'react'

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

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

function formatCurrency(currency: 'CNY' | 'IDR', amount: number) {
  return `${currency === 'CNY' ? '¥' : 'Rp'}${Math.round(amount).toLocaleString()}`
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

  const selectedCounts = useMemo(() => {
    return selectedData.reduce<Record<string, number>>((acc, item) => {
      acc[item.productId] = (acc[item.productId] || 0) + 1
      return acc
    }, {})
  }, [selectedData])

  const totalByCurrency = useMemo(() => {
    return selectedData.reduce<Partial<Record<'CNY' | 'IDR', number>>>((acc, item) => {
      acc[item.currency] = (acc[item.currency] || 0) + item.basePrice
      return acc
    }, {})
  }, [selectedData])

  const totalSummary = useMemo(() => {
    const entries = Object.entries(totalByCurrency) as Array<['CNY' | 'IDR', number]>
    if (entries.length === 0) return '暂无估算'
    return entries
      .sort(([currencyA], [currencyB]) => currencyA.localeCompare(currencyB))
      .map(([currency, amount]) => formatCurrency(currency, amount))
      .join(' / ')
  }, [totalByCurrency])

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

      <div className="flex flex-1 gap-4 overflow-hidden px-3 py-3">
        <div className="flex min-w-0 w-1/2 flex-col rounded-lg border border-[#e5e7eb] bg-white">
          <div className="border-b border-[#e5e7eb] p-3">
            <div className="flex items-center gap-1 rounded-md border border-[#e5e7eb] bg-white px-2.5 py-1.5">
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

          <div className="flex-1 overflow-y-auto p-3">
            <div className="space-y-2">
              {filteredProducts.map((product) => {
                const selectedCount = selectedCounts[product.id] || 0

                return (
                  <div
                    key={product.id}
                    className={`rounded-lg border px-3 py-2.5 transition-colors ${
                      selectedCount > 0
                        ? 'border-[#bfdbfe] bg-[#f8fbff]'
                        : 'border-[#e5e7eb] bg-white hover:border-[#d1d5db]'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <p className="truncate text-[13px] font-medium text-[#111827]">
                            {product.name}
                          </p>
                          <p className="shrink-0 text-right font-mono text-[12px] font-semibold text-[#374151]">
                            {formatCurrency(product.currency === 'CNY' ? 'CNY' : 'IDR', product.price)}
                          </p>
                        </div>

                        <div className="mt-1 flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 text-[11px] text-[#6b7280]">
                              {product.difficulty ? (
                                <span className="shrink-0 text-[#f59e0b]">
                                  难度 {getDifficultyStars(product.difficulty)}
                                </span>
                              ) : (
                                <span className="text-[#9ca3af]">标准服务</span>
                              )}
                              {selectedCount > 0 ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-[#e0f2fe] px-2 py-0.5 text-[#0369a1]">
                                  <Check size={11} />
                                  已添加 {selectedCount} 个
                                </span>
                              ) : null}
                            </div>

                            {product.description ? (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <p className="mt-1 line-clamp-2 cursor-help text-[11px] leading-5 text-[#9ca3af]">
                                    {product.description}
                                  </p>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="max-w-xs px-3 py-2 text-[11px] leading-5">
                                  {product.description}
                                </TooltipContent>
                              </Tooltip>
                            ) : null}
                          </div>

                          <button
                            onClick={() => addProductInstance(product)}
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-[#d1d5db] bg-white text-[#6b7280] transition-colors hover:border-[#93c5fd] hover:text-[#2563eb]"
                            aria-label="添加"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}

              {filteredProducts.length === 0 && (
                <div className="flex items-center justify-center rounded-lg border border-dashed border-[#e5e7eb] py-10 text-[12px] text-[#9ca3af]">
                  当前分类下暂无匹配产品
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex w-1/2 shrink-0 flex-col rounded-lg border border-[#e5e7eb] bg-slate-50 p-3">
          <div className="mb-3 rounded-md border border-[#e5e7eb] bg-white/80 px-3 py-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#94a3b8]">
                  已选方案区
                </p>
                <p className="mt-1 text-[13px] font-medium text-[#111827]">
                  已添加 {selectedData.length} 个服务实例
                </p>
              </div>
              <div className="text-right">
                <p className="text-[11px] text-[#94a3b8]">展示型总价估算</p>
                <p className="mt-1 font-mono text-[13px] font-semibold text-[#0f172a]">
                  {totalSummary}
                </p>
              </div>
            </div>
            <p className="mt-2 text-[10px] text-[#94a3b8]">
              仅用于 P2 方案浏览，不代表正式报价或锁价。
            </p>
          </div>

          {selectedData.length === 0 ? (
            <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-[#cbd5e1] bg-white/70 px-6 text-center text-[13px] text-[#94a3b8]">
              从左侧添加服务后，将在这里集中查看已选方案与办理对象。
            </div>
          ) : (
            <div className="flex-1 space-y-2 overflow-y-auto">
              {selectedData.map((item, index) => (
                <div
                  key={item.tempId}
                  className="rounded-lg border border-[#e2e8f0] bg-white p-3 transition-colors hover:border-[#cbd5e1]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-[13px] font-medium text-[#111827]">
                          {item.productName}
                        </p>
                        <span className="rounded-full bg-[#f1f5f9] px-2 py-0.5 text-[10px] text-[#64748b]">
                          实例 {index + 1}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <p className="min-w-[88px] text-right font-mono text-[12px] font-semibold text-[#334155]">
                        {formatCurrency(item.currency, item.basePrice)}
                      </p>
                      <button
                        onClick={() => removeProductInstance(item.tempId)}
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-[#fecaca] bg-white text-[#dc2626] transition-colors hover:bg-[#fff1f2]"
                        aria-label="移除"
                      >
                        <Minus size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 grid gap-1.5 sm:grid-cols-[72px_minmax(0,1fr)] sm:items-center">
                    <label className="text-[11px] font-medium text-[#6b7280]">
                      办理人 / 标的
                    </label>
                    <input
                      type="text"
                      value={item.targetName}
                      onChange={(e) => updateTargetName(item.tempId, e.target.value)}
                      placeholder="请输入办理人姓名，如: 张三"
                      className="h-8 w-full rounded-md border border-[#dbe2ea] bg-white px-2.5 text-[12px] text-[#111827] outline-none placeholder:text-[#9ca3af] focus:border-[#2563eb]"
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
