import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // 开发阶段：直接放行所有请求，不做认证检查
  // 后续可启用完整的 Supabase 认证检查
  return NextResponse.next()
}

export const config = {
  matcher: [
    // 仅匹配需要保护的路由（目前暂不启用）
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.png|.*\\.jpg|.*\\.svg).*)',
  ],
}
