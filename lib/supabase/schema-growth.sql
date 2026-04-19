-- MedPersona Growth Engine — Additive Schema
-- Apply AFTER schema.sql. All tables below are NEW (no destructive changes).
-- Run in Supabase SQL Editor.

-- ═══════════════════════════════════════════════════════════════
-- Extend ad_campaigns with autopilot fields
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE public.ad_campaigns
  ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'approved'
    CHECK (approval_status IN ('draft', 'pending_approval', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS source_creative_id TEXT,
  ADD COLUMN IF NOT EXISTS target_cpl_idr BIGINT,
  ADD COLUMN IF NOT EXISTS frequency NUMERIC(4,2),
  ADD COLUMN IF NOT EXISTS cpm_idr BIGINT;

-- ═══════════════════════════════════════════════════════════════
-- A. ADS_INSIGHTS (time-series per campaign)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.ads_insights (
  id SERIAL PRIMARY KEY,
  campaign_id TEXT NOT NULL REFERENCES public.ad_campaigns(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  spend_idr BIGINT DEFAULT 0,
  impressions BIGINT DEFAULT 0,
  clicks BIGINT DEFAULT 0,
  leads INT DEFAULT 0,
  reach BIGINT DEFAULT 0,
  frequency NUMERIC(4,2),
  ctr NUMERIC(5,2),
  cpm_idr BIGINT,
  cpc_idr BIGINT,
  cpl_idr BIGINT,
  raw JSONB DEFAULT '{}',
  fetched_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(campaign_id, date)
);
ALTER TABLE public.ads_insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_manage_ads_insights" ON public.ads_insights
  FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('super_admin', 'admin'));
CREATE INDEX IF NOT EXISTS idx_ads_insights_campaign_date ON public.ads_insights(campaign_id, date);

-- ═══════════════════════════════════════════════════════════════
-- B. AD_CREATIVES (per-creative inventory + performance)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.ad_creatives (
  id TEXT PRIMARY KEY,
  campaign_id TEXT REFERENCES public.ad_campaigns(id) ON DELETE SET NULL,
  platform TEXT NOT NULL,
  format TEXT, -- single_image | carousel | video | reels
  headline TEXT,
  primary_text TEXT,
  cta TEXT,
  asset_url TEXT,
  variant_tag TEXT,
  source_post_id TEXT, -- if derived from organic winner
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'retired')),
  performance JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.ad_creatives ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_manage_ad_creatives" ON public.ad_creatives
  FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('super_admin', 'admin'));

-- ═══════════════════════════════════════════════════════════════
-- C. ORGANIC_POSTS (per-post performance across platforms)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.organic_posts (
  id TEXT PRIMARY KEY,
  account_handle TEXT,
  platform TEXT NOT NULL,
  post_type TEXT, -- carousel | reel | video | image | story
  posted_at TIMESTAMPTZ,
  caption TEXT,
  hook TEXT,
  hashtags TEXT[],
  permalink TEXT,
  likes INT DEFAULT 0,
  comments INT DEFAULT 0,
  shares INT DEFAULT 0,
  saves INT DEFAULT 0,
  reach INT DEFAULT 0,
  impressions INT DEFAULT 0,
  plays INT DEFAULT 0,
  engagement_rate NUMERIC(5,2),
  fetched_at TIMESTAMPTZ DEFAULT now(),
  raw JSONB DEFAULT '{}'
);
ALTER TABLE public.organic_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_manage_organic_posts" ON public.organic_posts
  FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('super_admin', 'admin'));
CREATE INDEX IF NOT EXISTS idx_organic_posts_handle_posted ON public.organic_posts(account_handle, posted_at DESC);

-- ═══════════════════════════════════════════════════════════════
-- D. HASHTAG_PERFORMANCE
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.hashtag_performance (
  id SERIAL PRIMARY KEY,
  hashtag TEXT NOT NULL,
  platform TEXT NOT NULL,
  snapshot_date DATE NOT NULL,
  post_count BIGINT DEFAULT 0,
  avg_engagement_rate NUMERIC(5,2),
  relevance_score NUMERIC(4,2),
  opportunity_score NUMERIC(4,2),
  top_posts JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(hashtag, platform, snapshot_date)
);
ALTER TABLE public.hashtag_performance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_manage_hashtags" ON public.hashtag_performance
  FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('super_admin', 'admin'));
CREATE INDEX IF NOT EXISTS idx_hashtag_platform_date ON public.hashtag_performance(platform, snapshot_date DESC);

-- ═══════════════════════════════════════════════════════════════
-- E. COMPETITORS
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.competitors (
  id SERIAL PRIMARY KEY,
  handle TEXT NOT NULL,
  platform TEXT NOT NULL,
  display_name TEXT,
  category TEXT, -- agency | creator | publisher
  tier TEXT,      -- tier_1 | tier_2 | tier_3
  notes TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(handle, platform)
);
ALTER TABLE public.competitors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_manage_competitors" ON public.competitors
  FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('super_admin', 'admin'));

CREATE TABLE IF NOT EXISTS public.competitor_snapshots (
  id SERIAL PRIMARY KEY,
  competitor_id INT NOT NULL REFERENCES public.competitors(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  follower_count BIGINT,
  following_count BIGINT,
  post_count BIGINT,
  avg_engagement_rate NUMERIC(5,2),
  top_posts JSONB DEFAULT '[]',
  raw JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(competitor_id, snapshot_date)
);
ALTER TABLE public.competitor_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_manage_competitor_snap" ON public.competitor_snapshots
  FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('super_admin', 'admin'));

-- ═══════════════════════════════════════════════════════════════
-- F. SEO KEYWORDS + PAGES
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.seo_keywords (
  id SERIAL PRIMARY KEY,
  keyword TEXT NOT NULL,
  country TEXT DEFAULT 'ID',
  search_volume INT,
  difficulty INT,
  intent TEXT, -- informational | navigational | transactional | commercial
  current_rank INT,
  previous_rank INT,
  target_rank INT DEFAULT 3,
  tracking_since DATE DEFAULT CURRENT_DATE,
  last_checked TIMESTAMPTZ,
  active BOOLEAN DEFAULT true,
  UNIQUE(keyword, country)
);
ALTER TABLE public.seo_keywords ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_manage_seo_keywords" ON public.seo_keywords
  FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('super_admin', 'admin'));

CREATE TABLE IF NOT EXISTS public.seo_rank_history (
  id SERIAL PRIMARY KEY,
  keyword_id INT NOT NULL REFERENCES public.seo_keywords(id) ON DELETE CASCADE,
  checked_at TIMESTAMPTZ DEFAULT now(),
  rank INT,
  url TEXT,
  serp_features JSONB DEFAULT '{}'
);
ALTER TABLE public.seo_rank_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_manage_seo_rank_history" ON public.seo_rank_history
  FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('super_admin', 'admin'));
CREATE INDEX IF NOT EXISTS idx_seo_rank_keyword ON public.seo_rank_history(keyword_id, checked_at DESC);

CREATE TABLE IF NOT EXISTS public.seo_pages (
  id SERIAL PRIMARY KEY,
  path TEXT NOT NULL UNIQUE,
  title TEXT,
  meta_description TEXT,
  canonical TEXT,
  target_keyword TEXT,
  word_count INT,
  last_audited TIMESTAMPTZ,
  lh_performance INT,
  lh_seo INT,
  lh_accessibility INT,
  issues JSONB DEFAULT '[]',
  schema_types TEXT[]
);
ALTER TABLE public.seo_pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_manage_seo_pages" ON public.seo_pages
  FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('super_admin', 'admin'));

-- ═══════════════════════════════════════════════════════════════
-- G. PROSPECTS (B2B lead hunter)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.prospects (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL, -- ig_hashtag | ig_competitor_follower | tiktok_hashtag | linkedin | idi_directory | google_maps
  source_ref TEXT,
  platform TEXT,
  handle TEXT,
  full_name TEXT,
  title TEXT,
  specialty TEXT,
  subspecialty TEXT,
  city TEXT,
  country TEXT DEFAULT 'ID',
  clinic TEXT,
  bio TEXT,
  website TEXT,
  whatsapp TEXT,
  email TEXT,
  follower_count INT,
  post_count INT,
  avg_engagement_rate NUMERIC(5,2),
  icp_score INT DEFAULT 0,
  outreach_status TEXT DEFAULT 'new' CHECK (outreach_status IN (
    'new', 'enriched', 'queued', 'contacted', 'replied_hot', 'replied_warm', 'replied_cold',
    'unresponsive', 'opted_out', 'qualified', 'converted'
  )),
  outreach_channel TEXT,
  last_contacted_at TIMESTAMPTZ,
  notes TEXT,
  raw JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.prospects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_manage_prospects" ON public.prospects
  FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('super_admin', 'admin', 'staff'));
CREATE INDEX IF NOT EXISTS idx_prospects_status ON public.prospects(outreach_status);
CREATE INDEX IF NOT EXISTS idx_prospects_source ON public.prospects(source);

-- ═══════════════════════════════════════════════════════════════
-- H. OUTREACH_LOG
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.outreach_log (
  id SERIAL PRIMARY KEY,
  prospect_id TEXT NOT NULL REFERENCES public.prospects(id) ON DELETE CASCADE,
  channel TEXT NOT NULL, -- wa | ig_dm | tiktok_dm | linkedin_dm | email
  direction TEXT DEFAULT 'out' CHECK (direction IN ('out', 'in')),
  subject TEXT,
  message TEXT,
  sent_at TIMESTAMPTZ DEFAULT now(),
  delivered BOOLEAN,
  replied BOOLEAN DEFAULT false,
  reply_at TIMESTAMPTZ,
  reply_classification TEXT, -- hot | warm | cold | opt_out
  error TEXT,
  raw JSONB DEFAULT '{}'
);
ALTER TABLE public.outreach_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_manage_outreach" ON public.outreach_log
  FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('super_admin', 'admin', 'staff'));
CREATE INDEX IF NOT EXISTS idx_outreach_prospect ON public.outreach_log(prospect_id, sent_at DESC);

-- ═══════════════════════════════════════════════════════════════
-- I. APPROVALS_PENDING (central human-in-the-loop queue)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.approvals_pending (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL, -- ad_launch | ad_pause | ad_scale | creative_refresh | outreach_batch | seo_publish | content_publish
  title TEXT NOT NULL,
  summary TEXT,
  payload JSONB NOT NULL,
  risk_level TEXT DEFAULT 'medium' CHECK (risk_level IN ('low', 'medium', 'high')),
  proposed_by TEXT, -- tool/script name
  wa_message_id TEXT,
  wa_sent_at TIMESTAMPTZ,
  wa_sent_to TEXT,
  decision TEXT CHECK (decision IN ('approve', 'reject', 'edit', 'expired')),
  decision_note TEXT,
  decided_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'notified', 'decided', 'expired', 'executed', 'failed')),
  execution_result JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.approvals_pending ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_manage_approvals" ON public.approvals_pending
  FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('super_admin', 'admin'));
CREATE INDEX IF NOT EXISTS idx_approvals_status ON public.approvals_pending(status, created_at DESC);

-- ═══════════════════════════════════════════════════════════════
-- J. KNOWLEDGE_EVENTS (growth brain memory)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.knowledge_events (
  id SERIAL PRIMARY KEY,
  source TEXT NOT NULL, -- ads | organic | seo | leadgen | content
  category TEXT, -- winner | loser | anomaly | insight | action
  title TEXT NOT NULL,
  detail TEXT,
  metrics JSONB DEFAULT '{}',
  applied_to TEXT[], -- workflow_16, profile.agency, etc.
  confidence NUMERIC(3,2),
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.knowledge_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_manage_knowledge" ON public.knowledge_events
  FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('super_admin', 'admin'));
CREATE INDEX IF NOT EXISTS idx_knowledge_source ON public.knowledge_events(source, created_at DESC);

-- ═══════════════════════════════════════════════════════════════
-- K. GROWTH KPI VIEW
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW public.growth_kpis AS
SELECT
  (SELECT COUNT(*) FROM public.ad_campaigns WHERE status = 'active') AS active_campaigns,
  (SELECT COALESCE(SUM(spend_idr), 0) FROM public.ads_insights WHERE date >= CURRENT_DATE - INTERVAL '30 days') AS ad_spend_30d,
  (SELECT COALESCE(SUM(leads), 0) FROM public.ads_insights WHERE date >= CURRENT_DATE - INTERVAL '30 days') AS ad_leads_30d,
  (SELECT COUNT(*) FROM public.approvals_pending WHERE status = 'pending') AS pending_approvals,
  (SELECT COUNT(*) FROM public.prospects WHERE outreach_status = 'new') AS new_prospects,
  (SELECT COUNT(*) FROM public.prospects WHERE outreach_status IN ('contacted', 'queued')) AS prospects_in_outreach,
  (SELECT COUNT(*) FROM public.prospects WHERE outreach_status IN ('replied_hot', 'qualified')) AS hot_leads,
  (SELECT COUNT(*) FROM public.seo_keywords WHERE active AND current_rank IS NOT NULL AND current_rank <= 10) AS keywords_top10,
  (SELECT COUNT(*) FROM public.seo_keywords WHERE active) AS keywords_tracked,
  (SELECT AVG(engagement_rate) FROM public.organic_posts WHERE posted_at >= CURRENT_DATE - INTERVAL '30 days') AS organic_avg_er_30d;
