"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { LogOut, User, Loader2 } from "lucide-react"

export default function AuthButtons() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [signingOut, setSigningOut] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error) {
          console.error("Error getting user:", error)
        }
        setUser(user)
      } catch (error) {
        console.error("Auth error:", error)
      } finally {
        setLoading(false)
      }
    }

    getUser()

    // استمع لتغييرات حالة المصادقة
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  const handleSignOut = async () => {
    try {
      setSigningOut(true)
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error("Sign out error:", error)
        return
      }
      router.refresh()
      router.push("/auth/login")
    } catch (error) {
      console.error("Sign out error:", error)
    } finally {
      setSigningOut(false)
    }
  }

  if (loading) {
    return (
      <Button variant="ghost" disabled>
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    )
  }

  if (user) {
    return (
      <div className="flex items-center gap-2">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">
            لوحة التحكم
          </Button>
        </Link>
        <Link href="/profile">
          <Button variant="outline" size="sm" className="gap-1">
            <User className="h-3 w-3" />
            {user.email?.split('@')[0] || "حسابي"}
          </Button>
        </Link>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSignOut}
          disabled={signingOut}
          className="gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          {signingOut ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <LogOut className="h-3 w-3" />
          )}
          خروج
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Link href="/auth/login">
        <Button variant="ghost" size="sm">
          تسجيل الدخول
        </Button>
      </Link>
      <Link href="/auth/signup">
        <Button size="sm" className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
          إنشاء حساب
        </Button>
      </Link>
    </div>
  )
}
