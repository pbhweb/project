import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Shield, Users, DollarSign } from "lucide-react";

// بيانات الشروط والأحكام (يمكنك تعديلها لاحقاً)
const termsData = [
  {
    id: 1,
    title: "قبول الشروط",
    content: "باستخدامك لمنصة WorkHub، فإنك توافق على الالتزام بهذه الشروط والأحكام. إذا لم توافق على هذه الشروط، يرجى عدم استخدام المنصة.",
  },
  {
    id: 2,
    title: "التعريفات",
    content: [
      "المنصة: هي موقع WorkHub الإلكتروني الذي يربط بين أصحاب العمل والمستقلين.",
      "صاحب العمل: هو أي شخص أو كيان ينشر مشروعاً على المنصة.",
      "المستقل: هو أي شخص مسجل في المنصة يقدم عروضاً لتنفيذ المشاريع.",
      "المشروع: هو أي عمل أو خدمة ينشرها صاحب العمل على المنصة.",
      "العرض: هو اقتراح من مستقل لتنفيذ مشروع مقابل مبلغ مالي ومدة زمنية محددة.",
    ],
  },
  {
    id: 3,
    title: "حسابات المستخدمين",
    content: [
      "يجب عليك توفير معلومات دقيقة وحديثة و كاملة عند التسجيل.",
      "أنت مسؤول عن الحفاظ على سرية كلمة المرور الخاصة بك.",
      "أنت مسؤول عن جميع الأنشطة التي تحدث تحت حسابك.",
      "يحق للمنصة تعليق أو إنهاء حسابك إذا انتهكت هذه الشروط.",
    ],
  },
  {
    id: 4,
    title: "استخدام المنصة",
    content: [
      "توافق على استخدام المنصة للأغراض المشروعة فقط.",
      "يحظر نشر أي محتوى غير قانوني أو مسيء أو ينتهك حقوق الملكية الفكرية.",
      "يحاول إرسال معلومات اتصال خارج المنصة قد يؤدي إلى إيقاف حسابك.",
      "المنصة ليست طرفاً في الاتفاقيات بين أصحاب العمل والمستقلين.",
    ],
  },
  {
    id: 5,
    title: "الرسوم والدفعات",
    content: [
      "المنصة تتقاضى عمولة قدرها 20% من قيمة العرض المتفق عليه من المستقل.",
      "تتم عملية الدفع بين صاحب العمل والمستقل بعد الاتفاق على العرض.",
      "جميع الأسعار المعروضة على المنصة تكون شاملة ضريبة القيمة المضافة إن وجدت.",
      "المنصة لا تتحمل مسؤولية أي نزاعات مالية بين الطرفين.",
    ],
  },
  {
    id: 6,
    title: "الملكية الفكرية",
    content: "يحتفظ أصحاب العمل بملكية جميع المواد التي يوفرونها للمشروع. يمنح المستقل لصاحب العمل ترخيصاً غير حصري لاستخدام الحقوق الفكرية التي ينتجها في سياق المشروع.",
  },
  {
    id: 7,
    title: "الخصوصية",
    content: "يتم جمع واستخدام بياناتك وفقاً لسياسة الخصوصية الخاصة بنا. باستخدامك للمنصة، فإنك توافق على جمع واستخدام بياناتك كما هو موضح في سياسة الخصوصية.",
  },
  {
    id: 8,
    title: "تحديد المسؤولية",
    content: "المنصة تقدم الخدمات \"كما هي\" و \"كما هي متاحة\". لا نقدم أي ضمانات من أي نوع. نحن لنا مسؤولون عن أي أضرار غير مباشرة أو عرضية أو تبعية تنشأ عن استخدامك للمنصة.",
  },
  {
    id: 9,
    title: "إنهاء الحساب",
    content: "يمكنك إنهاء حسابك في أي وقت. نحن نحتفظ بالحق في إنهاء أو تعليق حسابك في أي وقت ولأي سبب، بما في ذلك انتهاك هذه الشروط.",
  },
  {
    id: 10,
    title: "تغيير الشروط",
    content: "نحن نحتفظ بالحق في تعديل هذه الشروط والأحكام في أي وقت. سيتم إعلامك بأي تغييرات من خلال نشر الشروط والأحكام المحدثة على هذه الصفحة.",
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/dashboard">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center cursor-pointer">
                <span className="text-white font-bold text-xl">W</span>
              </div>
            </Link>
            <h1 className="text-2xl font-bold">الشروط والأحكام</h1>
          </div>
          <Link href="/dashboard">
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              العودة للوحة التحكم
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-red-100 to-orange-100 rounded-full flex items-center justify-center mb-4">
                <FileText className="h-8 w-8 text-orange-600" />
              </div>
              <CardTitle className="text-3xl font-bold">شروط وأحكام منصة WorkHub</CardTitle>
              <CardDescription>
                آخر تحديث: {new Date().toLocaleDateString("ar-SA")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {termsData.map((section) => (
                <div key={section.id} className="border-b pb-6 last:border-b-0">
                  <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                    {section.id === 2 && <Users className="h-5 w-5 text-blue-600" />}
                    {section.id === 5 && <DollarSign className="h-5 w-5 text-green-600" />}
                    {section.id === 6 && <Shield className="h-5 w-5 text-purple-600" />}
                    {section.title}
                  </h2>
                  {Array.isArray(section.content) ? (
                    <ul className="list-disc list-inside space-y-2 text-gray-700">
                      {section.content.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-700">{section.content}</p>
                  )}
                </div>
              ))}

              {/* Legal Disclaimer */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-8">
                <h3 className="font-bold text-yellow-800 mb-2">إشعار قانوني هام</h3>
                <p className="text-sm text-yellow-700">
                  هذه الشروط والأحكام هي نموذج عام ولا تشكل استشارة قانونية. نوصي بشدة بالتشاور مع محامٍ متخصص لمراجعة هذه الشروط والتأكد من أنها تتوافق مع متطلباتك القانونية المحلية.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center mt-8 text-gray-500 text-sm">
            <p>&copy; {new Date().getFullYear()} WorkHub. جميع الحقوق محفوظة.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
