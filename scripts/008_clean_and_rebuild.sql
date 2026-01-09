-- تنظيف قاعدة البيانات وإعادة البناء بشكل صحيح
-- هذا السكريبت يحذف كل شيء ويعيد بناءه من الصفر

-- حذف الجداول القديمة بالترتيب الصحيح
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.referrals CASCADE;
DROP TABLE IF EXISTS public.affiliate_referrals CASCADE;
DROP TABLE IF EXISTS public.affiliates CASCADE;
DROP TABLE IF EXISTS public.bids CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- حذف الأنواع المخصصة
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS project_status CASCADE;
DROP TYPE IF EXISTS bid_status CASCADE;
DROP TYPE IF EXISTS transaction_type CASCADE;

-- حذف الدوال القديمة
DROP FUNCTION IF EXISTS generate_referral_code() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS validate_no_contact_info(TEXT) CASCADE;

-- إعادة إنشاء الأنواع
CREATE TYPE user_role AS ENUM ('business_owner', 'freelancer', 'affiliate');
CREATE TYPE project_status AS ENUM ('open', 'in_progress', 'completed', 'cancelled');
CREATE TYPE bid_status AS ENUM ('pending', 'accepted', 'rejected');
CREATE TYPE transaction_type AS ENUM ('payment', 'earning', 'commission');

-- جدول الملفات الشخصية
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'freelancer',
  phone TEXT,
  bio TEXT,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- جدول المشاريع (استخدام client_id بدلاً من owner_id)
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  budget_min NUMERIC(10, 2) NOT NULL DEFAULT 300 CHECK (budget_min >= 300),
  budget_max NUMERIC(10, 2),
  estimated_hours INTEGER,
  status project_status DEFAULT 'open',
  deadline DATE,
  referral_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (budget_max IS NULL OR budget_max >= budget_min)
);

-- جدول العروض
CREATE TABLE public.bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  freelancer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 300),
  delivery_days INTEGER NOT NULL,
  proposal TEXT NOT NULL,
  status bid_status DEFAULT 'pending',
  freelancer_commission NUMERIC(10, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, freelancer_id)
);

-- جدول الأفلييت
CREATE TABLE public.affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  referral_code TEXT UNIQUE NOT NULL,
  commission_rate NUMERIC(5, 2) DEFAULT 10.00 CHECK (commission_rate >= 0 AND commission_rate <= 100),
  total_referrals INTEGER DEFAULT 0,
  total_earnings NUMERIC(10, 2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- جدول الإحالات
CREATE TABLE public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  referred_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  referral_code TEXT NOT NULL,
  commission_amount NUMERIC(10, 2) DEFAULT 0,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- جدول المعاملات المالية
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  bid_id UUID REFERENCES public.bids(id) ON DELETE SET NULL,
  amount NUMERIC(10, 2) NOT NULL,
  type transaction_type NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- جدول التقييمات
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reviewed_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, reviewer_id, reviewed_user_id)
);

-- جدول الإشعارات
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  related_id UUID,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- تفعيل RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- سياسات RLS للملفات الشخصية
CREATE POLICY "Anyone can view profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- سياسات RLS للمشاريع
CREATE POLICY "Anyone can view open projects" ON public.projects FOR SELECT USING (true);
CREATE POLICY "Business owners can create projects" ON public.projects FOR INSERT WITH CHECK (
  auth.uid() = client_id AND 
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'business_owner')
);
CREATE POLICY "Project owners can update projects" ON public.projects FOR UPDATE USING (auth.uid() = client_id);
CREATE POLICY "Project owners can delete projects" ON public.projects FOR DELETE USING (auth.uid() = client_id);

-- سياسات RLS للعروض
CREATE POLICY "Anyone can view bids on their projects" ON public.bids FOR SELECT USING (
  freelancer_id = auth.uid() OR 
  project_id IN (SELECT id FROM public.projects WHERE client_id = auth.uid())
);
CREATE POLICY "Freelancers can create bids" ON public.bids FOR INSERT WITH CHECK (
  auth.uid() = freelancer_id AND
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'freelancer')
);
CREATE POLICY "Freelancers can update own bids" ON public.bids FOR UPDATE USING (auth.uid() = freelancer_id);

-- سياسات RLS للأفلييت
CREATE POLICY "Users can view own affiliate" ON public.affiliates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own affiliate" ON public.affiliates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own affiliate" ON public.affiliates FOR UPDATE USING (auth.uid() = user_id);

-- سياسات RLS للإحالات
CREATE POLICY "Affiliates can view own referrals" ON public.referrals FOR SELECT USING (
  affiliate_id IN (SELECT id FROM public.affiliates WHERE user_id = auth.uid())
);

-- سياسات RLS للمعاملات
CREATE POLICY "Users can view own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);

-- سياسات RLS للتقييمات
CREATE POLICY "Anyone can view reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Users can create reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- سياسات RLS للإشعارات
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- إنشاء الفهارس
CREATE INDEX idx_projects_client ON public.projects(client_id);
CREATE INDEX idx_projects_status ON public.projects(status);
CREATE INDEX idx_projects_referral ON public.projects(referral_code);
CREATE INDEX idx_bids_project ON public.bids(project_id);
CREATE INDEX idx_bids_freelancer ON public.bids(freelancer_id);
CREATE INDEX idx_bids_status ON public.bids(status);
CREATE INDEX idx_affiliates_code ON public.affiliates(referral_code);
CREATE INDEX idx_referrals_affiliate ON public.referrals(affiliate_id);
CREATE INDEX idx_transactions_user ON public.transactions(user_id);
CREATE INDEX idx_reviews_reviewed_user ON public.reviews(reviewed_user_id);
CREATE INDEX idx_notifications_user ON public.notifications(user_id);

-- دالة لتحديث updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- تطبيق التريجر على الجداول
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bids_updated_at BEFORE UPDATE ON public.bids
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_affiliates_updated_at BEFORE UPDATE ON public.affiliates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- دالة لتوليد كود إحالة فريد
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    code := upper(substring(md5(random()::text) from 1 for 8));
    SELECT EXISTS(SELECT 1 FROM public.affiliates WHERE referral_code = code) INTO exists;
    IF NOT exists THEN
      EXIT;
    END IF;
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- دالة لمعالجة المستخدمين الجدد
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'مستخدم جديد'),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'freelancer')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- تريجر للمستخدمين الجدد
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- دالة للتحقق من عدم وجود معلومات تواصل
CREATE OR REPLACE FUNCTION validate_no_contact_info(text_content TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  IF text_content ~* '(\+?\d{10,}|[\w\.-]+@[\w\.-]+\.\w+|واتس|whatsapp|تلجرام|telegram|انستا|instagram|فيس|facebook|رقم|موبايل|جوال|ايميل|email)' THEN
    RETURN false;
  END IF;
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- قيود للتحقق من عدم وجود معلومات تواصل
ALTER TABLE public.projects ADD CONSTRAINT check_project_no_contact 
  CHECK (validate_no_contact_info(description));

ALTER TABLE public.bids ADD CONSTRAINT check_bid_no_contact 
  CHECK (validate_no_contact_info(proposal));
