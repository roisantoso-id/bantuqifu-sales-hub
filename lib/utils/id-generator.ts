'use server'

import { createServiceClient } from '@/lib/supabase/server'
import { format } from 'date-fns'

export type BizPrefix = 'CUS' | 'LED' | 'OPP' | 'USR' | 'CON'

/**
 * 生成语义化业务 ID
 * 格式: [前缀]-[YYMMDD]-[4位自增序列]
 * 例如: OPP-260315-0001
 *
 * 使用 Postgres upsert + returning 实现原子递增，并发安全。
 */
export async function generateBizId(prefix: BizPrefix): Promise<string> {
  const supabase = await createServiceClient()
  const dateStr = format(new Date(), 'yyMMdd')
  const counterKey = `${prefix}_${dateStr}`

  // 原子 upsert：不存在则插入 sequence=1，存在则 +1，返回最新 sequence
  const { data, error } = await supabase.rpc('upsert_counter', {
    p_key: counterKey,
  })

  if (error || data == null) {
    console.error('[generateBizId] RPC error:', error)
    // 降级：随机 4 位
    const fallback = Math.floor(Math.random() * 9999).toString().padStart(4, '0')
    return `${prefix}-${dateStr}-${fallback}`
  }

  const sequenceStr = String(data).padStart(4, '0')
  return `${prefix}-${dateStr}-${sequenceStr}`
}
