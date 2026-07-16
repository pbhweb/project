// Freelance / home-business license types by country, as provided by
// the platform owner. Add more countries by extending this list — the
// UI in app/profile/page.tsx just renders whatever is in here.

export type LicenseCountryOption = {
  code: string
  label_en: string
  label_ar: string
  license_label_en: string
  license_label_ar: string
}

export const LICENSE_COUNTRIES: LicenseCountryOption[] = [
  {
    code: "SA",
    label_en: "Saudi Arabia",
    label_ar: "المملكة العربية السعودية",
    license_label_en: "Freelance Certificate (Freelance Platform — Ministry of Human Resources)",
    license_label_ar: "وثيقة العمل الحر (منصة العمل الحر التابعة لوزارة الموارد البشرية)",
  },
  {
    code: "SA_CR",
    label_en: "Saudi Arabia (alt.)",
    label_ar: "المملكة العربية السعودية (بديل)",
    license_label_en: "Virtual Commercial Register (\"Sijjili\" via Sijilat system)",
    license_label_ar: "السجل التجاري الافتراضي (سجلي) عبر نظام سجلات",
  },
  {
    code: "BH",
    label_en: "Bahrain",
    label_ar: "مملكة البحرين",
    license_label_en: "Freelance Professions License",
    license_label_ar: "رخصة المهن الحرة",
  },
  {
    code: "AE_AD",
    label_en: "UAE — Abu Dhabi (ADRA)",
    label_ar: "الإمارات - أبوظبي (ADRA)",
    license_label_en: "Personal Income Tax Register / Individual Home Business License",
    license_label_ar: "سجل الخاضعين لضريبة الدخل الشخصي / رخص الأعمال الفردية المنزلية",
  },
  {
    code: "QA",
    label_en: "Qatar",
    label_ar: "دولة قطر",
    license_label_en: "Home License (Ministry of Commerce and Industry)",
    license_label_ar: "الرخصة المنزلية (وزارة التجارة والصناعة)",
  },
  {
    code: "KW",
    label_en: "Kuwait",
    label_ar: "دولة الكويت",
    license_label_en: "Special-Nature Activity License (Micro/Home Licenses)",
    license_label_ar: "رخصة الأنشطة ذات الطبيعة الخاصة (الرخص متناهية الصغر/المنزلية)",
  },
  {
    code: "EG",
    label_en: "Egypt",
    label_ar: "مصر",
    license_label_en: "Freelancer ID (for digital & programming services)",
    license_label_ar: "بطاقة الفريلانسر (Freelancer ID)",
  },
  {
    code: "TN",
    label_en: "Tunisia",
    label_ar: "تونس",
    license_label_en: "Auto-Entrepreneur Regime",
    license_label_ar: "نظام المبادر الذاتي (Auto-entrepreneur)",
  },
  {
    code: "DZ",
    label_en: "Algeria",
    label_ar: "الجزائر",
    license_label_en: "Auto-Entrepreneur Card",
    license_label_ar: "بطاقة المقاول الذاتي (Auto-entrepreneur)",
  },
  {
    code: "JO",
    label_en: "Jordan",
    label_ar: "المملكة الأردنية الهاشمية",
    license_label_en: "Home-Based Profession Practice License",
    license_label_ar: "رخصة ممارسة المهن من داخل المنزل",
  },
  {
    code: "IQ",
    label_en: "Iraq",
    label_ar: "العراق",
    license_label_en: "E-Store License / Individual Commercial Register",
    license_label_ar: "إجازة متجر إلكتروني / السجل التجاري الفردي",
  },
  {
    code: "LY",
    label_en: "Libya",
    label_ar: "ليبيا",
    license_label_en: "Individual Commercial Register / Service Activity License",
    license_label_ar: "رخص الأنشطة الخدمية الفردية أو قيد في السجل التجاري",
  },
  {
    code: "PK",
    label_en: "Pakistan",
    label_ar: "باكستان",
    license_label_en: "PSEB Registration",
    license_label_ar: "تسجيل PSEB",
  },
  {
    code: "IN",
    label_en: "India",
    label_ar: "الهند",
    license_label_en: "Sole Proprietorship (PAN Card)",
    license_label_ar: "منشأة فردية (بطاقة PAN)",
  },
  {
    code: "US",
    label_en: "United States",
    label_ar: "الولايات المتحدة",
    license_label_en: "Single-Member LLC",
    license_label_ar: "شركة ذات عضو واحد (LLC)",
  },
  {
    code: "GB",
    label_en: "United Kingdom",
    label_ar: "المملكة المتحدة",
    license_label_en: "Sole Trader Registration",
    license_label_ar: "تسجيل تاجر فردي (Sole Trader)",
  },
  {
    code: "OTHER",
    label_en: "Other country",
    label_ar: "دولة أخرى",
    license_label_en: "Individual service-activity license or commercial register entry",
    license_label_ar: "رخص الأنشطة الخدمية الفردية أو قيد في السجل التجاري للأنشطة الإلكترونية",
  },
]
