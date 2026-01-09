"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Filter,
  DollarSign,
  Clock,
  MapPin,
  Briefcase,
} from "lucide-react";
import Link from "next/link";

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<any[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [budgetFilter, setBudgetFilter] = useState("all");

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    filterProjects();
  }, [projects, searchTerm, categoryFilter, budgetFilter]);

  const loadProjects = async () => {
    try {
      const supabase = createClient();

      const { data: projectsData, error } = await supabase
        .from("projects")
        .select(
          `
          *,
          profiles:client_id (full_name),
          bids (count)
        `
        )
        .eq("status", "open")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setProjects(projectsData || []);
    } catch (err) {
      console.error("Error loading projects:", err);
    } finally {
      setLoading(false);
    }
  };

  const filterProjects = () => {
    let filtered = [...projects];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (project) =>
          project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          project.description
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          project.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (categoryFilter !== "all") {
      filtered = filtered.filter(
        (project) => project.category === categoryFilter
      );
    }

    // Filter by budget
    if (budgetFilter !== "all") {
      if (budgetFilter === "low") {
        filtered = filtered.filter((project) => project.budget_min <= 500);
      } else if (budgetFilter === "medium") {
        filtered = filtered.filter(
          (project) => project.budget_min > 500 && project.budget_min <= 2000
        );
      } else if (budgetFilter === "high") {
        filtered = filtered.filter((project) => project.budget_min > 2000);
      }
    }

    setFilteredProjects(filtered);
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      "web-design": "bg-blue-100 text-blue-800",
      "mobile-app": "bg-green-100 text-green-800",
      "graphic-design": "bg-purple-100 text-purple-800",
      writing: "bg-yellow-100 text-yellow-800",
      marketing: "bg-pink-100 text-pink-800",
      programming: "bg-indigo-100 text-indigo-800",
    };
    return colors[category] || "bg-gray-100 text-gray-800";
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      open: "bg-green-100 text-green-800",
      in_progress: "bg-blue-100 text-blue-800",
      completed: "bg-gray-100 text-gray-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4">جاري تحميل المشاريع...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          المشاريع المتاحة
        </h1>
        <p className="text-gray-600">
          تصفح المشاريع المنشورة وقدم عروضك للحصول على 20% عمولة
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white border rounded-xl p-6 mb-8">
        <div className="grid md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="ابحث عن مشروع..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger>
              <Filter className="h-4 w-4 ml-2" />
              <SelectValue placeholder="التصنيف" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع التصنيفات</SelectItem>
              <SelectItem value="web-design">تصميم مواقع</SelectItem>
              <SelectItem value="mobile-app">تطبيقات جوال</SelectItem>
              <SelectItem value="graphic-design">تصميم جرافيك</SelectItem>
              <SelectItem value="writing">كتابة ومحتوى</SelectItem>
              <SelectItem value="marketing">تسويق</SelectItem>
              <SelectItem value="programming">برمجة</SelectItem>
            </SelectContent>
          </Select>

          <Select value={budgetFilter} onValueChange={setBudgetFilter}>
            <SelectTrigger>
              <DollarSign className="h-4 w-4 ml-2" />
              <SelectValue placeholder="الميزانية" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الميزانيات</SelectItem>
              <SelectItem value="low">منخفضة (حتى $500)</SelectItem>
              <SelectItem value="medium">متوسطة ($500 - $2000)</SelectItem>
              <SelectItem value="high">عالية (أكثر من $2000)</SelectItem>
            </SelectContent>
          </Select>

          <Link href="/projects/new">
            <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
              نشر مشروع جديد
            </Button>
          </Link>
        </div>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Briefcase className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            لا توجد مشاريع متاحة
          </h3>
          <p className="text-gray-500">
            لا توجد مشاريع تطابق معايير البحث الخاصة بك
          </p>
          <Link href="/projects/new" className="mt-4 inline-block">
            <Button>كن أول من ينشر مشروع</Button>
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <Card
              key={project.id}
              className="hover:shadow-lg transition-shadow"
            >
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <Badge className={getCategoryColor(project.category)}>
                    {project.category === "web-design" && "تصميم مواقع"}
                    {project.category === "mobile-app" && "تطبيقات جوال"}
                    {project.category === "graphic-design" && "تصميم جرافيك"}
                    {project.category === "writing" && "كتابة ومحتوى"}
                    {project.category === "marketing" && "تسويق"}
                    {project.category === "programming" && "برمجة"}
                  </Badge>
                  <Badge variant="outline">
                    {project.bids?.length || 0} عروض
                  </Badge>
                </div>
                <CardTitle className="text-lg line-clamp-1">
                  {project.title}
                </CardTitle>
                <CardDescription className="line-clamp-2">
                  {project.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <span className="font-semibold">الميزانية:</span>
                    <span>${project.budget_min}</span>
                    {project.budget_max && (
                      <>
                        <span>-</span>
                        <span>${project.budget_max}</span>
                      </>
                    )}
                  </div>

                  {project.deadline && (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <span className="font-semibold">الموعد النهائي:</span>
                      <span>
                        {new Date(project.deadline).toLocaleDateString("ar-SA")}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-purple-600" />
                    <span className="font-semibold">الناشر:</span>
                    <span>{project.profiles?.full_name}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Briefcase className="h-4 w-4 text-orange-600" />
                    <span className="font-semibold">الحالة:</span>
                    <Badge className={getStatusColor(project.status)}>
                      {project.status === "open" && "مفتوح"}
                      {project.status === "in_progress" && "قيد التنفيذ"}
                      {project.status === "completed" && "مكتمل"}
                      {project.status === "cancelled" && "ملغي"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Link href={`/projects/${project.id}`} className="w-full">
                  <Button className="w-full">عرض التفاصيل</Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="mt-12 pt-8 border-t">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {projects.length}
            </div>
            <div className="text-sm text-gray-600">المشاريع المفتوحة</div>
          </div>
          <div className="p-4">
            <div className="text-2xl font-bold text-green-600">
              $
              {projects
                .reduce((sum, p) => sum + p.budget_min, 0)
                .toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">إجمالي الميزانيات</div>
          </div>
          <div className="p-4">
            <div className="text-2xl font-bold text-purple-600">
              {projects.reduce((sum, p) => sum + (p.bids?.length || 0), 0)}
            </div>
            <div className="text-sm text-gray-600">إجمالي العروض</div>
          </div>
          <div className="p-4">
            <div className="text-2xl font-bold text-orange-600">20%</div>
            <div className="text-sm text-gray-600">عمولة المستقلين</div>
          </div>
        </div>
      </div>
    </div>
  );
}
