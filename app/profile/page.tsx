"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { Shield, Phone, FileCheck2, Upload } from "lucide-react";
import { LICENSE_COUNTRIES } from "@/lib/license-countries";
import { useLanguage } from "@/lib/i18n/language-context";

export default function ProfilePage() {
  const router = useRouter();
  const { lang } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form fields
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneVisible, setPhoneVisible] = useState(false);
  const [bio, setBio] = useState("");

  // Optional freelancer license/verification fields
  const [licenseCountry, setLicenseCountry] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [savingLicense, setSavingLicense] = useState(false);
  const [licenseError, setLicenseError] = useState<string | null>(null);
  const [licenseSuccess, setLicenseSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/login");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      setProfile(data);
      setFullName(data.full_name || "");
      setPhone(data.phone || "");
      setPhoneVisible(data.phone_visible || false);
      setBio(data.bio || "");
      setLicenseCountry(data.license_country || "");
      setLicenseNumber(data.license_number || "");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("يجب تسجيل الدخول");

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          phone,
          phone_visible: phoneVisible,
          bio,
        })
        .eq("id", user.id);

      if (error) throw error;

      setSuccess("تم حفظ التغييرات بنجاح!");
      await loadProfile();
    } catch (err: any) {
      setError(err.message || "حدث خطأ أثناء الحفظ");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingLicense(true);
    setLicenseError(null);
    setLicenseSuccess(null);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("يجب تسجيل الدخول");

      if (!licenseCountry) {
        throw new Error("يرجى اختيار الدولة");
      }

      const countryOption = LICENSE_COUNTRIES.find((c) => c.code === licenseCountry);
      let filePath: string | null = profile?.license_file_path || null;

      if (licenseFile) {
        const ext = licenseFile.name.split(".").pop();
        filePath = `${user.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("freelancer-licenses")
          .upload(filePath, licenseFile, { upsert: true });
        if (uploadError) {
          throw new Error("فشل رفع المستند. يرجى التأكد من أن الملف صورة أو PDF أقل من 10 ميجابايت.");
        }
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          license_country: licenseCountry,
          license_type: countryOption?.license_label_ar || null,
          license_number: licenseNumber || null,
          license_file_path: filePath,
          license_status: "pending",
          license_submitted_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;

      setLicenseSuccess(
        lang === "ar"
          ? "تم إرسال بيانات التوثيق، وستتم مراجعتها من فريقنا قريباً."
          : "Your verification details were submitted and will be reviewed soon.",
      );
      await loadProfile();
    } catch (err: any) {
      setLicenseError(err.message || "حدث خطأ أثناء إرسال بيانات التوثيق");
    } finally {
      setSavingLicense(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p>جاري التحميل...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/dashboard">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center cursor-pointer">
                <span className="text-white font-bold text-xl">W</span>
              </div>
            </Link>
            <h1 className="text-2xl font-bold">الملف الشخصي</h1>
          </div>
          <Link href="/dashboard">
            <Button variant="outline">لوحة التحكم</Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="bg-green-50 border-green-200">
              <AlertDescription className="text-green-800">
                {success}
              </AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle>معلومات الحساب</CardTitle>
              <CardDescription>قم بتحديث معلوماتك الشخصية</CardDescription>
            </CardHeader>
            <form onSubmit={handleSave}>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                  <Badge variant="secondary" className="text-lg px-4 py-2">
                    {profile?.role === "freelancer"
                      ? "مستقل"
                      : profile?.role === "business_owner"
                      ? "صاحب عمل"
                      : "مسوق بالعمولة"}
                  </Badge>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">نوع الحساب</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fullName">الاسم الكامل</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="أدخل اسمك الكامل"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">نبذة عنك (اختياري)</Label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="أخبرنا المزيد عنك..."
                    rows={4}
                  />
                </div>

                <div className="space-y-4 p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm">
                    <Shield className="w-4 h-4 text-blue-600" />
                    <span className="font-semibold">إعدادات الخصوصية</span>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">رقم الهاتف</Label>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+966 5X XXX XXXX"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <Alert>
                    <AlertDescription className="text-sm space-y-2">
                      <p className="font-semibold">متى يظهر رقم الهاتف؟</p>
                      <ul className="list-disc list-inside space-y-1 text-xs">
                        {profile?.role === "freelancer" && (
                          <li>
                            يظهر رقمك لصاحب العمل فقط عند قبول عرضك على المشروع
                          </li>
                        )}
                        {profile?.role === "business_owner" && (
                          <li>
                            يظهر رقمك للمستقل فقط عند قبول عرضه على مشروعك
                          </li>
                        )}
                        {profile?.role === "affiliate" && (
                          <li>رقمك محمي ولن يظهر لأي شخص</li>
                        )}
                        <li>
                          لا يمكن وضع أرقام الهواتف في أوصاف المشاريع أو العروض
                        </li>
                      </ul>
                    </AlertDescription>
                  </Alert>
                </div>

                <Button
                  type="submit"
                  disabled={saving}
                  className="w-full"
                  size="lg"
                >
                  {saving ? "جاري الحفظ..." : "حفظ التغييرات"}
                </Button>
              </CardContent>
            </form>
          </Card>

          {profile?.role === "freelancer" && (
            <Card className="border-green-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileCheck2 className="h-5 w-5 text-green-600" />
                  {lang === "ar" ? "توثيق رخصة العمل الحر (اختياري)" : "Freelance License Verification (optional)"}
                </CardTitle>
                <CardDescription>
                  {lang === "ar"
                    ? "ارفع رخصة العمل الحر أو السجل التجاري الخاص بك ليظهر لأصحاب الأعمال شارة \"موثّق\" على عروضك."
                    : "Upload your freelance license or business registration so business owners see a Verified badge on your bids."}
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleSubmitLicense}>
                <CardContent className="space-y-4">
                  <div>
                    {profile?.license_status === "verified" && (
                      <Badge className="bg-green-100 text-green-800">
                        {lang === "ar" ? "✅ موثّق" : "✅ Verified"}
                      </Badge>
                    )}
                    {profile?.license_status === "pending" && (
                      <Badge variant="outline" className="text-amber-700 border-amber-300">
                        {lang === "ar" ? "قيد المراجعة" : "Pending review"}
                      </Badge>
                    )}
                    {profile?.license_status === "rejected" && (
                      <Badge variant="destructive">
                        {lang === "ar" ? "تم الرفض — يرجى إعادة الإرسال" : "Rejected — please resubmit"}
                      </Badge>
                    )}
                    {(!profile?.license_status || profile?.license_status === "not_submitted") && (
                      <Badge variant="secondary">{lang === "ar" ? "لم يتم الإرسال بعد" : "Not submitted"}</Badge>
                    )}
                  </div>

                  {licenseError && (
                    <Alert variant="destructive">
                      <AlertDescription>{licenseError}</AlertDescription>
                    </Alert>
                  )}
                  {licenseSuccess && (
                    <Alert className="bg-green-50 border-green-200">
                      <AlertDescription className="text-green-800">{licenseSuccess}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label>{lang === "ar" ? "الدولة" : "Country"}</Label>
                    <Select value={licenseCountry} onValueChange={setLicenseCountry}>
                      <SelectTrigger>
                        <SelectValue placeholder={lang === "ar" ? "اختر الدولة" : "Select country"} />
                      </SelectTrigger>
                      <SelectContent>
                        {LICENSE_COUNTRIES.map((c) => (
                          <SelectItem key={c.code} value={c.code}>
                            {lang === "ar" ? c.label_ar : c.label_en}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {licenseCountry && (
                      <p className="text-xs text-muted-foreground">
                        {lang === "ar" ? "نوع الرخصة المتوقع: " : "Expected license type: "}
                        {lang === "ar"
                          ? LICENSE_COUNTRIES.find((c) => c.code === licenseCountry)?.license_label_ar
                          : LICENSE_COUNTRIES.find((c) => c.code === licenseCountry)?.license_label_en}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="licenseNumber">
                      {lang === "ar" ? "رقم الرخصة / السجل (اختياري)" : "License / registration number (optional)"}
                    </Label>
                    <Input
                      id="licenseNumber"
                      value={licenseNumber}
                      onChange={(e) => setLicenseNumber(e.target.value)}
                      dir="ltr"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="licenseFile" className="flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      {lang === "ar" ? "مستند الرخصة (صورة أو PDF)" : "License document (image or PDF)"}
                    </Label>
                    <Input
                      id="licenseFile"
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => setLicenseFile(e.target.files?.[0] || null)}
                    />
                    {profile?.license_file_path && !licenseFile && (
                      <p className="text-xs text-muted-foreground">
                        {lang === "ar" ? "تم رفع مستند سابقاً." : "A document was uploaded previously."}
                      </p>
                    )}
                  </div>

                  <Button type="submit" disabled={savingLicense} className="w-full" variant="outline">
                    {savingLicense
                      ? lang === "ar"
                        ? "جاري الإرسال..."
                        : "Submitting..."
                      : lang === "ar"
                        ? "إرسال للتوثيق"
                        : "Submit for verification"}
                  </Button>
                </CardContent>
              </form>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
