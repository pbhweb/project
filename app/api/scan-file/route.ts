import { NextResponse, type NextRequest } from "next/server"
import crypto from "crypto"

// ⚠️ ملاحظة صادقة: لا يوجد "فاحص فيروسات مفتوح المصدر" يعمل كـ API مجاني بدون
// خادم دائم — ClamAV (مفتوح المصدر فعلاً) يحتاج عملية سيرفر تعمل باستمرار، وهذا غير
// متاح على استضافة Vercel المجانية (serverless بدون حالة دائمة).
// البديل العملي المجاني الذي يعمل من دالة serverless: VirusTotal API المجاني
// (يجمع نتائج من +70 محرك فحص، كثير منها فعلاً مفتوح المصدر مثل ClamAV نفسه).
// خذ مفتاح مجاني من: https://www.virustotal.com/gui/join-us
// ثم أضفه بمتغيرات البيئة باسم VIRUSTOTAL_API_KEY

const VT_API_BASE = "https://www.virustotal.com/api/v3"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "لا يوجد ملف" }, { status: 400 })
    }

    const apiKey = process.env.VIRUSTOTAL_API_KEY
    if (!apiKey) {
      // بدون مفتاح، الفحص متوقف — نسمح بالرفع لكن نحذّر بالسجلات حتى تلاحظ وتفعّله
      console.warn("⚠️ VIRUSTOTAL_API_KEY غير مُعرّف؛ سيتم تخطي فحص الملفات.")
      return NextResponse.json({ safe: true, scanned: false })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const sha256 = crypto.createHash("sha256").update(buffer).digest("hex")

    // 1) الفحص السريع: هل هذا الملف معروف مسبقاً لدى VirusTotal؟ (فوري، بدون انتظار)
    const lookupRes = await fetch(`${VT_API_BASE}/files/${sha256}`, {
      headers: { "x-apikey": apiKey },
    })

    if (lookupRes.status === 200) {
      const data = await lookupRes.json()
      const stats = data?.data?.attributes?.last_analysis_stats
      const malicious = (stats?.malicious || 0) + (stats?.suspicious || 0)
      if (malicious > 0) {
        return NextResponse.json({
          safe: false,
          scanned: true,
          reason: `تم رصد هذا الملف كملف ضار من قبل ${malicious} محرك فحص`,
        })
      }
      return NextResponse.json({ safe: true, scanned: true })
    }

    // 2) الملف غير معروف مسبقاً — نرفعه للفحص وننتظر نتيجة أولية بحد أقصى ~20 ثانية
    const uploadForm = new FormData()
    uploadForm.append("file", new Blob([buffer]), file.name)

    const uploadRes = await fetch(`${VT_API_BASE}/files`, {
      method: "POST",
      headers: { "x-apikey": apiKey },
      body: uploadForm,
    })

    if (!uploadRes.ok) {
      console.error("❌ فشل رفع الملف لـ VirusTotal:", await uploadRes.text())
      // لا نمنع المستخدم بسبب عطل بخدمة خارجية — نسمح بالرفع
      return NextResponse.json({ safe: true, scanned: false })
    }

    const uploadData = await uploadRes.json()
    const analysisId = uploadData?.data?.id

    if (!analysisId) {
      return NextResponse.json({ safe: true, scanned: false })
    }

    // استطلاع نتيجة الفحص (polling) — محاولات محدودة حتى لا تنتظر واجهة المستخدم طويلاً
    for (let attempt = 0; attempt < 6; attempt++) {
      await new Promise((r) => setTimeout(r, 3000))

      const analysisRes = await fetch(`${VT_API_BASE}/analyses/${analysisId}`, {
        headers: { "x-apikey": apiKey },
      })
      const analysisData = await analysisRes.json()
      const status = analysisData?.data?.attributes?.status

      if (status === "completed") {
        const stats = analysisData?.data?.attributes?.stats
        const malicious = (stats?.malicious || 0) + (stats?.suspicious || 0)
        if (malicious > 0) {
          return NextResponse.json({
            safe: false,
            scanned: true,
            reason: `تم رصد هذا الملف كملف ضار من قبل ${malicious} محرك فحص`,
          })
        }
        return NextResponse.json({ safe: true, scanned: true })
      }
    }

    // انتهت محاولات الانتظار قبل اكتمال الفحص — لا نحجب المستخدم، نسمح بالرفع
    console.warn("⚠️ فحص VirusTotal لم يكتمل بالوقت المتاح، تم السماح بالرفع بدون تأكيد نهائي")
    return NextResponse.json({ safe: true, scanned: false })
  } catch (err: any) {
    console.error("❌ خطأ في فحص الملف:", err)
    // عطل بالفحص نفسه لا يجب أن يمنع رفع ملف سليم
    return NextResponse.json({ safe: true, scanned: false })
  }
}
