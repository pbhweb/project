import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  
  try {
    const supabase = createMiddlewareClient({ req, res })
    const { data: { session } } = await supabase.auth.getSession()

    // حماية المسارات التي تحتاج مصادقة
    if (req.nextUrl.pathname.startsWith('/dashboard') && !session) {
      return NextResponse.redirect(new URL('/auth/login', req.url))
    }

    // إذا كان المستخدم مسجلاً بالفعل، إعادة توجيهه من صفحات المصادقة
    if (req.nextUrl.pathname.startsWith('/auth') && session) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    return res
  } catch (error) {
    console.error('Middleware error:', error)
    return res
  }
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
