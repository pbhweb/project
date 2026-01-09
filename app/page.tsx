import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowRight, Briefcase, DollarSign, Shield, Users } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-20 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            <span className="text-gradient bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              منصة العمل الحر
            </span>
            <br />
            <span className="text-3xl md:text-4xl">
              الوجهة المثالية لمشاريعك
            </span>
          </h1>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            نوفر لك أفضل المستقلين لإنجاز مشاريعك، ونضمن لك عمولة 10% على كل
            مشروع تجلبه للمنصة
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup">
              <Button size="lg" className="gap-2">
                ابدأ الآن مجاناً
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/projects">
              <Button size="lg" variant="outline">
                استعرض المشاريع
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            لماذا تختار منصتنا؟
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <DollarSign className="h-12 w-12 text-green-600 mb-4" />
                <CardTitle>نظام عمولة مزدوج</CardTitle>
                <CardDescription>20% للمستقلين، 10% للمسوقين</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  احصل على عمولة مجزية لكل مشروع تنفذه أو تجلبه للمنصة
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Shield className="h-12 w-12 text-blue-600 mb-4" />
                <CardTitle>حماية المعلومات</CardTitle>
                <CardDescription>
                  أرقام الهواتف مخفية حتى القبول
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  نحمي معلومات اتصالك ونظهرها فقط للأطراف المقبولة
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Users className="h-12 w-12 text-purple-600 mb-4" />
                <CardTitle>ثلاثة أنواع من المستخدمين</CardTitle>
                <CardDescription>أصحاب عمل، مستقلين، مسوقين</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  نظام متكامل يلبي احتياجات جميع الأطراف في سوق العمل الحر
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            كيف تعمل المنصة؟
          </h2>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="font-semibold mb-2">انشر مشروعك</h3>
              <p className="text-sm text-muted-foreground">
                أضف مشروعك بحد أدنى 300$
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-purple-600">2</span>
              </div>
              <h3 className="font-semibold mb-2">استقبل العروض</h3>
              <p className="text-sm text-muted-foreground">
                يحصل المستقلون على 20% عمولة
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600">3</span>
              </div>
              <h3 className="font-semibold mb-2">اختر أفضل عرض</h3>
              <p className="text-sm text-muted-foreground">
                شاهد تقييمات المستقلين السابقة
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-orange-600">4</span>
              </div>
              <h3 className="font-semibold mb-2">احصل على عمولة</h3>
              <p className="text-sm text-muted-foreground">
                المسوقون يحصلون على 10% عمولة
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">جاهز للبدء؟</h2>
          <p className="text-xl mb-8 opacity-90">
            انضم إلى آلاف المستخدمين الذين وجدوا فرص عمل وأرباح على منصتنا
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup?role=client">
              <Button size="lg" variant="secondary" className="gap-2">
                <Briefcase className="h-4 w-4" />
                أنا صاحب عمل
              </Button>
            </Link>
            <Link href="/auth/signup?role=freelancer">
              <Button
                size="lg"
                variant="outline"
                className="bg-white text-purple-600 gap-2"
              >
                💼 أنا مستقل
              </Button>
            </Link>
            <Link href="/auth/signup?role=affiliate">
              <Button
                size="lg"
                variant="ghost"
                className="text-white border-white gap-2"
              >
                📢 أنا مسوق
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
