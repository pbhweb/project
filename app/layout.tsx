import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Navbar } from "@/components/navbar"
import { Toaster } from "@/components/ui/sonner"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "منصة العمل الحر - ربط أصحاب العمل مع المستقلين",
  description: "منصة متكاملة للعمل الحر مع نظام إحالة وعمولات",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className={`${inter.className} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <Navbar />
          <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">{children}</main>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
