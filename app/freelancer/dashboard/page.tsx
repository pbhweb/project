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
      const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

      if (profile?.role !== "freelancer") {
        router.push("/dashboard")
        return
      }

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
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">لوحة تحكم المستقل</h1>
          <p className="text-gray-600 mt-2">إدارة عروضك ومشاريعك وأرباحك</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-blue-600 font-medium">إجمالي العروض</p>
                <h3 className="text-3xl font-bold text-gray-900">{stats.total}</h3>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-orange-600 font-medium">قيد المراجعة</p>
                <h3 className="text-3xl font-bold text-gray-900">{stats.pending}</h3>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-green-600 font-medium">مقبولة</p>
                <h3 className="text-3xl font-bold text-gray-900">{stats.accepted}</h3>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-red-100">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-red-600 font-medium">مرفوضة</p>
                <h3 className="text-3xl font-bold text-gray-900">{stats.rejected}</h3>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-purple-600 font-medium">الأرباح</p>
                <h3 className="text-2xl font-bold text-gray-900">${stats.totalEarnings}</h3>
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
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Briefcase className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">لا توجد عروض حتى الآن</h3>
                <p className="text-gray-500 mb-6">تصفح المشاريع وابدأ بتقديم عروضك للحصول على فرص عمل</p>
                <Link href="/projects">
                  <Button>تصفح المشاريع</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {bids.map((bid) => (
                  <div key={bid.id} className="border rounded-xl p-6 hover:shadow-md transition-all">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{(bid.projects as any)?.title || "مشروع محذوف"}</h3>
                          {getStatusBadge(bid.status)}
                        </div>
                        <p className="text-gray-600 text-sm line-clamp-2 mb-3">{bid.proposal}</p>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1 font-semibold text-green-600">
                            <DollarSign className="h-4 w-4" />${bid.amount}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {bid.delivery_days} يوم
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(bid.created_at).toLocaleDateString("ar-SA")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
