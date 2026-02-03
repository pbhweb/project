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
import { CalendarIcon, Upload, X, CreditCard } from "lucide-react";
import Link from "next/link";

export default function NewProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPaymentGateways, setShowPaymentGateways] = useState(false);
  const [selectedGateway, setSelectedGateway] = useState<string>("");

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

  // بوابات الدفع مع الأسعار
  const paymentGateways = [
    {
      id: "gateway1",
      url: "professional.workshub.space",
      price: 1500,
      label: "بوابة احترافية",
      description: "مناسبة للمشاريع الكبيرة والمعقدة",
      color: "from-purple-600 to-indigo-600"
    },
    {
      id: "gateway2",
      url: "solutions.workshub.space",
      price: 1200,
      label: "بوابة حلول",
      description: "لمشاريع الحلول المتكاملة",
      color: "from-blue-600 to-cyan-600"
    },
    {
      id: "gateway3",
      url: "solution.workshub.space",
      price: 900,
      label: "بوابة حل",
      description: "مناسبة للمشاريع المتوسطة",
      color: "from-green-600 to-emerald-600"
    },
    {
      id: "gateway4",
      url: "digitals.workshub.space",
      price: 600,
      label: "بوابة رقمية",
      description: "للمشاريع الرقمية البسيطة",
      color: "from-orange-600 to-amber-600"
    },
    {
      id: "gateway5",
      url: "digital.workshub.space",
      price: 300,
      label: "بوابة أساسية",
      description: "للمشاريع الصغيرة والمبدئية",
      color: "from-gray-600 to-slate-600"
    }
  ];

  const validateForm = () => {
    if (!title || !description || !category || !budgetMin) {
      setError("جميع الحقول المطلوبة (*) يجب ملؤها");
      return false;
    }

    const minBudget = parseFloat(budgetMin);
    if (minBudget < 300) {
      setError("الميزانية الدنيا يجب أن تكون 300$ على الأقل");
      return false;
    }

    if (budgetMax) {
      const maxBudget = parseFloat(budgetMax);
      if (maxBudget < minBudget) {
        setError("الميزانية القصوى يجب أن تكون أكبر من أو تساوي الميزانية الدنيا");
        return false;
      }
    }

    // Check if description contains contact info
    const containsContact =
      description.match(/\d{10,}/) || // Phone numbers
      description.match(/@[A-Za-z0-9._%+-]+\.[A-Za-z]{2,}/) || // Emails
      description.match(/(whatsapp|telegram|signal|viber)/i); // Messaging apps

    if (containsContact) {
      setError("لا يمكن إضافة معلومات اتصال في وصف المشروع");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!validateForm()) {
      return;
    }

    setShowPaymentGateways(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePaymentGatewaySelection = async (gatewayId: string) => {
    setSelectedGateway(gatewayId);
    setLoading(true);

    try {
      const supabase = createClient();

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("يجب تسجيل الدخول");

      const selectedGatewayData = paymentGateways.find(g => g.id === gatewayId);
      if (!selectedGatewayData) throw new Error("بوابة الدفع غير موجودة");

      // Create project with payment gateway info
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .insert({
          client_id: user.id,
          title,
          description,
          category,
          budget_min: parseFloat(budgetMin),
          budget_max: budgetMax ? parseFloat(budgetMax) : null,
          estimated_hours: estimatedHours ? parseInt(estimatedHours) : null,
          deadline: deadline || null,
          referral_code: referralCode || null,
          payment_gateway: selectedGatewayData.url,
          gateway_price: selectedGatewayData.price,
          status: "pending_payment",
        })
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

      // بعد اختيار بوابة الدفع، توجيه المستخدم للدفع
      router.push(`/payment/${project.id}?gateway=${gatewayId}`);
      
    } catch (err: any) {
      setError(err.message || "حدث خطأ أثناء إنشاء المشروع");
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
              تم نشر مشروعك بنجاح! 🎉
            </CardTitle>
            <CardDescription>
              سيتم توجيهك إلى صفحة المشروع لتلقي العروض من المستقلين
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
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          نشر مشروع جديد
        </h1>
        <p className="text-gray-600">
          املأ التفاصيل أدناه لبدء تلقي عروض من المستقلين المحترفين
        </p>
      </div>

      {showPaymentGateways && (
        <div className="mb-8">
          <Card className="border-2 border-blue-200">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <CreditCard className="h-6 w-6" />
                اختر بوابة الدفع المناسبة
              </CardTitle>
              <CardDescription>
                اختر إحدى بوابات الدفع الخمسة حسب ميزانيتك واحتياجات مشروعك
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {paymentGateways.map((gateway) => (
                  <div
                    key={gateway.id}
                    className={cn(
                      "border-2 rounded-xl p-4 cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-lg",
                      selectedGateway === gateway.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    )}
                    onClick={() => setSelectedGateway(gateway.id)}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-lg">{gateway.label}</h3>
                        <p className="text-sm text-gray-600">{gateway.description}</p>
                      </div>
                      <div className={`bg-gradient-to-r ${gateway.color} text-white px-3 py-1 rounded-full text-sm font-bold`}>
                        ${gateway.price}
                      </div>
                    </div>
                    <div className="text-xs font-mono bg-gray-100 p-2 rounded text-center">
                      {gateway.url}
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        ميزانية المشروع: ${budgetMin}{budgetMax ? ` - $${budgetMax}` : '+'}
                      </span>
                      {selectedGateway === gateway.id && (
                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-4 justify-center">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowPaymentGateways(false)}
                  className="px-8"
                >
                  رجوع لتعديل المشروع
                </Button>
                <Button
                  type="button"
                  disabled={!selectedGateway || loading}
                  onClick={() => handlePaymentGatewaySelection(selectedGateway)}
                  className="px-8 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      جاري التوجيه للدفع...
                    </>
                  ) : (
                    "التالي للدفع"
                  )}
                </Button>
              </div>

              {!selectedGateway && (
                <p className="text-center text-amber-600 mt-4">
                  ⚠️ الرجاء اختيار بوابة دفع للمتابعة
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className={cn("grid md:grid-cols-3 gap-8", showPaymentGateways && "opacity-50 pointer-events-none")}>
          {/* Left Column - Main Info */}
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>معلومات المشروع الأساسية</CardTitle>
                <CardDescription>أدخل تفاصيل مشروعك بشكل واضح</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {error && !showPaymentGateways && (
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
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                        $
                      </span>
                      <Input
                        id="budgetMin"
                        type="number"
                        min="300"
                        step="50"
                        value={budgetMin}
                        onChange={(e) => setBudgetMin(e.target.value)}
                        required
                        className="pl-10"
                        placeholder="300"
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      الحد الأدنى للميزانية هو 300$
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
                <CardTitle>بوابات الدفع المتاحة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {paymentGateways.map((gateway) => (
                  <div key={gateway.id} className="flex items-start gap-3">
                    <div className={`w-8 h-8 bg-gradient-to-r ${gateway.color} rounded-full flex items-center justify-center shrink-0`}>
                      <span className="text-white font-bold">$</span>
                    </div>
                    <div>
                      <p className="font-medium">{gateway.label}</p>
                      <p className="text-sm text-gray-600">{gateway.url}</p>
                      <p className="text-xs font-bold text-green-600">
                        {gateway.price}$
                      </p>
                    </div>
                  </div>
                ))}
                
                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-600">
                    بعد إكمال النموذج، سيُطلب منك اختيار إحدى بوابات الدفع هذه
                    حسب ميزانيتك واحتياجات مشروعك
                  </p>
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
                    disabled={loading}
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        جاري التحقق...
                      </>
                    ) : (
                      "التالي لاختيار بوابة الدفع"
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
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
