"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Star, Clock, DollarSign, Calendar, Phone, Shield } from "lucide-react"

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [project, setProject] = useState<any>(null)
  const [bids, setBids] = useState<any[]>([])
  const [reviews, setReviews] = useState<any[]>([])
  const [userProfile, setUserProfile] = useState<any>(null)
  const [userBid, setUserBid] = useState<any>(null)
  const [freelancerReviews, setFreelancerReviews] = useState<{ [key: string]: any[] }>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [amount, setAmount] = useState("300")
  const [deliveryDays, setDeliveryDays] = useState("")
  const [proposal, setProposal] = useState("")

  const [showReviewForm, setShowReviewForm] = useState(false)
  const [rating, setRating] = useState(5)
  const [reviewComment, setReviewComment] = useState("")

  useEffect(() => {
    loadProjectData()
  }, [params.id])

  const loadProjectData = async () => {
    try {
      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push("/auth/login")
        return
      }

      const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()
      setUserProfile(profile)

      const { data: projectData, error: projectError } = await supabase
        .from("projects")
        .select(`
          *,
          owner_profile:client_id (
            id,
            full_name,
            avatar_url,
            phone,
            phone_visible
          )
        `)
        .eq("id", params.id)
        .single()

      if (projectError) throw projectError
      setProject(projectData)

      const { data: bidsData } = await supabase
        .from("bids")
        .select(`
          *,
          freelancer:freelancer_id (
            id,
            full_name,
            avatar_url,
            phone,
            phone_visible
          )
        `)
        .eq("project_id", params.id)
        .order("created_at", { ascending: false })

      setBids(bidsData || [])

      if (profile?.role === "business_owner" && bidsData) {
        const freelancerIds = bidsData.map((bid: any) => bid.freelancer_id)
        if (freelancerIds.length > 0) {
          const reviewsMap: { [key: string]: any[] } = {}

          for (const freelancerId of freelancerIds) {
            const { data: freelancerReviewsData } = await supabase
              .from("reviews")
              .select("rating, comment, created_at")
              .eq("reviewee_id", freelancerId)
              .order("created_at", { ascending: false })
              .limit(5)

            if (freelancerReviewsData) {
              reviewsMap[freelancerId] = freelancerReviewsData
            }
          }

          setFreelancerReviews(reviewsMap)
        }
      }

      const { data: reviewsData } = await supabase
        .from("reviews")
        .select(`
          *,
          reviewer:reviewer_id (full_name),
          reviewee:reviewee_id (full_name)
        `)
        .eq("project_id", params.id)
        .order("created_at", { ascending: false })

      setReviews(reviewsData || [])

      const existingBid = bidsData?.find((bid: any) => bid.freelancer_id === user.id)
      if (existingBid) {
        setUserBid(existingBid)
        setAmount(existingBid.amount.toString())
        setDeliveryDays(existingBid.delivery_days.toString())
        setProposal(existingBid.proposal)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitBid = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("يجب تسجيل الدخول")

      const bidAmount = Number.parseFloat(amount)
      if (bidAmount < 300) {
        throw new Error("الحد الأدنى للعرض هو 300 دولار")
      }

      const bidData = {
        project_id: params.id,
        freelancer_id: user.id,
        amount: bidAmount,
        delivery_days: Number.parseInt(deliveryDays),
        proposal,
        status: "pending",
      }

      if (userBid) {
        const { error: updateError } = await supabase.from("bids").update(bidData).eq("id", userBid.id)
        if (updateError) throw updateError
        alert("تم تحديث عرضك بنجاح")
      } else {
        const { error: insertError } = await supabase.from("bids").insert(bidData)
        if (insertError) throw insertError

        await supabase.from("notifications").insert({
          user_id: project.client_id,
          title: "عرض جديد على مشروعك",
          message: `تلقيت عرضاً جديداً بقيمة $${bidAmount} على مشروع: ${project.title}`,
          type: "bid_received",
          related_id: params.id,
        })

        alert("تم إرسال عرضك بنجاح!")
      }

      await loadProjectData()
    } catch (err: any) {
      setError(err.message || "حدث خطأ أثناء إرسال العرض")
    } finally {
      setSubmitting(false)
    }
  }

  const handleAcceptBid = async (bidId: string, freelancerId: string) => {
    if (!confirm("هل أنت متأكد من قبول هذا العرض؟ سيتم رفض جميع العروض الأخرى تلقائياً.")) {
      return
    }

    try {
      setSubmitting(true)
      const supabase = createClient()

      // قبول العرض المحدد
      const { error: acceptError } = await supabase.from("bids").update({ status: "accepted" }).eq("id", bidId)

      if (acceptError) throw acceptError

      // رفض باقي العروض
      const { error: rejectError } = await supabase
        .from("bids")
        .update({ status: "rejected" })
        .eq("project_id", params.id)
        .neq("id", bidId)

      if (rejectError) throw rejectError

      // تحديث حالة المشروع
      const { error: projectError } = await supabase
        .from("projects")
        .update({ status: "in_progress" })
        .eq("id", params.id)

      if (projectError) throw projectError

      // إرسال إشعار للمستقل
      await supabase.from("notifications").insert({
        user_id: freelancerId,
        title: "تم قبول عرضك!",
        message: `تم قبول عرضك على مشروع: ${project.title}. يمكنك البدء في العمل الآن.`,
        type: "bid_accepted",
        related_id: params.id,
      })

      alert("تم قبول العرض بنجاح!")
      await loadProjectData()
    } catch (err: any) {
      alert(err.message || "حدث خطأ أثناء قبول العرض")
    } finally {
      setSubmitting(false)
    }
  }

  const handleRejectBid = async (bidId: string, freelancerId: string) => {
    if (!confirm("هل أنت متأكد من رفض هذا العرض؟")) {
      return
    }

    try {
      setSubmitting(true)
      const supabase = createClient()

      const { error } = await supabase.from("bids").update({ status: "rejected" }).eq("id", bidId)

      if (error) throw error

      // إرسال إشعار للمستقل
      await supabase.from("notifications").insert({
        user_id: freelancerId,
        title: "تم رفض عرضك",
        message: `تم رفض عرضك على مشروع: ${project.title}`,
        type: "bid_rejected",
        related_id: params.id,
      })

      alert("تم رفض العرض")
      await loadProjectData()
    } catch (err: any) {
      alert(err.message || "حدث خطأ")
    } finally {
      setSubmitting(false)
    }
  }

  const handleCompleteProject = async () => {
    if (!confirm("هل أنت متأكد من إتمام المشروع؟ سيتم احتساب العمولات ولن يمكنك التراجع.")) {
      return
    }

    try {
      setSubmitting(true)
      const supabase = createClient()

      const acceptedBid = bids.find((bid) => bid.status === "accepted")
      if (!acceptedBid) throw new Error("لا يوجد عرض مقبول")

      // تحديث حالة المشروع
      const { error: projectError } = await supabase
        .from("projects")
        .update({ status: "completed" })
        .eq("id", params.id)

      if (projectError) throw projectError

      const freelancerCommission = acceptedBid.amount * 0.2

      await supabase.from("transactions").insert({
        user_id: acceptedBid.freelancer_id,
        project_id: params.id,
        bid_id: acceptedBid.id,
        amount: freelancerCommission,
        type: "earning",
        status: "completed",
      })

      if (project.affiliate_referral_id) {
        const { data: affiliate } = await supabase
          .from("affiliates")
          .select("user_id, commission_rate")
          .eq("id", project.affiliate_referral_id)
          .single()

        if (affiliate) {
          const affiliateCommission = acceptedBid.amount * (affiliate.commission_rate / 100)

          await supabase.from("transactions").insert({
            user_id: affiliate.user_id,
            project_id: params.id,
            affiliate_id: project.affiliate_referral_id,
            amount: affiliateCommission,
            type: "commission",
            status: "completed",
          })

          // تحديث إحصائيات الأفلييت
          await supabase
            .from("affiliates")
            .update({
              total_earnings: supabase.raw(`total_earnings + ${affiliateCommission}`),
            })
            .eq("id", project.affiliate_referral_id)

          // تحديث حالة الإحالة
          await supabase.from("referrals").update({ status: "completed" }).eq("project_id", params.id)
        }
      }

      // إرسال إشعارات
      await supabase.from("notifications").insert({
        user_id: acceptedBid.freelancer_id,
        title: "تم إتمام المشروع!",
        message: `تم إتمام مشروع "${project.title}" بنجاح. حصلت على $${freelancerCommission.toFixed(2)}`,
        type: "project_completed",
        related_id: params.id,
      })

      alert("تم إتمام المشروع بنجاح! يمكنك الآن ترك تقييم.")
      setShowReviewForm(true)
      await loadProjectData()
    } catch (err: any) {
      alert(err.message || "حدث خطأ أثناء إتمام المشروع")
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setSubmitting(true)
      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("يجب تسجيل الدخول")

      const acceptedBid = bids.find((bid) => bid.status === "accepted")
      if (!acceptedBid) throw new Error("لا يوجد عرض مقبول")

      const { error } = await supabase.from("reviews").insert({
        project_id: params.id,
        reviewer_id: user.id,
        reviewee_id: acceptedBid.freelancer_id,
        rating,
        comment: reviewComment,
      })

      if (error) throw error

      // إرسال إشعار للمستقل
      await supabase.from("notifications").insert({
        user_id: acceptedBid.freelancer_id,
        title: "تلقيت تقييماً جديداً",
        message: `تلقيت تقييم ${rating} نجوم على مشروع: ${project.title}`,
        type: "new_review",
        related_id: params.id,
      })

      alert("تم إرسال التقييم بنجاح!")
      setShowReviewForm(false)
      await loadProjectData()
    } catch (err: any) {
      alert(err.message || "حدث خطأ أثناء إرسال التقييم")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p>جاري التحميل...</p>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card>
          <CardContent className="py-12">
            <p className="text-center">المشروع غير موجود</p>
            <div className="flex justify-center mt-4">
              <Link href="/projects">
                <Button>العودة للمشاريع</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isOwner = userProfile?.id === project.client_id
  const isFreelancer = userProfile?.role === "freelancer"
  const isAffiliate = userProfile?.role === "affiliate"
  const acceptedBid = bids.find((bid) => bid.status === "accepted")
  const canReview = isOwner && project.status === "completed" && !reviews.some((r) => r.reviewer_id === userProfile?.id)

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/projects">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center cursor-pointer">
                <span className="text-white font-bold text-xl">W</span>
              </div>
            </Link>
            <h1 className="text-2xl font-bold">تفاصيل المشروع</h1>
          </div>
          <Link href="/projects">
            <Button variant="outline">العودة للمشاريع</Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge
                      variant={
                        project.status === "open"
                          ? "secondary"
                          : project.status === "in_progress"
                            ? "default"
                            : "outline"
                      }
                    >
                      {project.status === "open"
                        ? "مفتوح"
                        : project.status === "in_progress"
                          ? "قيد التنفيذ"
                          : project.status === "completed"
                            ? "مكتمل"
                            : "ملغي"}
                    </Badge>
                  </div>
                  <CardTitle className="text-2xl mb-3">{project.title}</CardTitle>
                  <div className="flex items-center gap-3 flex-wrap">
                    <Badge variant="secondary">{project.category}</Badge>
                    <span className="text-sm text-muted-foreground">
                      نشر بواسطة: {project.owner_profile?.full_name || "مستخدم"}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {new Date(project.created_at).toLocaleDateString("ar-EG")}
                    </span>
                  </div>
                </div>
                <div className="text-left">
                  <p className="text-sm text-muted-foreground mb-1">الميزانية</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${project.budget_min}
                    {project.budget_max && ` - $${project.budget_max}`}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">وصف المشروع</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">{project.description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                {project.deadline && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">الموعد النهائي</p>
                      <p className="font-semibold">{new Date(project.deadline).toLocaleDateString("ar-EG")}</p>
                    </div>
                  </div>
                )}
                {project.expected_hours && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">ساعات العمل المتوقعة</p>
                      <p className="font-semibold">{project.expected_hours} ساعة</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">عدد العروض</p>
                    <p className="font-semibold">{bids.length}</p>
                  </div>
                </div>
              </div>

              {isFreelancer && acceptedBid?.freelancer_id === userProfile?.id && project.owner_profile?.phone && (
                <Alert className="bg-green-50 border-green-200">
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    <p className="font-semibold mb-1">معلومات التواصل مع صاحب العمل:</p>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span className="font-mono">{project.owner_profile.phone}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      تم عرض هذه المعلومات لأنه تم قبول عرضك على المشروع
                    </p>
                  </AlertDescription>
                </Alert>
              )}

              {isOwner && project.status === "in_progress" && (
                <div className="pt-4 border-t">
                  <Button onClick={handleCompleteProject} disabled={submitting} size="lg">
                    إتمام المشروع واحتساب العمولات
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {isFreelancer && !isOwner && project.status === "open" && (
            <Card>
              <CardHeader>
                <CardTitle>{userBid ? "تحديث عرضك" : "قدم عرضك على المشروع"}</CardTitle>
                <CardDescription>ستحصل على 20% من قيمة المشروع عند إتمامه بنجاح</CardDescription>
              </CardHeader>
              <form onSubmit={handleSubmitBid}>
                <CardContent className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <Alert>
                    <AlertDescription>
                      <Shield className="h-4 w-4 inline mr-2" />
                      ممنوع وضع أرقام الهواتف أو البريد الإلكتروني. سيظهر رقمك تلقائياً عند قبول العرض.
                    </AlertDescription>
                  </Alert>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount">
                        المبلغ المطلوب (بالدولار) <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="amount"
                        type="number"
                        min="300"
                        step="10"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                      />
                      <p className="text-sm text-muted-foreground">
                        الحد الأدنى: 300 دولار | عمولتك (20%): ${(Number.parseFloat(amount || "0") * 0.2).toFixed(2)}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="deliveryDays">
                        مدة التسليم (بالأيام) <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="deliveryDays"
                        type="number"
                        min="1"
                        value={deliveryDays}
                        onChange={(e) => setDeliveryDays(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="proposal">
                      تفاصيل العرض <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id="proposal"
                      placeholder="اشرح كيف ستنفذ المشروع، خبرتك في هذا المجال..."
                      value={proposal}
                      onChange={(e) => setProposal(e.target.value)}
                      required
                      rows={6}
                    />
                  </div>

                  <Button type="submit" disabled={submitting} className="w-full" size="lg">
                    {submitting ? "جاري الإرسال..." : userBid ? "تحديث العرض" : "إرسال العرض"}
                  </Button>
                </CardContent>
              </form>
            </Card>
          )}

          {isOwner && (
            <Card>
              <CardHeader>
                <CardTitle>العروض المقدمة ({bids.length})</CardTitle>
                <CardDescription>اختر أفضل عرض مناسب لمشروعك</CardDescription>
              </CardHeader>
              <CardContent>
                {bids.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">لا توجد عروض حتى الآن</p>
                ) : (
                  <div className="space-y-4">
                    {bids.map((bid) => {
                      const freelancerReviewList = freelancerReviews[bid.freelancer_id] || []
                      const avgRating =
                        freelancerReviewList.length > 0
                          ? (
                              freelancerReviewList.reduce((sum, r) => sum + r.rating, 0) / freelancerReviewList.length
                            ).toFixed(1)
                          : "لا توجد تقييمات"

                      return (
                        <div key={bid.id} className="border rounded-lg p-4 space-y-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-semibold text-lg">{bid.freelancer?.full_name || "مستقل"}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <div className="flex items-center gap-1">
                                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                  <span className="text-sm font-semibold">{avgRating}</span>
                                </div>
                                <span className="text-sm text-muted-foreground">
                                  ({freelancerReviewList.length} تقييم)
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {new Date(bid.created_at).toLocaleDateString("ar-EG")}
                              </p>
                            </div>
                            <div className="text-left">
                              <p className="text-2xl font-bold text-green-600">${bid.amount}</p>
                              <p className="text-sm text-muted-foreground">{bid.delivery_days} يوم</p>
                              <p className="text-xs text-purple-600 font-semibold mt-1">
                                عمولة المستقل: ${(bid.amount * 0.2).toFixed(2)}
                              </p>
                            </div>
                          </div>

                          <div className="bg-slate-50 rounded p-3">
                            <p className="text-sm font-semibold mb-2">تفاصيل العرض:</p>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{bid.proposal}</p>
                          </div>

                          {freelancerReviewList.length > 0 && (
                            <div className="bg-blue-50 rounded p-3">
                              <p className="text-sm font-semibold mb-2">آخر التقييمات:</p>
                              <div className="space-y-2">
                                {freelancerReviewList.slice(0, 3).map((review, index) => (
                                  <div key={index} className="text-sm">
                                    <div className="flex items-center gap-1 mb-1">
                                      {[...Array(5)].map((_, i) => (
                                        <Star
                                          key={i}
                                          className={`w-3 h-3 ${
                                            i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                                          }`}
                                        />
                                      ))}
                                    </div>
                                    {review.comment && (
                                      <p className="text-muted-foreground text-xs">{review.comment}</p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {bid.status === "accepted" && bid.freelancer?.phone && (
                            <Alert className="bg-green-50 border-green-200">
                              <Shield className="h-4 w-4" />
                              <AlertDescription>
                                <p className="font-semibold mb-1">معلومات التواصل:</p>
                                <div className="flex items-center gap-2">
                                  <Phone className="h-4 w-4" />
                                  <span className="font-mono">{bid.freelancer.phone}</span>
                                </div>
                              </AlertDescription>
                            </Alert>
                          )}

                          <div className="flex items-center gap-2 pt-2 border-t">
                            <Badge
                              variant={
                                bid.status === "pending"
                                  ? "secondary"
                                  : bid.status === "accepted"
                                    ? "default"
                                    : "outline"
                              }
                            >
                              {bid.status === "pending"
                                ? "قيد المراجعة"
                                : bid.status === "accepted"
                                  ? "مقبول"
                                  : "مرفوض"}
                            </Badge>
                            {bid.status === "pending" && project.status === "open" && (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleAcceptBid(bid.id, bid.freelancer_id)}
                                  disabled={submitting}
                                >
                                  قبول العرض
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleRejectBid(bid.id, bid.freelancer_id)}
                                  disabled={submitting}
                                >
                                  رفض
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {canReview && (showReviewForm || project.status === "completed") && (
            <Card>
              <CardHeader>
                <CardTitle>تقييم المستقل</CardTitle>
                <CardDescription>شارك تجربتك مع المستقل الذي نفذ المشروع</CardDescription>
              </CardHeader>
              <form onSubmit={handleSubmitReview}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>التقييم</Label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button key={star} type="button" onClick={() => setRating(star)} className="focus:outline-none">
                          <Star
                            className={`w-8 h-8 ${
                              star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reviewComment">تعليق (اختياري)</Label>
                    <Textarea
                      id="reviewComment"
                      placeholder="شارك تجربتك مع المستقل..."
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      rows={4}
                    />
                  </div>

                  <Button type="submit" disabled={submitting} className="w-full">
                    {submitting ? "جاري الإرسال..." : "إرسال التقييم"}
                  </Button>
                </CardContent>
              </form>
            </Card>
          )}

          {isAffiliate && !isOwner && (
            <Alert>
              <AlertDescription>
                <p className="font-semibold mb-2">معلومة:</p>
                <p className="text-sm">
                  أنت مسجل كمسوق بالعمولة. لا يمكنك تقديم عروض على المشاريع، لكن يمكنك مشاركة رابط الإحالة الخاص بك
                  للحصول على 10% عمولة من كل مشروع يُنشر عبر رابطك.
                </p>
                <Link href="/affiliate/dashboard">
                  <Button size="sm" className="mt-3">
                    انتقل إلى لوحة الأفلييت
                  </Button>
                </Link>
              </AlertDescription>
            </Alert>
          )}

          {reviews.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>التقييمات ({reviews.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reviews.map((review) => (
                    <div key={review.id} className="border-b pb-3 last:border-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm font-semibold">{review.reviewer?.full_name}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(review.created_at).toLocaleDateString("ar-EG")}
                        </span>
                      </div>
                      {review.comment && <p className="text-sm text-muted-foreground">{review.comment}</p>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
