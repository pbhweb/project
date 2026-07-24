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
        .maybeSingle()

      if (profileError) {
        console.error("[v0] Profile error:", profileError)
      }

      console.log("[v0] User profile:", profile)

      if (profile?.role !== "affiliate") {
        router.push("/dashboard")
        return
      }

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
          email: user.email,
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

  const copyExistingClientLink = () => {
    const link = `${window.location.origin}/projects/new?ref=${affiliate.referral_code}`
    navigator.clipboard.writeText(link)
    setCopySuccess("تم نسخ رابط العميل المسجّل مسبقاً")
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

  const shareExistingClientLink = () => {
    const link = `${window.location.origin}/projects/new?ref=${affiliate.referral_code}`
    if (navigator.share) {
      navigator.share({
        title: "انشر مشروعك عبر كود الإحالة",
        text: `استخدم كود الإحالة ${affiliate.referral_code} عند نشر مشروعك!`,
        url: link,
      })
    } else {
      copyExistingClientLink()
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
          <p className="mt-4">جاري التحميل...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">لوحة تحكم المسوقين</h1>
          <p className="text-neutral-400 mt-2">إدارة كود الإحالة الخاص بك وتتبع أرباحك</p>
        </div>

        {copySuccess && (
          <Alert className="mb-6 bg-green-500/10 border-green-500/30">
            <AlertDescription className="text-green-300">✓ {copySuccess}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert className="mb-8 border-2 bg-red-100 border-red-300 text-red-900">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!affiliate ? (
          <Card className="border-2 border-dashed border-emerald-500/20">
            <CardHeader className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-emerald-500/10 to-cyan-500/15 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="h-10 w-10 text-emerald-400" />
              </div>
              <CardTitle className="text-2xl">انضم إلى برنامج المسوقين</CardTitle>
              <CardDescription>احصل على 10% عمولة من كل مشروع تجلبه للمنصة</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 rounded-xl p-6 space-y-4">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-emerald-400" />
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
                      <span className="bg-emerald-500/10 text-emerald-400 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold shrink-0">
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
                className="w-full bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700"
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
              <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/10 border-emerald-500/20">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-emerald-300 font-medium">إجمالي الإحالات</p>
                      <h3 className="text-3xl font-bold text-white">{affiliate.total_referrals || 0}</h3>
                    </div>
                    <Users className="h-10 w-10 text-emerald-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-500/10 to-green-500/15 border-green-500/30">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-400 font-medium">معدل العمولة</p>
                      <h3 className="text-3xl font-bold text-white">{affiliate.commission_rate}%</h3>
                    </div>
                    <TrendingUp className="h-10 w-10 text-green-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-500/15 border-cyan-500/30">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-cyan-400 font-medium">الأرباح الكلية</p>
                      <h3 className="text-3xl font-bold text-white">${affiliate.total_earnings || 0}</h3>
                    </div>
                    <DollarSign className="h-10 w-10 text-cyan-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/15 border-orange-500/30">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-orange-400 font-medium">الحالة</p>
                      <h3 className="text-xl font-bold mt-1">
                        <Badge variant={affiliate.is_active ? "default" : "destructive"} className="text-base">
                          {affiliate.is_active ? "نشط" : "معطل"}
                        </Badge>
                      </h3>
                    </div>
                    <div className="w-10 h-10 bg-orange-500/15 rounded-full flex items-center justify-center">
                      <div
                        className={`w-3 h-3 rounded-full ${affiliate.is_active ? "bg-green-500" : "bg-red-500"}`}
                      ></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {affiliate.gumroad_affiliate_id ? (
              <Alert className="mb-8 bg-green-950/40 border-2 border-green-500/40">
                <AlertDescription className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-green-400">✓</span>
                  </div>
                  <div>
                    <p className="font-bold text-green-300 mb-1">
                      نظام العمولات التلقائية مفعّل
                    </p>
                    <p className="text-sm text-green-400/90">
                      حسابك مربوط بمعرّف أفلييت على Gumroad — عمولاتك تُحتسب وتُدفع لك تلقائياً
                      عبر Gumroad دون أي تدخل يدوي منّا.
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
            ) : (
       <Alert className="mb-8 border-2 border-red-400/60 bg-red-950/30 rounded-lg">
  <div className="flex items-start gap-3 p-4">
    <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center shrink-0 mt-0.5 flex-shrink-0">
      <span className="text-red-400 text-lg">⚠️</span>
    </div>
    <div className="flex-1">
      <p className="font-bold text-red-300 text-lg mb-2">
        حسابك غير قادر حالياً على استلام العمولات تلقائياً
      </p>
      <p className="text-sm text-red-200 mb-3">
        الدفع يتم من طرف ثالث (Gumroad) بشكل آلي بالكامل — نحن لا نقوم بتحويل
        العمولات يدوياً. إذا كانت لديك عمولات مستحقة وخاصية الاستلام التلقائي غير
        مفعّلة، الرجاء التواصل معنا. إذا كنت من دول محظورة تمامًا استخدام هذا المنصة، لا تفعل خاصية استلام عمولة تلقائية مثل سوريا وسودان.
      </p>
      <div className="bg-red-500/10 rounded-lg p-3 mb-3">
        <p className="text-sm font-medium text-red-300 mb-2">لتفعيل نظام العمولات التلقائية:</p>
        <ul className="list-decimal list-inside text-sm space-y-1 text-red-200">
          <li>
            سجّل حساباً على{" "}
            <a
              href="https://gumroad.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-medium text-red-300 hover:text-red-200 transition-colors"
            >
              gumroad.com
            </a>
          </li>
          <li>
            تواصل معنا على{" "}
            <a href="mailto:affiliate@workshub.space" className="underline font-medium text-red-300 hover:text-red-200 transition-colors">
              affiliate@workshub.space
            </a>{" "}
            لربط حسابك وتفعيل استلام العمولات تلقائياً
          </li>
        </ul>
      </div>
      <p className="text-sm text-red-200">
        بعد التفعيل، تتم معالجة المدفوعات واستلام عمولاتك بشكل آلي بالكامل دون أي
        تدخل يدوي منّا.
      </p>
    </div>
  </div>
</Alert>
            )}

            <Card className="mb-8 border-2 border-emerald-500/20 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10">
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <Share2 className="h-6 w-6 text-emerald-400" />
                  رابط الإحالة الخاص بك
                </CardTitle>
                <CardDescription className="text-base">
                  شارك هذا الرابط مع أصحاب الأعمال للحصول على عمولة 10%
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                {/* Referral Code */}
                <div className="space-y-3">
                  <label className="text-sm font-bold text-neutral-300">كود الإحالة:</label>
                  <div className="flex items-center gap-3">
                    <Input
                      value={affiliate.referral_code}
                      readOnly
                      className="font-mono text-2xl font-bold text-center bg-emerald-500/10 border-2 border-emerald-500/30 text-emerald-300"
                    />
                    <Button
                      onClick={copyReferralCode}
                      variant="outline"
                      size="lg"
                      className="gap-2 border-2 border-emerald-500/30 hover:bg-emerald-500/10 bg-transparent"
                    >
                      <Copy className="h-5 w-5" />
                      نسخ
                    </Button>
                  </div>
                </div>

                {/* Referral Link */}
                <div className="space-y-3">
                  <label className="text-sm font-bold text-neutral-300">الرابط الكامل للمشاركة:</label>
                  <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
                    <Input
                      value={`${
                        typeof window !== "undefined" ? window.location.origin : ""
                      }/auth/signup?ref=${affiliate.referral_code}`}
                      readOnly
                      className="flex-1 bg-neutral-900 border-2 border-neutral-700 text-sm font-mono"
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
                        className="gap-2 flex-1 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700"
                      >
                        <Share2 className="h-4 w-4" />
                        مشاركة
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Existing-client Referral Link */}
                <div className="space-y-3 pt-2 border-t border-neutral-800">
                  <label className="text-sm font-bold text-neutral-300">
                    رابط لعميل مسجّل مسبقاً (ينشر مشروع مباشرة بكودك):
                  </label>
                  <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
                    <Input
                      value={`${
                        typeof window !== "undefined" ? window.location.origin : ""
                      }/projects/new?ref=${affiliate.referral_code}`}
                      readOnly
                      className="flex-1 bg-neutral-900 border-2 border-neutral-700 text-sm font-mono"
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={copyExistingClientLink}
                        variant="outline"
                        size="lg"
                        className="gap-2 flex-1 border-2 bg-transparent"
                      >
                        <Copy className="h-4 w-4" />
                        نسخ الرابط
                      </Button>
                      <Button
                        onClick={shareExistingClientLink}
                        size="lg"
                        className="gap-2 flex-1 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700"
                      >
                        <Share2 className="h-4 w-4" />
                        مشاركة
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-neutral-500">
                    استخدم هذا الرابط مع أشخاص لديهم حساب بالفعل — يفتح صفحة نشر مشروع مباشرة بكود إحالتك مفعّل تلقائياً.
                  </p>
                </div>

                {/* Instructions */}
                <Alert className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border-emerald-500/30 border-2">
                  <AlertDescription className="space-y-3">
                    <h4 className="font-bold text-emerald-300 text-lg">كيف تستخدم رابط الإحالة؟</h4>
                    <ul className="list-disc list-inside space-y-2 text-neutral-300">
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
                    <div className="w-24 h-24 bg-neutral-900 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users className="h-12 w-12 text-neutral-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-neutral-300 mb-2">لا توجد إحالات حتى الآن</h3>
                    <p className="text-neutral-400 mb-6">ابدأ بمشاركة رابط الإحالة الخاص بك للحصول على أول عمولة</p>
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
                              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500/10 to-purple-500/15 rounded-full flex items-center justify-center">
                                <Users className="h-5 w-5 text-emerald-400" />
                              </div>
                              <div>
                                <p className="font-semibold">
                                  {(referral.profiles as any)?.full_name || "مستخدم جديد"}
                                </p>
                                <p className="text-sm text-neutral-400">
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
                                  <span className="text-neutral-400">المشروع: </span>
                                  <span className="font-medium">
                                    {(referral.projects as any)?.title || "مشروع محذوف"}
                                  </span>
                                </p>
                                <p className="text-sm">
                                  <span className="text-neutral-400">قيمة المشروع: </span>
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
                                <p className="text-xs text-neutral-400">عمولتك</p>
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
