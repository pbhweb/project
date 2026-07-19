// Lightweight client-side dictionary. English is the default language;
// Arabic is offered as a toggle (site direction flips to RTL automatically).
// Add more keys here as you translate more pages — every page that needs
// text should pull from `useLanguage()` instead of hardcoding Arabic.

export type Lang = "en" | "ar"

export const dictionaries = {
  en: {
    nav_projects: "Projects",
    nav_verified: "Verified Freelancers",
    nav_language: "العربية",
    hero_title_line1: "Hire Trusted Freelancers.",
    hero_title_line2: "Get Work Done, Verified.",
    hero_subtitle:
      "Post a project, receive offers from professional freelancers, and — for extra peace of mind — check whether a freelancer has a verified local freelance license before you hire them.",
    hero_cta_start: "Get Started Free",
    hero_cta_browse: "Browse Projects",
    trust_badge: "License verification available",
    features_title: "Why قمّة",
    feature_commission_title: "Simple, transparent pricing",
    feature_commission_desc: "One clear payment link per project — no confusing tiers.",
    feature_protection_title: "Contact info stays private",
    feature_protection_desc: "Phone numbers stay hidden until a bid is accepted.",
    feature_roles_title: "Three account types",
    feature_roles_desc: "Business owners, freelancers, and affiliates all in one platform.",
    feature_verify_title: "Freelance license verification",
    feature_verify_desc:
      "Freelancers can optionally upload their local freelance license or business registration. Business owners can see a Verified badge before accepting an offer.",
    how_title: "How it works",
    how_1_title: "Post your project",
    how_1_desc: "Describe what you need and set a budget.",
    how_2_title: "Get offers",
    how_2_desc: "Freelancers submit proposals with price and timeline.",
    how_3_title: "Check & choose",
    how_3_desc: "Compare ratings and, if available, license verification.",
    how_4_title: "Pay securely & start",
    how_4_desc: "Complete payment through a single secure checkout link.",
    cta_title: "Ready to get started?",
    cta_subtitle: "Join business owners, freelancers, and affiliates already using قمّة.",
    cta_business: "I'm a Business Owner",
    cta_freelancer: "I'm a Freelancer",
    cta_affiliate: "I'm an Affiliate",
    verify_section_title: "How freelancer license verification works",
    verify_section_body:
      "Verification is optional for freelancers. A freelancer can upload proof such as a local freelance permit, sole-trader registration, or business license from their country. Our team reviews the document, and once approved a green Verified badge appears on their bids — visible to any business owner reviewing offers.",
    verify_learn_more: "Learn more",
  },
  ar: {
    nav_projects: "المشاريع",
    nav_verified: "المستقلون الموثقون",
    nav_language: "English",
    hero_title_line1: "وظّف مستقلين موثوقين.",
    hero_title_line2: "أنجز أعمالك، بثقة موثّقة.",
    hero_subtitle:
      "انشر مشروعك، استقبل عروضاً من مستقلين محترفين، وللمزيد من الاطمئنان يمكنك التحقق من امتلاك المستقل لرخصة عمل حر موثّقة في بلده قبل التوظيف.",
    hero_cta_start: "ابدأ الآن مجاناً",
    hero_cta_browse: "استعرض المشاريع",
    trust_badge: "التحقق من رخصة العمل الحر متاح",
    features_title: "لماذا تختار قمّة",
    feature_commission_title: "تسعير بسيط وواضح",
    feature_commission_desc: "رابط دفع واحد وواضح لكل مشروع، دون تعقيد.",
    feature_protection_title: "خصوصية معلومات التواصل",
    feature_protection_desc: "تبقى أرقام الهواتف مخفية حتى قبول العرض.",
    feature_roles_title: "ثلاثة أنواع حسابات",
    feature_roles_desc: "أصحاب عمل، مستقلون، ومسوقون بالعمولة على منصة واحدة.",
    feature_verify_title: "توثيق رخصة العمل الحر",
    feature_verify_desc:
      "يمكن للمستقل رفع رخصة العمل الحر أو السجل التجاري الخاص به اختيارياً، ويظهر لصاحب العمل شارة \"موثّق\" قبل قبول العرض.",
    how_title: "كيف تعمل المنصة",
    how_1_title: "انشر مشروعك",
    how_1_desc: "صف احتياجك وحدد الميزانية.",
    how_2_title: "استقبل العروض",
    how_2_desc: "يقدم المستقلون عروضاً بالسعر والمدة.",
    how_3_title: "قارن واختر",
    how_3_desc: "قارن التقييمات وتحقق من توثيق الرخصة إن وجد.",
    how_4_title: "ادفع بأمان وابدأ",
    how_4_desc: "أكمل الدفع عبر رابط دفع آمن واحد.",
    cta_title: "جاهز للبدء؟",
    cta_subtitle: "انضم إلى أصحاب الأعمال والمستقلين والمسوقين على منصة قمّة.",
    cta_business: "أنا صاحب عمل",
    cta_freelancer: "أنا مستقل",
    cta_affiliate: "أنا مسوق",
    verify_section_title: "كيف يعمل توثيق رخصة المستقل",
    verify_section_body:
      "التوثيق اختياري للمستقلين. يمكن للمستقل رفع إثبات مثل تصريح عمل حر محلي أو سجل تجاري فردي أو رخصة أعمال من بلده. يراجع فريقنا المستند، وبعد الاعتماد تظهر شارة توثيق خضراء بجانب عروضه، تظهر لأي صاحب عمل يراجع العروض.",
    verify_learn_more: "اعرف المزيد",
  },
} as const

export type DictionaryKey = keyof typeof dictionaries.en
