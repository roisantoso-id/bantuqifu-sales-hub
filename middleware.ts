import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(_request: NextRequest) {
  // 开发模式：暂时禁用登录鉴权与外部 auth 跳转
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.svg|.*\\.ico).*)'],
}
