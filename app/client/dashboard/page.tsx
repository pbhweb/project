"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Briefcase, FileText, Clock, CheckCircle2, XCircle } from "lucide-react"

export default function ClientDashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [projects, setProjects] = useState<any[]>([])
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    completed: 0,
  })

  useEffect(() => {
    loadClientData()
  }, [])

  const loadClientData = async () => {
    try {
      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push("/auth/login")
        return
      }

      // Check if user is a client
      const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

      if (profile?.role !== "business_owner") {
        router.push("/dashboard")
        return
      }

      // Get client projects
      const { data: projectsData } = await supabase
        .from("projects")
        .select("*, bids(count)")
        .eq("client_id", user.id)
        .order("created_at", { ascending: false })

      setProjects(projectsData || [])

      // Calculate stats
      const stats = {
        total: projectsData?.length || 0,
        open: projectsData?.filter((p) => p.status === "open").length || 0,
        inProgress: projectsData?.filter((p) => p.status === "in_progress").length || 0,
        completed: projectsData?.filter((p) => p.status === "completed").length || 0,
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4">جاري التحميل...</p>
        </div>
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      open: { label: "مفتوح", variant: "default" as const, icon: <Clock className="h-3 w-3" /> },
      in_progress: { label: "قيد التنفيذ", variant: "secondary" as const, icon: <Briefcase className="h-3 w-3" /> },
      completed: { label: "مكتمل", variant: "default" as const, icon: <CheckCircle2 className="h-3 w-3" /> },
      cancelled: { label: "ملغي", variant: "destructive" as const, icon: <XCircle className="h-3 w-3" /> },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.open
    return (
      <Badge variant={config.variant} className="gap-1">
        {config.icon}
        {config.label}
      </Badge>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">لوحة تحكم صاحب العمل</h1>
          <p className="text-gray-600 mt-2">إدارة مشاريعك واختيار أفضل المستقلين</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-blue-600 font-medium">إجمالي المشاريع</p>
                <h3 className="text-3xl font-bold text-gray-900">{stats.total}</h3>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-green-600 font-medium">مفتوحة</p>
                <h3 className="text-3xl font-bold text-gray-900">{stats.open}</h3>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-orange-600 font-medium">قيد التنفيذ</p>
                <h3 className="text-3xl font-bold text-gray-900">{stats.inProgress}</h3>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-purple-600 font-medium">مكتملة</p>
                <h3 className="text-3xl font-bold text-gray-900">{stats.completed}</h3>
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
              <Link href="/projects/new" className="flex-1">
                <Button className="w-full bg-blue-600 hover:bg-blue-700">نشر مشروع جديد</Button>
              </Link>
              <Link href="/projects" className="flex-1">
                <Button variant="outline" className="w-full bg-transparent">
                  تصفح المشاريع
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Projects List */}
        <Card>
          <CardHeader>
            <CardTitle>مشاريعي ({projects.length})</CardTitle>
            <CardDescription>إدارة ومتابعة المشاريع الخاصة بك</CardDescription>
          </CardHeader>
          <CardContent>
            {projects.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">لا توجد مشاريع حتى الآن</h3>
                <p className="text-gray-500 mb-6">ابدأ بنشر أول مشروع واحصل على عروض من المستقلين المحترفين</p>
                <Link href="/projects/new">
                  <Button>نشر مشروع جديد</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {projects.map((project) => (
                  <Link key={project.id} href={`/projects/${project.id}`}>
                    <div className="border rounded-xl p-6 hover:shadow-md transition-all cursor-pointer">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold">{project.title}</h3>
                            {getStatusBadge(project.status)}
                          </div>
                          <p className="text-gray-600 text-sm line-clamp-2 mb-3">{project.description}</p>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Briefcase className="h-4 w-4" />
                              {project.category}
                            </span>
                            <span className="font-semibold text-green-600">
                              ${project.budget_min}
                              {project.budget_max && ` - $${project.budget_max}`}
                            </span>
                            <span>{project.bids?.[0]?.count || 0} عرض</span>
                          </div>
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
