"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { FileText } from "lucide-react"

export default function MyBidsPage() {
  const [bids, setBids] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    loadBids()
  }, [])

  const loadBids = async () => {
    try {
      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push("/auth/login")
        return
      }

      const { data, error } = await supabase
        .from("bids")
        .select(
          `
          *,
          projects (
            id,
            title,
            status,
            owner_id
          )
        `,
        )
        .eq("freelancer_id", user.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      setBids(data || [])
    } catch (err: any) {
      console.error("Error loading bids:", err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p>جاري التحميل...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-6 h-6" />
            <h1 className="text-2xl font-bold">عروضي</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/projects">
              <Button>تصفح المشاريع</Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline">لوحة التحكم</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          {bids.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">لم تقدم أي عروض بعد</p>
                <Link href="/projects">
                  <Button>تصفح المشاريع المتاحة</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {bids.map((bid) => {
                const project = bid.projects as any
                return (
                  <Link key={bid.id} href={`/projects/${project?.id}`}>
                    <Card className="hover:border-blue-300 transition-colors cursor-pointer">
                      <CardHeader>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <CardTitle className="text-xl">{project?.title || "مشروع محذوف"}</CardTitle>
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
                            </div>
                            <CardDescription className="line-clamp-2">{bid.proposal}</CardDescription>
                          </div>
                          <div className="text-left">
                            <p className="text-sm text-muted-foreground mb-1">العرض</p>
                            <p className="text-xl font-bold text-green-600">${bid.amount}</p>
                            <p className="text-sm text-muted-foreground">{bid.delivery_days} يوم</p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>
                            تاريخ العرض:{" "}
                            {new Date(bid.created_at).toLocaleDateString("ar-EG", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </span>
                          {project?.status && (
                            <>
                              <span>•</span>
                              <span>
                                حالة المشروع:{" "}
                                {project.status === "open"
                                  ? "مفتوح"
                                  : project.status === "in_progress"
                                    ? "قيد التنفيذ"
                                    : "مكتمل"}
                              </span>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
