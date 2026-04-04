'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export interface ProductRow {
  id: string
  organizationId: string
  productCode: string
  name: string
  category: string
  description: string | null
  difficulty: number
  isExpertMode: boolean
  sla: number | null
  expertTag: string[]
  price: number // retail price in current currency
  currency: 'IDR' | 'CNY'
  costPrice: number
}

async function getCurrentTenantId(): Promise<string> {
  const cookieStore = await cookies()
  return cookieStore.get('selectedTenant')?.value ?? 'org_bantu_id'
}

/**
 * 获取当前租户的产品列表（含最新价格）
 */
export async function getProductsAction(currency?: 'IDR' | 'CNY'): Promise<ProductRow[]> {
  const supabase = await createClient()
  const tenantId = await getCurrentTenantId()
  const curr = currency || 'IDR'

  // 1. 获取产品列表
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('*')
    .eq('organizationId', tenantId)
    .order('category')
    .order('name')

  if (productsError || !products) {
    console.error('[getProductsAction] Error fetching products:', productsError)
    return []
  }

  if (products.length === 0) return []

  // 2. 获取这些产品的当前价格
  const productIds = products.map(p => p.id)
  const { data: prices, error: pricesError } = await supabase
    .from('product_prices')
    .select('productId, retailPriceIdr, retailPriceCny, costPriceIdr, costPriceCny, isCurrent')
    .in('productId', productIds)
    .eq('isCurrent', true)

  if (pricesError) {
    console.error('[getProductsAction] Error fetching prices:', pricesError)
  }

  // 3. 构建价格映射
  const priceMap = new Map(
    (prices || []).map(p => [p.productId, p])
  )

  // 4. 合并产品 + 价格
  return products.map(p => {
    const priceData = priceMap.get(p.id)
    return {
      id: p.id,
      organizationId: p.organizationId,
      productCode: p.productCode,
      name: p.name,
      category: p.category,
      description: p.description,
      difficulty: p.difficulty,
      isExpertMode: p.isExpertMode,
      sla: p.sla,
      expertTag: p.expertTag || [],
      price: curr === 'CNY'
        ? (priceData?.retailPriceCny ?? priceData?.retailPriceIdr ?? 0)
        : (priceData?.retailPriceIdr ?? 0),
      currency: curr,
      costPrice: curr === 'CNY'
        ? (priceData?.costPriceCny ?? priceData?.costPriceIdr ?? 0)
        : (priceData?.costPriceIdr ?? 0),
    }
  })
}

/**
 * 获取商机已选的 P2 产品
 */
export async function getOpportunityP2DataAction(opportunityId: string) {
  const supabase = await createClient()
  const tenantId = await getCurrentTenantId()

  const { data, error } = await supabase
    .from('opportunity_p2_data')
    .select(`
      id,
      opportunityId,
      productId,
      cycle,
      product:products (
        id, name, category, productCode, difficulty
      )
    `)
    .eq('opportunityId', opportunityId)

  if (error) {
    console.error('[getOpportunityP2DataAction] Error:', error)
    return []
  }

  return data ?? []
}

/**
 * 保存商机 P2 产品选择
 */
export async function saveOpportunityP2DataAction(
  opportunityId: string,
  selections: { productId: string; cycle?: string }[]
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const tenantId = await getCurrentTenantId()

  // 1. 删除旧的 P2 数据
  const { error: deleteError } = await supabase
    .from('opportunity_p2_data')
    .delete()
    .eq('opportunityId', opportunityId)

  if (deleteError) {
    console.error('[saveOpportunityP2DataAction] Delete error:', deleteError)
    return { success: false, error: '清除旧数据失败' }
  }

  // 2. 插入新的 P2 数据
  if (selections.length > 0) {
    const rows = selections.map(s => ({
      id: crypto.randomUUID(),
      opportunityId,
      productId: s.productId,
      cycle: s.cycle || null,
    }))

    const { error: insertError } = await supabase
      .from('opportunity_p2_data')
      .insert(rows)

    if (insertError) {
      console.error('[saveOpportunityP2DataAction] Insert error:', insertError)
      return { success: false, error: '保存方案失败' }
    }
  }

  return { success: true }
}
