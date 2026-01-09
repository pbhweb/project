"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export default function AffiliateDashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [affiliate, setAffiliate] = useState<any>(null)
  const [referrals, setReferrals] = useState<any[]>([])
  const [userProfile, setUserProfile] = useState<any>(null)

  useEffect(() => {
    loadAffiliateData()
  }, [])

  const loadAffiliateData = async () => {
    try {
      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push("/auth/login")
        return
      }

      // Get user profile
      const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

      setUserProfile(profile)

      // Get or check affiliate account
      const { data: affiliateData } = await supabase.from("affiliates").select("*").eq("user_id", user.id).single()

      if (affiliateData) {
        setAffiliate(affiliateData)

        // Get referrals
        const { data: referralsData } = await supabase
          .from("affiliate_referrals")
          .select(
            `
            *,
            profiles:referred_user_id (full_name),
            projects:project_id (title, budget_min)
          `,
          )
          .eq("affiliate_id", affiliateData.id)
          .order("created_at", { ascending: false })

        setReferrals(referralsData || [])
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const createAffiliateAccount = async () => {
    setCreating(true)
    setError(null)

    try {
      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("يجب تسجيل الدخول")

      // Generate referral code
      const { data: codeData, error: codeError } = await supabase.rpc("generate_referral_code")

      if (codeError) throw codeError

      // Create affiliate account
      const { data: newAffiliate, error: affiliateError } = await supabase
        .from("affiliates")
        .insert({
          user_id: user.id,
          referral_code: codeData,
          commission_rate: 10.0,
        })
        .select()
        .single()

      if (affiliateError) throw affiliateError

      await loadAffiliateData()
    } catch (err: any) {
      setError(err.message || "حدث خطأ أثناء إنشاء حساب الأفلييت")
    } finally {
      setCreating(false)
    }
  }

  const copyReferralLink = () => {
    const link = `${window.location.origin}/auth/signup?ref=${affiliate.referral_code}`
    navigator.clipboard.writeText(link)
    alert("تم نسخ رابط الإحالة")
  }

  const copyReferralCode = () => {
    navigator.clipboard.writeText(affiliate.referral_code)
    alert("تم نسخ كود الإحالة")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p>جاري التحميل...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/dashboard">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-800 rounded-lg flex items-center justify-center cursor-pointer">
                <span className="text-white font-bold text-xl">A</span>
              </div>
            </Link>
            <h1 className="text-2xl font-bold">لوحة تحكم الأفلييت</h1>
          </div>
          <Link href="/dashboard">
            <Button variant="outline">لوحة التحكم الرئيسية</Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!affiliate ? (
            <Card>
              <CardHeader>
                <CardTitle>مرحباً بك في نظام الأفلييت</CardTitle>
                <CardDescription>انضم إلى برنامج الأفلييت واحصل على 10% عمولة من كل مشروع تجلبه للمنصة</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 space-y-4">
                  <h3 className="font-bold text-lg">كيف يعمل البرنامج؟</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-purple-600 font-bold">1.</span>
                      <span>احصل على كود إحالة خاص بك</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-600 font-bold">2.</span>
                      <span>شارك الكود مع أصحاب الأعمال المهتمين</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-600 font-bold">3.</span>
                      <span>عندما ينشرون مشروعاً باستخدام كودك، تحصل على 10% من قيمة المشروع</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-600 font-bold">4.</span>
                      <span>تتبع أرباحك وإحالاتك من لوحة التحكم</span>
                    </li>
                  </ul>
                </div>

                <Button onClick={createAffiliateAccount} disabled={creating} size="lg" className="w-full">
                  {creating ? "جاري الإنشاء..." : "إنشاء حساب أفلييت مجاناً"}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription>إجمالي الإحالات</CardDescription>
                    <CardTitle className="text-3xl text-blue-600">{affiliate.total_referrals}</CardTitle>
                  </CardHeader>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription>معدل العمولة</CardDescription>
                    <CardTitle className="text-3xl text-green-600">{affiliate.commission_rate}%</CardTitle>
                  </CardHeader>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription>الأرباح الكلية</CardDescription>
                    <CardTitle className="text-3xl text-purple-600">${affiliate.total_earnings || 0}</CardTitle>
                  </CardHeader>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription>الحالة</CardDescription>
                    <CardTitle>
                      <Badge variant={affiliate.is_active ? "default" : "destructive"}>
                        {affiliate.is_active ? "نشط" : "معطل"}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                </Card>
              </div>

              {/* Referral Code Card */}
              <Card>
                <CardHeader>
                  <CardTitle>كود الإحالة الخاص بك</CardTitle>
                  <CardDescription>
                    شارك هذا الكود أو الرابط مع أصحاب الأعمال ليستخدموه عند نشر مشاريعهم
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Input
                      value={affiliate.referral_code}
                      readOnly
                      className="font-mono text-lg font-bold text-center"
                    />
                    <Button onClick={copyReferralCode} variant="outline">
                      نسخ الكود
                    </Button>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-2">رابط الإحالة المباشر:</p>
                    <div className="flex items-center gap-3">
                      <Input
                        value={`${typeof window !== "undefined" ? window.location.origin : ""}/auth/signup?ref=${affiliate.referral_code}`}
                        readOnly
                        className="text-sm"
                        dir="ltr"
                      />
                      <Button onClick={copyReferralLink} variant="outline">
                        نسخ الرابط
                      </Button>
                    </div>
                  </div>

                  <Alert>
                    <AlertDescription className="space-y-2">
                      <p className="font-semibold">كيف يعمل النظام:</p>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        <li>شارك رابط الإحالة مع أصحاب الأعمال المهتمين</li>
                        <li>عندما يسجلون وينشرون مشروعاً، تحصل على 10% من قيمة المشروع</li>
                        <li>العمولة تُحسب تلقائياً عند إتمام المشروع بنجاح</li>
                        <li>يمكنك تتبع جميع إحالاتك وأرباحك من هذه الصفحة</li>
                      </ul>
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>

              {/* Referrals List */}
              <Card>
                <CardHeader>
                  <CardTitle>سجل الإحالات ({referrals.length})</CardTitle>
                  <CardDescription>قائمة بجميع الإحالات التي قمت بها</CardDescription>
                </CardHeader>
                <CardContent>
                  {referrals.length === 0 ? (
                    <div className="py-12 text-center">
                      <p className="text-muted-foreground mb-4">لا توجد إحالات حتى الآن</p>
                      <p className="text-sm text-muted-foreground">
                        ابدأ بمشاركة كود الإحالة الخاص بك مع أصحاب الأعمال
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {referrals.map((referral) => (
                        <div key={referral.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-semibold">{(referral.profiles as any)?.full_name || "مستخدم جديد"}</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(referral.created_at).toLocaleDateString("ar-EG", {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                })}
                              </p>
                            </div>
                            <Badge variant={referral.status === "completed" ? "default" : "secondary"}>
                              {referral.status === "pending"
                                ? "قيد الانتظار"
                                : referral.status === "completed"
                                  ? "مكتمل"
                                  : "مدفوع"}
                            </Badge>
                          </div>
                          {referral.projects && (
                            <div className="text-sm">
                              <p className="text-muted-foreground">
                                المشروع: {(referral.projects as any)?.title || "مشروع محذوف"}
                              </p>
                              <p className="text-green-600 font-semibold mt-1">
                                قيمة المشروع: ${(referral.projects as any)?.budget_min || 0}
                              </p>
                              <p className="text-purple-600 font-semibold">
                                عمولتك المتوقعة: $
                                {((((referral.projects as any)?.budget_min || 0) * 10) / 100).toFixed(2)}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
