"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import {
  Briefcase,
  DollarSign,
  Users,
  TrendingUp,
  FileText,
  MessageSquare,
  Bell,
  Clock,
  CheckCircle,
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    totalEarnings: 0,
    pendingBids: 0,
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/login");
        return;
      }

      // Get user profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      setUserProfile(profile);

      // Load statistics based on user role
      if (profile.role === "client") {
        const { data: projects } = await supabase
          .from("projects")
          .select("*")
          .eq("client_id", user.id);

        const { data: bids } = await supabase
          .from("bids")
          .select("*")
          .in("project_id", projects?.map((p) => p.id) || []);

        setStats({
          totalProjects: projects?.length || 0,
          activeProjects:
            projects?.filter((p) => p.status === "in_progress").length || 0,
          totalEarnings: 0, // Clients don't earn
          pendingBids: bids?.filter((b) => b.status === "pending").length || 0,
        });
      } else if (profile.role === "freelancer") {
        const { data: bids } = await supabase
          .from("bids")
          .select("*")
          .eq("freelancer_id", user.id);

        const { data: transactions } = await supabase
          .from("transactions")
          .select("amount")
          .eq("user_id", user.id)
          .eq("status", "completed")
          .eq("type", "commission");

        const totalEarnings =
          transactions?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;

        setStats({
          totalProjects:
            bids?.filter((b) => b.status === "accepted").length || 0,
          activeProjects:
            bids?.filter((b) => b.status === "accepted").length || 0,
          totalEarnings,
          pendingBids: bids?.filter((b) => b.status === "pending").length || 0,
        });
      } else if (profile.role === "affiliate") {
        const { data: affiliate } = await supabase
          .from("affiliates")
          .select("*")
          .eq("user_id", user.id)
          .single();

        setStats({
          totalProjects: affiliate?.total_referrals || 0,
          activeProjects: 0,
          totalEarnings: affiliate?.total_earnings || 0,
          pendingBids: 0,
        });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4">جاري تحميل لوحة التحكم...</p>
        </div>
      </div>
    );
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "client":
        return <Briefcase className="h-6 w-6 text-blue-600" />;
      case "freelancer":
        return <Users className="h-6 w-6 text-green-600" />;
      case "affiliate":
        return <DollarSign className="h-6 w-6 text-purple-600" />;
      default:
        return <Users className="h-6 w-6 text-gray-600" />;
    }
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case "client":
        return "صاحب عمل";
      case "freelancer":
        return "مستقل";
      case "affiliate":
        return "مسوق عمولة";
      default:
        return "مستخدم";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">لوحة التحكم</h1>
              <p className="text-gray-600 mt-2">
                مرحباً بك، {userProfile?.full_name}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg">
                {getRoleIcon(userProfile?.role)}
                <span className="font-medium">
                  {getRoleName(userProfile?.role)}
                </span>
              </div>
              <Link href="/profile">
                <Button variant="outline">الملف الشخصي</Button>
              </Link>
            </div>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">المشاريع الكلية</p>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {stats.totalProjects}
                  </h3>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Briefcase className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">المشاريع النشطة</p>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {stats.activeProjects}
                  </h3>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">إجمالي الأرباح</p>
                  <h3 className="text-2xl font-bold text-gray-900">
                    ${stats.totalEarnings}
                  </h3>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">العروض المعلقة</p>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {stats.pendingBids}
                  </h3>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full md:w-auto grid-cols-3">
            <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
            <TabsTrigger value="quick-actions">إجراءات سريعة</TabsTrigger>
            <TabsTrigger value="recent">النشاط الأخير</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Role Specific Dashboard */}
            {userProfile?.role === "client" && (
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Briefcase className="h-5 w-5" />
                      مشاريعي
                    </CardTitle>
                    <CardDescription>
                      إدارة المشاريع التي نشرتها
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Link href="/projects/new">
                        <Button className="w-full">نشر مشروع جديد</Button>
                      </Link>
                      <Link href="/my-projects">
                        <Button variant="outline" className="w-full">
                          عرض جميع المشاريع
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      العروض الواردة
                    </CardTitle>
                    <CardDescription>
                      عروض المستقلين على مشاريعك
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Link href="/my-bids">
                        <Button className="w-full">عرض جميع العروض</Button>
                      </Link>
                      <div className="text-center">
                        <p className="text-sm text-gray-500">
                          لديك {stats.pendingBids} عرض معلق
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {userProfile?.role === "freelancer" && (
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      المشاريع المتاحة
                    </CardTitle>
                    <CardDescription>
                      ابحث عن مشاريع تناسب مهاراتك
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Link href="/projects">
                        <Button className="w-full">تصفح المشاريع</Button>
                      </Link>
                      <Link href="/my-bids">
                        <Button variant="outline" className="w-full">
                          عروضي المقدمة
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      أرباحي
                    </CardTitle>
                    <CardDescription>
                      تتبع أرباحك من المشاريع المكتملة
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center space-y-4">
                      <div className="text-3xl font-bold text-green-600">
                        ${stats.totalEarnings}
                      </div>
                      <p className="text-sm text-gray-500">إجمالي الأرباح</p>
                      <Link href="/transactions">
                        <Button variant="outline" className="w-full">
                          عرض المعاملات
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {userProfile?.role === "affiliate" && (
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      برنامج المسوقين
                    </CardTitle>
                    <CardDescription>إدارة كود الإحالة وأرباحك</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Link href="/affiliate">
                        <Button className="w-full">لوحة المسوقين</Button>
                      </Link>
                      <div className="text-center">
                        <p className="text-sm text-gray-500">
                          لديك {stats.totalProjects} إحالة
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      أرباح الإحالة
                    </CardTitle>
                    <CardDescription>
                      تحصل على 10% من كل مشروع عبر رابطك
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center space-y-4">
                      <div className="text-3xl font-bold text-purple-600">
                        ${stats.totalEarnings}
                      </div>
                      <p className="text-sm text-gray-500">
                        إجمالي أرباح الإحالة
                      </p>
                      <Link href="/transactions">
                        <Button variant="outline" className="w-full">
                          سحب الأرباح
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="quick-actions" className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userProfile?.role === "client" && (
                <>
                  <Link href="/projects/new">
                    <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                      <CardContent className="pt-6 text-center">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <FileText className="h-6 w-6 text-blue-600" />
                        </div>
                        <h3 className="font-semibold">نشر مشروع جديد</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          ابدأ مشروعك بحد أدنى 300$
                        </p>
                      </CardContent>
                    </Card>
                  </Link>

                  <Link href="/my-bids">
                    <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                      <CardContent className="pt-6 text-center">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <CheckCircle className="h-6 w-6 text-green-600" />
                        </div>
                        <h3 className="font-semibold">مراجعة العروض</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          قبول أو رفض عروض المستقلين
                        </p>
                      </CardContent>
                    </Card>
                  </Link>

                  <Link href="/profile">
                    <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                      <CardContent className="pt-6 text-center">
                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Users className="h-6 w-6 text-purple-600" />
                        </div>
                        <h3 className="font-semibold">تعديل الملف الشخصي</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          حدث معلومات التواصل الخاصة بك
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                </>
              )}

              {userProfile?.role === "freelancer" && (
                <>
                  <Link href="/projects">
                    <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                      <CardContent className="pt-6 text-center">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Briefcase className="h-6 w-6 text-blue-600" />
                        </div>
                        <h3 className="font-semibold">تصفح المشاريع</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          ابحث عن مشاريع تناسب مهاراتك
                        </p>
                      </CardContent>
                    </Card>
                  </Link>

                  <Link href="/my-bids">
                    <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                      <CardContent className="pt-6 text-center">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <FileText className="h-6 w-6 text-green-600" />
                        </div>
                        <h3 className="font-semibold">عروضي</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          عرض وتعديل العروض المقدمة
                        </p>
                      </CardContent>
                    </Card>
                  </Link>

                  <Link href="/transactions">
                    <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                      <CardContent className="pt-6 text-center">
                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <DollarSign className="h-6 w-6 text-purple-600" />
                        </div>
                        <h3 className="font-semibold">أرباحي</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          تتبع ونسحب أرباحك (20% عمولة)
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                </>
              )}

              {userProfile?.role === "affiliate" && (
                <>
                  <Link href="/affiliate">
                    <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                      <CardContent className="pt-6 text-center">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <DollarSign className="h-6 w-6 text-blue-600" />
                        </div>
                        <h3 className="font-semibold">كود الإحالة</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          شارك رابطك واحصل على 10% عمولة
                        </p>
                      </CardContent>
                    </Card>
                  </Link>

                  <Link href="/transactions">
                    <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                      <CardContent className="pt-6 text-center">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <TrendingUp className="h-6 w-6 text-green-600" />
                        </div>
                        <h3 className="font-semibold">سحب الأرباح</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          انسحب أرباح الإحالة الخاصة بك
                        </p>
                      </CardContent>
                    </Card>
                  </Link>

                  <Link href="/profile">
                    <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                      <CardContent className="pt-6 text-center">
                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Users className="h-6 w-6 text-purple-600" />
                        </div>
                        <h3 className="font-semibold">الملف الشخصي</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          حدث معلوماتك الشخصية
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="recent">
            <Card>
              <CardHeader>
                <CardTitle>النشاط الأخير</CardTitle>
                <CardDescription>آخر التحديثات في حسابك</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Bell className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">مرحباً بك في المنصة</p>
                      <p className="text-sm text-gray-500">
                        تم إنشاء حسابك بنجاح
                      </p>
                    </div>
                    <span className="text-sm text-gray-500">الآن</span>
                  </div>

                  {userProfile?.role === "freelancer" && (
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <DollarSign className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">يمكنك البدء بالربح</p>
                        <p className="text-sm text-gray-500">
                          احصل على 20% عمولة من كل مشروع
                        </p>
                      </div>
                      <span className="text-sm text-gray-500">منذ قليل</span>
                    </div>
                  )}

                  {userProfile?.role === "affiliate" && (
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <TrendingUp className="h-5 w-5 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">ابدأ بالتسويق</p>
                        <p className="text-sm text-gray-500">
                          احصل على 10% عمولة على كل إحالة
                        </p>
                      </div>
                      <span className="text-sm text-gray-500">منذ قليل</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
