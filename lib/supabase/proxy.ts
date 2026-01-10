import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // ✅ التصحيح: تحديث response بدون إعادة تعيين
          cookiesToSet.forEach(({ name, value, options }) => {
            // تحديث request cookies
            request.cookies.set(name, value)
            // تحديث response cookies
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // الحصول على بيانات المستخدم
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error) {
    console.error('Auth error in middleware:', error)
  }

  const { pathname } = request.nextUrl

  // ✅ قائمة المسارات المحمية
  const protectedPaths = [
    '/dashboard',
    '/projects/new',
    '/profile',
    '/notifications',
    '/my-bids',
    '/my-projects',
    '/affiliate/dashboard',
    '/transactions'
  ]

  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path))

  // إذا حاول الدخول لمسار محمي بدون تسجيل دخول
  if (isProtectedPath && !user) {
    const redirectUrl = new URL('/auth/login', request.url)
    redirectUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // ✅ إذا كان مسجل وحاول دخول صفحات التسجيل
  const authPaths = ['/auth/login', '/auth/signup', '/auth/forgot-password']
  const isAuthPath = authPaths.includes(pathname)
  
  if (user && isAuthPath) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // ✅ معالجة auth callbacks لـ Supabase
  if (pathname.startsWith('/auth/callback')) {
    const url = request.nextUrl.clone()
    url.pathname = '/api/auth/callback'
    
    request.nextUrl.searchParams.forEach((value, key) => {
      url.searchParams.set(key, value)
    })
    
    return NextResponse.rewrite(url)
  }

  return response
}

// ✅ إضافة config لتحديد المسارات
export const config = {
  matcher: [
    /*
     * تطبيق على جميع المسارات ما عدا:
     * - api routes
     * - static files
     * - images
     * - favicon
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public/).*)',
  ],
}
