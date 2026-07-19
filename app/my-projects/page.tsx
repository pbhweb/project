"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  DollarSign,
  Clock,
  Users,
  Calendar,
  FileText,
  CheckCircle,
  XCircle,
  Eye,
  MessageSquare,
  TrendingUp,
  Plus,
} from "lucide-react"
import Link from "next/link"

export default function MyProjectsPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userProfile, setUserProfile] = useState<any>(null)

  useEffect(() => {
    loadMyProjects()
  }, [])

  const loadMyProjects = async () => {
    try {
      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push("/auth/login")
        return
      }

      // Get user profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle()
      setUserProfile(profile)

      // Load projects
      const { data: projectsData } = await supabase
        .from("projects")
        .select(`
          *,
          bids (
            id,
            status,
            freelancer_id,
            profiles:freelancer_id (full_name),
            count
          )
        `)
        .eq("client_id", user.id)
        .order("created_at", { ascending: false })

      setProjects(projectsData || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      open: "bg-green-500/15 text-green-300",
      in_progress: "bg-emerald-500/10 text-emerald-300",
      completed: "bg-neutral-900 text-neutral-200",
      cancelled: "bg-red-500/15 text-red-300",
    }
    return colors[status] || "bg-neutral-900 text-neutral-200"
  }

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      open: "مفتوح",
      in_progress: "قيد التنفيذ",
      completed: "مكتمل",
      cancelled: "ملغي",
    }
    return texts[status] || status
  }

  const getAcceptedBid = (bids: any[]) => {
    return bids?.find((bid) => bid.status === "accepted")
  }

  const calculateTotalBudget = () => {
    return projects.reduce((sum, project) => sum + (project.budget_min || 0), 0)
  }

  const openProjects = projects.filter((p) => p.status === "open")
  const inProgressProjects = projects.filter((p) => p.status === "in_progress")
  const completedProjects = projects.filter((p) => p.status === "completed")

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
          <p className="mt-4">جاري تحميل مشاريعك...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">مشاريعي</h1>
          <p className="text-neutral-400">إدارة وتتبع جميع المشاريع التي نشرتها</p>
        </div>
        <Link href="/projects/new">
          <Button className="gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold">
            <Plus className="h-4 w-4" />
            مشروع جديد
          </Button>
        </Link>
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
                <p className="text-sm text-neutral-400">إجمالي المشاريع</p>
                <h3 className="text-2xl font-bold text-white">{projects.length}</h3>
              </div>
              <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center">
                <FileText className="h-6 w-6 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-400">المشاريع المفتوحة</p>
                <h3 className="text-2xl font-bold text-white">{openProjects.length}</h3>
              </div>
              <div className="w-12 h-12 bg-green-500/15 rounded-full flex items-center justify-center">
                <Eye className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-400">قيد التنفيذ</p>
                <h3 className="text-2xl font-bold text-white">{inProgressProjects.length}</h3>
              </div>
              <div className="w-12 h-12 bg-yellow-500/15 rounded-full flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-400">إجمالي الميزانية</p>
                <h3 className="text-2xl font-bold text-white">${calculateTotalBudget()}</h3>
              </div>
              <div className="w-12 h-12 bg-purple-500/15 rounded-full flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="grid w-full md:w-auto grid-cols-4">
          <TabsTrigger value="all">جميع المشاريع</TabsTrigger>
          <TabsTrigger value="open">مفتوحة</TabsTrigger>
          <TabsTrigger value="progress">قيد التنفيذ</TabsTrigger>
          <TabsTrigger value="completed">مكتملة</TabsTrigger>
        </TabsList>

        {/* All Projects */}
        <TabsContent value="all">
          {projects.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-16 w-16 text-neutral-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-neutral-300 mb-2">لا توجد مشاريع</h3>
                <p className="text-neutral-400 mb-6">لم تنشر أي مشاريع حتى الآن</p>
                <Link href="/projects/new">
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    نشر أول مشروع
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Open Projects */}
        <TabsContent value="open">
          {openProjects.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Eye className="h-16 w-16 text-neutral-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-neutral-300 mb-2">لا توجد مشاريع مفتوحة</h3>
                <p className="text-neutral-400">جميع مشاريعك إما قيد التنفيذ أو مكتملة</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {openProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* In Progress Projects */}
        <TabsContent value="progress">
          {inProgressProjects.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Clock className="h-16 w-16 text-neutral-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-neutral-300 mb-2">لا توجد مشاريع قيد التنفيذ</h3>
                <p className="text-neutral-400">ليس لديك مشاريع قيد التنفيذ حالياً</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {inProgressProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Completed Projects */}
        <TabsContent value="completed">
          {completedProjects.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle className="h-16 w-16 text-neutral-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-neutral-300 mb-2">لا توجد مشاريع مكتملة</h3>
                <p className="text-neutral-400">لم تكمل أي من مشاريعك بعد</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {completedProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Financial Summary */}
      {projects.length > 0 && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              ملخص مالي
            </CardTitle>
            <CardDescription>تحليل مالي لمشاريعك</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <h4 className="font-medium text-neutral-300">التكاليف</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-neutral-400">قيمة المشاريع:</span>
                    <span className="font-medium">${calculateTotalBudget()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-neutral-400">عمولة المستقلين (20%):</span>
                    <span className="font-medium text-red-600">
                      ${(calculateTotalBudget() * 0.2).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-neutral-400">عمولة المسوقين (10%):</span>
                    <span className="font-medium text-orange-600">
                      ${(calculateTotalBudget() * 0.1).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-neutral-300">الإحصائيات</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-neutral-400">متوسط الميزانية:</span>
                    <span className="font-medium">
                      ${projects.length > 0 ? (calculateTotalBudget() / projects.length).toFixed(2) : "0"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-neutral-400">متوسط العروض:</span>
                    <span className="font-medium">
                      {projects.length > 0
                        ? (projects.reduce((sum, p) => sum + (p.bids?.length || 0), 0) / projects.length).toFixed(1)
                        : "0"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-neutral-400">معدل القبول:</span>
                    <span className="font-medium">
                      {projects.length > 0
                        ? ((projects.filter((p) => getAcceptedBid(p.bids)).length / projects.length) * 100).toFixed(1) : "0"}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-neutral-300">التوقعات</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-neutral-400">صافي التكلفة:</span>
                    <span className="font-bold text-green-600">
                      $
                      {(
                        calculateTotalBudget() -
                        calculateTotalBudget() * 0.2 -
                        calculateTotalBudget() * 0.1
                      ).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-neutral-400">التوفير المتوقع:</span>
                    <span className="font-medium text-emerald-400">
                      ${(calculateTotalBudget() * 0.3).toFixed(2)}
                    </span>
                  </div>
                  <div className="text-xs text-neutral-400 mt-4">
                    * العمولات تدفع فقط للمشاريع المقبولة
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Project Card Component
function ProjectCard({ project }: { project: any }) {
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      open: "bg-green-500/15 text-green-300",
      in_progress: "bg-emerald-500/10 text-emerald-300",
      completed: "bg-neutral-900 text-neutral-200",
      cancelled: "bg-red-500/15 text-red-300",
    }
    return colors[status] || "bg-neutral-900 text-neutral-200"
  }

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      open: "مفتوح",
      in_progress: "قيد التنفيذ",
      completed: "مكتمل",
      cancelled: "ملغي",
    }
    return texts[status] || status
  }

  const getAcceptedBid = (bids: any[]) => {
    return bids?.find((bid) => bid.status === "accepted")
  }

  const acceptedBid = getAcceptedBid(project.bids)

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start mb-2">
          <Badge className={getStatusColor(project.status)}>
            {getStatusText(project.status)}
          </Badge>
          <Badge variant="outline">{project.bids?.length || 0} عروض</Badge>
        </div>
        <CardTitle className="line-clamp-1">{project.title}</CardTitle>
        <CardDescription className="line-clamp-2">{project.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-400">الميزانية:</span>
            <span className="font-bold text-green-600">${project.budget_min}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-400">الموعد النهائي:</span>
            <span className="font-medium">
              {project.deadline
                ? new Date(project.deadline).toLocaleDateString("ar-SA")
                : "غير محدد"}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-400">التاريخ:</span>
            <span className="text-sm">
              {new Date(project.created_at).toLocaleDateString("ar-SA")}
            </span>
          </div>
        </div>

        {acceptedBid && (
          <Alert className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30">
            <AlertDescription>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">المستقل المقبول:</p>
                  <p className="text-sm">{acceptedBid.profiles?.full_name}</p>
                </div>
                <Badge variant="outline" className="bg-neutral-900">
                  ${acceptedBid.amount}
                </Badge>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className="flex gap-2">
        <Link href={`/projects/${project.id}`} className="flex-1">
          <Button variant="outline" className="w-full gap-2">
            <Eye className="h-4 w-4" />
            التفاصيل
          </Button>
        </Link>
        <Link href={`/my-bids?project=${project.id}`} className="flex-1">
          <Button className="w-full gap-2">
            <MessageSquare className="h-4 w-4" />
            العروض
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}
