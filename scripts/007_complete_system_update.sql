-- إضافة حقول مفقودة لجدول profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS phone_visible BOOLEAN DEFAULT false;

-- إضافة حقول مفقودة لجدول projects
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS expected_hours INTEGER,
ADD COLUMN IF NOT EXISTS client_phone TEXT;

-- تحديث جدول bids لإضافة المزيد من الحقول
ALTER TABLE public.bids
ADD COLUMN IF NOT EXISTS freelancer_commission NUMERIC(5,2) DEFAULT 20.00;

-- إنشاء جدول referrals المحدث
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  referred_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  referral_code TEXT NOT NULL,
  commission_amount NUMERIC(10, 2) DEFAULT 0,
  status TEXT DEFAULT 'pending', -- pending, completed, paid
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- إنشاء جدول reviews للتقييمات
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reviewee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, reviewer_id, reviewee_id)
);

-- إنشاء جدول notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL, -- bid_received, bid_accepted, project_completed, etc
  related_id UUID,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- تحديث جدول transactions
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'payment';

-- تمكين RLS للجداول الجديدة
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- سياسات RLS لجدول referrals
CREATE POLICY "Affiliates can view their referrals" ON public.referrals
  FOR SELECT USING (
    affiliate_id IN (SELECT id FROM public.affiliates WHERE user_id = auth.uid())
  );

-- سياسات RLS لجدول reviews
CREATE POLICY "Anyone can view reviews" ON public.reviews
  FOR SELECT USING (true);

CREATE POLICY "Users can create reviews for completed projects" ON public.reviews
  FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- سياسات RLS لجدول notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- دالة لحساب عمولة الأفلييت تلقائياً
CREATE OR REPLACE FUNCTION calculate_affiliate_commission()
RETURNS TRIGGER AS $$
DECLARE
  affiliate_record RECORD;
  commission_amt NUMERIC(10,2);
BEGIN
  -- إذا كان المشروع يحتوي على affiliate_referral_id
  IF NEW.affiliate_referral_id IS NOT NULL THEN
    -- احصل على معلومات الأفلييت
    SELECT * INTO affiliate_record 
    FROM public.affiliates 
    WHERE id = NEW.affiliate_referral_id;
    
    IF FOUND THEN
      -- احسب العمولة (10% من الميزانية الأدنى)
      commission_amt := NEW.budget_min * (affiliate_record.commission_rate / 100);
      
      -- أنشئ إشعار للأفلييت
      INSERT INTO public.notifications (user_id, title, message, type, related_id)
      VALUES (
        affiliate_record.user_id,
        'إحالة جديدة!',
        'تم إنشاء مشروع جديد عبر رابط الإحالة الخاص بك. ستحصل على عمولة ' || commission_amt || ' دولار',
        'new_referral',
        NEW.id
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ربط الدالة بجدول projects
DROP TRIGGER IF EXISTS on_project_created ON public.projects;
CREATE TRIGGER on_project_created
  AFTER INSERT ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION calculate_affiliate_commission();

-- دالة للتحقق من منع معلومات الاتصال
CREATE OR REPLACE FUNCTION check_contact_info()
RETURNS TRIGGER AS $$
BEGIN
  -- التحقق من وجود أرقام هواتف أو إيميلات في الوصف
  IF NEW.description ~* '\d{10,}|@|email|phone|whatsapp|telegram|تواصل|رقم|جوال|واتساب|تلجرام|ايميل' THEN
    RAISE EXCEPTION 'ممنوع إضافة معلومات الاتصال في الوصف';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ربط دالة التحقق بجدول projects
DROP TRIGGER IF EXISTS check_project_contact_info ON public.projects;
CREATE TRIGGER check_project_contact_info
  BEFORE INSERT OR UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION check_contact_info();

-- ربط دالة التحقق بجدول bids  
DROP TRIGGER IF EXISTS check_bid_contact_info ON public.bids;
CREATE TRIGGER check_bid_contact_info
  BEFORE INSERT OR UPDATE ON public.bids
  FOR EACH ROW
  EXECUTE FUNCTION check_contact_info();

-- إنشاء indexes للأداء
CREATE INDEX IF NOT EXISTS idx_referrals_affiliate ON public.referrals(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_reviews_project ON public.reviews(project_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee ON public.reviews(reviewee_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_client ON public.projects(client_id);
