import { NextResponse, type NextRequest } from 'next/server'

// Next.js 16 proxy function (replaces middleware)
export async function proxy(request: NextRequest) {
  // Development: pass through all requests without auth check
  // Enable full Supabase auth check later
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.png|.*\\.jpg|.*\\.svg).*)',
  ],
}
