"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ShieldCheck, Languages } from "lucide-react"
import AuthButtons from "./auth-buttons"
import { useLanguage } from "@/lib/i18n/language-context"

export function Navbar() {
  const { lang, setLang, t } = useLanguage()

  return (
    <header className="border-b bg-white/80 backdrop-blur-md dark:bg-gray-900/80 sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-lg">W</span>
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-xl font-bold text-gray-900 dark:text-white">WorkHub</span>
            <span className="text-[11px] text-gray-500 dark:text-gray-400">
              {lang === "ar" ? "منصة العمل الحر" : "Freelance Marketplace"}
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="flex items-center gap-1 sm:gap-3">
          <Link href="/projects">
            <Button variant="ghost" size="sm" className="text-sm hidden sm:inline-flex">
              {t("nav_projects")}
            </Button>
          </Link>

          <Link href="/#verification">
            <Button variant="ghost" size="sm" className="text-sm gap-1 hidden md:inline-flex">
              <ShieldCheck className="h-4 w-4 text-green-600" />
              {t("nav_verified")}
            </Button>
          </Link>

          <Button
            variant="outline"
            size="sm"
            className="gap-1 text-xs sm:text-sm"
            onClick={() => setLang(lang === "en" ? "ar" : "en")}
            aria-label="Toggle language"
          >
            <Languages className="h-4 w-4" />
            {t("nav_language")}
          </Button>

          <AuthButtons />
        </nav>
      </div>
    </header>
  )
}
