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
    const bidId = fields["url_params[bid_id]"] || fields["bid_id"]
    const saleId = fields["sale_id"]
    const isTest = fields["test"] === "true"
    const priceInCents = Number(fields["price"] || 0)

    if (!saleId) {
      return NextResponse.json({ error: "missing sale_id" }, { status: 400 })
    }

    // 🆕 حالة دفع صاحب المشروع للمستقل بعد اعتماد التسليم (رابط
    // gumroad.com/a/{freelancer_gumroad_affiliate_id}/fxzdsg?...&bid_id=...)
    // هذا مسار مختلف تماماً عن دفع نشر المشروع أدناه.
    if (bidId) {
      const { verified, price: verifiedPrice } = await verifySaleWithGumroad(saleId)
      if (!verified) {
        console.error("❌ تعذّر التحقق من صحة عملية دفع المستقل:", saleId)
        return NextResponse.json({ error: "sale not verified" }, { status: 403 })
      }

      const supabase = getServiceClient()
      const { data: bid, error: bidFetchError } = await supabase
        .from("bids")
        .select("id, project_id, freelancer_id, amount, deliverable_status, paid_at")
        .eq("id", bidId)
        .maybeSingle()

      if (bidFetchError || !bid) {
        console.error("❌ لم يتم العثور على العرض لتأكيد الدفع:", bidId, bidFetchError)
        return NextResponse.json({ error: "bid not found" }, { status: 404 })
      }

      if (bid.paid_at) {
        return NextResponse.json({ ok: true, note: "already paid" })
      }

      if (bid.deliverable_status !== "approved" && bid.deliverable_status !== "ai_unavailable") {
        console.error(
          `❌ محاولة دفع لعرض (${bidId}) لم يُعتمد تسليمه بعد (deliverable_status=${bid.deliverable_status})`,
        )
        return NextResponse.json({ error: "deliverable not approved yet" }, { status: 400 })
      }

      const paidAmount = verifiedPrice ?? priceInCents / 100

      const { error: payUpdateError } = await supabase
        .from("bids")
        .update({ paid_at: new Date().toISOString() })
        .eq("id", bidId)

      if (payUpdateError) {
        console.error("❌ فشل تسجيل دفع المستقل:", payUpdateError)
        return NextResponse.json({ error: "update failed" }, { status: 500 })
      }

      await supabase.from("transactions").insert({
        user_id: bid.freelancer_id,
        project_id: bid.project_id,
        bid_id: bid.id,
        amount: paidAmount || bid.amount,
        type: "earning",
        description: `دفع Gumroad لتسليم معتمد (sale_id: ${saleId}${isTest ? "، تجريبي" : ""})`,
        status: "completed",
      })

      console.log(`✅ تم تأكيد دفع المستقل عن العرض ${bidId} (sale_id: ${saleId})`)
      return NextResponse.json({ ok: true })
    }

    if (!projectId) {
      console.error("❌ ويبهوك Gumroad بدون project_id أو bid_id:", fields)
      return NextResponse.json({ error: "missing project_id" }, { status: 400 })
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

    // ✅ تفعيل عمولة المسوّق (إن وُجدت) فقط الآن بعد تأكيد الدفع فعلياً —
    // مو وقت إنشاء المشروع. هذا يحل مشكلة عدم إضافة الرصيد/الأرباح وعدم
    // ظهور الإحالة كمكتملة بسجل الإحالات.
    const { data: referral } = await supabase
      .from("referrals")
      .select("id, affiliate_id, commission_amount, status")
      .eq("project_id", projectId)
      .eq("status", "pending")
      .maybeSingle()

    if (referral) {
      const { error: referralUpdateError } = await supabase
        .from("referrals")
        .update({ status: "completed" })
        .eq("id", referral.id)

      if (referralUpdateError) {
        console.error("❌ فشل تحديث حالة الإحالة:", referralUpdateError)
      }

      const { data: affiliate } = await supabase
        .from("affiliates")
        .select("total_referrals, total_earnings")
        .eq("id", referral.affiliate_id)
        .maybeSingle()

      if (affiliate) {
        const { error: affiliateUpdateError } = await supabase
          .from("affiliates")
          .update({
            total_referrals: (affiliate.total_referrals || 0) + 1,
            total_earnings: parseFloat(
              ((affiliate.total_earnings || 0) + (referral.commission_amount || 0)).toFixed(2)
            ),
            updated_at: new Date().toISOString(),
          })
          .eq("id", referral.affiliate_id)

        if (affiliateUpdateError) {
          console.error("❌ فشل تحديث إحصائيات المسوّق:", affiliateUpdateError)
        } else {
          console.log(`✅ تم تفعيل عمولة المسوّق ${referral.affiliate_id}: +${referral.commission_amount}$`)
        }
      }
    }

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
