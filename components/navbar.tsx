import Link from "next/link"
import { Button } from "@/components/ui/button"
import AuthButtons from "./auth-buttons"

// ❌ غير من:
// export function Navbar() { ... }

// ✅ إلى:
export default function Navbar() {
  return (
    <header className="border-b bg-white dark:bg-gray-900 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">W</span>
          </div>
          <span className="text-xl font-bold dark:text-white">WorkHub</span>
        </Link>

        {/* Navigation Links */}
        <nav className="flex items-center gap-4">
          <Link href="/projects">
            <Button variant="ghost">المشاريع</Button>
          </Link>
          
          {/* Client Component للـ Auth */}
          <AuthButtons />
        </nav>
      </div>
    </header>
  )
}
