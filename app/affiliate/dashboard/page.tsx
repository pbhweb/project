"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Copy, Share2, DollarSign, Users, TrendingUp } from "lucide-react"

export default function AffiliateDashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [affiliate, setAffiliate] = useState<any>(null)
  const [referrals, setReferrals] = useState<any[]>([])
  const [userProfile, setUserProfile] = useState<any>(null)
  const [copySuccess, setCopySuccess] = useState<string | null>(null)

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

      console.log("[v0] Loading affiliate data for user:", user.id)

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      if (profileError) {
        console.error("[v0] Profile error:", profileError)
      }

      console.log("[v0] User profile:", profile)
      setUserProfile(profile)

      // Get affiliate account
      const { data: affiliateData, error: affiliateError } = await supabase
        .from("affiliates")
        .select("*")
        .eq("user_id", user.id)
        .single()

      if (affiliateError && affiliateError.code !== "PGRST116") {
        console.error("[v0] Affiliate error:", affiliateError)
      }

      console.log("[v0] Affiliate data:", affiliateData)

      if (affiliateData) {
        setAffiliate(affiliateData)

        // Get referrals
        const { data: referralsData } = await supabase
          .from("referrals")
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
      console.error("[v0] Load error:", err)
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

      const { error: profileError } = await supabase.from("profiles").update({ role: "affiliate" }).eq("id", user.id)

      if (profileError) throw profileError

      const referralCode = `AFF${Math.random().toString(36).substr(2, 6).toUpperCase()}`

      const { data: newAffiliate, error: affiliateError } = await supabase
        .from("affiliates")
        .insert({
          user_id: user.id,
          referral_code: referralCode,
          commission_rate: 10.0,
          is_active: true,
        })
        .select()
        .single()

      if (affiliateError) throw affiliateError

      await loadAffiliateData()
    } catch (err: any) {
      console.error("[v0] Create affiliate error:", err)
      setError(err.message || "حدث خطأ أثناء إنشاء حساب الأفلييت")
    } finally {
      setCreating(false)
    }
  }

  const copyReferralLink = () => {
    const link = `${window.location.origin}/auth/signup?ref=${affiliate.referral_code}`
    navigator.clipboard.writeText(link)
    setCopySuccess("تم نسخ رابط الإحالة")
    setTimeout(() => setCopySuccess(null), 2000)
  }

  const copyReferralCode = () => {
    navigator.clipboard.writeText(affiliate.referral_code)
    setCopySuccess("تم نسخ كود الإحالة")
    setTimeout(() => setCopySuccess(null), 2000)
  }

  const shareReferralLink = () => {
    const link = `${window.location.origin}/auth/signup?ref=${affiliate.referral_code}`
    if (navigator.share) {
      navigator.share({
        title: "انضم إلى منصة العمل الحر واحصل على خصم",
        text: `استخدم كود الإحالة ${affiliate.referral_code} للحصول على مزايا حصرية!`,
        url: link,
      })
    } else {
      copyReferralLink()
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4">جاري التحميل...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">لوحة تحكم المسوقين</h1>
          <p className="text-gray-600 mt-2">إدارة كود الإحالة الخاص بك وتتبع أرباحك</p>
        </div>

        {copySuccess && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <AlertDescription className="text-green-800">✓ {copySuccess}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!affiliate ? (
          <Card className="border-2 border-dashed border-blue-200">
            <CardHeader className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="h-10 w-10 text-blue-600" />
              </div>
              <CardTitle className="text-2xl">انضم إلى برنامج المسوقين</CardTitle>
              <CardDescription>احصل على 10% عمولة من كل مشروع تجلبه للمنصة</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 space-y-4">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  كيف تربح معنا؟
                </h3>
                <ul className="space-y-3">
                  {[
                    "احصل على كود إحالة فريد لك",
                    "شاركه مع أصحاب الأعمال المهتمين",
                    "احصل على 10% من قيمة كل مشروع ينشرونه",
                    "تتبع أرباحك في الوقت الحقيقي",
                    "اسحب أرباحك بسهولة",
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <span className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold shrink-0">
                        {idx + 1}
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Button
                onClick={createAffiliateAccount}
                disabled={creating}
                size="lg"
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
              >
                {creating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    جاري الإنشاء...
                  </>
                ) : (
                  "ابدأ الربح الآن مجاناً"
                )}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-700 font-medium">إجمالي الإحالات</p>
                      <h3 className="text-3xl font-bold text-gray-900">{affiliate.total_referrals || 0}</h3>
                    </div>
                    <Users className="h-10 w-10 text-blue-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-700 font-medium">معدل العمولة</p>
                      <h3 className="text-3xl font-bold text-gray-900">{affiliate.commission_rate}%</h3>
                    </div>
                    <TrendingUp className="h-10 w-10 text-green-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-cyan-50 to-cyan-100 border-cyan-200">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-cyan-700 font-medium">الأرباح الكلية</p>
                      <h3 className="text-3xl font-bold text-gray-900">${affiliate.total_earnings || 0}</h3>
                    </div>
                    <DollarSign className="h-10 w-10 text-cyan-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-orange-700 font-medium">الحالة</p>
                      <h3 className="text-xl font-bold mt-1">
                        <Badge variant={affiliate.is_active ? "default" : "destructive"} className="text-base">
                          {affiliate.is_active ? "نشط" : "معطل"}
                        </Badge>
                      </h3>
                    </div>
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                      <div
                        className={`w-3 h-3 rounded-full ${affiliate.is_active ? "bg-green-500" : "bg-red-500"}`}
                      ></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="mb-8 border-2 border-blue-200 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <Share2 className="h-6 w-6 text-blue-600" />
                  رابط الإحالة الخاص بك
                </CardTitle>
                <CardDescription className="text-base">
                  شارك هذا الرابط مع أصحاب الأعمال للحصول على عمولة 10%
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                {/* Referral Code */}
                <div className="space-y-3">
                  <label className="text-sm font-bold text-gray-700">كود الإحالة:</label>
                  <div className="flex items-center gap-3">
                    <Input
                      value={affiliate.referral_code}
                      readOnly
                      className="font-mono text-2xl font-bold text-center bg-blue-50 border-2 border-blue-300 text-blue-700"
                    />
                    <Button
                      onClick={copyReferralCode}
                      variant="outline"
                      size="lg"
                      className="gap-2 border-2 border-blue-300 hover:bg-blue-50 bg-transparent"
                    >
                      <Copy className="h-5 w-5" />
                      نسخ
                    </Button>
                  </div>
                </div>

                {/* Referral Link */}
                <div className="space-y-3">
                  <label className="text-sm font-bold text-gray-700">الرابط الكامل للمشاركة:</label>
                  <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
                    <Input
                      value={`${
                        typeof window !== "undefined" ? window.location.origin : ""
                      }/auth/signup?ref=${affiliate.referral_code}`}
                      readOnly
                      className="flex-1 bg-gray-50 border-2 border-gray-300 text-sm font-mono"
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={copyReferralLink}
                        variant="outline"
                        size="lg"
                        className="gap-2 flex-1 border-2 bg-transparent"
                      >
                        <Copy className="h-4 w-4" />
                        نسخ الرابط
                      </Button>
                      <Button
                        onClick={shareReferralLink}
                        size="lg"
                        className="gap-2 flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                      >
                        <Share2 className="h-4 w-4" />
                        مشاركة
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Instructions */}
                <Alert className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-300 border-2">
                  <AlertDescription className="space-y-3">
                    <h4 className="font-bold text-blue-800 text-lg">كيف تستخدم رابط الإحالة؟</h4>
                    <ul className="list-disc list-inside space-y-2 text-gray-700">
                      <li className="font-medium">شارك الرابط مع أصحاب الأعمال عبر وسائل التواصل</li>
                      <li className="font-medium">عند تسجيلهم باستخدام رابطك، يتم تتبع إحالتك تلقائياً</li>
                      <li className="font-medium">تحصل على 10% من قيمة كل مشروع ينشرونه</li>
                      <li className="font-medium">العمولة تُدفع تلقائياً عند إتمام المشروع بنجاح</li>
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
                  <div className="text-center py-12">
                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users className="h-12 w-12 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">لا توجد إحالات حتى الآن</h3>
                    <p className="text-gray-500 mb-6">ابدأ بمشاركة رابط الإحالة الخاص بك للحصول على أول عمولة</p>
                    <Button onClick={shareReferralLink} className="gap-2">
                      <Share2 className="h-4 w-4" />
                      مشاركة رابط الإحالة
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {referrals.map((referral) => (
                      <div key={referral.id} className="border rounded-xl p-4 hover:shadow-md transition-shadow">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                                <Users className="h-5 w-5 text-blue-600" />
                              </div>
                              <div>
                                <p className="font-semibold">
                                  {(referral.profiles as any)?.full_name || "مستخدم جديد"}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {new Date(referral.created_at).toLocaleDateString("ar-SA", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  })}
                                </p>
                              </div>
                            </div>

                            {referral.projects && (
                              <div className="mt-3 space-y-1">
                                <p className="text-sm">
                                  <span className="text-gray-600">المشروع: </span>
                                  <span className="font-medium">
                                    {(referral.projects as any)?.title || "مشروع محذوف"}
                                  </span>
                                </p>
                                <p className="text-sm">
                                  <span className="text-gray-600">قيمة المشروع: </span>
                                  <span className="font-bold text-green-600">
                                    ${(referral.projects as any)?.budget_min || 0}
                                  </span>
                                </p>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col items-end gap-2">
                            <Badge
                              variant={
                                referral.status === "completed"
                                  ? "default"
                                  : referral.status === "pending"
                                    ? "outline"
                                    : "secondary"
                              }
                              className="text-sm"
                            >
                              {referral.status === "pending"
                                ? "⏳ قيد الانتظار"
                                : referral.status === "completed"
                                  ? "✅ مكتمل"
                                  : "💰 مدفوع"}
                            </Badge>

                            {referral.commission_amount && (
                              <div className="text-right">
                                <p className="text-xs text-gray-500">عمولتك</p>
                                <p className="text-lg font-bold text-purple-600">${referral.commission_amount}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
