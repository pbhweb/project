"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import AuthButtons from "./auth-buttons"

export function Navbar() {
  return (
    <header className="border-b bg-white dark:bg-gray-900 sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">W</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold text-gray-900 dark:text-white">WorkHub</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">منصة العمل الحر</span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="flex items-center gap-3">
          <Link href="/projects">
            <Button variant="ghost" size="sm" className="text-sm">
              المشاريع
            </Button>
          </Link>

          <AuthButtons />
        </nav>
      </div>
    </header>
  )
}
