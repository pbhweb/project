import { NextResponse, type NextRequest } from "next/server"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { extractTextFromFile } from "@/lib/extract-file-text"

// ⚠️ نفس نمط app/api/gumroad-webhook/route.ts: عميل بصلاحيات كاملة (service_role)
// لازم فقط للكتابة بالأعمدة الحساسة (deliverable_status/ai_feedback/paid_at...)
// التي سحبنا صلاحية تعديلها من دور authenticated بسكربت 020 — أي شخص يستدعي
// هذا الـ API لازم يمر أولاً من التحقق أدناه (عميل الجلسة العادي)، مو من هنا مباشرة.
function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY غير مُعرّف في متغيرات البيئة")
  }
  return createServiceClient(url, key)
}

// نداء OpenRouter مع مهلة زمنية — إذا تأخر أو فشل بأي شكل، نعتبر الذكاء
// الاصطناعي "غير متاح" بدل ما نعلّق تسليم المستقل لأجل غير مسمى.
async function reviewWithAI(
  requirementText: string,
  submissionText: string,
): Promise<
  | { available: true; decision: "approved" | "needs_revision"; feedback: string }
  | { available: false; reason: string }
> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    return { available: false, reason: "OPENROUTER_API_KEY غير مُعرّف في متغيرات البيئة" }
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 25000)

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://workshub.space/",
        "X-Title": "WorksHub",
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        // 🆕 نموذج مجاني بدل openai/gpt-4o المدفوع (كان يرجع 402 لعدم وجود رصيد).
        // openrouter/free راوتر تلقائي من OpenRouter نفسه يختار نموذجاً مجانياً
        // متاحاً حالياً — أكثر ثباتاً من تثبيت اسم نموذج مجاني معيّن قد ينسحب
        // لاحقاً بدون إشعار. الحد: ~50 طلب/يوم (أو 1000 لو أضفت 10$ رصيد)، 20/دقيقة.
        model: "openrouter/free",
        messages: [
          {
            role: "system",
            content:
              "أنت مراجع جودة تسليمات مستقلين. قارن بين متطلبات المشروع وما سلّمه المستقل، " +
              "وحدد إذا كان العمل يفي بالمطلوب أم يحتاج تصحيح. " +
              'أجب حصراً بصيغة JSON صحيحة بدون أي نص إضافي: {"decision":"approved" أو "needs_revision","feedback":"شرح مختصر بالعربية"}',
          },
          {
            role: "user",
            content: `متطلبات المشروع:\n${requirementText}\n\n---\n\nما سلّمه المستقل:\n${submissionText}`,
          },
        ],
      }),
    })
    clearTimeout(timeout)

    if (!res.ok) {
      return { available: false, reason: `OpenRouter رجع حالة غير ناجحة: ${res.status}` }
    }

    const data = await res.json()
    const raw: string = data?.choices?.[0]?.message?.content || ""
    const cleaned = raw.replace(/```json|```/g, "").trim()
    const parsed = JSON.parse(cleaned)

    if (parsed?.decision !== "approved" && parsed?.decision !== "needs_revision") {
      return { available: false, reason: "رد الذكاء الاصطناعي لم يكن بالصيغة المتوقعة" }
    }

    return { available: true, decision: parsed.decision, feedback: parsed.feedback || "" }
  } catch (err: any) {
    clearTimeout(timeout)
    const reason =
      err?.name === "AbortError" ? "انتهت مهلة انتظار رد الذكاء الاصطناعي (25 ثانية)" : err?.message || "خطأ غير معروف"
    return { available: false, reason }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { project_id, bid_id, file_url, file_name, note } = body || {}

    if (!project_id || !bid_id || !file_url || !file_name) {
      return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 })
    }

    // ✅ عميل بجلسة المستخدم الحالي — RLS يتكفّل بمنع أي شخص من قراءة/التصرف
    // بعرض (bid) لا يخصّه.
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "يجب تسجيل الدخول" }, { status: 401 })
    }

    const { data: bid, error: bidError } = await supabase
      .from("bids")
      .select("id, project_id, freelancer_id, status")
      .eq("id", bid_id)
      .maybeSingle()

    if (bidError || !bid) {
      return NextResponse.json({ error: "العرض غير موجود" }, { status: 404 })
    }

    if (bid.freelancer_id !== user.id) {
      return NextResponse.json({ error: "لا يمكنك التسليم على عرض لا يخصّك" }, { status: 403 })
    }

    if (bid.project_id !== project_id) {
      return NextResponse.json({ error: "بيانات غير متطابقة" }, { status: 400 })
    }

    if (bid.status !== "accepted") {
      return NextResponse.json({ error: "لا يمكن التسليم إلا بعد قبول عرضك على هذا المشروع" }, { status: 400 })
    }

    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("title, description, client_id")
      .eq("id", project_id)
      .maybeSingle()

    if (projectError || !project) {
      return NextResponse.json({ error: "المشروع غير موجود" }, { status: 404 })
    }

    // 🆕 نحمّل الملف فعلياً من التخزين ونستخرج نصه الحقيقي (docx/pdf/txt/csv،
    // وحتى ملفات zip بفتح ما بداخلها) بدل الاكتفاء باسم الملف فقط. إذا فشل
    // التحميل أو الاستخراج لأي سبب، نتراجع لنفس السلوك القديم (اسم الملف
    // + الملاحظة) بدل ما نوقف التسليم بالكامل — نفس فلسفة "لا نوقف سير العمل".
    let extractedFileText = ""
    try {
      const { data: fileBlob, error: downloadError } = await supabase.storage
        .from("project-files")
        .download(file_url)

      if (downloadError || !fileBlob) {
        throw new Error(downloadError?.message || "تعذّر تحميل الملف من التخزين")
      }

      const arrayBuffer = await fileBlob.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      extractedFileText = await extractTextFromFile(buffer, file_name)
    } catch (extractErr: any) {
      console.error("⚠️ فشل استخراج نص الملف، سيُكتفى باسم الملف فقط:", extractErr?.message)
    }

    // نص التسليم: محتوى الملف الفعلي المُستخرج (إن توفّر) + ملاحظة المستقل + اسم الملف
    const submissionText = `${
      extractedFileText ? `محتوى الملف المستخرج:\n${extractedFileText}\n\n` : ""
    }ملاحظة المستقل:\n${note || "(لا توجد ملاحظة)"}\n\n(اسم الملف المرفق: ${file_name})`.trim()
    const requirementText = `${project.title}\n${project.description}`

    const aiResult = await reviewWithAI(requirementText, submissionText)

    let deliverableStatus: "needs_revision" | "approved" | "ai_unavailable"
    let aiFeedback: string | null = null
    let aiError: string | null = null

    if (aiResult.available) {
      deliverableStatus = aiResult.decision
      aiFeedback = aiResult.feedback
    } else {
      // 🔎 حسب طلبك: لو الذكاء الاصطناعي متعطل لأي سبب، ما نوقف سير العمل —
      // نعتبر التسليم "بحاجة لمراجعة يدوية" ونظهر زر الدفع لصاحب المشروع مباشرة.
      deliverableStatus = "ai_unavailable"
      aiError = aiResult.reason
      console.error("⚠️ الذكاء الاصطناعي (OpenRouter) غير متاح حالياً:", aiResult.reason)
    }

    const serviceSupabase = getServiceClient()
    const { error: updateError } = await serviceSupabase
      .from("bids")
      .update({
        deliverable_file_url: file_url,
        deliverable_file_name: file_name,
        deliverable_note: note || null,
        submitted_at: new Date().toISOString(),
        deliverable_status: deliverableStatus,
        ai_feedback: aiFeedback,
        ai_error: aiError,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", bid_id)

    if (updateError) {
      console.error("❌ فشل تحديث بيانات التسليم:", updateError)
      return NextResponse.json({ error: "فشل حفظ التسليم" }, { status: 500 })
    }

    // 🆕 إشعار صاحب المشروع بأن التسليم وصل وبانتظار الدفع (بغض النظر عن قرار
    // الذكاء الاصطناعي — حتى لو ai_unavailable، صاحب المشروع لازم يعرف إنه وصله تسليم)
    try {
      const statusMessage =
        deliverableStatus === "needs_revision"
          ? "الذكاء الاصطناعي طلب من المستقل تصحيح بعض النقاط قبل اعتماده."
          : "تم استلام التسليم وهو جاهز — بانتظار دفعك لإتمام العملية."
      await serviceSupabase.rpc("create_notification", {
        p_user_id: project.client_id,
        p_title: "تم تسليم مشروعك",
        p_message: `سلّم المستقل عملك على مشروع "${project.title}". ${statusMessage}`,
        p_type: "deliverable_submitted",
        p_related_id: project_id,
      })
    } catch (notifyErr: any) {
      console.error("⚠️ فشل إرسال إشعار التسليم لصاحب المشروع:", notifyErr?.message)
    }

    return NextResponse.json({
      ok: true,
      deliverable_status: deliverableStatus,
      ai_available: aiResult.available,
      ai_feedback: aiFeedback,
      ai_error: aiError,
    })
  } catch (err: any) {
    console.error("❌ خطأ في submit-deliverable:", err)
    return NextResponse.json({ error: err.message || "خطأ داخلي" }, { status: 500 })
  }
}
