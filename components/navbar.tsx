import Link from "next/link"
import { Button } from "@/components/ui/button"

export function Navbar({ user }: { user: any }) {
  return (
    <header className="border-b bg-white sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">W</span>
          </div>
          <span className="text-xl font-bold">WorkHub</span>
        </Link>

        <nav className="flex items-center gap-4">
          {user ? (
            <>
              <Link href="/dashboard">
                <Button variant="ghost">لوحة التحكم</Button>
              </Link>
              <Link href="/projects">
                <Button variant="ghost">المشاريع</Button>
              </Link>
              <Link href="/affiliate/dashboard">
                <Button variant="ghost">الأفلييت</Button>
              </Link>
            </>
          ) : (
            <>
              <Link href="/auth/login">
                <Button variant="ghost">تسجيل الدخول</Button>
              </Link>
              <Link href="/auth/signup">
                <Button>إنشاء حساب</Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
