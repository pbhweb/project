"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function EditProjectPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [budgetMin, setBudgetMin] = useState("")
  const [budgetMax, setBudgetMax] = useState("")
  const [estimatedHours, setEstimatedHours] = useState("")
  const [status, setStatus] = useState("")

  useEffect(() => {
    loadProject()
  }, [projectId])

  const loadProject = async () => {
    try {
      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push(`/auth/login?redirect=/projects/${projectId}/edit`)
        return
      }

      const { data: project, error: projectError } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .maybeSingle()

      if (projectError || !project) {
        setError("تعذّر العثور على المشروع")
        setLoading(false)
        return
      }

      if (project.client_id !== user.id) {
        setError("لا يمكنك تعديل مشروع لا تملكه")
        setLoading(false)
        return
      }

      setTitle(project.title || "")
      setDescription(project.description || "")
      setCategory(project.category || "")
      setBudgetMin(String(project.budget_min ?? ""))
      setBudgetMax(project.budget_max ? String(project.budget_max) : "")
      setEstimatedHours(project.estimated_hours ? String(project.estimated_hours) : "")
      setStatus(project.status || "")
    } catch (err: any) {
      setError(err.message || "حدث خطأ أثناء تحميل المشروع")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaving(true)

    try {
      const supabase = createClient()

      const containsContact =
        description.match(/\d{10,}/) ||
        description.match(/@[A-Za-z0-9._%+-]+\.[A-Za-z]{2,}/) ||
        description.match(/(whatsapp|telegram|signal|viber)/i)

      if (containsContact) {
        throw new Error("لا يمكن إضافة معلومات اتصال في وصف المشروع")
      }

      // ⚠️ لا نسمح بتعديل budget_min بعد النشر — هذا المبلغ مرتبط برابط دفع
      // (Gumroad) تم إنشاؤه مسبقاً وربما دُفع بالفعل. تعديل السعر هنا لن ينعكس
      // على رابط الدفع الأصلي ويسبب تعارضاً بين المبلغ المعروض والمبلغ المدفوع فعلياً.
      const { error: updateError } = await supabase
        .from("projects")
        .update({
          title,
          description,
          category,
          budget_max: budgetMax ? Number.parseFloat(budgetMax) : null,
          estimated_hours: estimatedHours ? Number.parseInt(estimatedHours) : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", projectId)

      if (updateError) throw updateError

      setSuccess(true)
      setTimeout(() => router.push(`/projects/${projectId}`), 1200)
    } catch (err: any) {
      setError(err.message || "حدث خطأ أثناء حفظ التعديلات")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500 mx-auto mb-4"></div>
            <p className="text-neutral-400">جاري تحميل المشروع...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error && !title) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>تعديل المشروع</CardTitle>
          <CardDescription>
            {status === "pending_payment"
              ? "مشروعك لا يزال بانتظار تأكيد الدفع"
              : "يمكنك تعديل تفاصيل مشروعك المنشور"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert className="mb-4 bg-emerald-500/10 border-emerald-500/30">
              <AlertDescription className="text-emerald-300">
                ✓ تم حفظ التعديلات بنجاح
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">عنوان المشروع *</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">وصف المشروع *</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">التصنيف *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="اختر التصنيف" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="web-design">تصميم مواقع</SelectItem>
                  <SelectItem value="mobile-app">تطبيقات جوال</SelectItem>
                  <SelectItem value="graphic-design">تصميم جرافيك</SelectItem>
                  <SelectItem value="writing">كتابة ومحتوى</SelectItem>
                  <SelectItem value="marketing">تسويق</SelectItem>
                  <SelectItem value="programming">برمجة</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="budgetMin">الميزانية الدنيا ($)</Label>
                <Input id="budgetMin" value={budgetMin} disabled />
                <p className="text-xs text-neutral-500">
                  لا يمكن تعديل الميزانية الدنيا بعد النشر لارتباطها برابط الدفع
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="budgetMax">الميزانية القصوى ($)</Label>
                <Input
                  id="budgetMax"
                  type="number"
                  value={budgetMax}
                  onChange={(e) => setBudgetMax(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimatedHours">الساعات المتوقعة</Label>
              <Input
                id="estimatedHours"
                type="number"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(e.target.value)}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={saving} className="flex-1">
                {saving ? "جاري الحفظ..." : "حفظ التعديلات"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                إلغاء
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
