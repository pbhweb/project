"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ArrowRight,
  Briefcase,
  DollarSign,
  Shield,
  ShieldCheck,
  Users,
  PlayCircle,
  FileCheck2,
} from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/lib/i18n/language-context"

export default function HomePage() {
  const { t, lang } = useLanguage()

  return (
    <div className="min-h-screen overflow-hidden">
      {/* Hero Section */}
      <section className="relative py-20 px-4">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.12),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(59,130,246,0.12),transparent_40%)]" />
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div className={lang === "ar" ? "text-right" : "text-left"}>
            <div className="inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-medium text-green-700 mb-5">
              <ShieldCheck className="h-3.5 w-3.5" />
              {t("trust_badge")}
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-balance leading-tight">
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                {t("hero_title_line1")}
              </span>
              <br />
              <span className="text-3xl md:text-4xl text-gray-900">{t("hero_title_line2")}</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-xl text-pretty">{t("hero_subtitle")}</p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/auth/signup">
                <Button size="lg" className="gap-2 shadow-lg shadow-blue-600/20">
                  {t("hero_cta_start")}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/projects">
                <Button size="lg" variant="outline">
                  {t("hero_cta_browse")}
                </Button>
              </Link>
            </div>
          </div>

          {/* Product preview — replace /public/media/hero-poster.jpg and
              /public/media/hero-demo.mp4 with your own screenshots/clip. */}
          <div className="relative">
            <div className="rounded-2xl border bg-white shadow-2xl overflow-hidden aspect-video">
              <video
                className="w-full h-full object-cover"
                poster="/media/hero-poster.jpg"
                controls
                preload="none"
              >
                <source src="/media/hero-demo.mp4" type="video/mp4" />
              </video>
            </div>
            <div className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-lg border p-3 flex items-center gap-2">
              <PlayCircle className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium">
                {lang === "ar" ? "شاهد كيف تعمل المنصة" : "See how it works"}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-secondary/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">{t("features_title")}</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardHeader>
                <DollarSign className="h-10 w-10 text-green-600 mb-3" />
                <CardTitle className="text-lg">{t("feature_commission_title")}</CardTitle>
                <CardDescription>{t("feature_commission_desc")}</CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardHeader>
                <Shield className="h-10 w-10 text-blue-600 mb-3" />
                <CardTitle className="text-lg">{t("feature_protection_title")}</CardTitle>
                <CardDescription>{t("feature_protection_desc")}</CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardHeader>
                <Users className="h-10 w-10 text-purple-600 mb-3" />
                <CardTitle className="text-lg">{t("feature_roles_title")}</CardTitle>
                <CardDescription>{t("feature_roles_desc")}</CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow ring-1 ring-green-100">
              <CardHeader>
                <FileCheck2 className="h-10 w-10 text-green-600 mb-3" />
                <CardTitle className="text-lg">{t("feature_verify_title")}</CardTitle>
                <CardDescription>{t("feature_verify_desc")}</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">{t("how_title")}</h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { n: 1, title: t("how_1_title"), desc: t("how_1_desc"), circle: "bg-blue-100", text: "text-blue-600" },
              {
                n: 2,
                title: t("how_2_title"),
                desc: t("how_2_desc"),
                circle: "bg-purple-100",
                text: "text-purple-600",
              },
              { n: 3, title: t("how_3_title"), desc: t("how_3_desc"), circle: "bg-green-100", text: "text-green-600" },
              {
                n: 4,
                title: t("how_4_title"),
                desc: t("how_4_desc"),
                circle: "bg-orange-100",
                text: "text-orange-600",
              },
            ].map((step) => (
              <div key={step.n} className="text-center">
                <div className={`w-16 h-16 ${step.circle} rounded-full flex items-center justify-center mx-auto mb-4`}>
                  <span className={`text-2xl font-bold ${step.text}`}>{step.n}</span>
                </div>
                <h3 className="font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Verification explainer */}
      <section id="verification" className="py-16 px-4 bg-gradient-to-br from-green-50 via-white to-blue-50">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-100 mb-6">
            <ShieldCheck className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold mb-4">{t("verify_section_title")}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-6">{t("verify_section_body")}</p>
          <Link href="/profile">
            <Button variant="outline" size="lg">
              {t("verify_learn_more")}
            </Button>
          </Link>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-purple-700 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">{t("cta_title")}</h2>
          <p className="text-xl mb-8 opacity-90">{t("cta_subtitle")}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup?role=business_owner">
              <Button size="lg" variant="secondary" className="gap-2">
                <Briefcase className="h-4 w-4" />
                {t("cta_business")}
              </Button>
            </Link>
            <Link href="/auth/signup?role=freelancer">
              <Button size="lg" variant="outline" className="bg-white text-blue-600 hover:bg-gray-50 gap-2">
                <Briefcase className="h-4 w-4" />
                {t("cta_freelancer")}
              </Button>
            </Link>
            <Link href="/auth/signup?role=affiliate">
              <Button size="lg" variant="ghost" className="text-white border-2 border-white hover:bg-white/10 gap-2">
                <Users className="h-4 w-4" />
                {t("cta_affiliate")}
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
