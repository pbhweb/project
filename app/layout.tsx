import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import Script from "next/script"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Navbar } from "@/components/navbar"
import { Toaster } from "@/components/ui/sonner"
import { LanguageProvider } from "@/lib/i18n/language-context"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "WorkHub — Freelance Marketplace with Verified Freelancers",
  description:
    "Post projects, receive offers from professional freelancers, and check freelance license verification before you hire.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // Default language is English (lang/dir are updated client-side by
    // LanguageProvider when the visitor switches to Arabic).
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <head>
        {/* Google AdSense site-verification / ad script. Replace the
            client id below if your AdSense account id ever changes. */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4261863462581026"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body className={`${inter.className} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <LanguageProvider>
            <Navbar />
            <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">{children}</main>
            <Toaster />
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
