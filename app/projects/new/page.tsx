"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { CalendarIcon, Upload, X } from "lucide-react";
import Link from "next/link";

export default function NewProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [estimatedHours, setEstimatedHours] = useState("");
  const [deadline, setDeadline] = useState<Date>();
  const [referralCode, setReferralCode] = useState("");
  const [files, setFiles] = useState<File[]>([]);

  // خيارات الميزانية الثابتة مرتبطة ببوابات الدفع
  const budgetOptions = [
    { value: "300", label: "300$ - مشروع صغير/مبدئي", gateway: "digital.workshub.space" },
    { value: "600", label: "600$ - مشروع رقمي بسيط", gateway: "digitals.workshub.space" },
    { value: "900", label: "900$ - مشروع متوسط", gateway: "solution.workshub.space" },
    { value: "1200", label: "1200$ - مشروع حلول متكاملة", gateway: "solutions.workshub.space" },
    { value: "1500", label: "1500$ - مشروع كبير/معقد", gateway: "professional.workshub.space" },
  ];

  const getGatewayByBudget = (budget: string) => {
    return budgetOptions.find(option => option.value === budget);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("يجب تسجيل الدخول");

      // Validate required fields
      if (!title || !description || !category || !budgetMin) {
        throw new Error("جميع الحقول المطلوبة (*) يجب ملؤها");
      }

      // Check if description contains contact info
      const containsContact =
        description.match(/\d{10,}/) || // Phone numbers
        description.match(/@[A-Za-z0-9._%+-]+\.[A-Za-z]{2,}/) || // Emails
        description.match(/(whatsapp|telegram|signal|viber)/i); // Messaging apps

      if (containsContact) {
        throw new Error("لا يمكن إضافة معلومات اتصال في وصف المشروع");
      }

      // الحصول على بوابة الدفع المناسبة بناء على الميزانية
      const selectedGateway = getGatewayByBudget(budgetMin);
      if (!selectedGateway) {
        throw new Error("الميزانية المختارة غير صالحة");
      }

      // إنشاء المشروع - فقط مع الحقول الموجودة في الجدول
      const projectData: any = {
        client_id: user.id,
        title,
        description,
        category,
        budget_min: parseInt(budgetMin),
        status: "pending_payment", // تغيير الحالة لانتظار الدفع
      };

      // إضافة الحقول الاختيارية فقط إذا كانت موجودة
      if (budgetMax) projectData.budget_max = parseFloat(budgetMax);
      if (estimatedHours) projectData.estimated_hours = parseInt(estimatedHours);
      if (deadline) projectData.deadline = deadline;
      if (referralCode) projectData.referral_code = referralCode;

      // Create project
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .insert(projectData)
        .select()
        .single();

      if (projectError) throw projectError;

      // Upload files if any
      if (files.length > 0 && files.length <= 50) {
        for (const file of files) {
          const fileName = `${Date.now()}_${file.name}`;
          const { data: uploadData, error: uploadError } =
            await supabase.storage
              .from("project-files")
              .upload(`projects/${project.id}/${fileName}`, file);

          if (uploadError) throw uploadError;

          // Create file record
          await supabase.from("project_files").insert({
            project_id: project.id,
            file_name: file.name,
            file_url: uploadData.path,
            file_size: file.size,
            file_type: file.type,
            uploaded_by: user.id,
          });
        }
      } else if (files.length > 50) {
        throw new Error("لا يمكن رفع أكثر من 50 ملف");
      }

      // بعد إنشاء المشروع، توجيه المستخدم لبوابة الدفع المناسبة
      // نستخدم window.open لفتح نافذة جديدة أو تبويب جديد
      const paymentUrl = `https://${selectedGateway.gateway}?project_id=${project.id}&amount=${budgetMin}`;
      window.open(paymentUrl, '_blank');
      
      // إظهار رسالة نجاح مع توجيه لصفحة المشروع
      setSuccess(true);
      setTimeout(() => {
        router.push(`/projects/${project.id}`);
      }, 3000);
      
    } catch (err: any) {
      setError(err.message || "حدث خطأ أثناء إنشاء المشروع");
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

  if (success) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="border-2 border-green-200">
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
              تم إنشاء مشروعك بنجاح! 🎉
            </CardTitle>
            <CardDescription>
              تم فتح نافذة جديدة لبوابة الدفع. يرجى إكمال عملية الدفع.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              إذا لم تفتح نافذة الدفع تلقائياً،{' '}
              <button
                onClick={() => {
                  const selectedGateway = getGatewayByBudget(budgetMin);
                  if (selectedGateway) {
                    window.open(`https://${selectedGateway.gateway}`, '_blank');
                  }
                }}
                className="text-blue-600 hover:underline"
              >
                انقر هنا لفتح بوابة الدفع
              </button>
            </p>
            <p className="text-sm text-gray-500">
              ستتم توجيهك إلى صفحة المشروع خلال بضع ثوانٍ...
            </p>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
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

      <form onSubmit={handleSubmit}>
        <div className="grid md:grid-cols-3 gap-8">
          {/* Left Column - Main Info */}
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>معلومات المشروع الأساسية</CardTitle>
                <CardDescription>أدخل تفاصيل مشروعك بشكل واضح</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {error && (
                  <Alert variant="destructive">
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
                    className="resize-none"
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
                      <SelectTrigger>
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
                      <SelectTrigger>
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
                        className="pl-10"
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

            {/* File Upload */}
            <Card>
              <CardHeader>
                <CardTitle>الملفات المرفقة</CardTitle>
                <CardDescription>
                  يمكنك رفع حتى 50 ملف (صور، مستندات، إلخ)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
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
                    <Button type="button" variant="outline">
                      اختيار الملفات
                    </Button>
                  </label>
                  <p className="text-xs text-gray-500 mt-3">
                    الملفات المدعومة: صور، PDF، Word، Excel، ZIP (بحد أقصى 50
                    ملف)
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
                          className="flex items-center justify-between p-3 border rounded-lg"
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

          {/* Right Column - Additional Info */}
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
                          "w-full justify-start text-left font-normal",
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
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="referralCode">كود الإحالة (اختياري)</Label>
                  <Input
                    id="referralCode"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value)}
                    placeholder="إذا كان لديك كود إحالة"
                  />
                  <p className="text-xs text-gray-500">
                    إذا كنت قد سجلت عبر رابط مسوق، أدخل الكود هنا
                  </p>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-700 mb-2">
                    💡 نصائح للنشر
                  </h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• كن واضحاً في وصف المتطلبات</li>
                    <li>• حدد ميزانية واقعية</li>
                    <li>• أرفع ملفات توضيحية إن أمكن</li>
                    <li>• حدد موعداً نهائياً مناسباً</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>معلومات الدفع</CardTitle>
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
                      الميزانية المختارة: {budgetMin}$
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      بوابة الدفع التي ستفتح: {
                        budgetOptions.find(opt => opt.value === budgetMin)?.gateway
                      }
                    </p>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-red-600 font-bold">⚠️</span>
                  </div>
                  <div>
                    <p className="font-medium">مهم</p>
                    <p className="text-sm text-gray-600">
                      لن يتم نشر المشروع إلا بعد إكمال عملية الدفع بنجاح
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="sticky top-6">
              <Card>
                <CardContent className="pt-6">
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    disabled={loading || !budgetMin}
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        جاري إنشاء المشروع...
                      </>
                    ) : (
                      "نشر المشروع وفتح بوابة الدفع"
                    )}
                  </Button>
                  <p className="text-xs text-gray-500 text-center mt-3">
                    بالنشر، فإنك توافق على{" "}
                    <Link
                      href="/terms"
                      className="text-blue-600 hover:underline"
                    >
                      الشروط والأحكام
                    </Link>
                  </p>
                  
                  {!budgetMin && (
                    <p className="text-center text-amber-600 text-sm mt-2">
                      ⚠️ الرجاء اختيار الميزانية أولاً
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
