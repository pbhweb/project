import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Briefcase, FileText, DollarSign, Users, CheckCircle, TrendingUp, Link2, Target } from "lucide-react"
import { handleSignOut } from "@/lib/auth" // Import handleSignOut function

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile, error: profileError } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  // If profile doesn't exist, create it from user metadata
  if (profileError || !profile) {
    const { data: newProfile } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        full_name: user.email?.split("@")[0] || "مستخدم جديد",
        role: "freelancer",
      })
      .select()
      .single()

    if (newProfile) {
      redirect("/dashboard")
    } else {
      // If still can't create, redirect to signup
      redirect("/auth/signup")
    }
  }

  const stats = {
    activeProjects: 0,
    totalBids: 0,
    totalEarnings: 0,
    completedProjects: 0,
    receivedBids: 0,
    totalSpent: 0,
    referrals: 0,
    commissionEarnings: 0,
  }

  if (profile?.role === "freelancer") {
    // إحصائيات المستقل
    const { count: bidsCount } = await supabase
      .from("bids")
      .select("*", { count: "exact", head: true })
      .eq("freelancer_id", user.id)

    const { count: activeProjectsCount } = await supabase
      .from("bids")
      .select("*", { count: "exact", head: true })
      .eq("freelancer_id", user.id)
      .eq("status", "accepted")

    const { data: transactions } = await supabase
      .from("transactions")
      .select("amount")
      .eq("user_id", user.id)
      .eq("type", "earning")

    stats.totalBids = bidsCount || 0
    stats.activeProjects = activeProjectsCount || 0
    stats.totalEarnings = transactions?.reduce((sum, t) => sum + t.amount, 0) || 0
  } else if (profile?.role === "business_owner") {
    // إحصائيات صاحب العمل
    const { count: projectsCount } = await supabase
      .from("projects")
      .select("*", { count: "exact", head: true })
      .eq("client_id", user.id)

    const { count: completedCount } = await supabase
      .from("projects")
      .select("*", { count: "exact", head: true })
      .eq("client_id", user.id)
      .eq("status", "completed")

    const { data: projectIds } = await supabase.from("projects").select("id").eq("client_id", user.id)

    if (projectIds && projectIds.length > 0) {
      const { count: bidsCount } = await supabase
        .from("bids")
        .select("*", { count: "exact", head: true })
        .in(
          "project_id",
          projectIds.map((p) => p.id),
        )

      stats.receivedBids = bidsCount || 0
    }

    const { data: transactions } = await supabase
      .from("transactions")
      .select("amount")
      .eq("user_id", user.id)
      .eq("type", "payment")

    stats.activeProjects = projectsCount || 0
    stats.completedProjects = completedCount || 0
    stats.totalSpent = transactions?.reduce((sum, t) => sum + t.amount, 0) || 0
  } else if (profile?.role === "affiliate") {
    // إحصائيات المسوق
    const { data: affiliate } = await supabase.from("affiliates").select("*").eq("user_id", user.id).single()

    if (affiliate) {
      const { count: referralsCount } = await supabase
        .from("referrals")
        .select("*", { count: "exact", head: true })
        .eq("affiliate_id", affiliate.id)

      const { data: transactions } = await supabase
        .from("transactions")
        .select("amount")
        .eq("user_id", user.id)
        .eq("type", "commission")

      stats.referrals = referralsCount || 0
      stats.commissionEarnings = transactions?.reduce((sum, t) => sum + t.amount, 0) || 0
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">W</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">WorkHub</h1>
              <p className="text-xs text-slate-500">لوحة التحكم</p>
            </div>
          </div>
          <form action={handleSignOut}>
            <Button variant="outline" type="submit" size="sm">
              تسجيل الخروج
            </Button>
          </form>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <Card className="border-none shadow-lg bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
            <CardHeader>
              <CardTitle className="text-3xl">مرحباً، {profile?.full_name} 👋</CardTitle>
              <p className="text-blue-100 mt-2">
                {profile?.role === "freelancer" && "ابحث عن مشاريع جديدة وابدأ العمل"}
                {profile?.role === "business_owner" && "أنشر مشاريعك واحصل على أفضل العروض"}
                {profile?.role === "affiliate" && "شارك رابطك واحصل على عمولة 10%"}
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {profile?.role === "business_owner" && (
                  <>
                    <Link href="/projects/new">
                      <Button size="lg" variant="secondary" className="bg-white text-blue-700 hover:bg-blue-50">
                        <FileText className="mr-2 h-5 w-5" />
                        نشر مشروع جديد
                      </Button>
                    </Link>
                    <Link href="/projects">
                      <Button size="lg" variant="ghost" className="text-white border-white/30 hover:bg-white/10">
                        عرض مشاريعي
                      </Button>
                    </Link>
                  </>
                )}
                {profile?.role === "freelancer" && (
                  <>
                    <Link href="/projects">
                      <Button size="lg" variant="secondary" className="bg-white text-blue-700 hover:bg-blue-50">
                        <Briefcase className="mr-2 h-5 w-5" />
                        تصفح المشاريع
                      </Button>
                    </Link>
                    <Link href="/transactions">
                      <Button size="lg" variant="ghost" className="text-white border-white/30 hover:bg-white/10">
                        الأرباح
                      </Button>
                    </Link>
                  </>
                )}
                {profile?.role === "affiliate" && (
                  <>
                    <Link href="/affiliate/dashboard">
                      <Button size="lg" variant="secondary" className="bg-white text-blue-700 hover:bg-blue-50">
                        <Link2 className="mr-2 h-5 w-5" />
                        لوحة الأفلييت
                      </Button>
                    </Link>
                    <Link href="/transactions">
                      <Button size="lg" variant="ghost" className="text-white border-white/30 hover:bg-white/10">
                        أرباح العمولة
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {profile?.role === "freelancer" && (
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">العروض المقدمة</CardTitle>
                  <FileText className="h-5 w-5 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-slate-900">{stats.totalBids}</div>
                  <p className="text-xs text-slate-500 mt-1">إجمالي العروض</p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">المشاريع النشطة</CardTitle>
                  <Briefcase className="h-5 w-5 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-slate-900">{stats.activeProjects}</div>
                  <p className="text-xs text-slate-500 mt-1">مشاريع قيد التنفيذ</p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">الأرباح الكلية</CardTitle>
                  <DollarSign className="h-5 w-5 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-slate-900">${stats.totalEarnings.toFixed(2)}</div>
                  <p className="text-xs text-slate-500 mt-1">إجمالي الأرباح</p>
                </CardContent>
              </Card>
            </div>
          )}

          {profile?.role === "business_owner" && (
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">مشاريعي النشطة</CardTitle>
                  <Briefcase className="h-5 w-5 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-slate-900">{stats.activeProjects}</div>
                  <p className="text-xs text-slate-500 mt-1">مشروع منشور</p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">العروض المستلمة</CardTitle>
                  <Users className="h-5 w-5 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-slate-900">{stats.receivedBids}</div>
                  <p className="text-xs text-slate-500 mt-1">عرض من مستقلين</p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">المشاريع المكتملة</CardTitle>
                  <CheckCircle className="h-5 w-5 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-slate-900">{stats.completedProjects}</div>
                  <p className="text-xs text-slate-500 mt-1">مشروع منجز</p>
                </CardContent>
              </Card>
            </div>
          )}

          {profile?.role === "affiliate" && (
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">عدد الإحالات</CardTitle>
                  <Users className="h-5 w-5 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-slate-900">{stats.referrals}</div>
                  <p className="text-xs text-slate-500 mt-1">إحالة ناجحة</p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">أرباح العمولة</CardTitle>
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-slate-900">${stats.commissionEarnings.toFixed(2)}</div>
                  <p className="text-xs text-slate-500 mt-1">عمولة 10%</p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">معدل التحويل</CardTitle>
                  <Target className="h-5 w-5 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-slate-900">{stats.referrals > 0 ? "100%" : "0%"}</div>
                  <p className="text-xs text-slate-500 mt-1">نسبة النجاح</p>
                </CardContent>
              </Card>
            </div>
          )}

          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle>النشاط الأخير</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-slate-500">
                <p>لا يوجد نشاط حديث</p>
                <p className="text-sm mt-2">
                  {profile?.role === "freelancer" && "ابدأ بتقديم عروضك على المشاريع"}
                  {profile?.role === "business_owner" && "انشر مشروعك الأول لتبدأ"}
                  {profile?.role === "affiliate" && "شارك رابط الإحالة الخاص بك"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
