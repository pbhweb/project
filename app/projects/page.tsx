import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { redirect } from "next/navigation"

export default async function ProjectsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  // Get all open projects with owner info
  const { data: projects } = await supabase
    .from("projects")
    .select(
      `
      *,
      profiles:owner_id (full_name)
    `,
    )
    .eq("status", "open")
    .order("created_at", { ascending: false })

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
            <h1 className="text-2xl font-bold">المشاريع المتاحة</h1>
          </div>
          <div className="flex items-center gap-3">
            {profile?.role === "business_owner" && (
              <Link href="/projects/new">
                <Button>نشر مشروع جديد</Button>
              </Link>
            )}
            <Link href="/dashboard">
              <Button variant="outline">لوحة التحكم</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {!projects || projects.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground mb-4">لا توجد مشاريع متاحة حالياً</p>
                {profile?.role === "business_owner" && (
                  <Link href="/projects/new">
                    <Button>انشر أول مشروع</Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {projects.map((project: any) => (
                <Card key={project.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-2">{project.title}</CardTitle>
                        <CardDescription className="flex items-center gap-2 flex-wrap">
                          <Badge variant="secondary">{project.category}</Badge>
                          <span className="text-sm">
                            نشر بواسطة: {(project.profiles as any)?.full_name || "مستخدم"}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {new Date(project.created_at).toLocaleDateString("ar-EG", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </span>
                        </CardDescription>
                      </div>
                      <div className="text-left">
                        <p className="text-sm text-muted-foreground">الميزانية</p>
                        <p className="text-xl font-bold text-green-600">
                          ${project.budget_min}
                          {project.budget_max && ` - $${project.budget_max}`}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{project.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {project.deadline && (
                          <span>
                            الموعد النهائي:{" "}
                            {new Date(project.deadline).toLocaleDateString("ar-EG", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </span>
                        )}
                      </div>
                      {profile?.role === "freelancer" && (
                        <Link href={`/projects/${project.id}`}>
                          <Button>عرض التفاصيل</Button>
                        </Link>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
