// app/projects/new/page.tsx
"use client";

import { useState, useEffect, useRef, Suspense } from "react";
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
  const [uploadWarning, setUploadWarning] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [paymentWindowOpened, setPaymentWindowOpened] = useState(false);
  const [pendingPaymentUrl, setPendingPaymentUrl] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [estimatedHours, setEstimatedHours] = useState("");
  const [deadline, setDeadline] = useState<Date>();
  const [referralCode, setReferralCode] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [referralLoaded, setReferralLoaded] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // ✅ لا مزيد من باقات أسعار ثابتة — أي مبلغ حر بحد أدنى MIN_BUDGET دولار.
  // رابط الدفع موحّد على منتج Gumroad واحد ("project") مع تمرير السعر الفعلي
  // ومعرّف المشروع كـ url param حتى يقرأه الويبهوك بعد الدفع.
  const MIN_BUDGET = 125;

  // أسعار الصرف: الريال السعودي والدرهم الإماراتي والريال القطري والدينار الكويتي
  // مربوطة رسمياً بالدولار (ثابتة). اليورو عائم وهذا سعر تقريبي.
  const CURRENCY_RATES: { code: string; label: string; rate: number; floating: boolean }[] = [
    { code: "SAR", label: "ريال سعودي", rate: 3.75, floating: false },
    { code: "AED", label: "درهم إماراتي", rate: 3.6725, floating: false },
    { code: "QAR", label: "ريال قطري", rate: 3.64, floating: false },
    { code: "KWD", label: "دينار كويتي", rate: 0.307, floating: false },
    { code: "EUR", label: "يورو", rate: 0.92, floating: true },
  ];

  const CHECKOUT_DOMAIN = "byrashid.gumroad.com";
  const GUMROAD_PRODUCT_SLUG = "devweb";

  const buildCheckoutUrl = (projectId: string, price: string) =>
    `https://${CHECKOUT_DOMAIN}/l/${GUMROAD_PRODUCT_SLUG}?price=${price}&wanted=true&project_id=${projectId}`;

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

    // ✅ نفتح نافذة فارغة الآن (أثناء الضغطة مباشرة) حتى لا يحظرها المتصفح
    // كمنع نوافذ منبثقة — سنضع فيها الرابط الصحيح لاحقاً بعد إنشاء المشروع.
    const paymentWindow = window.open("about:blank", "_blank");

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
        .select('id, role')
        .eq('id', user.id)
        .maybeSingle();

      if (profile && profile.role !== "business_owner") {
        throw new Error(
          "لا يمكنك نشر مشروع بهذا الحساب — نشر المشاريع متاح فقط لحسابات \"صاحب عمل\". " +
          "إذا كان هذا الحساب مفترض أن يكون صاحب عمل، تواصل مع الدعم للتحقق من نوع الحساب."
        );
      }

      if (profileError || !profile) {
        console.log("⚠️ المستخدم ليس له بروفايل، جاري إنشاء واحد...");
        
        // أنشئ profile إذا لم يكن موجوداً
        const metadataRole = (user.user_metadata as any)?.role;
        const safeRole = ["business_owner", "freelancer", "affiliate"].includes(metadataRole)
          ? metadataRole
          : "business_owner"; // شخص ينشئ مشروعاً غالباً صاحب عمل، وليس مستقل

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

      if (Number(budgetMin) < MIN_BUDGET) {
        throw new Error(`الحد الأدنى للميزانية ${MIN_BUDGET}$`);
      }

      let validMarketerId = null;
      
      if (referralCode) {
        try {
          const { data: marketer, error: marketerError } = await supabase
            .from("affiliates")
            .select("id, user_id, referral_code, is_active, total_referrals, total_earnings")
            .eq("referral_code", referralCode.trim())
            .maybeSingle();

          if (marketerError) {
            console.error("⚠️ خطأ بالتحقق من كود الإحالة:", marketerError.message);
          } else if (!marketer) {
            console.warn(`⚠️ كود الإحالة "${referralCode}" غير موجود إطلاقاً بجدول affiliates`);
          } else if (!marketer.is_active) {
            console.warn(`⚠️ كود الإحالة "${referralCode}" موجود لكن الحساب غير مفعّل (is_active = false)`);
          } else {
            validMarketerId = marketer.id;
          }
        } catch (marketerErr: any) {
          console.error("⚠️ خطأ في التحقق من كود الإحالة:", marketerErr.message);
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

      if (validMarketerId && project.id) {
        try {
          const commissionAmount = parseFloat(((parseInt(budgetMin) * 10) / 100).toFixed(2));

          // ✅ نسجّل الإحالة بحالة "pending" فقط الآن — العمولة والإحصائيات
          // (total_referrals / total_earnings) تُحدَّث لاحقاً من app/api/gumroad-webhook/route.ts
          // فقط بعد تأكيد الدفع فعلياً، مو وقت إنشاء المشروع.
          const { error: referralError } = await supabase
            .from("referrals")
            .insert({
              affiliate_id: validMarketerId,
              referred_user_id: user.id,
              referral_code: referralCode,
              project_id: project.id,
              commission_amount: commissionAmount,
              status: "pending",
              created_at: new Date().toISOString()
            });

          if (referralError) {
            console.error("❌ خطأ في تسجيل الإحالة:", referralError.message);
          }
        } catch (referralErr: any) {
          console.error("❌ خطأ في تسجيل الإحالة:", referralErr.message);
        }
      }

      const failedUploads: string[] = [];
      const blockedUploads: string[] = [];
      let anyFileScanned = false;
      let anyFileSkippedScan = false;
      if (files.length > 0 && files.length <= MAX_FILES) {
        console.log("📤 فحص ورفع الملفات...");
        for (const file of files) {
          try {
            const scanForm = new FormData();
            scanForm.append("file", file);
            const scanRes = await fetch("/api/scan-file", { method: "POST", body: scanForm });
            const scanResult = await scanRes.json();

            if (scanResult?.scanned) anyFileScanned = true;
            else anyFileSkippedScan = true;

            if (scanResult && scanResult.safe === false) {
              console.error("🚫 ملف مرفوض (فحص أمني):", file.name, scanResult.reason);
              blockedUploads.push(`${file.name} (${scanResult.reason || "ملف مشبوه"})`);
              continue;
            }
          } catch (scanErr) {
            console.error("⚠️ تعذّر فحص الملف، سيُرفع بدون تأكيد نهائي:", file.name, scanErr);
          }

          // ⚠️ لا نستخدم اسم الملف الأصلي بمسار التخزين — أسماء عربية طويلة أو فيها
          // رموز/مسافات قد تفشل بصمت مع Supabase Storage. الاسم الأصلي يبقى محفوظاً
          // بعمود file_name بجدول project_files ويظهر للمستخدم بشكل طبيعي.
          const originalExt = file.name.includes(".") ? file.name.split(".").pop() : "";
          const safeName = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}${originalExt ? "." + originalExt : ""}`;
          const storagePath = `projects/${project.id}/${safeName}`;

          const { error: uploadError } = await supabase.storage
            .from("project-files")
            .upload(storagePath, file, { contentType: file.type || undefined });

          if (!uploadError) {
            const { error: fileRecordError } = await supabase.from("project_files").insert({
              project_id: project.id,
              file_name: file.name,
              file_url: storagePath,
              file_size: file.size,
              file_type: file.type,
              uploaded_by: user.id,
            });

            if (fileRecordError) {
              console.error("❌ فشل تسجيل الملف بقاعدة البيانات:", file.name, fileRecordError.message);
              failedUploads.push(`${file.name} (${fileRecordError.message})`);
            }
          } else {
            console.error("❌ فشل رفع الملف:", file.name, uploadError.message);
            failedUploads.push(`${file.name} (${uploadError.message})`);
          }
        }
      }

      const uploadIssues: string[] = [];
      if (blockedUploads.length > 0) {
        uploadIssues.push(`تم رفض ${blockedUploads.length} ملف لأسباب أمنية: ${blockedUploads.join(", ")}`);
      }
      if (failedUploads.length > 0) {
        uploadIssues.push(
          `تعذّر حفظ ${failedUploads.length} ملف: ${failedUploads.join(", ")}`
        );
      }
      if (anyFileSkippedScan && !anyFileScanned) {
        uploadIssues.push(
          "تنبيه: فحص الفيروسات غير مفعّل حالياً (لم يُضاف VIRUSTOTAL_API_KEY)، تم رفع الملفات بدون فحص"
        );
      }
      if (uploadIssues.length > 0) {
        setUploadWarning(uploadIssues.join(" — "));
      }

      const paymentUrl = buildCheckoutUrl(project.id, budgetMin);

      if (paymentWindow) {
        paymentWindow.location.href = paymentUrl;
        setPaymentWindowOpened(true);
      } else {
        // النافذة حُظرت رغم فتحها المبكر — نستخدم رابطاً يمكن للمستخدم الضغط عليه بدل التوجيه التلقائي
        console.error("❌ تم حظر نافذة الدفع من المتصفح");
        setPaymentWindowOpened(false);
      }

      setPendingPaymentUrl(paymentUrl);
      setSuccess(true);
      
      setTimeout(() => {
        router.push(`/projects/${project.id}`);
      }, 8000);
      
    } catch (err: any) {
      console.error("❌ خطأ أثناء إنشاء المشروع:", err);

      const rawMessage: string = err?.message || "";
      let friendlyMessage = rawMessage || "حدث خطأ أثناء إنشاء المشروع. يرجى المحاولة مرة أخرى.";

      if (rawMessage.includes("row-level security policy")) {
        friendlyMessage =
          "لا يمكنك نشر مشروع بهذا الحساب — نشر المشاريع متاح فقط لحسابات \"صاحب عمل\". " +
          "إذا كان هذا الحساب مفترض أن يكون صاحب عمل، تواصل مع الدعم للتحقق من نوع الحساب.";
      } else if (rawMessage.includes("invalid input value for enum")) {
        friendlyMessage = "حدث خطأ في إعداد قاعدة البيانات (قيمة حالة غير مدعومة). تم إبلاغ الفريق التقني.";
      }

      setError(friendlyMessage);
      paymentWindow?.close();
    } finally {
      setLoading(false);
    }
  };

  // ✅ يطابق حدود bucket "project-files" (راجع scripts/013_finalize_storage_setup.sql)
  const MAX_FILE_SIZE_MB = 10;
  const MAX_FILES = 10; // كان 50 — رقم غير واقعي لاستضافة مجانية، خفّضناه لحد معقول
  const ALLOWED_FILE_TYPES: Record<string, string> = {
    "image/jpeg": "JPG", "image/png": "PNG", "image/webp": "WEBP", "image/gif": "GIF", "image/svg+xml": "SVG",
    "application/pdf": "PDF",
    "application/msword": "DOC",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "DOCX",
    "application/vnd.ms-excel": "XLS",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "XLSX",
    "application/vnd.ms-powerpoint": "PPT",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": "PPTX",
    "text/plain": "TXT", "text/csv": "CSV",
    "application/zip": "ZIP",
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;

    const newFiles = Array.from(selectedFiles);

    if (files.length + newFiles.length > MAX_FILES) {
      setError(`لا يمكن رفع أكثر من ${MAX_FILES} ملفات`);
      return;
    }

    const rejected: string[] = [];
    const accepted: File[] = [];

    for (const file of newFiles) {
      if (!ALLOWED_FILE_TYPES[file.type]) {
        rejected.push(`${file.name} (نوع غير مدعوم)`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        rejected.push(`${file.name} (أكبر من ${MAX_FILE_SIZE_MB}MB)`);
        continue;
      }
      accepted.push(file);
    }

    if (rejected.length > 0) {
      setError(`تعذّر إضافة بعض الملفات: ${rejected.join(", ")}`);
    }

    setFiles([...files, ...accepted]);
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-neutral-400">جاري التحقق من تسجيل الدخول...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="border-2 border-green-500/30 shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto w-20 h-20 bg-green-500/15 rounded-full flex items-center justify-center mb-4">
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
            <CardTitle className="text-2xl text-green-400">
              {paymentWindowOpened ? "تم فتح بوابة الدفع! 🎉" : "تم إنشاء مشروعك بنجاح! ✅"}
            </CardTitle>
            <CardDescription>
              {paymentWindowOpened 
                ? "تم فتح نافذة جديدة لبوابة الدفع. يرجى إكمال عملية الدفع."
                : "المتصفح منع فتح نافذة جديدة تلقائياً — استخدم الزر أدناه لإكمال الدفع."}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            {pendingPaymentUrl && (
              <>
                <Alert className="bg-emerald-500/10 border-emerald-500/20">
                  <AlertCircle className="h-4 w-4 text-emerald-400" />
                  <AlertDescription className="text-emerald-300">
                    <p className="font-medium mb-2">
                      {paymentWindowOpened ? "لم تفتح النافذة تلقائياً؟" : "⚠️ تم حظر النافذة المنبثقة"}
                    </p>
                    <a
                      href={pendingPaymentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-1 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors font-medium text-sm"
                    >
                      انقر هنا لفتح بوابة الدفع
                    </a>
                  </AlertDescription>
                </Alert>
                
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <p className="text-sm text-yellow-400">
                    ⚠️ <strong>مهم:</strong> لن يتم نشر المشروع إلا بعد إكمال عملية الدفع بنجاح
                  </p>
                  <p className="text-xs text-yellow-600 mt-1">
                    سيتم تحديث حالة المشروع تلقائياً بعد الدفع
                  </p>
                </div>
              </>
            )}
            
            {referralCode && (
              <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                <p className="text-sm text-green-400">
                  ✅ <strong>كود الإحالة:</strong> {referralCode}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  سيحصل المسوق على عمولة 10% بعد إتمام عملية الدفع
                </p>
              </div>
            )}
            
            {uploadWarning && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-right">
                <p className="text-sm text-amber-400">⚠️ {uploadWarning}</p>
              </div>
            )}

            <div className="pt-4 border-t">
              <p className="text-sm text-neutral-400">
                ستتم توجيهك إلى صفحة المشروع خلال 8 ثوانٍ...
              </p>
              <div className="flex justify-center items-center space-x-2 mt-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                <span className="text-sm text-neutral-400">جاري التوجيه...</span>
              </div>
              
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => router.push('/my-projects')}
              >
                الذهاب إلى مشاريعي الآن
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
        <h1 className="text-3xl font-bold text-white mb-2">
          نشر مشروع جديد
        </h1>
        <p className="text-neutral-400">
          املأ التفاصيل أدناه لبدء تلقي عروض من المستقلين المحترفين
        </p>
      </div>

      {showReferralNotice && (
        <Alert className="mb-6 border-green-500/30 bg-green-500/10">
          <Gift className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-400 space-y-2">
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
                  <p className="text-sm text-neutral-400">
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
                    <Label htmlFor="budgetMin">الميزانية الدنيا * (بالدولار الأمريكي)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400">
                        $
                      </span>
                      <Input
                        id="budgetMin"
                        type="number"
                        min={MIN_BUDGET}
                        step="1"
                        value={budgetMin}
                        onChange={(e) => setBudgetMin(e.target.value)}
                        placeholder={`الحد الأدنى ${MIN_BUDGET}$`}
                        className="pl-10 focus:ring-2 focus:ring-emerald-500"
                        required
                      />
                    </div>
                    {budgetMin && Number(budgetMin) < MIN_BUDGET ? (
                      <p className="text-xs text-red-400">
                        الحد الأدنى للميزانية {MIN_BUDGET}$
                      </p>
                    ) : (
                      <p className="text-xs text-neutral-400">
                        الحد الأدنى لنشر مشروع هو {MIN_BUDGET}$
                      </p>
                    )}

                    {budgetMin && Number(budgetMin) >= MIN_BUDGET && (
                      <div className="rounded-lg border border-emerald-500/20 bg-neutral-900 p-3 space-y-1.5">
                        <p className="text-xs text-neutral-400 mb-1">ما يعادلها تقريباً (يظهر للعميل):</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-sm">
                          {CURRENCY_RATES.map(({ code, label, rate, floating }) => (
                            <div key={code} className="flex items-center justify-between gap-2">
                              <span className="text-neutral-400">{label}</span>
                              <span className="text-emerald-300 font-medium">
                                {(Number(budgetMin) * rate).toLocaleString("ar", { maximumFractionDigits: 0 })}
                                {floating ? "≈" : ""}
                              </span>
                            </div>
                          ))}
                        </div>
                        <p className="text-[10px] text-neutral-500 pt-1">
                          الريال والدرهم والريال القطري والدينار الكويتي أسعار صرف ثابتة مربوطة بالدولار. اليورو تقريبي ويتغيّر يومياً.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="budgetMax">
                      الميزانية القصوى (اختياري)
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400">
                        $
                      </span>
                      <Input
                        id="budgetMax"
                        type="number"
                        min={budgetMin || String(MIN_BUDGET)}
                        step="1"
                        value={budgetMax}
                        onChange={(e) => setBudgetMax(e.target.value)}
                        className="pl-10 focus:ring-2 focus:ring-emerald-500"
                        placeholder="اختياري"
                      />
                    </div>
                    {budgetMin && (
                      <p className="text-xs text-neutral-400">
                        الحد الأدنى المحدد: {budgetMin}$
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>

              <CardHeader>
                <CardTitle>الملفات المرفقة (اختياري)</CardTitle>
                <CardDescription>
                  حتى 10 ملفات، كل ملف أقل من 10MB — صور، PDF، Word، Excel، PowerPoint، أو ZIP
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div
                  className="border-2 border-dashed border-neutral-700 rounded-lg p-6 text-center hover:border-purple-400 transition-colors"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files?.length) {
                      handleFileUpload({ target: { files: e.dataTransfer.files } } as any);
                    }
                  }}
                >
                  <Upload className="h-12 w-12 text-neutral-500 mx-auto mb-3" />
                  <p className="text-sm text-neutral-400 mb-3">
                    اسحب وأفلت الملفات أو انقر للرفع
                  </p>
                  <input
                    type="file"
                    id="file-upload"
                    ref={fileInputRef}
                    multiple
                    accept=".jpg,.jpeg,.png,.webp,.gif,.svg,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="hover:bg-purple-500/10"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    اختيار الملفات
                  </Button>
                  <p className="text-xs text-neutral-400 mt-3">
                    الملفات المدعومة: صور، PDF، Word، Excel، ZIP (بحد أقصى 10 ملفات)
                  </p>
                </div>

                {files.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">
                      الملفات المختارة ({files.length}/10)
                    </p>
                    <div className="space-y-2">
                      {files.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-neutral-900 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-neutral-900 rounded flex items-center justify-center">
                              <span className="text-xs font-medium">
                                {file.name.split(".").pop()?.toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-medium truncate max-w-xs">
                                {file.name}
                              </p>
                              <p className="text-xs text-neutral-400">
                                {(file.size / 1024).toFixed(1)} كيلوبايت
                              </p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                            className="hover:bg-red-500/10 hover:text-red-600"
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
                          "w-full justify-start text-left font-normal hover:bg-neutral-900",
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
                        referralLoaded ? "border-green-500 bg-green-500/10" : ""
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
                  <p className="text-xs text-neutral-400">
                    إذا كنت قد سجلت عبر رابط مسوق، أدخل الكود هنا أو استخدم رابط مثل:
                    <code className="block mt-1 bg-neutral-900 p-1 rounded text-xs font-mono">
                      https://workshub.space/projects/new?ref=ABCD
                    </code>
                  </p>
                </div>

                <div className="bg-gradient-to-br from-emerald-500/10 to-purple-500/10 rounded-lg p-4 border border-emerald-500/20">
                  <h3 className="font-semibold text-emerald-300 mb-2 flex items-center gap-2">
                    <span>💡</span> نصائح للنشر
                  </h3>
                  <ul className="text-sm text-neutral-400 space-y-1">
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400">•</span>
                      <span>كن واضحاً في وصف المتطلبات</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400">•</span>
                      <span>حدد ميزانية واقعية</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400">•</span>
                      <span>أرفق ملفات توضيحية إن أمكن</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400">•</span>
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
                  <div className="w-8 h-8 bg-green-500/15 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-green-600 font-bold">💰</span>
                  </div>
                  <div>
                    <p className="font-medium">نظام الدفع</p>
                    <p className="text-sm text-neutral-400">
                      بعد النشر، سيتم فتح بوابة الدفع المناسبة تلقائياً حسب الميزانية المختارة
                    </p>
                  </div>
                </div>

                {budgetMin && Number(budgetMin) >= MIN_BUDGET && (
                  <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                    <p className="text-sm font-medium text-emerald-300">
                      الميزانية المحددة: <span className="font-bold">{budgetMin}$</span>
                    </p>
                    <p className="text-xs text-emerald-400 mt-1">
                      سيُنشأ رابط دفع خاص بمشروعك تلقائياً بعد النشر
                    </p>
                  </div>
                )}

                {referralCode && (
                  <div className="p-3 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-500/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Gift className="h-4 w-4 text-purple-600" />
                      <p className="text-sm font-medium text-purple-400">
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
                  <div className="w-8 h-8 bg-yellow-500/15 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-yellow-600 font-bold">🎁</span>
                  </div>
                  <div>
                    <p className="font-medium">مكافأة الإحالة</p>
                    <p className="text-sm text-neutral-400">
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
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-semibold shadow-lg hover:shadow-xl transition-all"
                    disabled={loading || !budgetMin || Number(budgetMin) < MIN_BUDGET}
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
                        الدفع الآن لنشر المشروع
                      </>
                    )}
                  </Button>
                  
                  {referralCode && (
                    <div className="mt-3 p-2 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-lg">
                      <p className="text-xs text-center text-green-400">
                        ✅ كود الإحالة <strong>{referralCode}</strong> مفعل - تحصل على خصم 10%
                      </p>
                    </div>
                  )}

                  <p className="text-xs text-neutral-400 text-center mt-3">
                    بالنشر، فإنك توافق على{" "}
                    <Link
                      href="/terms"
                      className="text-emerald-400 hover:underline font-medium"
                    >
                      الشروط والأحكام
                    </Link>
                  </p>
                  
                  {(!budgetMin || Number(budgetMin) < MIN_BUDGET) && (
                    <p className="text-center text-amber-600 text-sm mt-2 flex items-center justify-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      ⚠️ الرجاء إدخال ميزانية {MIN_BUDGET}$ أو أكثر
                    </p>
                  )}
                  
                  <div className="mt-4 text-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => router.back()}
                      className="text-neutral-400 hover:text-white"
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
            <p className="text-neutral-400">جاري تحميل نموذج نشر المشروع...</p>
          </div>
        </div>
      </div>
    }>
      <NewProjectContent />
    </Suspense>
  );
}
