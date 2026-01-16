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
  // تم تغيير "client" إلى "business_owner" في جميع الأماكن
  const [role, setRole] = useState<"business_owner" | "freelancer" | "affiliate">("business_owner");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // تم تغيير "client" إلى "business_owner"
    const roleParam = searchParams.get("role") as "business_owner" | "freelancer" | "affiliate";
    if (
      roleParam &&
      // تم تغيير "client" إلى "business_owner"
      ["business_owner", "freelancer", "affiliate"].includes(roleParam)
    ) {
      setRole(roleParam);
    }
  }, [searchParams]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // === إضافة التحقق من رقم الهاتف مع كود الدولة ===
    const phoneRegex = /^\+\d{1,3}\s?\d{5,14}$/;
    if (!phoneRegex.test(phone)) {
      setError("رقم الهاتف يجب أن يبدأ بكود الدولة (مثل +966)");
      setLoading(false);
      return;
    }
    // === نهاية التحقق ===

    try {
      const supabase = createClient();

      // تسجيل المستخدم الجديد
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (signUpError) throw signUpError;

      if (!authData.user) throw new Error("فشل إنشاء الحساب");

      // === إصلاح خطأ المفتاح المكرر باستخدام upsert ===
      // إنشاء أو تحديث الملف الشخصي
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: authData.user.id,
        full_name: fullName,
        phone: phone,
        role: role,
      }, {
        onConflict: 'id' // إذا كان الـ id موجوداً، قم بتحديث السجل
      });
      // === نهاية الإصلاح ===

      if (profileError) throw profileError;

      // إذا كان هناك كود إحالة، تسجيل الإحالة
      if (referralCode) {
        const { data: affiliateData } = await supabase
          .from("affiliates")
          .select("id")
          .eq("referral_code", referralCode)
          .single();

        if (affiliateData) {
          await supabase.from("referrals").insert({
            affiliate_id: affiliateData.id,
            referred_user_id: authData.user.id,
            referral_code: referralCode,
            status: "pending",
          });
        }
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard");
      }, 3000);
    } catch (err: any) {
      setError(err.message || "حدث خطأ أثناء إنشاء الحساب");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 p-4">
        <Card className="w-full max-w-md border-2 border-green-200">
          <CardHeader className="text-center">
            <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                <UserPlus className="h-6 w-6 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl text-green-700">
              تم إنشاء حسابك بنجاح! 🎉
            </CardTitle>
            <CardDescription>
              مرحباً بك في منصة العمل الحر. يتم توجيهك إلى لوحة التحكم...
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-lg border-2">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center mb-4">
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
              <Alert className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                <DollarSign className="h-4 w-4 text-blue-600" />
                <AlertDescription>
                  تمت إحالتك بواسطة كود:{" "}
                  <span className="font-bold">{referralCode}</span>
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
                // تم تغيير "client" إلى "business_owner"
                onValueChange={(value) => setRole(value as "business_owner" | "freelancer" | "affiliate")}
                className="grid grid-cols-3 gap-3"
              >
                <div>
                  {/* تم تغيير "client" إلى "business_owner" */}
                  <RadioGroupItem value="business_owner" id="business_owner" className="peer sr-only" />
                  <Label
                    htmlFor="business_owner"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-gray-200 bg-white p-4 hover:bg-gray-50 hover:text-gray-900 peer-data-[state=checked]:border-blue-600 peer-data-[state=checked]:bg-blue-50 cursor-pointer"
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
                    className="flex flex-col items-center justify-between rounded-md border-2 border-gray-200 bg-white p-4 hover:bg-gray-50 hover:text-gray-900 peer-data-[state=checked]:border-green-600 peer-data-[state=checked]:bg-green-50 cursor-pointer"
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
                    className="flex flex-col items-center justify-between rounded-md border-2 border-gray-200 bg-white p-4 hover:bg-gray-50 hover:text-gray-900 peer-data-[state=checked]:border-purple-600 peer-data-[state=checked]:bg-purple-50 cursor-pointer"
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
                <p className="text-xs text-gray-500">مثال: +966501234567</p>
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
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500">
                يجب أن تحتوي كلمة المرور على 6 أحرف على الأقل
              </p>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
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
            <p className="text-sm text-center text-gray-600">
              لديك حساب بالفعل؟{" "}
              <Link
                href="/auth/login"
                className="text-blue-600 hover:underline font-medium"
              >
                سجل الدخول
              </Link>
            </p>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
