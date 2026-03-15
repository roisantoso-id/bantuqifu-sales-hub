/**
 * 定时任务：自动回收7天未跟进的线索
 *
 * 使用方式：
 * 1. 使用 Node.js Cron (node-cron)
 * 2. 使用 Vercel Cron Jobs (vercel.json)
 * 3. 使用外部 Cron 服务（如 cron-job.org）调用 API 端点
 *
 * 本文件提供 API Route 实现，可以被外部 Cron 服务调用
 */

import { NextRequest, NextResponse } from 'next/server'
import { autoRecycleLeadsAction } from '@/app/actions/lead'

// 验证 Cron 密钥（防止未授权访问）
const CRON_SECRET = process.env.CRON_SECRET || 'your-secret-key-here'

export async function GET(request: NextRequest) {
  // 验证授权
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    console.log('[Cron] Starting auto-recycle job...')
    const result = await autoRecycleLeadsAction()

    console.log(`[Cron] Auto-recycle completed: ${result.count} leads recycled`)

    return NextResponse.json({
      success: true,
      message: `Successfully recycled ${result.count} leads`,
      count: result.count,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[Cron] Auto-recycle failed:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

// 支持 POST 方法（某些 Cron 服务使用 POST）
export async function POST(request: NextRequest) {
  return GET(request)
}
