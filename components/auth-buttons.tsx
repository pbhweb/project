"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export default function AuthButtons() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }

    getUser()

    // استمع لتغييرات حالة المصادقة
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.refresh()
    router.push("/auth/login")
  }

  if (loading) {
    return <Button variant="ghost" disabled>...</Button>
  }

  if (user) {
    return (
      <>
        <Link href="/profile">
          <Button variant="outline" size="sm">
            👤 {user.email?.split('@')[0]}
          </Button>
        </Link>
        <Button variant="ghost" onClick={handleSignOut}>
          تسجيل الخروج
        </Button>
      </>
    )
  }

  return (
    <>
      <Link href="/auth/login">
        <Button variant="ghost">تسجيل الدخول</Button>
      </Link>
      <Link href="/auth/signup">
        <Button>إنشاء حساب</Button>
      </Link>
    </>
  )
}
