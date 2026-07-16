// app/projects/new/page.tsx
"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, Upload, X, UserPlus, Gift, CreditCard, AlertCircle } from "lucide-react";
import Link from "next/link";

// مكون داخلي يستخدم useSearchParams
function NewProjectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [paymentWindowOpened, setPaymentWindowOpened] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [estimatedHours, setEstimatedHours] = useState("");
  const [deadline, setDeadline] = useState<Date>();
  const [referralCode, setReferralCode] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [referralLoaded, setReferralLoaded] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Quick-select budget presets shown as chips in the UI. These no
  // longer point at 5 different payment domains — every budget uses
  // the SAME checkout link, with the price passed as a query param.
  const budgetOptions = [
    { value: "300", label: "300$ - مشروع صغير/مبدئي" },
    { value: "600", label: "600$ - مشروع رقمي بسيط" },
    { value: "900", label: "900$ - مشروع متوسط" },
    { value: "1200", label: "1200$ - مشروع حلول متكاملة" },
    { value: "1500", label: "1500$ - مشروع كبير/معقد" },
  ];

  // Single checkout product. Replace PAYMENT_PRODUCT_ID with the real
  // product id from your digital.workshub.space storefront if it's
  // different. The amount and a "wanted" flag are passed as query
  // params so ANY budget value works through this one link.
  const PAYMENT_PRODUCT_ID = "workhub-project";
  const buildPaymentUrl = (amount: string, projectId: string, userIdForLink: string) =>
    `https://digital.workshub.space/l/${PAYMENT_PRODUCT_ID}?price=${amount}&wanted=true&project_id=${projectId}&user_id=${userIdForLink}`;

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error("❌ خطأ في المصادقة:", authError);
        setIsLoggedIn(false);
        const currentParams = new URLSearchParams(window.location.search);
        router.push(`/auth/login?redirect=/projects/new&${currentParams.toString()}`);
        return;
      }
      
      if (!user) {
        setIsLoggedIn(false);
        const currentParams = new URLSearchParams(window.location.search);
        router.push(`/auth/login?redirect=/projects/new&${currentParams.toString()}`);
        return;
      }
      
      setIsLoggedIn(true);
      setUserId(user.id);
    };
    
    checkAuth();

    const refFromUrl = searchParams.get("ref");
    const refFromStorage = localStorage.getItem("user_referral_code");
    const refFromSession = sessionStorage.getItem("pending_referral_code");
    
    let finalRefCode = refFromUrl || refFromStorage || refFromSession;
    
    if (finalRefCode && !referralLoaded) {
      setReferralCode(finalRefCode.toUpperCase());
      setReferralLoaded(true);
      
      if (refFromStorage) {
        localStorage.removeItem("user_referral_code");
      }
      if (refFromSession) {
        sessionStorage.removeItem("pending_referral_code");
      }
      
      setError(null);
    }
  }, [searchParams, referralLoaded, router]);

  const updateAffiliateStats = async (affiliateId: string, commissionAmount: number) => {
    const supabase = createClient();
    
    try {
      const { data: currentAffiliate, error: fetchError } = await supabase
        .from("affiliates")
        .select("total_referrals, total_earnings")
        .eq("id", affiliateId)
        .single();

      if (fetchError) {
        return { success: false, error: fetchError };
      }

      if (currentAffiliate) {
        const newReferrals = (currentAffiliate.total_referrals || 0) + 1;
        const newEarnings = parseFloat(((currentAffiliate.total_earnings || 0) + commissionAmount).toFixed(2));
        
        const { error: updateError } = await supabase
          .from("affiliates")
          .update({
            total_referrals: newReferrals,
            total_earnings: newEarnings,
            updated_at: new Date().toISOString()
          })
          .eq("id", affiliateId);

        if (updateError) {
          return { success: false, error: updateError };
        } else {
          return { success: true };
        }
      } else {
        return { success: false, error: new Error("المسوق غير موجود") };
      }
      
    } catch (statsError: any) {
      return { success: false, error: statsError };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();

      const {
        data: { user },
        error: authError
      } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error("❌ خطأ في المصادقة:", authError);
        const redirectUrl = `/auth/login?redirect=/projects/new&ref=${referralCode || ""}`;
        router.push(redirectUrl);
        return;
      }

      // ✅ **الإصلاح 1: تحقق من وجود profile للمستخدم**
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError || !profile) {
        console.log("⚠️ المستخدم ليس له بروفايل، جاري إنشاء واحد...");
        
        // أنشئ profile إذا لم يكن موجوداً — نستخدم نوع الحساب الذي
        // اختاره المستخدم عند التسجيل (وليس "freelancer" دائماً)
        const metadataRole = (user.user_metadata as any)?.role;
        const safeRole = ["business_owner", "freelancer", "affiliate"].includes(metadataRole)
          ? metadataRole
          : "business_owner"; // person is here to post a project, so default to business_owner, not freelancer
        const { error: createProfileError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'مستخدم',
            role: safeRole,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (createProfileError) {
          console.error("❌ فشل إنشاء البروفايل:", createProfileError);
          throw new Error("فشل في تحضير حسابك. يرجى المحاولة مرة أخرى.");
        }
      }

      if (!title || !description || !category || !budgetMin) {
        throw new Error("جميع الحقول المطلوبة (*) يجب ملؤها");
      }

      const containsContact =
        description.match(/\d{10,}/) ||
        description.match(/@[A-Za-z0-9._%+-]+\.[A-Za-z]{2,}/) ||
        description.match(/(whatsapp|telegram|signal|viber)/i);

      if (containsContact) {
        throw new Error("لا يمكن إضافة معلومات اتصال في وصف المشروع");
      }

      if (!budgetMin || parseFloat(budgetMin) <= 0) {
        throw new Error("الميزانية المختارة غير صالحة");
      }

      let validMarketerId = null;
      
      if (referralCode) {
        try {
          const { data: marketer, error: marketerError } = await supabase
            .from("affiliates")
            .select("id, user_id, referral_code, is_active, total_referrals, total_earnings")
            .eq("referral_code", referralCode.trim())
            .eq("is_active", true)
            .single();

          if (!marketerError && marketer) {
            validMarketerId = marketer.id;
          }
        } catch (marketerErr: any) {
          console.log("⚠️ خطأ في التحقق من كود الإحالة:", marketerErr.message);
        }
      }

      const projectData: any = {
        client_id: user.id,
        title,
        description,
        category,
        budget_min: parseInt(budgetMin),
        status: "pending_payment",
        referral_code: referralCode || null,
      };

      if (budgetMax) projectData.budget_max = parseFloat(budgetMax);
      if (estimatedHours) projectData.estimated_hours = parseInt(estimatedHours);
      if (deadline) projectData.deadline = deadline;

      // ✅ **الإصلاح 2: استخدام maybeSingle بدلاً من single**
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .insert(projectData)
        .select()
        .maybeSingle(); // ← غيرت من single إلى maybeSingle

      if (projectError || !project) {
        console.error("❌ خطأ في إنشاء المشروع:", projectError);
        throw new Error(projectError?.message || "فشل إنشاء المشروع");
      }

      console.log("✅ تم إنشاء المشروع بنجاح:", project.id);
      setCreatedProjectId(project.id);

      if (validMarketerId && project.id) {
        try {
          const commissionAmount = parseFloat(((parseInt(budgetMin) * 10) / 100).toFixed(2));
          
          const { error: referralError } = await supabase
            .from("referrals")
            .insert({
              affiliate_id: validMarketerId,
              referred_user_id: user.id,
              referral_code: referralCode,
              project_id: project.id,
              commission_amount: commissionAmount,
              status: "pending_payment",
              created_at: new Date().toISOString()
            });

          if (!referralError) {
            await updateAffiliateStats(validMarketerId, 0);
          }
          
        } catch (referralErr: any) {
          console.error("❌ خطأ في تسجيل الإحالة:", referralErr.message);
        }
      }

      if (files.length > 0 && files.length <= 50) {
        console.log("📤 رفع الملفات...");
        const failedUploads: string[] = [];
        for (const file of files) {
          const fileName = `${Date.now()}_${file.name}`;
          const { error: uploadError } = await supabase.storage
            .from("project-files")
            .upload(`projects/${project.id}/${fileName}`, file);

          if (!uploadError) {
            await supabase.from("project_files").insert({
              project_id: project.id,
              file_name: file.name,
              file_url: `projects/${project.id}/${fileName}`,
              file_size: file.size,
              file_type: file.type,
              uploaded_by: user.id,
            });
          } else {
            console.error("❌ فشل رفع الملف:", file.name, uploadError);
            failedUploads.push(file.name);
          }
        }
        if (failedUploads.length > 0) {
          // Don't block project creation on this — the project already
          // exists — but let the person know which files didn't make it.
          setError(
            `تم نشر المشروع، لكن فشل رفع ${failedUploads.length} ملف: ${failedUploads.join(", ")}. يمكنك إعادة رفعها من صفحة المشروع.`
          );
        }
      }

      const paymentUrl = buildPaymentUrl(budgetMin, project.id, user.id);
      const newWindow = window.open(paymentUrl, '_blank');
      
      if (newWindow) {
        setPaymentWindowOpened(true);
      } else {
        console.error("❌ فشل فتح نافذة الدفع");
        throw new Error("فشل فتح بوابة الدفع. يرجى التحقق من إعدادات المنع النافذة المنبثقة.");
      }
      
      setSuccess(true);
      
      setTimeout(() => {
        router.push(`/projects/${project.id}`);
      }, 8000);
      
    } catch (err: any) {
      console.error("❌ خطأ أثناء إنشاء المشروع:", err);
      setError(err.message || "حدث خطأ أثناء إنشاء المشروع. يرجى المحاولة مرة أخرى.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;

    const newFiles = Array.from(selectedFiles);
    if (files.length + newFiles.length > 50) {
      setError("لا يمكن رفع أكثر من 50 ملف");
      return;
    }

    setFiles([...files, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const categories = [
    { value: "web-design", label: "تصميم مواقع" },
    { value: "mobile-app", label: "تطبيقات جوال" },
    { value: "graphic-design", label: "تصميم جرافيك" },
    { value: "writing", label: "كتابة ومحتوى" },
    { value: "marketing", label: "تسويق" },
    { value: "programming", label: "برمجة" },
    { value: "consulting", label: "استشارات" },
    { value: "translation", label: "ترجمة" },
    { value: "video-editing", label: "مونتاج فيديو" },
    { value: "other", label: "أخرى" },
  ];

  const showReferralNotice = referralCode && referralLoaded;

  if (!isLoggedIn) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحقق من تسجيل الدخول...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="border-2 border-green-200 shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                <svg
                  className="h-6 w-6 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>
            <CardTitle className="text-2xl text-green-700">
              {paymentWindowOpened ? "تم فتح بوابة الدفع! 🎉" : "تم إنشاء مشروعك بنجاح! ✅"}
            </CardTitle>
            <CardDescription>
              {paymentWindowOpened 
                ? "تم فتح نافذة جديدة لبوابة الدفع. يرجى إكمال عملية الدفع."
                : "سيتم توجيهك إلى صفحة المشروع قريباً..."}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            {paymentWindowOpened && (
              <>
                <Alert className="bg-blue-50 border-blue-200">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-700">
                    <p className="font-medium mb-2">⚠️ تم فتح نافذة الدفع</p>
                    <p className="text-sm">
                      إذا لم تفتح نافذة الدفع تلقائياً،{' '}
                      <button
                        onClick={() => {
                          if (createdProjectId && userId) {
                            window.open(buildPaymentUrl(budgetMin, createdProjectId, userId), "_blank");
                          }
                        }}
                        className="text-blue-600 hover:underline font-medium"
                      >
                        انقر هنا لفتح بوابة الدفع
                      </button>
                    </p>
                  </AlertDescription>
                </Alert>
                
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-700">
                    ⚠️ <strong>مهم:</strong> لن يتم نشر المشروع إلا بعد إكمال عملية الدفع بنجاح
                  </p>
                  <p className="text-xs text-yellow-600 mt-1">
                    سيتم تحديث حالة المشروع تلقائياً بعد الدفع
                  </p>
                </div>
              </>
            )}
            
            {referralCode && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700">
                  ✅ <strong>كود الإحالة:</strong> {referralCode}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  سيحصل المسوق على عمولة 10% بعد إتمام عملية الدفع
                </p>
              </div>
            )}
            
            <div className="pt-4 border-t">
              <p className="text-sm text-gray-500">
                ستتم توجيهك إلى صفحة المشروع خلال 8 ثوانٍ...
              </p>
              <div className="flex justify-center items-center space-x-2 mt-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                <span className="text-sm text-gray-600">جاري التوجيه...</span>
              </div>
              
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => router.push('/my-projects')}
              >
                الذهاب إلى لوحة التحكم الآن
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          نشر مشروع جديد
        </h1>
        <p className="text-gray-600">
          املأ التفاصيل أدناه لبدء تلقي عروض من المستقلين المحترفين
        </p>
      </div>

      {showReferralNotice && (
        <Alert className="mb-6 border-green-200 bg-green-50">
          <Gift className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700 space-y-2">
            <div>
              ✅ <strong>كود الإحالة مفعل:</strong> {referralCode}
            </div>
            <div className="text-sm text-green-600">
              تحصل على خصم 10% وسيحصل المسوق على عمولة عند إتمام المشروع
            </div>
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>معلومات المشروع الأساسية</CardTitle>
                <CardDescription>أدخل تفاصيل مشروعك بشكل واضح</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-3">
                  <Label htmlFor="title">عنوان المشروع *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    placeholder="مثال: تصميم موقع إلكتروني لشركة تجارية"
                    className="focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="description">وصف المشروع *</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    rows={6}
                    placeholder="صف مشروعك بالتفصيل، بما في ذلك المتطلبات والنتائج المتوقعة..."
                    className="resize-none focus:ring-2 focus:ring-purple-500"
                  />
                  <p className="text-sm text-gray-500">
                    ⚠️ لا تضف معلومات اتصال (أرقام هواتف، إيميلات، حسابات تواصل
                    اجتماعي)
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <Label htmlFor="category">التصنيف *</Label>
                    <Select
                      value={category}
                      onValueChange={setCategory}
                      required
                    >
                      <SelectTrigger className="focus:ring-2 focus:ring-purple-500">
                        <SelectValue placeholder="اختر التصنيف" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="estimatedHours">الوقت المقدر (ساعات)</Label>
                    <Input
                      id="estimatedHours"
                      type="number"
                      min="1"
                      value={estimatedHours}
                      onChange={(e) => setEstimatedHours(e.target.value)}
                      placeholder="مثال: 40"
                      className="focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <Label htmlFor="budgetMin">الميزانية الدنيا *</Label>
                    <Select
                      value={budgetMin}
                      onValueChange={setBudgetMin}
                      required
                    >
                      <SelectTrigger className="focus:ring-2 focus:ring-purple-500">
                        <SelectValue placeholder="اختر الميزانية" />
                      </SelectTrigger>
                      <SelectContent>
                        {budgetOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500">
                      سيتم فتح بوابة الدفع المناسبة تلقائياً بناءً على اختيارك
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="budgetMax">
                      الميزانية القصوى (اختياري)
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                        $
                      </span>
                      <Input
                        id="budgetMax"
                        type="number"
                        min={budgetMin || "300"}
                        step="50"
                        value={budgetMax}
                        onChange={(e) => setBudgetMax(e.target.value)}
                        className="pl-10 focus:ring-2 focus:ring-purple-500"
                        placeholder="اختياري"
                      />
                    </div>
                    {budgetMin && (
                      <p className="text-xs text-gray-500">
                        الحد الأدنى المحدد: {budgetMin}$
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>الملفات المرفقة</CardTitle>
                <CardDescription>
                  يمكنك رفع حتى 50 ملف (صور، مستندات، إلخ)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-400 transition-colors">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 mb-3">
                    اسحب وأفلت الملفات أو انقر للرفع
                  </p>
                  <input
                    type="file"
                    id="file-upload"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <label htmlFor="file-upload">
                    <Button type="button" variant="outline" className="hover:bg-purple-50">
                      اختيار الملفات
                    </Button>
                  </label>
                  <p className="text-xs text-gray-500 mt-3">
                    الملفات المدعومة: صور، PDF، Word، Excel، ZIP (بحد أقصى 50 ملف)
                  </p>
                </div>

                {files.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">
                      الملفات المختارة ({files.length}/50)
                    </p>
                    <div className="space-y-2">
                      {files.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                              <span className="text-xs font-medium">
                                {file.name.split(".").pop()?.toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-medium truncate max-w-xs">
                                {file.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {(file.size / 1024).toFixed(1)} كيلوبايت
                              </p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                            className="hover:bg-red-50 hover:text-red-600"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>إعدادات إضافية</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label>الموعد النهائي (اختياري)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal hover:bg-gray-50",
                          !deadline && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="ml-2 h-4 w-4" />
                        {deadline
                          ? format(deadline, "yyyy-MM-dd")
                          : "اختر تاريخ"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={deadline}
                        onSelect={setDeadline}
                        initialFocus
                        className="rounded-md border"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="referralCode" className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4" />
                    كود الإحالة (اختياري)
                  </Label>
                  <div className="relative">
                    <Input
                      id="referralCode"
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                      placeholder="أدخل كود الإحالة"
                      className={cn(
                        "focus:ring-2 focus:ring-purple-500",
                        referralLoaded ? "border-green-500 bg-green-50" : ""
                      )}
                    />
                    {referralLoaded && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    إذا كنت قد سجلت عبر رابط مسوق، أدخل الكود هنا أو استخدم رابط مثل:
                    <code className="block mt-1 bg-gray-100 p-1 rounded text-xs font-mono">
                      https://workshub.space/projects/new?ref=ABCD
                    </code>
                  </p>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-100">
                  <h3 className="font-semibold text-blue-700 mb-2 flex items-center gap-2">
                    <span>💡</span> نصائح للنشر
                  </h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500">•</span>
                      <span>كن واضحاً في وصف المتطلبات</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500">•</span>
                      <span>حدد ميزانية واقعية</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500">•</span>
                      <span>أرفق ملفات توضيحية إن أمكن</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500">•</span>
                      <span>حدد موعداً نهائياً مناسباً</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>معلومات الدفع والإحالة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-green-600 font-bold">💰</span>
                  </div>
                  <div>
                    <p className="font-medium">نظام الدفع</p>
                    <p className="text-sm text-gray-600">
                      بعد النشر، سيتم فتح بوابة الدفع المناسبة تلقائياً حسب الميزانية المختارة
                    </p>
                  </div>
                </div>

                {budgetMin && (
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm font-medium text-blue-700">
                      الميزانية المختارة: <span className="font-bold">{budgetMin}$</span>
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      رابط الدفع: <span className="font-mono">digital.workshub.space/l/{PAYMENT_PRODUCT_ID}</span>
                    </p>
                  </div>
                )}

                {referralCode && (
                  <div className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Gift className="h-4 w-4 text-purple-600" />
                      <p className="text-sm font-medium text-purple-700">
                        مزايا كود الإحالة
                      </p>
                    </div>
                    <div className="space-y-1 text-xs">
                      <p className="text-purple-600 flex items-center gap-1">
                        <span>🎁</span>
                        <span><strong>خصم 10%</strong> على نشر المشروع</span>
                      </p>
                      <p className="text-purple-600 flex items-center gap-1">
                        <span>👥</span>
                        <span>المسوق يحصل على <strong>10% عمولة</strong></span>
                      </p>
                      <p className="text-purple-600 flex items-center gap-1">
                        <span>📊</span>
                        <span><strong>تتبع الأرباح</strong> في لوحة تحكم المسوق</span>
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-yellow-600 font-bold">🎁</span>
                  </div>
                  <div>
                    <p className="font-medium">مكافأة الإحالة</p>
                    <p className="text-sm text-gray-600">
                      استخدم كود إحالة للحصول على خصومات وعروض خاصة
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="sticky top-6">
              <Card>
                <CardContent className="pt-6">
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all"
                    disabled={loading || !budgetMin}
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        جاري إنشاء المشروع...
                      </>
                    ) : (
                      <>
                        <CreditCard className="ml-2 h-5 w-5" />
                        نشر المشروع وفتح بوابة الدفع
                      </>
                    )}
                  </Button>
                  
                  {referralCode && (
                    <div className="mt-3 p-2 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                      <p className="text-xs text-center text-green-700">
                        ✅ كود الإحالة <strong>{referralCode}</strong> مفعل - تحصل على خصم 10%
                      </p>
                    </div>
                  )}

                  <p className="text-xs text-gray-500 text-center mt-3">
                    بالنشر، فإنك توافق على{" "}
                    <Link
                      href="/terms"
                      className="text-blue-600 hover:underline font-medium"
                    >
                      الشروط والأحكام
                    </Link>
                  </p>
                  
                  {!budgetMin && (
                    <p className="text-center text-amber-600 text-sm mt-2 flex items-center justify-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      ⚠️ الرجاء اختيار الميزانية أولاً
                    </p>
                  )}
                  
                  <div className="mt-4 text-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => router.back()}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      إلغاء والعودة للخلف
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

// المكون الرئيسي مع Suspense
export default function NewProjectPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">جاري تحميل نموذج نشر المشروع...</p>
          </div>
        </div>
      </div>
    }>
      <NewProjectContent />
    </Suspense>
  );
}
