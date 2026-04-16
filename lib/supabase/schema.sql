-- MedPersona Database Schema
-- Run this in Supabase SQL Editor to initialize the database

-- ═══════════════════════════════════════════════════════════════
-- 1. USER PROFILES (extends Supabase auth.users)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'doctor' CHECK (role IN ('super_admin', 'admin', 'staff', 'doctor')),
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  doctor_id TEXT, -- FK link to doctors table, NULL for non-doctors
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read own profile, admins can read all
CREATE POLICY "users_read_own_profile" ON public.profiles
  FOR SELECT USING (id = auth.uid() OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('super_admin', 'admin'));

CREATE POLICY "users_update_own_profile" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "admins_manage_profiles" ON public.profiles
  FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('super_admin', 'admin'));

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'doctor')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ═══════════════════════════════════════════════════════════════
-- 2. DOCTORS
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE public.doctors (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  title TEXT DEFAULT 'dr.',
  whatsapp_number TEXT,
  photo_url TEXT,
  location TEXT,
  specialty TEXT,
  subspecialty TEXT,
  institution TEXT,
  years_in_practice INT,
  tier TEXT NOT NULL DEFAULT 'starter' CHECK (tier IN ('starter', 'growth', 'pro', 'elite')),
  subscription_status TEXT DEFAULT 'pending' CHECK (subscription_status IN ('active', 'pending', 'expired', 'paused')),
  subscription_started TIMESTAMPTZ,
  subscription_expires TIMESTAMPTZ,
  monthly_cost_idr BIGINT,
  brand_voice JSONB DEFAULT '{}',
  visual_style JSONB DEFAULT '{}',
  target_audience JSONB DEFAULT '{}',
  content_preferences JSONB DEFAULT '{}',
  platforms JSONB DEFAULT '{}',
  social_accounts JSONB DEFAULT '{}',
  voice_id TEXT,
  allow_repurposing BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_manage_doctors" ON public.doctors
  FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('super_admin', 'admin', 'staff'));

CREATE POLICY "doctors_read_own" ON public.doctors
  FOR SELECT USING (id = (SELECT doctor_id FROM public.profiles WHERE id = auth.uid()));

-- Add FK from profiles to doctors
ALTER TABLE public.profiles
  ADD CONSTRAINT fk_profiles_doctor FOREIGN KEY (doctor_id) REFERENCES public.doctors(id);

-- ═══════════════════════════════════════════════════════════════
-- 3. CONTENT ITEMS
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE public.content_items (
  id TEXT PRIMARY KEY,
  doctor_id TEXT NOT NULL REFERENCES public.doctors(id),
  batch_id TEXT,
  planned_date DATE,
  platform TEXT NOT NULL,
  content_type TEXT DEFAULT 'carousel',
  funnel_stage TEXT,
  topic_title TEXT,
  topic_category TEXT,
  copy_hook TEXT,
  copy_body TEXT,
  copy_cta TEXT,
  caption TEXT,
  hashtags TEXT[],
  status TEXT DEFAULT 'drafted' CHECK (status IN (
    'planned', 'researched', 'drafted', 'pending_review',
    'approved', 'revision', 'rejected', 'auto_rejected',
    'scheduled', 'posted', 'failed'
  )),
  assets JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  performance JSONB DEFAULT '{}',
  requires_expert_review BOOLEAN DEFAULT false,
  personal_upload BOOLEAN DEFAULT false,
  approval_notes TEXT,
  approved_at TIMESTAMPTZ,
  posted_at TIMESTAMPTZ,
  platform_post_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.content_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_manage_content" ON public.content_items
  FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('super_admin', 'admin', 'staff'));

CREATE POLICY "doctors_read_own_content" ON public.content_items
  FOR SELECT USING (doctor_id = (SELECT doctor_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "doctors_update_own_content" ON public.content_items
  FOR UPDATE USING (doctor_id = (SELECT doctor_id FROM public.profiles WHERE id = auth.uid()));

CREATE INDEX idx_content_doctor_status ON public.content_items(doctor_id, status);
CREATE INDEX idx_content_planned_date ON public.content_items(planned_date);

-- ═══════════════════════════════════════════════════════════════
-- 4. INVOICES
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE public.invoices (
  id TEXT PRIMARY KEY,
  doctor_id TEXT NOT NULL REFERENCES public.doctors(id),
  tier TEXT NOT NULL,
  type TEXT DEFAULT 'subscription' CHECK (type IN ('subscription', 'addon', 'prorated')),
  amount_idr BIGINT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'expired', 'failed')),
  invoice_url TEXT,
  period TEXT,
  payment_method TEXT,
  payment_channel TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_manage_invoices" ON public.invoices
  FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('super_admin', 'admin'));

CREATE POLICY "doctors_read_own_invoices" ON public.invoices
  FOR SELECT USING (doctor_id = (SELECT doctor_id FROM public.profiles WHERE id = auth.uid()));

CREATE INDEX idx_invoices_doctor ON public.invoices(doctor_id);
CREATE INDEX idx_invoices_status ON public.invoices(status);

-- ═══════════════════════════════════════════════════════════════
-- 5. EXPENSES
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE public.expenses (
  id SERIAL PRIMARY KEY,
  month TEXT NOT NULL,
  category TEXT NOT NULL,
  item TEXT NOT NULL,
  description TEXT,
  amount_idr BIGINT NOT NULL,
  amount_usd NUMERIC(10,2),
  doctor_id TEXT REFERENCES public.doctors(id),
  recorded_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_manage_expenses" ON public.expenses
  FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('super_admin', 'admin'));

CREATE INDEX idx_expenses_month ON public.expenses(month);

-- ═══════════════════════════════════════════════════════════════
-- 6. CRM LEADS
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE public.leads (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  specialty TEXT,
  clinic TEXT,
  location TEXT,
  source TEXT DEFAULT 'website',
  stage TEXT DEFAULT 'new' CHECK (stage IN (
    'new', 'contacted', 'qualified', 'demo_sent', 'negotiating', 'won', 'lost'
  )),
  score INT DEFAULT 0,
  interest TEXT,
  tier_interest TEXT,
  touch_count INT DEFAULT 0,
  assigned_to TEXT,
  referral_code TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_manage_leads" ON public.leads
  FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('super_admin', 'admin', 'staff'));

CREATE INDEX idx_leads_stage ON public.leads(stage);

-- ═══════════════════════════════════════════════════════════════
-- 7. ARTICLES (Blog/SEO)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE public.articles (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT,
  body TEXT NOT NULL,
  cover_image_url TEXT,
  author_id UUID REFERENCES public.profiles(id),
  category TEXT,
  tags TEXT[],
  seo_title TEXT,
  seo_description TEXT,
  og_image_url TEXT,
  schema_markup JSONB,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- Public can read published articles
CREATE POLICY "public_read_published" ON public.articles
  FOR SELECT USING (status = 'published');

CREATE POLICY "admins_manage_articles" ON public.articles
  FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('super_admin', 'admin'));

CREATE INDEX idx_articles_slug ON public.articles(slug);
CREATE INDEX idx_articles_status ON public.articles(status);

-- ═══════════════════════════════════════════════════════════════
-- 8. MONTHLY USAGE
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE public.monthly_usage (
  id SERIAL PRIMARY KEY,
  doctor_id TEXT NOT NULL REFERENCES public.doctors(id),
  month TEXT NOT NULL,
  posts_published INT DEFAULT 0,
  videos_published INT DEFAULT 0,
  revisions_used INT DEFAULT 0,
  personal_uploads_used INT DEFAULT 0,
  posts_auto_rejected INT DEFAULT 0,
  UNIQUE(doctor_id, month)
);

ALTER TABLE public.monthly_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_manage_usage" ON public.monthly_usage
  FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('super_admin', 'admin', 'staff'));

CREATE POLICY "doctors_read_own_usage" ON public.monthly_usage
  FOR SELECT USING (doctor_id = (SELECT doctor_id FROM public.profiles WHERE id = auth.uid()));

-- ═══════════════════════════════════════════════════════════════
-- 9. AD CAMPAIGNS
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE public.ad_campaigns (
  id TEXT PRIMARY KEY,
  campaign_name TEXT NOT NULL,
  platform TEXT DEFAULT 'meta',
  objective TEXT,
  budget_daily_idr BIGINT,
  spend_idr BIGINT DEFAULT 0,
  impressions BIGINT DEFAULT 0,
  clicks BIGINT DEFAULT 0,
  leads INT DEFAULT 0,
  cpl_idr BIGINT,
  ctr NUMERIC(5,2),
  status TEXT DEFAULT 'active',
  insights JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.ad_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_manage_campaigns" ON public.ad_campaigns
  FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('super_admin', 'admin'));

-- ═══════════════════════════════════════════════════════════════
-- 10. FINANCIAL REPORTS
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE public.financial_reports (
  id SERIAL PRIMARY KEY,
  report_type TEXT NOT NULL CHECK (report_type IN ('pnl', 'balance_sheet', 'cash_flow')),
  period TEXT NOT NULL,
  period_type TEXT NOT NULL CHECK (period_type IN ('monthly', 'quarterly', 'yearly')),
  data JSONB NOT NULL,
  notes TEXT,
  generated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.financial_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_manage_reports" ON public.financial_reports
  FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('super_admin', 'admin'));

CREATE UNIQUE INDEX idx_reports_unique ON public.financial_reports(report_type, period, period_type);

-- ═══════════════════════════════════════════════════════════════
-- 11. HELPER VIEWS
-- ═══════════════════════════════════════════════════════════════

-- Dashboard KPI view
CREATE OR REPLACE VIEW public.dashboard_kpis AS
SELECT
  (SELECT COUNT(*) FROM public.doctors WHERE subscription_status = 'active') as active_doctors,
  (SELECT COALESCE(SUM(monthly_cost_idr), 0) FROM public.doctors WHERE subscription_status = 'active') as mrr,
  (SELECT COUNT(*) FROM public.leads WHERE stage NOT IN ('won', 'lost')) as active_leads,
  (SELECT COUNT(*) FROM public.content_items WHERE status = 'pending_review') as pending_approvals,
  (SELECT COUNT(*) FROM public.content_items WHERE status = 'posted' AND posted_at >= now() - interval '30 days') as posts_this_month,
  (SELECT COALESCE(SUM(amount_idr), 0) FROM public.invoices WHERE status = 'paid' AND paid_at >= date_trunc('month', now())) as revenue_this_month,
  (SELECT COALESCE(SUM(amount_idr), 0) FROM public.expenses WHERE month = to_char(now(), 'YYYY-MM')) as expenses_this_month;
