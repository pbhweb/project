import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import Script from "next/script"
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
        {/* Google AdSense — site ownership verification / ad code */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4261863462581026"
          crossOrigin="anonymous"
          strategy="beforeInteractive"
        />
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
          <Navbar />
          <main className="min-h-screen bg-black">{children}</main>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
