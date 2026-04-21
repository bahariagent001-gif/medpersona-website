-- ==================================================================
-- Recurring subscription plans (auto-renewal via Xendit)
-- ==================================================================
-- When a doctor opts into auto-renewal, we create a Xendit Recurring Plan
-- that handles BOTH credit-card and linked-eWallet charges on a monthly
-- schedule. Xendit stores the tokenized payment method; our side just
-- stores the plan reference + latest status.
--
-- Lifecycle:
--   1. Doctor clicks "Aktifkan Auto-Renewal" → POST /api/payment/setup-recurring
--   2. Row inserted here with status='pending_auth', redirect_url returned
--   3. Doctor completes Xendit auth (CC 3DS or eWallet OAuth)
--   4. Webhook event `recurring.plan.activated` → status='active'
--   5. Each month Xendit auto-charges; webhook `recurring.cycle.succeeded`
--      creates a new invoice row + extends subscription_expires
--   6. Failed charges → webhook `recurring.cycle.retrying` / `.failed`

CREATE TABLE IF NOT EXISTS public.recurring_plans (
  id TEXT PRIMARY KEY,             -- Xendit plan id (e.g. pl_xxx)
  doctor_id TEXT NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  tier TEXT NOT NULL,              -- starter|growth|pro|elite
  amount_idr INTEGER NOT NULL,

  -- Payment method
  method_type TEXT,                -- CREDIT_CARD | EWALLET_OVO | EWALLET_DANA | etc.
  method_mask TEXT,                -- last-4 for CC, phone for eWallet (display only)

  -- Schedule
  interval_unit TEXT NOT NULL DEFAULT 'MONTH',
  interval_count INTEGER NOT NULL DEFAULT 1,
  next_charge_at TIMESTAMPTZ,

  -- State
  status TEXT NOT NULL DEFAULT 'pending_auth',
  -- pending_auth | active | paused | cancelled | failed
  last_cycle_id TEXT,
  last_cycle_at TIMESTAMPTZ,
  failure_reason TEXT,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  cancelled_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_recurring_plans_doctor
  ON public.recurring_plans(doctor_id);
CREATE INDEX IF NOT EXISTS idx_recurring_plans_status
  ON public.recurring_plans(status);

CREATE OR REPLACE FUNCTION public.tg_recurring_plans_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_recurring_plans_updated_at ON public.recurring_plans;
CREATE TRIGGER trg_recurring_plans_updated_at
  BEFORE UPDATE ON public.recurring_plans
  FOR EACH ROW EXECUTE FUNCTION public.tg_recurring_plans_updated_at();

-- RLS: doctor sees own plans; admin sees all
ALTER TABLE public.recurring_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "doctor_read_own_plan" ON public.recurring_plans;
CREATE POLICY "doctor_read_own_plan" ON public.recurring_plans
  FOR SELECT USING (
    doctor_id = (SELECT doctor_id FROM public.profiles WHERE id = auth.uid())
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('super_admin','admin')
  );

DROP POLICY IF EXISTS "admin_manage_plans" ON public.recurring_plans;
CREATE POLICY "admin_manage_plans" ON public.recurring_plans
  FOR ALL USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('super_admin','admin')
  );


-- ==================================================================
-- Renewal reminder log — idempotency for daily cron
-- ==================================================================
-- One row per (doctor_id, bucket, day) so the cron doesn't re-send the
-- same H-7/H-3/H-1/expired reminder twice in the same day.

CREATE TABLE IF NOT EXISTS public.renewal_reminder_log (
  id TEXT PRIMARY KEY,             -- "<doctor_id>:<bucket>:<YYYY-MM-DD>"
  doctor_id TEXT NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  bucket TEXT NOT NULL,            -- h7 | h3 | h1 | expired
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reminder_log_doctor_sent
  ON public.renewal_reminder_log(doctor_id, sent_at DESC);

-- Admin can read/write; regular users don't need access
ALTER TABLE public.renewal_reminder_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_manage_reminder_log" ON public.renewal_reminder_log;
CREATE POLICY "admin_manage_reminder_log" ON public.renewal_reminder_log
  FOR ALL USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('super_admin','admin')
  );
