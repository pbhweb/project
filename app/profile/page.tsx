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
import Link from "next/link";
import { Shield, Phone } from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
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
        </div>
      </main>
    </div>
  );
}
