import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@supabase/supabase-js"

// عميل Supabase بصلاحيات كاملة (service role) لأن هذا الويبهوك يعمل بدون
// جلسة مستخدم، ويحتاج تجاوز RLS ليحدّث حالة المشروع بعد تأكيد الدفع.
// ⚠️ لازم تضيف SUPABASE_SERVICE_ROLE_KEY في متغيرات البيئة (Vercel) —
// خذها من: Supabase Dashboard → Settings → API → service_role secret.
// لا تضعها بـ NEXT_PUBLIC_ أبداً، هذا المفتاح يجب أن يبقى سرّياً على السيرفر فقط.
function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY غير مُعرّف في متغيرات البيئة")
  }
  return createClient(url, key)
}

// Gumroad لا يوقّع طلبات الـ Ping افتراضياً، لذلك نتحقق من صحة عملية البيع
// عبر استدعاء Gumroad API مباشرة بدل الوثوق بالطلب الوارد وحده.
// هذا يمنع أي شخص من إرسال POST مزوّر لهذا المسار وتفعيل مشروع بدون دفع فعلي.
async function verifySaleWithGumroad(saleId: string): Promise<{ verified: boolean; price?: number }> {
  const accessToken = process.env.GUMROAD_ACCESS_TOKEN
  if (!accessToken) {
    // بدون access token لا يمكن التحقق من صحة البيع فعلياً — هذا وضع غير آمن للإنتاج.
    console.warn("⚠️ GUMROAD_ACCESS_TOKEN غير مُعرّف؛ سيتم قبول الويبهوك بدون تحقق فعلي من Gumroad.")
    return { verified: true }
  }

  try {
    const res = await fetch(
      `https://api.gumroad.com/v2/sales/${encodeURIComponent(saleId)}?access_token=${encodeURIComponent(accessToken)}`
    )
    const data = await res.json()
    if (!data.success || !data.sale) return { verified: false }
    return { verified: true, price: data.sale.price / 100 }
  } catch (err) {
    console.error("❌ فشل التحقق من البيع عبر Gumroad API:", err)
    return { verified: false }
  }
}

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData()
    const fields: Record<string, string> = {}
    form.forEach((value, key) => {
      fields[key] = String(value)
    })

    // Gumroad يمرّر أي query params أضفتها لرابط الدفع تحت url_params[key]
    const projectId = fields["url_params[project_id]"] || fields["project_id"]
    const saleId = fields["sale_id"]
    const isTest = fields["test"] === "true"
    const priceInCents = Number(fields["price"] || 0)

    if (!projectId) {
      console.error("❌ ويبهوك Gumroad بدون project_id:", fields)
      return NextResponse.json({ error: "missing project_id" }, { status: 400 })
    }

    if (!saleId) {
      return NextResponse.json({ error: "missing sale_id" }, { status: 400 })
    }

    const { verified, price: verifiedPrice } = await verifySaleWithGumroad(saleId)
    if (!verified) {
      console.error("❌ تعذّر التحقق من صحة عملية البيع:", saleId)
      return NextResponse.json({ error: "sale not verified" }, { status: 403 })
    }

    const supabase = getServiceClient()

    const { data: project, error: fetchError } = await supabase
      .from("projects")
      .select("id, status, budget_min, client_id")
      .eq("id", projectId)
      .maybeSingle()

    if (fetchError || !project) {
      console.error("❌ لم يتم العثور على المشروع:", projectId, fetchError)
      return NextResponse.json({ error: "project not found" }, { status: 404 })
    }

    if (project.status !== "pending_payment") {
      // إما تم نشره مسبقاً (طلب مكرر من Gumroad) أو حالة غير متوقعة — لا داعي لخطأ هنا
      return NextResponse.json({ ok: true, note: "already processed" })
    }

    const paidAmount = verifiedPrice ?? priceInCents / 100
    if (paidAmount > 0 && paidAmount < project.budget_min) {
      console.error(`❌ المبلغ المدفوع (${paidAmount}) أقل من ميزانية المشروع (${project.budget_min})`)
      return NextResponse.json({ error: "amount mismatch" }, { status: 400 })
    }

    const { error: updateError } = await supabase
      .from("projects")
      .update({ status: "open", updated_at: new Date().toISOString() })
      .eq("id", projectId)

    if (updateError) {
      console.error("❌ فشل تحديث حالة المشروع:", updateError)
      return NextResponse.json({ error: "update failed" }, { status: 500 })
    }

    await supabase.from("transactions").insert({
      user_id: project.client_id,
      project_id: project.id,
      amount: paidAmount || project.budget_min,
      type: "payment",
      description: `دفع Gumroad (sale_id: ${saleId}${isTest ? ", تجريبي" : ""})`,
      status: "completed",
    })

    console.log(`✅ تم نشر المشروع ${projectId} بعد تأكيد الدفع (sale_id: ${saleId})`)
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error("❌ خطأ في ويبهوك Gumroad:", err)
    return NextResponse.json({ error: err.message || "internal error" }, { status: 500 })
  }
}

// Gumroad أحياناً يتحقق من توفر الرابط بطلب GET بسيط
export async function GET() {
  return NextResponse.json({ ok: true, message: "Gumroad webhook endpoint is live" })
}
