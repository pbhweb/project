"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import Link from "next/link"

type UserRole = "business_owner" | "freelancer" | "affiliate"

export default function SignupForm() {
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<UserRole>("freelancer")
  const [referralCode, setReferralCode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const ref = searchParams.get("ref")
    if (ref) {
      setReferralCode(ref.toUpperCase())
    }
  }, [searchParams])

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const supabase = createClient()

      if (referralCode.trim()) {
        sessionStorage.setItem("pending_referral_code", referralCode.trim().toUpperCase())
      }

      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/dashboard`,
          data: {
            full_name: fullName,
            role: role,
          },
        },
      })

      if (signUpError) throw signUpError

      console.log("[v0] User created:", signUpData.user?.id)

      setSuccess(true)
    } catch (err: any) {
      console.error("[v0] Signup error:", err)
      setError(err.message || "حدث خطأ أثناء التسجيل")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <CardTitle className="text-2xl">تم إنشاء الحساب بنجاح</CardTitle>
            <CardDescription className="text-base mt-2">
              تم إرسال رسالة تأكيد إلى بريدك الإلكتروني. يرجى التحقق من بريدك وتأكيد حسابك للمتابعة.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Button onClick={() => router.push("/auth/login")} variant="outline">
              العودة لتسجيل الدخول
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold">إنشاء حساب جديد</CardTitle>
          <CardDescription>أدخل معلوماتك لإنشاء حساب جديد في المنصة</CardDescription>
        </CardHeader>
        <form onSubmit={handleSignup}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {referralCode && (
              <Alert>
                <AlertDescription>
                  تم تطبيق كود الإحالة: <strong>{referralCode}</strong>
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="fullName">الاسم الكامل</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="أدخل اسمك الكامل"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input
                id="email"
                type="email"
                placeholder="example@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                dir="ltr"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">كلمة المرور</Label>
              <Input
                id="password"
                type="password"
                placeholder="يجب أن تكون 6 أحرف على الأقل"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <div className="space-y-3">
              <Label>نوع الحساب</Label>
              <RadioGroup value={role} onValueChange={(value) => setRole(value as UserRole)}>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <RadioGroupItem value="freelancer" id="freelancer" />
                  <Label htmlFor="freelancer" className="font-normal cursor-pointer">
                    مستقل - أقدم عروض على المشاريع
                  </Label>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <RadioGroupItem value="business_owner" id="business_owner" />
                  <Label htmlFor="business_owner" className="font-normal cursor-pointer">
                    صاحب عمل - أطلب خدمات
                  </Label>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <RadioGroupItem value="affiliate" id="affiliate" />
                  <Label htmlFor="affiliate" className="font-normal cursor-pointer">
                    مسوق بالعمولة - أجلب عملاء وأحصل على 10%
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {!searchParams.get("ref") && (
              <div className="space-y-2">
                <Label htmlFor="referralCode">كود الإحالة (اختياري)</Label>
                <Input
                  id="referralCode"
                  type="text"
                  placeholder="إذا كان لديك كود إحالة"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                  maxLength={8}
                />
              </div>
            )}
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "جاري إنشاء الحساب..." : "إنشاء حساب"}
            </Button>

            <p className="text-sm text-center text-muted-foreground">
              لديك حساب بالفعل؟{" "}
              <Link href="/auth/login" className="text-primary hover:underline font-medium">
                سجل الدخول
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
