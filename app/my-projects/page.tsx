"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Plus, Briefcase } from "lucide-react"

export default function MyProjectsPage() {
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
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
        .from("projects")
        .select(
          `
          *,
          bids (count)
        `,
        )
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      setProjects(data || [])
    } catch (err: any) {
      console.error("Error loading projects:", err)
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
            <Briefcase className="w-6 h-6" />
            <h1 className="text-2xl font-bold">مشاريعي</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/projects/new">
              <Button>
                <Plus className="w-4 h-4 ml-2" />
                مشروع جديد
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline">لوحة التحكم</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          {projects.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Briefcase className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">لم تقم بنشر أي مشاريع بعد</p>
                <Link href="/projects/new">
                  <Button>
                    <Plus className="w-4 h-4 ml-2" />
                    نشر مشروع جديد
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {projects.map((project) => (
                <Link key={project.id} href={`/projects/${project.id}`}>
                  <Card className="hover:border-blue-300 transition-colors cursor-pointer">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <CardTitle className="text-xl">{project.title}</CardTitle>
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
                          <CardDescription className="line-clamp-2">{project.description}</CardDescription>
                        </div>
                        <div className="text-left">
                          <p className="text-sm text-muted-foreground mb-1">الميزانية</p>
                          <p className="text-xl font-bold text-green-600">
                            ${project.budget_min}
                            {project.budget_max && ` - $${project.budget_max}`}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>التصنيف: {project.category}</span>
                        <span>•</span>
                        <span>العروض: {Array.isArray(project.bids) ? project.bids.length : 0}</span>
                        <span>•</span>
                        <span>
                          {new Date(project.created_at).toLocaleDateString("ar-EG", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
