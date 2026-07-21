"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import {
  Eye,
  EyeOff,
  UserPlus,
  Briefcase,
  Users,
  DollarSign,
} from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const referralCode = searchParams.get("ref");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<"business_owner" | "freelancer" | "affiliate">("business_owner");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const roleParam = searchParams.get("role") as "business_owner" | "freelancer" | "affiliate";
    if (
      roleParam &&
      ["business_owner", "freelancer", "affiliate"].includes(roleParam)
    ) {
      setRole(roleParam);
    }
  }, [searchParams]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const phoneRegex = /^\+\d{1,3}\s?\d{5,14}$/;
    if (!phoneRegex.test(phone)) {
      setError("رقم الهاتف يجب أن يبدأ بكود الدولة (مثل +966)");
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();

      // تسجيل المستخدم الجديد
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone: phone,
            role: role,
            referral_code: referralCode || null, // حفظ كود الإحالة في بيانات المستخدم
          },
        },
      });

      if (signUpError) throw signUpError;

      // إذا كان هناك كود إحالة، حفظه في localStorage للاستخدام لاحقاً
      if (referralCode && data.user) {
        localStorage.setItem("user_referral_code", referralCode);
        
        // تسجيل الإحالة في قاعدة البيانات
        setTimeout(async () => {
          const { data: affiliateData } = await supabase
            .from("affiliates")
            .select("id")
            .eq("referral_code", referralCode)
            .maybeSingle();

          if (affiliateData) {
            await supabase.from("referrals").insert({
              affiliate_id: affiliateData.id,
              referred_user_id: data.user.id,
              referral_code: referralCode,
              status: "pending",
            });
          }
        }, 1500);
      }

      // حفظ كود الإحالة في sessionStorage أيضاً
      if (referralCode) {
        sessionStorage.setItem("pending_referral_code", referralCode);
      }

      setSuccess(true);
      setTimeout(() => {
        // إذا كان المستخدم صاحب عمل، توجهه مباشرة إلى صفحة إنشاء مشروع مع الكود
        if (role === "business_owner" && referralCode) {
          router.push(`/projects/new?ref=${referralCode}`);
        } else {
          router.push("/dashboard");
        }
      }, 3000);
    } catch (err: any) {
      setError(err.message || "حدث خطأ أثناء إنشاء الحساب");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-500/10 to-emerald-500/15 p-4">
        <Card className="w-full max-w-md border-2 border-green-500/30">
          <CardHeader className="text-center">
            <div className="mx-auto w-20 h-20 bg-green-500/15 rounded-full flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                <UserPlus className="h-6 w-6 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl text-green-400">
              تم إنشاء حسابك بنجاح! 🎉
            </CardTitle>
            <CardDescription>
              {referralCode ? (
                <>
                  تم تفعيل كود الإحالة: <strong>{referralCode}</strong>
                  <br />
                  سيتم توجيهك لإنشاء أول مشروع...
                </>
              ) : (
                "يتم توجيهك إلى لوحة التحكم..."
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <Card className="w-full max-w-lg border-2">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-800 rounded-full flex items-center justify-center mb-4">
            <UserPlus className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold">إنشاء حساب جديد</CardTitle>
          <CardDescription>
            اختر نوع حسابك واملأ المعلومات المطلوبة
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSignup}>
          <CardContent className="space-y-6">
            {referralCode && (
              <Alert className="bg-gradient-to-r from-emerald-500/10 to-purple-500/10 border-emerald-500/20">
                <DollarSign className="h-4 w-4 text-emerald-400" />
                <AlertDescription className="space-y-2">
                  <div>
                    ✅ <strong>كود الإحالة مفعل:</strong> {referralCode}
                  </div>
                  {role === "business_owner" && (
                    <div className="text-sm text-emerald-300">
                      ستحصل على خصم 10% على نشر أول مشروع لك!
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Role Selection */}
            <div className="space-y-3">
              <Label>أنا</Label>
              <RadioGroup
                value={role}
                onValueChange={(value) => setRole(value as "business_owner" | "freelancer" | "affiliate")}
                className="grid grid-cols-3 gap-3"
              >
                <div>
                  <RadioGroupItem value="business_owner" id="business_owner" className="peer sr-only" />
                  <Label
                    htmlFor="business_owner"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-neutral-800 bg-neutral-900 p-4 hover:bg-neutral-800 hover:text-white peer-data-[state=checked]:border-emerald-500 peer-data-[state=checked]:bg-emerald-500/10 cursor-pointer"
                  >
                    <Briefcase className="h-6 w-6 mb-2" />
                    <span>صاحب عمل</span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem
                    value="freelancer"
                    id="freelancer"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="freelancer"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-neutral-800 bg-neutral-900 p-4 hover:bg-neutral-800 hover:text-white peer-data-[state=checked]:border-emerald-400 peer-data-[state=checked]:bg-emerald-500/10 cursor-pointer"
                  >
                    <Users className="h-6 w-6 mb-2" />
                    <span>مستقل</span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem
                    value="affiliate"
                    id="affiliate"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="affiliate"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-neutral-800 bg-neutral-900 p-4 hover:bg-neutral-800 hover:text-white peer-data-[state=checked]:border-purple-500 peer-data-[state=checked]:bg-purple-500/10 cursor-pointer"
                  >
                    <DollarSign className="h-6 w-6 mb-2" />
                    <span>مسوق</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Personal Info */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <Label htmlFor="fullName">الاسم الكامل</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  placeholder="أحمد محمد"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="phone">رقم الهاتف (مع كود الدولة)</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  placeholder="+966 5X XXX XXXX"
                  dir="ltr"
                />
                <p className="text-xs text-neutral-400">مثال: +966501234567</p>
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input
                id="email"
                type="email"
                placeholder="example@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                dir="ltr"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="password">كلمة المرور</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-300"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-neutral-400">
                يجب أن تحتوي كلمة المرور على 6 أحرف على الأقل
              </p>
            </div>

            <Button
              type="submit"
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-semibold"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  جاري إنشاء الحساب...
                </>
              ) : (
                "إنشاء حساب"
              )}
            </Button>
          </CardContent>

          <CardContent className="pt-0">
            <div className="text-center space-y-2">
              <p className="text-sm text-neutral-400">
                لديك حساب بالفعل؟{" "}
                <Link
                  href="/auth/login"
                  className="text-emerald-400 hover:underline font-medium"
                >
                  سجل الدخول
                </Link>
              </p>
              
              {!referralCode && (
                <p className="text-xs text-neutral-400">
                  لديك كود إحالة؟{" "}
                  <Link
                    href="/auth/signup"
                    className="text-purple-600 hover:underline"
                  >
                    أضفه عند التسجيل
                  </Link>
                </p>
              )}
            </div>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
