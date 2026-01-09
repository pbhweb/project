"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  DollarSign,
  Clock,
  User,
  Calendar,
  Briefcase,
  TrendingUp,
  Eye,
  FileText,
  CheckCircle,
  XCircle,
  ClockIcon,
} from "lucide-react";
import Link from "next/link";

export default function MyBidsPage() {
  const router = useRouter();
  const [bids, setBids] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    loadMyBids();
  }, []);

  const loadMyBids = async () => {
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

      // Load bids
      const { data: bidsData } = await supabase
        .from("bids")
        .select(
          `
          *,
          projects:project_id (
            *,
            profiles:client_id (full_name, phone)
          )
        `
        )
        .eq("freelancer_id", user.id)
        .order("created_at", { ascending: false });

      setBids(bidsData || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <ClockIcon className="h-4 w-4 text-yellow-600" />;
      case "accepted":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "withdrawn":
        return <XCircle className="h-4 w-4 text-gray-600" />;
      default:
        return <ClockIcon className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "⏳ معلق";
      case "accepted":
        return "✅ مقبول";
      case "rejected":
        return "❌ مرفوض";
      case "withdrawn":
        return "↩️ مسحوب";
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "accepted":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "withdrawn":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const calculateEarnings = () => {
    return bids
      .filter((bid) => bid.status === "accepted")
      .reduce((sum, bid) => sum + (bid.freelancer_commission || 0), 0);
  };

  const activeBids = bids.filter((bid) => bid.status === "pending");
  const acceptedBids = bids.filter((bid) => bid.status === "accepted");
  const rejectedBids = bids.filter((bid) => bid.status === "rejected");

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4">جاري تحميل عروضك...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">عروضي</h1>
        <p className="text-gray-600">
          إدارة وتتبع جميع العروض التي قدمتها على المشاريع
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">إجمالي العروض</p>
                <h3 className="text-2xl font-bold text-gray-900">
                  {bids.length}
                </h3>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">العروض النشطة</p>
                <h3 className="text-2xl font-bold text-gray-900">
                  {activeBids.length}
                </h3>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">العروض المقبولة</p>
                <h3 className="text-2xl font-bold text-gray-900">
                  {acceptedBids.length}
                </h3>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">الأرباح المتوقعة</p>
                <h3 className="text-2xl font-bold text-gray-900">
                  ${calculateEarnings()}
                </h3>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="grid w-full md:w-auto grid-cols-4">
          <TabsTrigger value="all">جميع العروض</TabsTrigger>
          <TabsTrigger value="active">نشطة</TabsTrigger>
          <TabsTrigger value="accepted">مقبولة</TabsTrigger>
          <TabsTrigger value="rejected">مرفوضة</TabsTrigger>
        </TabsList>

        {/* All Bids */}
        <TabsContent value="all">
          {bids.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  لا توجد عروض
                </h3>
                <p className="text-gray-500 mb-6">
                  لم تقدم أي عروض على المشاريع حتى الآن
                </p>
                <Link href="/projects">
                  <Button className="gap-2">
                    <Eye className="h-4 w-4" />
                    تصفح المشاريع المتاحة
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {bids.map((bid) => (
                <BidCard key={bid.id} bid={bid} showProject={true} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Active Bids */}
        <TabsContent value="active">
          {activeBids.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Clock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  لا توجد عروض نشطة
                </h3>
                <p className="text-gray-500">جميع عروضك إما مقبولة أو مرفوضة</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {activeBids.map((bid) => (
                <BidCard key={bid.id} bid={bid} showProject={true} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Accepted Bids */}
        <TabsContent value="accepted">
          {acceptedBids.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  لا توجد عروض مقبولة
                </h3>
                <p className="text-gray-500">لم يقبل أي من عروضك حتى الآن</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {acceptedBids.map((bid) => (
                <BidCard
                  key={bid.id}
                  bid={bid}
                  showProject={true}
                  showClientInfo={true}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Rejected Bids */}
        <TabsContent value="rejected">
          {rejectedBids.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <XCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  لا توجد عروض مرفوضة
                </h3>
                <p className="text-gray-500">
                  جميع عروضك إما مقبولة أو قيد المراجعة
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {rejectedBids.map((bid) => (
                <BidCard key={bid.id} bid={bid} showProject={true} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Earnings Summary */}
      {acceptedBids.length > 0 && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              ملخص الأرباح
            </CardTitle>
            <CardDescription>تفاصيل أرباحك من العروض المقبولة</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">
                      المشروع
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">
                      قيمة العرض
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">
                      العمولة (20%)
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">
                      الحالة
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {acceptedBids.map((bid) => (
                    <tr key={bid.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <Link
                          href={`/projects/${bid.project_id}`}
                          className="font-medium text-blue-600 hover:underline"
                        >
                          {bid.projects?.title}
                        </Link>
                      </td>
                      <td className="py-3 px-4 font-medium">${bid.amount}</td>
                      <td className="py-3 px-4 font-bold text-green-600">
                        $
                        {bid.freelancer_commission ||
                          (bid.amount * 0.2).toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={getStatusColor(bid.status)}>
                          {getStatusText(bid.status)}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50">
                    <td className="py-3 px-4 font-bold" colSpan={2}>
                      الإجمالي:
                    </td>
                    <td className="py-3 px-4 font-bold text-green-600">
                      ${calculateEarnings()}
                    </td>
                    <td className="py-3 px-4"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
          <CardFooter>
            <Link href="/transactions" className="w-full">
              <Button variant="outline" className="w-full">
                عرض جميع المعاملات
              </Button>
            </Link>
          </CardFooter>
        </Card>
      )}

      {/* CTA */}
      <div className="mt-8 text-center">
        <Link href="/projects">
          <Button size="lg" className="gap-2">
            <Eye className="h-4 w-4" />
            تصفح المشاريع المتاحة
          </Button>
        </Link>
      </div>
    </div>
  );
}

// Bid Card Component
function BidCard({
  bid,
  showProject = false,
  showClientInfo = false,
}: {
  bid: any;
  showProject?: boolean;
  showClientInfo?: boolean;
}) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "accepted":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "withdrawn":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "⏳ معلق";
      case "accepted":
        return "✅ مقبول";
      case "rejected":
        return "❌ مرفوض";
      case "withdrawn":
        return "↩️ مسحوب";
      default:
        return status;
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          {/* Left Column - Bid Details */}
          <div className="flex-1 space-y-4">
            {showProject && bid.projects && (
              <div className="mb-4">
                <h3 className="font-bold text-lg mb-1">{bid.projects.title}</h3>
                <p className="text-gray-600 text-sm line-clamp-2">
                  {bid.projects.description}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-gray-500">قيمة العرض</p>
                <p className="font-bold text-lg text-green-600">
                  ${bid.amount}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-gray-500">مدة التسليم</p>
                <p className="font-bold">{bid.delivery_days} يوم</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-gray-500">عمولتك</p>
                <p className="font-bold text-purple-600">
                  ${bid.freelancer_commission || (bid.amount * 0.2).toFixed(2)}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-gray-500">التاريخ</p>
                <p className="font-medium">
                  {new Date(bid.created_at).toLocaleDateString("ar-SA")}
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-500 mb-1">وصف العرض:</p>
              <p className="text-gray-700 whitespace-pre-line line-clamp-3">
                {bid.proposal}
              </p>
            </div>

            {showClientInfo &&
              bid.status === "accepted" &&
              bid.projects?.profiles && (
                <Alert className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                  <AlertDescription>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">معلومات العميل:</p>
                        <p className="text-sm">
                          {bid.projects.profiles.full_name}
                        </p>
                        <p className="text-sm font-bold mt-1">
                          {bid.projects.profiles.phone}
                        </p>
                      </div>
                      <div className="text-sm text-gray-500">
                        رقم الهاتف ظاهر لك لأن عرضك مقبول
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
          </div>

          {/* Right Column - Status & Actions */}
          <div className="flex flex-col items-end gap-4">
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(bid.status)}>
                {getStatusText(bid.status)}
              </Badge>
            </div>

            <div className="flex flex-col gap-2">
              <Link href={`/projects/${bid.project_id}`}>
                <Button variant="outline" size="sm" className="gap-2">
                  <Eye className="h-4 w-4" />
                  عرض المشروع
                </Button>
              </Link>

              {bid.status === "pending" && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 text-red-600"
                >
                  <XCircle className="h-4 w-4" />
                  سحب العرض
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
