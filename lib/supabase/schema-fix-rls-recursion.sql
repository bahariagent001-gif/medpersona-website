-- Fix: infinite recursion in profiles RLS policy
-- Problem: existing policy does `SELECT role FROM profiles WHERE id = auth.uid()`
-- which re-triggers the same policy → 42P17 error.
-- Solution: use a SECURITY DEFINER helper function that bypasses RLS.

-- 1. Create helper function (bypasses RLS via SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$;

GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated, anon;

-- 2. Drop existing recursive policies on profiles
DROP POLICY IF EXISTS "users_read_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "users_update_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "admins_manage_profiles" ON public.profiles;

-- 3. Re-create without recursion
CREATE POLICY "users_read_own_profile" ON public.profiles
  FOR SELECT
  USING (
    id = auth.uid()
    OR public.current_user_role() IN ('super_admin', 'admin')
  );

CREATE POLICY "users_update_own_profile" ON public.profiles
  FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "admins_manage_profiles" ON public.profiles
  FOR ALL
  USING (public.current_user_role() IN ('super_admin', 'admin'));

-- 4. Replace similar recursive patterns on other tables (doctors, content_items, etc.)
-- All policies that referenced `(SELECT role FROM public.profiles WHERE id = auth.uid())` inline
-- should use public.current_user_role() instead.

-- doctors
DROP POLICY IF EXISTS "admins_manage_doctors" ON public.doctors;
CREATE POLICY "admins_manage_doctors" ON public.doctors
  FOR ALL USING (public.current_user_role() IN ('super_admin', 'admin', 'staff'));

-- content_items
DROP POLICY IF EXISTS "admins_manage_content" ON public.content_items;
CREATE POLICY "admins_manage_content" ON public.content_items
  FOR ALL USING (public.current_user_role() IN ('super_admin', 'admin', 'staff'));

-- invoices
DROP POLICY IF EXISTS "admins_manage_invoices" ON public.invoices;
CREATE POLICY "admins_manage_invoices" ON public.invoices
  FOR ALL USING (public.current_user_role() IN ('super_admin', 'admin'));

-- expenses
DROP POLICY IF EXISTS "admins_manage_expenses" ON public.expenses;
CREATE POLICY "admins_manage_expenses" ON public.expenses
  FOR ALL USING (public.current_user_role() IN ('super_admin', 'admin'));

-- leads
DROP POLICY IF EXISTS "admins_manage_leads" ON public.leads;
CREATE POLICY "admins_manage_leads" ON public.leads
  FOR ALL USING (public.current_user_role() IN ('super_admin', 'admin', 'staff'));

-- articles
DROP POLICY IF EXISTS "admins_manage_articles" ON public.articles;
CREATE POLICY "admins_manage_articles" ON public.articles
  FOR ALL USING (public.current_user_role() IN ('super_admin', 'admin'));

-- monthly_usage
DROP POLICY IF EXISTS "admins_manage_usage" ON public.monthly_usage;
CREATE POLICY "admins_manage_usage" ON public.monthly_usage
  FOR ALL USING (public.current_user_role() IN ('super_admin', 'admin', 'staff'));

-- ad_campaigns
DROP POLICY IF EXISTS "admins_manage_campaigns" ON public.ad_campaigns;
CREATE POLICY "admins_manage_campaigns" ON public.ad_campaigns
  FOR ALL USING (public.current_user_role() IN ('super_admin', 'admin'));

-- financial_reports
DROP POLICY IF EXISTS "admins_manage_reports" ON public.financial_reports;
CREATE POLICY "admins_manage_reports" ON public.financial_reports
  FOR ALL USING (public.current_user_role() IN ('super_admin', 'admin'));

-- Growth engine tables (schema-growth.sql) — already use same pattern, fix them too
DROP POLICY IF EXISTS "admins_manage_ads_insights" ON public.ads_insights;
CREATE POLICY "admins_manage_ads_insights" ON public.ads_insights
  FOR ALL USING (public.current_user_role() IN ('super_admin', 'admin'));

DROP POLICY IF EXISTS "admins_manage_ad_creatives" ON public.ad_creatives;
CREATE POLICY "admins_manage_ad_creatives" ON public.ad_creatives
  FOR ALL USING (public.current_user_role() IN ('super_admin', 'admin'));

DROP POLICY IF EXISTS "admins_manage_organic_posts" ON public.organic_posts;
CREATE POLICY "admins_manage_organic_posts" ON public.organic_posts
  FOR ALL USING (public.current_user_role() IN ('super_admin', 'admin'));

DROP POLICY IF EXISTS "admins_manage_hashtags" ON public.hashtag_performance;
CREATE POLICY "admins_manage_hashtags" ON public.hashtag_performance
  FOR ALL USING (public.current_user_role() IN ('super_admin', 'admin'));

DROP POLICY IF EXISTS "admins_manage_competitors" ON public.competitors;
CREATE POLICY "admins_manage_competitors" ON public.competitors
  FOR ALL USING (public.current_user_role() IN ('super_admin', 'admin'));

DROP POLICY IF EXISTS "admins_manage_competitor_snap" ON public.competitor_snapshots;
CREATE POLICY "admins_manage_competitor_snap" ON public.competitor_snapshots
  FOR ALL USING (public.current_user_role() IN ('super_admin', 'admin'));

DROP POLICY IF EXISTS "admins_manage_seo_keywords" ON public.seo_keywords;
CREATE POLICY "admins_manage_seo_keywords" ON public.seo_keywords
  FOR ALL USING (public.current_user_role() IN ('super_admin', 'admin'));

DROP POLICY IF EXISTS "admins_manage_seo_rank_history" ON public.seo_rank_history;
CREATE POLICY "admins_manage_seo_rank_history" ON public.seo_rank_history
  FOR ALL USING (public.current_user_role() IN ('super_admin', 'admin'));

DROP POLICY IF EXISTS "admins_manage_seo_pages" ON public.seo_pages;
CREATE POLICY "admins_manage_seo_pages" ON public.seo_pages
  FOR ALL USING (public.current_user_role() IN ('super_admin', 'admin'));

DROP POLICY IF EXISTS "admins_manage_prospects" ON public.prospects;
CREATE POLICY "admins_manage_prospects" ON public.prospects
  FOR ALL USING (public.current_user_role() IN ('super_admin', 'admin', 'staff'));

DROP POLICY IF EXISTS "admins_manage_outreach" ON public.outreach_log;
CREATE POLICY "admins_manage_outreach" ON public.outreach_log
  FOR ALL USING (public.current_user_role() IN ('super_admin', 'admin', 'staff'));

DROP POLICY IF EXISTS "admins_manage_approvals" ON public.approvals_pending;
CREATE POLICY "admins_manage_approvals" ON public.approvals_pending
  FOR ALL USING (public.current_user_role() IN ('super_admin', 'admin'));

DROP POLICY IF EXISTS "admins_manage_knowledge" ON public.knowledge_events;
CREATE POLICY "admins_manage_knowledge" ON public.knowledge_events
  FOR ALL USING (public.current_user_role() IN ('super_admin', 'admin'));
