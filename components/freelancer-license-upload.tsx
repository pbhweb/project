"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ShieldCheck, Upload, Globe, FileText } from "lucide-react";

// Optional local freelance / home-business licenses recognized across the region.
// This list is informational only — it helps a freelancer pick the right label
// for the document they're uploading. It is not a legal endorsement of any license.
const LICENSE_OPTIONS: { country: string; code: string; en: string; ar: string }[] = [
  { country: "Bahrain", code: "BH", en: "Self-Employment / Home Business Permit (Sijilli)", ar: "سجلي - السجل التجاري الافتراضي" },
  { country: "Saudi Arabia", code: "SA", en: "Freelance Work Document (Ministry of Human Resources platform)", ar: "وثيقة العمل الحر (منصة العمل الحر - وزارة الموارد البشرية)" },
  { country: "UAE — Abu Dhabi (ADRA)", code: "AE", en: "Individual Home Business License / Sole Business License", ar: "رخصة المهن الحرة (أبوظبي - ADRA)" },
  { country: "Qatar", code: "QA", en: "Home License (Ministry of Commerce and Industry)", ar: "الرخصة المنزلية (وزارة التجارة والصناعة)" },
  { country: "Kuwait", code: "KW", en: "Special-Nature / Micro Home Activity License", ar: "رخصة الأنشطة ذات الطبيعة الخاصة (الرخص متناهية الصغر/المنزلية)" },
  { country: "Egypt", code: "EG", en: "Freelancer ID (digital & tech services)", ar: "بطاقة الفريلانسر - للخدمات الرقمية والبرمجة" },
  { country: "Tunisia", code: "TN", en: "Auto-Entrepreneur Scheme", ar: "نظام المبادر الذاتي" },
  { country: "Algeria", code: "DZ", en: "Auto-Entrepreneur Card", ar: "بطاقة المقاول الذاتي" },
  { country: "Jordan", code: "JO", en: "Home-Based Profession License", ar: "رخصة ممارسة المهن من داخل المنزل" },
  { country: "Iraq", code: "IQ", en: "E-Store License / Individual Commercial Registration", ar: "إجازة متجر إلكتروني / السجل التجاري الفردي" },
  { country: "Libya", code: "LY", en: "Individual Service Activity License / Commercial Registration", ar: "رخص الأنشطة الخدمية الفردية أو قيد في السجل التجاري" },
  { country: "Pakistan", code: "PK", en: "PSEB Freelancer Registration", ar: "تسجيل مجلس تصدير خدمات البرمجيات الباكستاني (PSEB)" },
  { country: "India", code: "IN", en: "Sole Proprietorship / PAN Card", ar: "منشأة فردية - بطاقة PAN" },
  { country: "United States", code: "US", en: "Single-Member LLC", ar: "شركة ذات مسؤولية محدودة بعضو واحد (LLC)" },
  { country: "United Kingdom", code: "GB", en: "Sole Trader Registration", ar: "تسجيل تاجر فردي (Sole Trader)" },
  { country: "Other / Not listed", code: "OTHER", en: "Other local freelance license", ar: "رخصة عمل حر أخرى" },
];

type Lang = "en" | "ar";

const TEXT = {
  en: {
    title: "Freelance License Verification (optional)",
    subtitle:
      "Upload proof of a local freelance / home-business license so clients can see a verified badge on your bids. This is optional and does not block you from bidding.",
    country: "Country / License type",
    countryPlaceholder: "Select your country's license",
    licenseNumber: "License number (optional)",
    document: "Upload document",
    submit: "Submit for verification",
    submitting: "Submitting…",
    statusNotSubmitted: "No license submitted yet",
    statusPending: "Pending review",
    statusVerified: "Verified",
    statusRejected: "Rejected — you can resubmit",
    toggle: "العربية",
  },
  ar: {
    title: "توثيق رخصة العمل الحر (اختياري)",
    subtitle:
      "ارفع إثبات رخصة عمل حر أو نشاط منزلي محلية حتى يظهر شارة \"موثّق\" على عروضك أمام أصحاب العمل. هذا اختياري ولا يمنعك من تقديم العروض.",
    country: "الدولة / نوع الرخصة",
    countryPlaceholder: "اختر رخصة بلدك",
    licenseNumber: "رقم الرخصة (اختياري)",
    document: "رفع المستند",
    submit: "إرسال للتوثيق",
    submitting: "جاري الإرسال...",
    statusNotSubmitted: "لم يتم إرسال رخصة بعد",
    statusPending: "قيد المراجعة",
    statusVerified: "موثّق ✅",
    statusRejected: "مرفوض — يمكنك إعادة الإرسال",
    toggle: "English",
  },
};

export function FreelancerLicenseUpload({ freelancerId }: { freelancerId: string }) {
  const [lang, setLang] = useState<Lang>("en");
  const [countryCode, setCountryCode] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [existing, setExisting] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const t = TEXT[lang];
  const dir = lang === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("freelancer_licenses")
        .select("*")
        .eq("freelancer_id", freelancerId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      setExisting(data);
      setLoading(false);
    };
    load();
  }, [freelancerId]);

  const selectedOption = LICENSE_OPTIONS.find((o) => o.code === countryCode);

  const handleSubmit = async () => {
    setError(null);
    if (!countryCode) {
      setError(lang === "ar" ? "الرجاء اختيار نوع الرخصة" : "Please select a license type");
      return;
    }
    setSaving(true);
    try {
      const supabase = createClient();
      let documentUrl: string | null = null;

      if (file) {
        const path = `${freelancerId}/${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("license-documents")
          .upload(path, file, { upsert: true });
        if (uploadError) throw uploadError;
        documentUrl = path;
      }

      const { error: insertError } = await supabase.from("freelancer_licenses").insert({
        freelancer_id: freelancerId,
        country_code: countryCode,
        license_name: lang === "ar" ? selectedOption?.ar : selectedOption?.en,
        license_number: licenseNumber || null,
        document_url: documentUrl,
        status: "pending",
      });
      if (insertError) throw insertError;

      setSuccess(true);
      setExisting({
        country_code: countryCode,
        license_name: selectedOption?.en,
        status: "pending",
      });
    } catch (err: any) {
      setError(err.message || "Failed to submit license");
    } finally {
      setSaving(false);
    }
  };

  const statusLabel = (status: string) => {
    if (status === "verified") return t.statusVerified;
    if (status === "rejected") return t.statusRejected;
    if (status === "pending") return t.statusPending;
    return t.statusNotSubmitted;
  };

  const statusColor = (status: string) => {
    if (status === "verified") return "bg-emerald-500/15 text-emerald-400 border-emerald-300";
    if (status === "rejected") return "bg-red-500/15 text-red-400 border-red-300";
    if (status === "pending") return "bg-amber-100 text-amber-700 border-amber-300";
    return "bg-neutral-900 text-neutral-400 border-neutral-700";
  };

  if (loading) return null;

  return (
    <div dir={dir} className="rounded-xl border border-white/10 bg-neutral-900 p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0" />
          <div>
            <h3 className="font-semibold text-white">{t.title}</h3>
            <p className="text-sm text-neutral-400 mt-0.5">{t.subtitle}</p>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="shrink-0 gap-1"
          onClick={() => setLang(lang === "en" ? "ar" : "en")}
        >
          <Globe className="h-4 w-4" /> {t.toggle}
        </Button>
      </div>

      {existing && (
        <Badge variant="outline" className={statusColor(existing.status)}>
          {statusLabel(existing.status)}
          {existing.license_name ? ` · ${existing.license_name}` : ""}
        </Badge>
      )}

      {(!existing || existing.status === "rejected") && (
        <div className="space-y-3 pt-2 border-t">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert className="bg-emerald-500/10 border-emerald-500/30">
              <AlertDescription className="text-emerald-400">
                {lang === "ar" ? "تم الإرسال! سنراجعه قريباً." : "Submitted! We'll review it shortly."}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-1.5">
            <Label>{t.country}</Label>
            <Select value={countryCode} onValueChange={setCountryCode}>
              <SelectTrigger>
                <SelectValue placeholder={t.countryPlaceholder} />
              </SelectTrigger>
              <SelectContent>
                {LICENSE_OPTIONS.map((o) => (
                  <SelectItem key={o.code} value={o.code}>
                    {o.country} — {lang === "ar" ? o.ar : o.en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>{t.licenseNumber}</Label>
            <Input value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5">
              <FileText className="h-4 w-4" /> {t.document}
            </Label>
            <Input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>

          <Button type="button" onClick={handleSubmit} disabled={saving} className="gap-2">
            <Upload className="h-4 w-4" />
            {saving ? t.submitting : t.submit}
          </Button>
        </div>
      )}
    </div>
  );
}
