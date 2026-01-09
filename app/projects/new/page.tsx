"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"

const categories = [
  "تطوير المواقع",
  "تطوير التطبيقات",
  "التصميم الجرافيكي",
  "كتابة المحتوى",
  "الترجمة",
  "التسويق الرقمي",
  "تحرير الفيديو",
  "إدارة وسائل التواصل",
  "استشارات",
  "أخرى",
]

export default function NewProjectPage() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [budgetMin, setBudgetMin] = useState("300")
  const [budgetMax, setBudgetMax] = useState("")
  const [deadline, setDeadline] = useState("")
  const [expectedHours, setExpectedHours] = useState("")
  const [referralCode, setReferralCode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("يجب تسجيل الدخول أولاً")

      const minBudget = Number.parseFloat(budgetMin)
      if (minBudget < 300) {
        throw new Error("الحد الأدنى للميزانية هو 300 دولار")
      }

      let affiliateReferralId = null

      if (referralCode.trim()) {
        const { data: affiliate } = await supabase
          .from("affiliates")
          .select("id, is_active")
          .eq("referral_code", referralCode.trim().toUpperCase())
          .single()

        if (!affiliate) {
          throw new Error("كود الإحالة غير صحيح")
        }

        if (!affiliate.is_active) {
          throw new Error("كود الإحالة غير نشط")
        }

        affiliateReferralId = affiliate.id
      }

      const { data: project, error: projectError } = await supabase
        .from("projects")
        .insert({
          client_id: user.id,
          title,
          description,
          category,
          budget_min: minBudget,
          budget_max: budgetMax ? Number.parseFloat(budgetMax) : null,
          deadline: deadline || null,
          expected_hours: expectedHours ? Number.parseInt(expectedHours) : null,
          affiliate_referral_id: affiliateReferralId,
        })
        .select()
        .single()

      if (projectError) throw projectError

      if (affiliateReferralId) {
        await supabase.from("affiliate_referrals").insert({
          affiliate_id: affiliateReferralId,
          referred_user_id: user.id,
          project_id: project.id,
          referral_code: referralCode.trim().toUpperCase(),
        })
      }

      router.push("/projects")
    } catch (err: any) {
      setError(err.message || "حدث خطأ أثناء نشر المشروع")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/dashboard">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center cursor-pointer">
                <span className="text-white font-bold text-xl">F</span>
              </div>
            </Link>
            <h1 className="text-2xl font-bold">نشر مشروع جديد</h1>
          </div>
          <Link href="/dashboard">
            <Button variant="outline">العودة للوحة التحكم</Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>تفاصيل المشروع</CardTitle>
              <CardDescription>املأ التفاصيل التالية لنشر مشروعك. جميع الحقول المطلوبة مميزة بعلامة *</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-6">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Alert>
                  <AlertDescription>
                    ممنوع وضع أرقام الهواتف، البريد الإلكتروني، أو أي معلومات تواصل أخرى في الوصف. سيتم رفض المشروع
                    تلقائياً.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label htmlFor="title">
                    عنوان المشروع <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="title"
                    placeholder="مثال: تطوير موقع تجارة إلكترونية"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">
                    التصنيف <span className="text-destructive">*</span>
                  </Label>
                  <Select value={category} onValueChange={setCategory} required>
                    <SelectTrigger id="category">
                      <SelectValue placeholder="اختر التصنيف المناسب" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">
                    وصف المشروع <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="اشرح تفاصيل المشروع، المتطلبات، والنتائج المتوقعة..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    rows={8}
                    className="resize-y"
                  />
                  <p className="text-sm text-muted-foreground">{description.length} حرف</p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="budgetMin">
                      الميزانية الأدنى (بالدولار) <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="budgetMin"
                      type="number"
                      min="300"
                      step="10"
                      placeholder="300"
                      value={budgetMin}
                      onChange={(e) => setBudgetMin(e.target.value)}
                      required
                    />
                    <p className="text-sm text-muted-foreground">الحد الأدنى: 300 دولار</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="budgetMax">الميزانية الأعلى (بالدولار)</Label>
                    <Input
                      id="budgetMax"
                      type="number"
                      min="300"
                      step="10"
                      placeholder="اختياري"
                      value={budgetMax}
                      onChange={(e) => setBudgetMax(e.target.value)}
                    />
                    <p className="text-sm text-muted-foreground">اختياري</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deadline">الموعد النهائي</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                  />
                  <p className="text-sm text-muted-foreground">اختياري</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expectedHours">ساعات العمل المتوقعة</Label>
                  <Input
                    id="expectedHours"
                    type="number"
                    min="1"
                    placeholder="مثال: 40 ساعة"
                    value={expectedHours}
                    onChange={(e) => setExpectedHours(e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">عدد الساعات المتوقعة لإنجاز المشروع (اختياري)</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="referralCode">كود الإحالة (Affiliate)</Label>
                  <Input
                    id="referralCode"
                    placeholder="إذا كان لديك كود إحالة، أدخله هنا"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                    maxLength={8}
                  />
                  <p className="text-sm text-muted-foreground">
                    إذا أحالك أحد المسوقين، أدخل كوده ليحصل على 10% عمولة من المشروع
                  </p>
                </div>

                <div className="flex items-center gap-4 pt-4">
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? "جاري النشر..." : "نشر المشروع"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
                    إلغاء
                  </Button>
                </div>
              </CardContent>
            </form>
          </Card>
        </div>
      </main>
    </div>
  )
}
