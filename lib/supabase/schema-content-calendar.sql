-- ================================================================
-- MedPersona Content Calendar — planned + published posts tracker
-- ================================================================
-- Separates approvals_pending (review queue) from actual scheduled
-- content. Once an approval is approved and published, we record
-- the published state here for the calendar/monitoring UI.
--
-- Works for organic posts across IG / TikTok / LinkedIn.
-- Run via: Supabase SQL editor (copy-paste).
-- ================================================================

CREATE TABLE IF NOT EXISTS public.scheduled_posts (
  id TEXT PRIMARY KEY,

  -- Source
  approval_id TEXT REFERENCES public.approvals_pending(id) ON DELETE SET NULL,
  approval_type TEXT NOT NULL DEFAULT 'organic_post',  -- organic_post | ad_launch | boost_existing

  -- Target
  platform TEXT NOT NULL,          -- instagram | tiktok | linkedin | facebook
  target_account TEXT DEFAULT 'medpersona',
  content_type TEXT,               -- educational | social_proof | tips | promotional | carousel | reel

  -- Content snapshot (frozen at time of schedule/publish)
  caption TEXT,
  hashtags TEXT,
  visual_url TEXT,
  visual_source TEXT,              -- stock | ai | carousel | reel | manual
  carousel_slide_urls JSONB,       -- array of public urls if carousel
  audio_url TEXT,                  -- for reels/tiktok
  audio_title TEXT,
  audio_artist TEXT,

  -- Scheduling
  scheduled_for TIMESTAMPTZ,       -- when the post should go live
  published_at TIMESTAMPTZ,
  platform_post_id TEXT,           -- IG media_id / TT post_id etc.
  platform_permalink TEXT,

  -- Status
  status TEXT NOT NULL DEFAULT 'draft',  -- draft | scheduled | publishing | published | failed
  error_message TEXT,

  -- Performance (populated after publish by a daily cron)
  metrics JSONB,                   -- { likes, comments, shares, saves, reach, engagement_rate }
  metrics_last_synced_at TIMESTAMPTZ,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by TEXT DEFAULT 'agency_content_generator'
);

CREATE INDEX IF NOT EXISTS idx_scheduled_posts_status ON public.scheduled_posts(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_platform ON public.scheduled_posts(platform);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_scheduled_for ON public.scheduled_posts(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_published_at ON public.scheduled_posts(published_at DESC);

-- Trigger to update `updated_at`
CREATE OR REPLACE FUNCTION public.tg_scheduled_posts_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_scheduled_posts_updated_at ON public.scheduled_posts;
CREATE TRIGGER trg_scheduled_posts_updated_at
  BEFORE UPDATE ON public.scheduled_posts
  FOR EACH ROW EXECUTE FUNCTION public.tg_scheduled_posts_updated_at();

-- RLS (admin-only via SECURITY DEFINER helper)
ALTER TABLE public.scheduled_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins_manage_scheduled_posts" ON public.scheduled_posts;
CREATE POLICY "admins_manage_scheduled_posts" ON public.scheduled_posts
  FOR ALL USING (public.current_user_role() IN ('super_admin', 'admin'));

-- ================================================================
-- music_library — curated audio tracks for Reels / TikTok
-- ================================================================
-- Sourced from royalty-free libraries (Pixabay, Uppbeat) + optionally
-- trending audio synced from TikTok/IG via Apify.

CREATE TABLE IF NOT EXISTS public.music_library (
  id TEXT PRIMARY KEY,             -- provider:track_id
  title TEXT NOT NULL,
  artist TEXT,
  duration_sec INTEGER,
  audio_url TEXT NOT NULL,         -- public URL to mp3
  preview_url TEXT,                -- 30s preview
  waveform_url TEXT,               -- optional waveform image
  tags TEXT[],                     -- e.g. {'upbeat','educational','inspirational'}
  mood TEXT,                       -- upbeat | calm | emotional | energetic
  tempo_bpm INTEGER,
  license TEXT,                    -- free | attribution | paid
  source TEXT,                     -- pixabay | uppbeat | tiktok_trending | custom
  is_trending BOOLEAN DEFAULT FALSE,
  trending_until TIMESTAMPTZ,
  times_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_music_library_mood ON public.music_library(mood);
CREATE INDEX IF NOT EXISTS idx_music_library_trending ON public.music_library(is_trending) WHERE is_trending = TRUE;

ALTER TABLE public.music_library ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admins_manage_music_library" ON public.music_library;
CREATE POLICY "admins_manage_music_library" ON public.music_library
  FOR ALL USING (public.current_user_role() IN ('super_admin', 'admin'));

-- Public read for signed-in users (so non-admin staff can preview)
DROP POLICY IF EXISTS "read_music_library_authenticated" ON public.music_library;
CREATE POLICY "read_music_library_authenticated" ON public.music_library
  FOR SELECT USING (auth.uid() IS NOT NULL);
