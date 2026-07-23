"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import AuthButtons from "./auth-buttons"
import NotificationBell from "./notification-bell"

export function Navbar() {
  return (
    <header className="border-b border-white/10 bg-black/95 backdrop-blur sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-9 h-9 rounded-lg bg-neutral-900 border border-emerald-500/30 flex items-center justify-center overflow-hidden">
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
              <path d="M12 2 L21 8 L12 22 L3 8 Z" stroke="#34D399" strokeWidth="1.4" />
              <path d="M12 2 L12 22 M3 8 L21 8" stroke="#34D399" strokeWidth="0.8" opacity="0.5" />
            </svg>
            <div className="absolute inset-0 bg-emerald-400/0 group-hover:bg-emerald-400/10 transition-colors" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-xl font-bold text-white tracking-wide">قمّة</span>
            <span className="text-[10px] text-emerald-400/70 tracking-[0.2em] uppercase">Qimah</span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="flex items-center gap-3">
          <Link href="/projects">
            <Button variant="ghost" size="sm" className="text-sm text-neutral-300 hover:text-white hover:bg-white/5">
              المشاريع
            </Button>
          </Link>

          <NotificationBell />
          <AuthButtons />
        </nav>
      </div>
    </header>
  )
}
