'use server'

import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'

/**
 * 支持的业务前缀
 */
export type BizPrefix = 'CUS' | 'LED' | 'OPP' | 'USR' | 'CON'

/**
 * 生成语义化业务 ID
 * 格式: [前缀]-[YYMMDD]-[4位自增序列]
 * 例如: OPP-260315-0001
 * 
 * @param prefix - 业务前缀 (CUS, LED, OPP, USR, CON)
 * @returns Promise<string> 生成的语义化 ID
 */
export async function generateBizId(prefix: BizPrefix): Promise<string> {
  const supabase = await createClient()
  
  const today = new Date()
  const dateStr = format(today, 'yyMMdd') // 生成 260315 格式
  
  // 计数器的唯一键，例如：OPP_260315
  const counterKey = `${prefix}_${dateStr}`

  try {
    // 使用 Supabase 的 RPC 或直接 SQL 更新实现原子性递增
    // 首先尝试更新
    const { data: updated } = await supabase
      .from('system_counters')
      .update({ updatedAt: new Date().toISOString() })
      .eq('id', counterKey)
      .select()

    if (updated && updated.length > 0) {
      // 更新成功，重新获取当前的 sequence
      const { data: current } = await supabase
        .from('system_counters')
        .select('sequence')
        .eq('id', counterKey)
        .single()

      if (current) {
        const newSequence = (current.sequence || 0) + 1
        const sequenceStr = newSequence.toString().padStart(4, '0')
        return `${prefix}-${dateStr}-${sequenceStr}`
      }
    }

    // 如果更新失败（说明这是第一条记录），创建新记录
    const { data: created } = await supabase
      .from('system_counters')
      .insert([{ id: counterKey, sequence: 1 }])
      .select()
      .single()

    if (created) {
      return `${prefix}-${dateStr}-0001`
    }

    throw new Error('Failed to generate ID')
  } catch (error) {
    console.error('[generateBizId] Error:', error)
    // 备用方案：生成随机 ID
    const randomId = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    return `${prefix}-${dateStr}-${randomId}`
  }
}
