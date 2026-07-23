import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, Briefcase, DollarSign, Shield, Users } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  return (
      <div className="min-h-screen">
      {/* Hero Section — cinematic full-bleed with glassmorphism card */}
      <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden px-4">
        {/* Backdrop: swap this block for a <video autoPlay muted loop playsInline poster="/hero-poster.jpg"><source src="/hero.mp4" type="video/mp4" /></video>
            once a real cinematic clip is available. Until then, an animated gradient + glowing
            connection lines stand in for the "remote teams, connected by data lines" concept. */}
        <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_20%_20%,#0b1c14_0%,#050705_55%,#020302_100%)]" />
        <div className="absolute inset-0 -z-20 opacity-70 animate-[hero-drift_18s_ease-in-out_infinite] bg-[radial-gradient(circle_at_75%_65%,rgba(16,185,129,0.28)_0%,transparent_45%)]" />
        <svg
          className="absolute inset-0 -z-10 h-full w-full opacity-60"
          viewBox="0 0 1200 800"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="dataLine" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#34d399" stopOpacity="0" />
              <stop offset="50%" stopColor="#34d399" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[
            "M120,620 C320,520 420,560 620,400 S920,220 1080,180",
            "M60,180 C260,240 380,180 560,300 S860,540 1140,560",
            "M180,760 C420,680 520,500 760,460 S1020,360 1160,300",
          ].map((d, i) => (
            <path
              key={d}
              d={d}
              fill="none"
              stroke="url(#dataLine)"
              strokeWidth="1.5"
              strokeDasharray="6 10"
              className="animate-[hero-flow_6s_linear_infinite]"
              style={{ animationDelay: `${i * 0.8}s` }}
            />
          ))}
          {[
            [120, 620], [620, 400], [1080, 180], [60, 180], [560, 300], [1140, 560], [760, 460], [1160, 300],
          ].map(([cx, cy], i) => (
            <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="4" fill="#6ee7b7" className="animate-[hero-pulse_3s_ease-in-out_infinite]" style={{ animationDelay: `${i * 0.3}s` }} />
          ))}
        </svg>

        <div className="absolute inset-0 -z-10 bg-black/35" />

        {/* Glassmorphism card */}
        <div className="relative w-full max-w-2xl rounded-2xl border border-emerald-500/20 bg-black/40 backdrop-blur-xl px-8 py-14 text-center shadow-2xl shadow-black/60 sm:px-14">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white text-balance">
            تواصل مع نخبة المستقلين حول العالم
          </h1>
          <p className="mt-6 text-lg md:text-xl text-white/70 max-w-xl mx-auto text-pretty">
            حلول مواهب قابلة للتوسع، مدعومة بالسحابة — بلا حدود جغرافية
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup">
              <Button
                size="lg"
                className="gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold shadow-lg shadow-emerald-900/40 px-8"
              >
                وظّف أفضل الكفاءات
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/projects">
              <Button size="lg" variant="outline" className="border-white/30 text-white bg-white/5 hover:bg-white/10">
                استعرض المشاريع
              </Button>
            </Link>
          </div>
        </div>

        <style>{`
          @keyframes hero-drift {
            0%, 100% { transform: translate(0, 0) scale(1); }
            50% { transform: translate(-3%, 2%) scale(1.08); }
          }
          @keyframes hero-flow {
            to { stroke-dashoffset: -160; }
          }
          @keyframes hero-pulse {
            0%, 100% { opacity: 0.3; r: 3; }
            50% { opacity: 1; r: 5; }
          }
          @media (prefers-reduced-motion: reduce) {
            [class*="animate-[hero-"] { animation: none !important; }
          }
        `}</style>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-secondary/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">لماذا تختار منصتنا؟</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <DollarSign className="h-12 w-12 text-emerald-400 mb-4" />
                <CardTitle>نظام عمولة مزدوج</CardTitle>
                <CardDescription>20% للمستقلين، 10% للمسوقين</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">احصل على عمولة مجزية لكل مشروع تنفذه أو تجلبه للمنصة</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Shield className="h-12 w-12 text-emerald-400 mb-4" />
                <CardTitle>حماية المعلومات</CardTitle>
                <CardDescription>أرقام الهواتف مخفية حتى القبول</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">نحمي معلومات اتصالك ونظهرها فقط للأطراف المقبولة</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Users className="h-12 w-12 text-emerald-400 mb-4" />
                <CardTitle>ثلاثة أنواع من المستخدمين</CardTitle>
                <CardDescription>أصحاب عمل، مستقلين، مسوقين</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">نظام متكامل يلبي احتياجات جميع الأطراف في سوق العمل الحر</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">كيف تعمل المنصة؟</h2>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-emerald-400">1</span>
              </div>
              <h3 className="font-semibold mb-2">انشر مشروعك</h3>
              <p className="text-sm text-muted-foreground">أضف مشروعك بحد أدنى 150$</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-emerald-400">2</span>
              </div>
              <h3 className="font-semibold mb-2">استقبل العروض</h3>
              <p className="text-sm text-muted-foreground">يحصل المستقلون على 20% عمولة</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-emerald-400">3</span>
              </div>
              <h3 className="font-semibold mb-2">اختر أفضل عرض</h3>
              <p className="text-sm text-muted-foreground">شاهد تقييمات المستقلين السابقة</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-orange-400">4</span>
              </div>
              <h3 className="font-semibold mb-2">احصل على عمولة</h3>
              <p className="text-sm text-muted-foreground">المسوقون يحصلون على 10% عمولة</p>
            </div>
          </div>
        </div>
      </section>

      {/* Verification Section */}
      <section className="py-16 px-4 bg-secondary/30">
        <div className="max-w-4xl mx-auto text-center">
          <Shield className="h-12 w-12 text-emerald-600 mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-4">مستقلون موثّقون</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
            يمكن للمستقلين رفع رخصة عمل حر أو نشاط منزلي محلية (اختياري) للحصول على شارة
            "موثّق"، تظهر لصاحب العمل عند مراجعة العروض قبل قبولها.
          </p>
          <Link href="/profile">
            <Button size="lg" variant="outline" className="gap-2">
              <Shield className="h-4 w-4" />
              وثّق حسابك الآن
            </Button>
          </Link>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-emerald-600 to-emerald-900 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">جاهز للبدء؟</h2>
          <p className="text-xl mb-8 opacity-90">انضم إلى آلاف المستخدمين الذين وجدوا فرص عمل وأرباح على منصتنا</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup?role=client">
              <Button size="lg" variant="secondary" className="gap-2">
                <Briefcase className="h-4 w-4" />
                أنا صاحب عمل
              </Button>
            </Link>
            <Link href="/auth/signup?role=freelancer">
              <Button size="lg" variant="outline" className="bg-white text-emerald-400 hover:bg-neutral-900 gap-2">
                <Briefcase className="h-4 w-4" />
                أنا مستقل
              </Button>
            </Link>
            <Link href="/auth/signup?role=affiliate">
              <Button size="lg" variant="ghost" className="text-white border-2 border-white hover:bg-white/10 gap-2">
                <Users className="h-4 w-4" />
                أنا مسوق
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
