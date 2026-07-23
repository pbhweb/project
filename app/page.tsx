"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  ArrowRight, Briefcase, DollarSign, Shield, Users, Bot, 
  CheckCircle2, Sparkles, RefreshCw, Volume2, VolumeX, AlertCircle 
} from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  // التحكم بصوت الفيديو
  const [isMuted, setIsMuted] = useState(true)
  const videoRef = useRef<HTMLVideoElement>(null)

  const toggleSound = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  // ضمان تشغيل الفيديو تلقائياً فور تحميل الصفحة
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      // محاولة التشغيل مع تجاهل الأخطاء
      const playPromise = video.play();
      
      if (playPromise !== undefined) {
        playPromise.then(() => {
          console.log("Video started playing");
        }).catch(error => {
          console.log("Autoplay prevented:", error);
          // محاولة إعادة التشغيل بعد تفاعل المستخدم
          document.addEventListener('click', () => {
            video.play();
          }, { once: true });
        });
      }
    }
  }, []);

  // محاكاة تقييم الـ AI والتحويل الآلي
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [aiResult, setAiResult] = useState<{ score: number; status: string; payout: string } | null>(null)

  const handleAiAutoAudit = () => {
    setIsEvaluating(true)
    setAiResult(null)

    setTimeout(() => {
      setIsEvaluating(false)
      setAiResult({
        score: 98,
        status: "مكتمِل ومُطابق لشروط العمل 100%",
        payout: "تم تحويل 20% عمولة المستقل و 10% عمولة المسوق آلياً ⚡",
      })
    }, 2500)
  }

  return (
    <div className="min-h-screen bg-black text-white">
      
      {/* Hero Section - الفيديو خلفية شفافة مرئية */}
      <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden px-4">
        
       <div className="absolute inset-0 z-0">
          <video
            ref={videoRef}
            autoPlay
            muted={isMuted}
            loop
            playsInline
            preload="auto"
            className="w-full h-full object-cover"
            poster="/video-poster.jpg" // صورة بديلة أثناء التحميل
          >
            <source src="/hero.mp4" type="video/mp4" />
            {/* إضافة بديل للفيديو إذا لم يتم تحميله */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 to-black/90 flex items-center justify-center">
              <div className="text-center">
                <Briefcase className="h-16 w-16 mx-auto text-emerald-400 mb-4" />
                <p className="text-xl">جاري تحميل الفيديو...</p>
              </div>
            </div>
          </video>
        </div>


      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 z-10" />


        {/* 2. زر كتم / تشغيل الصوت فائق الاستجابة */}
        <button
          onClick={toggleSound}
          className="absolute bottom-6 right-6 z-30 p-3 rounded-full bg-black/50 backdrop-blur-md border border-white/20 hover:bg-emerald-500 hover:text-black transition-all text-white shadow-xl cursor-pointer"
          title={isMuted ? "تشغيل الصوت" : "كتم الصوت"}
        >
          {isMuted ? (
            <VolumeX className="h-5 w-5 text-gray-300" />
          ) : (
            <Volume2 className="h-5 w-5 text-emerald-400 animate-pulse" />
          )}
        </button>

        {/* 3. طبقة شفافة خفيفة جداً لإبراز الفيديو */}
        <div className="absolute inset-0 -z-20 bg-black/20" />

        {/* 4. بطاقة المحتوى الزجاجية بالكامل (تظهر الفيديو من خلفها) */}
        <div className="relative z-10 w-full max-w-2xl rounded-2xl border border-white/20 bg-black/30 backdrop-blur-sm px-8 py-14 text-center shadow-2xl sm:px-14">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white text-balance drop-shadow-md">
            تواصل مع نخبة المستقلين حول العالم
          </h1>
          <p className="mt-6 text-lg md:text-xl text-white/90 max-w-xl mx-auto text-pretty drop-shadow-sm">
            إدارة وتسليم آلي مدعوم بالذكاء الاصطناعي مع تحويل تلقائي للعمولات والأرباح
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
              <Button size="lg" variant="outline" className="border-white/40 text-white bg-black/20 hover:bg-white/20 backdrop-blur-md">
                استعرض المشاريع
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* قسم التحليل الآلي للذكاء الاصطناعي */}
      <section className="py-12 px-4 border-y border-emerald-500/20 bg-emerald-950/20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium mb-4">
            <Sparkles className="h-3.5 w-3.5" /> مراجعة AI قبل التسليم + تحويل آلي
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">تحليل الذكاء الاصطناعي وإيداع العمولات الفوري</h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm sm:text-base mb-6">
            قبل تسليم العمل للعميل، يفحص الـ AI ملفات المستقل تلقائياً للتأكد من الشروط، ثم يُحول المستحقات فورياً.
          </p>

          <div className="max-w-md mx-auto p-6 rounded-xl border border-white/10 bg-black/60 backdrop-blur-md">
            <div className="flex items-center justify-between mb-4 text-xs text-emerald-400 font-mono">
              <span>AI_PRE_DELIVERY_AUDIT</span>
              <span>AUTOMATED_PAYOUT</span>
            </div>
            {!aiResult ? (
              <Button
                onClick={handleAiAutoAudit}
                disabled={isEvaluating}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-semibold gap-2"
              >
                {isEvaluating ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" /> جاري تحليل الملفات وصرف العمولات...
                  </>
                ) : (
                  <>
                    <Bot className="h-4 w-4" /> محاكاة رفع العمل وتحليله بالـ AI
                  </>
                )}
              </Button>
            ) : (
              <div className="text-right space-y-3 animate-in fade-in zoom-in duration-300">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="text-sm text-gray-400">نسبة تطابق المخرجات:</span>
                  <span className="text-emerald-400 font-bold text-lg">{aiResult.score}%</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-emerald-300">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                  <span>{aiResult.status}</span>
                </div>
                <div className="p-3 bg-emerald-500/10 rounded-lg text-xs text-emerald-200 border border-emerald-500/20 font-mono text-center">
                  {aiResult.payout}
                </div>
                <Button variant="ghost" size="sm" onClick={() => setAiResult(null)} className="w-full text-xs text-gray-400 hover:text-white">
                  إعادة المحاكاة
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* المميزات */}
      <section className="py-16 px-4 bg-secondary/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">لماذا تختار منصتنا؟</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-black/40 border-white/10">
              <CardHeader>
                <DollarSign className="h-12 w-12 text-emerald-400 mb-4" />
                <CardTitle>إيداع آلي وفوري</CardTitle>
                <CardDescription>20% للمستقلين، 10% للمسوقين</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  تُحول المبالغ مباشرة إلى المحافظ المخصصة فور اجتياز العمل لمراجعة الذكاء الاصطناعي.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-black/40 border-white/10">
              <CardHeader>
                <Shield className="h-12 w-12 text-emerald-400 mb-4" />
                <CardTitle>توثيق رخص العمل الحر</CardTitle>
                <CardDescription>إشارات توثيق موثوقة</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  نظام إشعارات ذكي يدير حالات تقديم، قبول، ورفض وثائق العمل الحر للمستقلين.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-black/40 border-white/10">
              <CardHeader>
                <Users className="h-12 w-12 text-emerald-400 mb-4" />
                <CardTitle>نظام الأدوار المتعددة</CardTitle>
                <CardDescription>حساب واحد لجميع المهام</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  يمكنك التنقل بسهولة بين وضع المستقل، صاحب العمل، والمسوق بنفس الحساب.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* قسم التوثيق */}
      <section className="py-16 px-4 bg-secondary/30">
        <div className="max-w-4xl mx-auto text-center">
          <Shield className="h-12 w-12 text-emerald-600 mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-4">مستقلون موثّقون</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
            يمكن للمستقلين رفع رخصة عمل حر أو نشاط منزلي محلية (اختياري) للحصول على شارة
            "موثّق"، تظهر لصاحب العمل عند مراجعة العروض قبل قبولها.
          </p>
          <Link href="/profile">
            <Button size="lg" variant="outline" className="gap-2 border-emerald-500/30">
              <Shield className="h-4 w-4" />
              وثّق حسابك الآن
            </Button>
          </Link>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-emerald-600 to-emerald-900 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">جاهز للبدء مع منصتنا الذكية؟</h2>
          <p className="text-xl mb-8 opacity-90">انضم إلى آلاف المستخدمين الذين وجدوا فرص عمل وأرباح مؤتمتة بالكامل</p>
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
