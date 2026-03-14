import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

/**
 * POST /api/auth/set-tenant
 * 登陆成功后调用此 API 设置当前租户
 */
export async function POST(request: Request) {
  const cookieStore = cookies()
  const supabase = createServerComponentClient({ cookies: () => cookieStore })

  try {
    const { tenantId } = await request.json()

    if (!tenantId) {
      return NextResponse.json({ error: '缺少 tenantId' }, { status: 400 })
    }

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: '未认证' }, { status: 401 })
    }

    // 检查用户是否属于此租户
    const { data: userOrg } = await supabase
      .from('user_organizations')
      .select('*')
      .eq('userId', session.user.id)
      .eq('organizationId', tenantId)
      .single()

    if (!userOrg) {
      return NextResponse.json({ error: '用户不属于此组织' }, { status: 403 })
    }

    // 设置 Cookie（30 天有效期）
    const response = NextResponse.json({ success: true })
    response.cookies.set('selectedTenant', tenantId, {
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: false,
      sameSite: 'lax',
    })

    return response
  } catch (error) {
    console.error('[v0] Error setting tenant:', error)
    return NextResponse.json({ error: '设置租户失败' }, { status: 500 })
  }
}

/**
 * POST /api/auth/logout
 * 登出用户
 */
export async function PUT(request: Request) {
  const cookieStore = cookies()
  const supabase = createServerComponentClient({ cookies: () => cookieStore })

  const response = NextResponse.json({ success: true })
  
  // 清除租户 Cookie
  response.cookies.delete('selectedTenant')

  // 清除 Supabase 认证
  await supabase.auth.signOut()

  return response
}
