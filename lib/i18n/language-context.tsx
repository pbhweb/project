"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { dictionaries, type Lang, type DictionaryKey } from "./dictionaries"

type LanguageContextValue = {
  lang: Lang
  dir: "ltr" | "rtl"
  setLang: (lang: Lang) => void
  t: (key: DictionaryKey) => string
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

const STORAGE_KEY = "workhub_lang"

export function LanguageProvider({ children }: { children: ReactNode }) {
  // English is the default language site-wide.
  const [lang, setLangState] = useState<Lang>("en")

  useEffect(() => {
    const saved = typeof window !== "undefined" ? (localStorage.getItem(STORAGE_KEY) as Lang | null) : null
    if (saved === "en" || saved === "ar") {
      setLangState(saved)
    }
  }, [])

  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr"
  }, [lang])

  const setLang = (next: Lang) => {
    setLangState(next)
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, next)
  }

  const t = (key: DictionaryKey) => dictionaries[lang][key] ?? dictionaries.en[key]

  return (
    <LanguageContext.Provider value={{ lang, dir: lang === "ar" ? "rtl" : "ltr", setLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider")
  return ctx
}
