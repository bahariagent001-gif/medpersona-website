-- ==================================================================
-- Weekly research briefs — synced from tools/sync_research_to_supabase.py
-- ==================================================================
-- Each row = one WF02 research cycle output for a doctor. The Python
-- research pipeline writes its markdown brief + structured extracts
-- (viral alerts, pillars, hashtags) to this table so the website can
-- render it without needing access to the local `.tmp/research/` files.

CREATE TABLE IF NOT EXISTS public.research_briefs (
  id TEXT PRIMARY KEY,              -- "<doctor_id>:<cycle_date>"
  doctor_id TEXT NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  cycle_date DATE NOT NULL,         -- the Monday (or trigger date) of the research sprint
  specialty TEXT,                   -- denormalized from doctors.specialty at write time
  tier_required TEXT NOT NULL DEFAULT 'pro', -- 'pro' | 'elite'. starter+growth don't see briefs.

  -- Full markdown (raw brief_{date}.md contents)
  brief_markdown TEXT NOT NULL,

  -- Structured extracts (parsed by sync script — null if parsing failed)
  viral_alerts JSONB,               -- [{ title, why_urgent, angle, format, urgency }]
  pillars JSONB,                    -- [{ name, goal, ideas: [{ title, hook, lever, format, note }] }]
  hashtags TEXT[],                  -- extracted from "## Hashtag intelligence"
  topics_to_avoid TEXT[],           -- extracted from "## Topics to avoid"

  -- Source attribution (PubMed citations, news URLs, etc.)
  sources JSONB,                    -- { pubmed: [{ pmid, title, journal, citation }], news: [...] }

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_research_briefs_doctor_date
  ON public.research_briefs(doctor_id, cycle_date DESC);

CREATE OR REPLACE FUNCTION public.tg_research_briefs_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_research_briefs_updated_at ON public.research_briefs;
CREATE TRIGGER trg_research_briefs_updated_at
  BEFORE UPDATE ON public.research_briefs
  FOR EACH ROW EXECUTE FUNCTION public.tg_research_briefs_updated_at();

-- RLS:
--   * Doctor reads own briefs only if their tier matches/exceeds tier_required
--   * Admin manages all
ALTER TABLE public.research_briefs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "doctor_read_own_brief_by_tier" ON public.research_briefs;
CREATE POLICY "doctor_read_own_brief_by_tier" ON public.research_briefs
  FOR SELECT USING (
    doctor_id = (SELECT doctor_id FROM public.profiles WHERE id = auth.uid())
    AND (
      -- tier ranking: elite > pro > growth > starter
      CASE (SELECT tier FROM public.doctors WHERE id = doctor_id)
        WHEN 'elite' THEN 4
        WHEN 'pro' THEN 3
        WHEN 'growth' THEN 2
        WHEN 'starter' THEN 1
        ELSE 0
      END
      >=
      CASE tier_required
        WHEN 'elite' THEN 4
        WHEN 'pro' THEN 3
        ELSE 0
      END
    )
  );

DROP POLICY IF EXISTS "admin_manage_briefs" ON public.research_briefs;
CREATE POLICY "admin_manage_briefs" ON public.research_briefs
  FOR ALL USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('super_admin','admin','staff')
  );
