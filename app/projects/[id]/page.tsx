"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  DollarSign,
  Clock,
  User,
  FileText,
  MessageSquare,
  Users,
  Calendar,
  Briefcase,
  Download,
  Eye,
} from "lucide-react"
import Link from "next/link"

export default function ProjectDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const [project, setProject] = useState<any>(null)
  const [client, setClient] = useState<any>(null)
  const [bids, setBids] = useState<any[]>([])
  const [files, setFiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [showBidForm, setShowBidForm] = useState(false)
  const [bidAmount, setBidAmount] = useState("")
  const [bidDays, setBidDays] = useState("")
  const [bidProposal, setBidProposal] = useState("")
  const [submittingBid, setSubmittingBid] = useState(false)

  useEffect(() => {
    loadProjectData()
  }, [projectId])

  const loadProjectData = async () => {
    try {
      const supabase = createClient()

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()
        setUserProfile(profile)
      }

      // Load project
      const { data: projectData, error: projectError } = await supabase
        .from("projects")
        .select(
          `
          *,
          profiles:client_id (*)
        `,
        )
        .eq("id", projectId)
        .single()

      if (projectError) throw projectError

      setProject(projectData)
      setClient(projectData.profiles)

      // Load bids
      const { data: bidsData } = await supabase
  .from("bids")
  .select("*") // <-- لا نجلب أي بيانات من جداول أخرى
  .eq("project_id", projectId)
  .order("created_at", { ascending: false })

setBids(bidsData || [])

      // Load files
      const { data: filesData } = await supabase
        .from("project_files")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })

      setFiles(filesData || [])
    } catch (err: any) {
      setError(err.message || "حدث خطأ أثناء تحميل بيانات المشروع")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitBid = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmittingBid(true)
    setError(null)

    try {
      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("يجب تسجيل الدخول")

      if (userProfile?.role !== "freelancer") {
        throw new Error("يجب أن تكون مستقل لتقديم عروض")
      }

      const amount = Number.parseFloat(bidAmount)
      if (amount < 300) {
        throw new Error("قيمة العرض يجب أن تكون 300$ على الأقل")
      }
      if (amount < project.budget_min) {
        throw new Error("قيمة العرض أقل من الميزانية الدنيا للمشروع")
      }

      const containsContact =
        bidProposal.match(/\d{10,}/) ||
        bidProposal.match(/@[A-Za-z0-9._%+-]+\.[A-Za-z]{2,}/) ||
        bidProposal.match(/(whatsapp|telegram|signal|viber)/i)

      if (containsContact) {
        throw new Error("لا يمكن إضافة معلومات اتصال في وصف العرض")
      }

      const { data, error: bidError } = await supabase.rpc("create_bid", {
        p_project_id: projectId,
        p_freelancer_id: user.id,
        p_amount: amount,
        p_delivery_days: Number.parseInt(bidDays),
        p_proposal: bidProposal,
      })

      if (bidError) {
        console.error("[v0] Bid error:", bidError)
        throw new Error(bidError.message || "فشل تقديم العرض")
      }

      console.log("[v0] Bid created successfully:", data)

      await loadProjectData()
      setShowBidForm(false)
      setBidAmount("")
      setBidDays("")
      setBidProposal("")

      alert("✓ تم تقديم عرضك بنجاح!")
    } catch (err: any) {
      console.error("[v0] Submit bid error:", err)
      setError(err.message || "حدث خطأ أثناء تقديم العرض")
    } finally {
      setSubmittingBid(false)
    }
  }

  const calculateAverageRating = (reviews: any[]) => {
    if (!reviews || reviews.length === 0) return 0
    const sum = reviews.reduce((total, review) => total + (review.rating || 0), 0)
    return sum / reviews.length
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      open: "bg-green-100 text-green-800",
      in_progress: "bg-blue-100 text-blue-800",
      completed: "bg-gray-100 text-gray-800",
      cancelled: "bg-red-100 text-red-800",
    }
    return colors[status] || "bg-gray-100 text-gray-800"
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4">جاري تحميل بيانات المشروع...</p>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertDescription>المشروع غير موجود أو تم حذفه</AlertDescription>
        </Alert>
        <Link href="/projects" className="mt-4 inline-block">
          <Button>عودة إلى قائمة المشاريع</Button>
        </Link>
      </div>
    )
  }

  const canBid =
    project.status === "open" &&
    userProfile?.role === "freelancer" &&
    !bids.some((bid) => bid.freelancer_id === userProfile?.id)

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Project Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Badge className={getStatusColor(project.status)}>
                {project.status === "open" && "مفتوح"}
                {project.status === "in_progress" && "قيد التنفيذ"}
                {project.status === "completed" && "مكتمل"}
                {project.status === "cancelled" && "ملغي"}
              </Badge>
              <Badge variant="outline">
                {project.category === "web-design" && "تصميم مواقع"}
                {project.category === "mobile-app" && "تطبيقات جوال"}
                {project.category === "graphic-design" && "تصميم جرافيك"}
                {project.category === "writing" && "كتابة ومحتوى"}
                {project.category === "marketing" && "تسويق"}
                {project.category === "programming" && "برمجة"}
              </Badge>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{project.title}</h1>
            <p className="text-gray-600">نشر {new Date(project.created_at).toLocaleDateString("ar-SA")}</p>
          </div>

          {project.client_id === userProfile?.id ? (
            <div className="flex gap-2">
              <Link href={`/projects/${projectId}/edit`}>
                <Button variant="outline">تعديل المشروع</Button>
              </Link>
              <Link href="/my-projects">
                <Button>مشاريعي</Button>
              </Link>
            </div>
          ) : canBid ? (
            <Button
              onClick={() => setShowBidForm(true)}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              تقديم عرض
            </Button>
          ) : null}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-3 p-3 bg-white border rounded-lg">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">الميزانية</p>
              <p className="font-bold text-lg">
                ${project.budget_min}
                {project.budget_max && ` - $${project.budget_max}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-white border rounded-lg">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Clock className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">الوقت المقدر</p>
              <p className="font-bold text-lg">
                {project.estimated_hours ? `${project.estimated_hours} ساعة` : "غير محدد"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-white border rounded-lg">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <Users className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">العروض</p>
              <p className="font-bold text-lg">{bids.length} عرض</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-white border rounded-lg">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <Calendar className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">الموعد النهائي</p>
              <p className="font-bold text-lg">
                {project.deadline ? new Date(project.deadline).toLocaleDateString("ar-SA") : "غير محدد"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid md:grid-cols-3 gap-8">
        {/* Left Column - Project Details */}
        <div className="md:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                وصف المشروع
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <p className="whitespace-pre-line">{project.description}</p>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="bids">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="bids">
                <MessageSquare className="h-4 w-4 ml-2" />
                العروض ({bids.length})
              </TabsTrigger>
              <TabsTrigger value="files">
                <FileText className="h-4 w-4 ml-2" />
                الملفات ({files.length})
              </TabsTrigger>
              <TabsTrigger value="info">
                <User className="h-4 w-4 ml-2" />
                معلومات الناشر
              </TabsTrigger>
            </TabsList>

            <TabsContent value="bids" className="space-y-4">
              {bids.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">لا توجد عروض حتى الآن</h3>
                    <p className="text-gray-500">كن أول من يقدم عرضاً على هذا المشروع</p>
                  </CardContent>
                </Card>
              ) : (
                bids.map((bid) => (
                  <Card key={bid.id}>
                    <CardContent className="pt-6">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                              <User className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                              <h4 className="font-bold">{bid.profiles?.full_name}</h4>
                              <div className="flex items-center gap-2">
                                <div className="flex items-center">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <svg
                                      key={star}
                                      className={`h-4 w-4 ${
                                        star <= Math.round(calculateAverageRating(bid.reviews || []))
                                          ? "text-yellow-400 fill-yellow-400"
                                          : "text-gray-300"
                                      }`}
                                      viewBox="0 0 20 20"
                                      fill="currentColor"
                                    >
                                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                  ))}
                                </div>
                                <span className="text-sm text-gray-600">
                                  {calculateAverageRating(bid.reviews || []).toFixed(1)}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="mb-4">
                            <p className="text-gray-700 whitespace-pre-line">{bid.proposal}</p>
                          </div>

                          <div className="flex flex-wrap gap-4">
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-green-600" />
                              <span className="font-bold text-green-600">${bid.amount}</span>
                              <span className="text-sm text-gray-500">قيمة العرض</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-blue-600" />
                              <span className="font-bold">{bid.delivery_days} يوم</span>
                              <span className="text-sm text-gray-500">مدة التسليم</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Briefcase className="h-4 w-4 text-purple-600" />
                              <span className="font-bold text-purple-600">${(bid.amount * 0.2).toFixed(2)}</span>
                              <span className="text-sm text-gray-500">عمولة المستقل (20%)</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          <Badge
                            variant={
                              bid.status === "accepted" ? "default" : bid.status === "pending" ? "outline" : "secondary"
                            }
                          >
                            {bid.status === "pending" && "⏳ معلق"}
                            {bid.status === "accepted" && "✅ مقبول"}
                            {bid.status === "rejected" && "❌ مرفوض"}
                            {bid.status === "withdrawn" && "↩️ مسحوب"}
                          </Badge>

                          {project.client_id === userProfile?.id && bid.status === "pending" && (
                            <Button size="sm" className="bg-gradient-to-r from-green-600 to-emerald-600">
                              قبول العرض
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="files" className="space-y-4">
              {files.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">لا توجد ملفات مرفقة</h3>
                    <p className="text-gray-500">لم يرفع الناشر أي ملفات للمشروع</p>
                  </CardContent>
                </Card>
              ) : (
                files.map((file) => (
                  <Card key={file.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                            <FileText className="h-6 w-6 text-gray-600" />
                          </div>
                          <div>
                            <h4 className="font-medium">{file.file_name}</h4>
                            <p className="text-sm text-gray-500">
                              {(file.file_size / 1024).toFixed(1)} كيلوبايت •{" "}
                              {new Date(file.created_at).toLocaleDateString("ar-SA")}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 ml-2" />
                            معاينة
                          </Button>
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 ml-2" />
                            تحميل
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="info">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    معلومات الناشر
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                      <User className="h-8 w-8 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{client?.full_name}</h3>
                      <p className="text-gray-600">صاحب عمل</p>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <svg
                              key={star}
                              className="h-4 w-4 text-yellow-400 fill-yellow-400"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                        <span className="text-sm text-gray-600">4.8 (24 تقييم)</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                        <Calendar className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">تاريخ الانضمام</p>
                        <p className="font-medium">
                          {client?.created_at ? new Date(client.created_at).toLocaleDateString("ar-SA") : "غير متوفر"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center">
                        <Briefcase className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">المشاريع المنشورة</p>
                        <p className="font-medium">12 مشروع</p>
                      </div>
                    </div>

                    {userProfile?.id === project.client_id && (
                      <Alert className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                        <AlertDescription>
                          رقم هاتفك: <span className="font-bold">{client?.phone}</span>
                          <br />
                          <span className="text-sm">سيظهر فقط للمستقل المقبول</span>
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column - Bid Form & Info */}
        <div className="space-y-6">
          {showBidForm ? (
            <Card>
              <CardHeader>
                <CardTitle>تقديم عرض جديد</CardTitle>
                <CardDescription>املأ النموذج لتقديم عرضك على المشروع</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitBid} className="space-y-4">
                  <div className="space-y-3">
                    <Label htmlFor="bidAmount">قيمة العرض ($) *</Label>
                    <Input
                      id="bidAmount"
                      type="number"
                      min={project.budget_min}
                      step="50"
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      required
                      placeholder="يجب أن تكون 300$ على الأقل"
                    />
                    <p className="text-xs text-gray-500">الحد الأدنى: ${project.budget_min}</p>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="bidDays">مدة التسليم (أيام) *</Label>
                    <Input
                      id="bidDays"
                      type="number"
                      min="1"
                      max="365"
                      value={bidDays}
                      onChange={(e) => setBidDays(e.target.value)}
                      required
                      placeholder="عدد الأيام المطلوبة للتسليم"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="bidProposal">وصف العرض *</Label>
                    <Textarea
                      id="bidProposal"
                      rows={4}
                      value={bidProposal}
                      onChange={(e) => setBidProposal(e.target.value)}
                      required
                      placeholder="صف عرضك بالتفصيل وكيف ستقوم بإنجاز المشروع..."
                    />
                    <p className="text-xs text-gray-500">⚠️ لا تضف معلومات اتصال في وصف العرض</p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                      <span className="text-sm font-medium">عمولتك:</span>
                      <span className="font-bold text-green-600">
                        ${bidAmount ? (Number.parseFloat(bidAmount) * 0.2).toFixed(2) : "0.00"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 text-center">تحصل على 20% عمولة من قيمة المشروع</p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                      disabled={submittingBid}
                    >
                      {submittingBid ? "جاري الإرسال..." : "تقديم العرض"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowBidForm(false)}>
                      إلغاء
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>معلومات مهمة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-green-600 font-bold">$</span>
                  </div>
                  <div>
                    <p className="font-medium">عمولة 20%</p>
                    <p className="text-sm text-gray-600">تحصل على 20% من قيمة المشروع كعمولة</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-blue-600 font-bold">!</span>
                  </div>
                  <div>
                    <p className="font-medium">حماية المعلومات</p>
                    <p className="text-sm text-gray-600">رقم هاتف الناشر يظهر فقط للعرض المقبول</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-purple-600 font-bold">✓</span>
                  </div>
                  <div>
                    <p className="font-medium">تقييمات المستقل</p>
                    <p className="text-sm text-gray-600">يمكنك رؤية تقييمات المستقلين السابقة</p>
                  </div>
                </div>

                {canBid && (
                  <Button
                    onClick={() => setShowBidForm(true)}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  >
                    تقديم عرض على المشروع
                  </Button>
                )}

                {!userProfile && (
                  <Alert>
                    <AlertDescription>
                      <Link href="/auth/login" className="font-medium text-blue-600 hover:underline">
                        سجل الدخول
                      </Link>{" "}
                      لتقديم عرض على المشروع
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {/* Commission Info */}
          <Card>
            <CardHeader>
              <CardTitle>حساب العمولة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">قيمة المشروع:</span>
                  <span className="font-medium">${project.budget_min}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">عمولة المستقل (20%):</span>
                  <span className="font-bold text-green-600">${(project.budget_min * 0.2).toFixed(2)}</span>
                </div>
                {project.referral_code && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">عمولة المسوق (10%):</span>
                    <span className="font-bold text-purple-600">${(project.budget_min * 0.1).toFixed(2)}</span>
                  </div>
                )}
                <div className="pt-3 border-t">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">صافي للعميل:</span>
                    <span className="font-bold">
                      $
                      {(
                        project.budget_min -
                        project.budget_min * 0.2 -
                        (project.referral_code ? project.budget_min * 0.1 : 0)
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
