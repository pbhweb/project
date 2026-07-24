"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Briefcase, DollarSign, Clock, CheckCircle2, XCircle } from "lucide-react"

export default function FreelancerDashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [bids, setBids] = useState<any[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    accepted: 0,
    rejected: 0,
    totalEarnings: 0,
  })

  useEffect(() => {
    loadFreelancerData()
  }, [])

  const loadFreelancerData = async () => {
    try {
      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push("/auth/login")
        return
      }

      // Check if user is a freelancer
      const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle()

      if (profile?.role !== "freelancer") {
        router.push("/dashboard")
        return
      }

      setProfile(profile)

      // Get freelancer bids
      const { data: bidsData } = await supabase
        .from("bids")
        .select("*, projects(title, budget_min, status)")
        .eq("freelancer_id", user.id)
        .order("created_at", { ascending: false })

      setBids(bidsData || [])

      // Get earnings
      const { data: transactions } = await supabase
        .from("transactions")
        .select("amount")
        .eq("user_id", user.id)
        .eq("type", "earning")
        .eq("status", "completed")

      const totalEarnings = transactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0

      // Calculate stats
      const stats = {
        total: bidsData?.length || 0,
        pending: bidsData?.filter((b) => b.status === "pending").length || 0,
        accepted: bidsData?.filter((b) => b.status === "accepted").length || 0,
        rejected: bidsData?.filter((b) => b.status === "rejected").length || 0,
        totalEarnings,
      }
      setStats(stats)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4">جاري التحميل...</p>
        </div>
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "قيد المراجعة", variant: "secondary" as const, icon: <Clock className="h-3 w-3" /> },
      accepted: { label: "مقبول", variant: "default" as const, icon: <CheckCircle2 className="h-3 w-3" /> },
      rejected: { label: "مرفوض", variant: "destructive" as const, icon: <XCircle className="h-3 w-3" /> },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    return (
      <Badge variant={config.variant} className="gap-1">
        {config.icon}
        {config.label}
      </Badge>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">لوحة تحكم المستقل</h1>
          <p className="text-neutral-400 mt-2">إدارة عروضك ومشاريعك وأرباحك</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {profile?.freelancer_gumroad_affiliate_id ? (
          <Alert className="mb-6 bg-green-950/40 border-2 border-green-500/40">
            <AlertDescription className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-green-400">✓</span>
              </div>
              <div>
                <p className="font-bold text-green-300 mb-1">نظام العمولات التلقائية مفعّل</p>
                <p className="text-sm text-green-400/90">
                  حسابك مربوط بمعرّف أفلييت على Gumroad — تستلم أرباح مشاريعك تلقائياً عبر
                  Gumroad دون أي تدخل يدوي منّا.
                </p>
              </div>
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="mb-8 border-2 border-neutral-700 bg-neutral-900/50">
  <AlertDescription className="space-y-3">
    <p className="font-bold text-white">
      ⚠️ حسابك غير قادر حالياً على استلام العمولات تلقائياً
    </p>
    <p className="text-sm text-neutral-300">
      الدفع يتم من طرف ثالث (Gumroad) بشكل آلي بالكامل  بتحويل العمولات
      يدوياً. إذا كانت لديك عمولات مستحقة وخاصية الاستلام التلقائي غير مفعّلة، إذا كانت لديك عمولات مستحقة وخاصية الاستلام التلقائي غير
      مفعّلة، الرجاء التواصل معنا . اذا كنت من دول محظوره تماما استخدام هذا منصه لا تفعل خاصية استلام عمولة تلقائيه مثل سوريا وسودان  

    </p>
    <p className="text-sm font-medium text-white">لتفعيل نظام العمولات التلقائية:</p>
    <ul className="list-decimal list-inside text-sm space-y-1 text-neutral-300">
      <li>
        سجّل حساباً على{" "}
        <a
          href="https://gumroad.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline font-medium text-white hover:text-neutral-200"
        >
          gumroad.com
        </a>
      </li>
      <li>
        تواصل معنا على{" "}
        <a href="mailto:freelancer@workshub.space" className="underline font-medium text-white hover:text-neutral-200">
          freelancer@workshub.space
        </a>{" "}
        لربط حسابك وتفعيل استلام العمولات تلقائياً
      </li>
    </ul>
    <p className="text-sm text-neutral-300">
      بعد التفعيل، تتم معالجة المدفوعات واستلام أرباحك بشكل آلي بالكامل دون أي تدخل
      يدوي منّا.
    </p>
  </AlertDescription>
</Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/10">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-emerald-400 font-medium">إجمالي العروض</p>
                <h3 className="text-3xl font-bold text-white">{stats.total}</h3>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/15">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-orange-600 font-medium">قيد المراجعة</p>
                <h3 className="text-3xl font-bold text-white">{stats.pending}</h3>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-green-500/15">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-green-600 font-medium">مقبولة</p>
                <h3 className="text-3xl font-bold text-white">{stats.accepted}</h3>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-500/10 to-red-500/15">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-red-600 font-medium">مرفوضة</p>
                <h3 className="text-3xl font-bold text-white">{stats.rejected}</h3>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/15">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-purple-600 font-medium">الأرباح</p>
                <h3 className="text-2xl font-bold text-white">${stats.totalEarnings}</h3>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>إجراءات سريعة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Link href="/projects" className="flex-1">
                <Button className="w-full bg-green-600 hover:bg-green-700">تصفح المشاريع المتاحة</Button>
              </Link>
              <Link href="/profile" className="flex-1">
                <Button variant="outline" className="w-full bg-transparent">
                  تحديث الملف الشخصي
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Bids List */}
        <Card>
          <CardHeader>
            <CardTitle>عروضي ({bids.length})</CardTitle>
            <CardDescription>قائمة بجميع العروض التي قدمتها</CardDescription>
          </CardHeader>
          <CardContent>
            {bids.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-neutral-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Briefcase className="h-12 w-12 text-neutral-500" />
                </div>
                <h3 className="text-lg font-semibold text-neutral-300 mb-2">لا توجد عروض حتى الآن</h3>
                <p className="text-neutral-400 mb-6">تصفح المشاريع وابدأ بتقديم عروضك للحصول على فرص عمل</p>
                <Link href="/projects">
                  <Button>تصفح المشاريع</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {bids.map((bid) => (
                  <Link
                    href={`/projects/${bid.project_id}`}
                    key={bid.id}
                    className="block border rounded-xl p-6 hover:shadow-md hover:border-emerald-500/40 transition-all cursor-pointer"
                  >
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{(bid.projects as any)?.title || "مشروع محذوف"}</h3>
                          {getStatusBadge(bid.status)}
                        </div>
                        <p className="text-neutral-400 text-sm line-clamp-2 mb-3">{bid.proposal}</p>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-400">
                          <span className="flex items-center gap-1 font-semibold text-green-600">
                            <DollarSign className="h-4 w-4" />${bid.amount}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {bid.delivery_days} يوم
                          </span>
                          <span className="text-xs text-neutral-500">
                            {new Date(bid.created_at).toLocaleDateString("ar-SA")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
