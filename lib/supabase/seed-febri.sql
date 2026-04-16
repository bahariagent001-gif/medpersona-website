-- Seed data for dr. Febri Andika (test account)
-- Run this AFTER schema.sql has been applied

-- 1. Insert doctor record
INSERT INTO public.doctors (
  id, full_name, title, specialty, subspecialty,
  whatsapp_number, location, institution, years_in_practice,
  tier, subscription_status, subscription_started, subscription_expires,
  monthly_cost_idr,
  brand_voice, visual_style, target_audience, platforms, social_accounts,
  voice_id
) VALUES (
  'dr-febri-andika',
  'Febri Andika',
  'dr.',
  'General Practitioner',
  'Family Medicine',
  '08xxxxxxxxxx',  -- Replace with actual WhatsApp number
  'Batam, Kepulauan Riau',
  'Klinik Sehat Batam',
  5,
  'pro',
  'active',
  now(),
  now() + interval '30 days',
  1299000,
  '{"tone": "approachable", "character_adjectives": ["warm", "trustworthy", "educational", "relatable"], "content_style": "practical-tips"}'::jsonb,
  '{"color_palette": ["#2E86AB", "#A8DADC", "#F1FAEE", "#E63946"], "font_preference": "modern-sans", "aesthetic": "clean clinical", "template_archetype": "clean-doctor"}'::jsonb,
  '{"primary": "Working adults 25-45 in Batam seeking health advice", "secondary": "Parents seeking family health guidance", "geography": "Batam, Indonesia"}'::jsonb,
  '{"instagram": {"active": true, "handle": "@drfebri.sehat"}, "linkedin": {"active": true, "handle": "dr-febri-andika"}, "tiktok": {"active": false}}'::jsonb,
  '{"instagram": {"handle": "@drfebri.sehat"}, "linkedin": {"handle": "dr-febri-andika"}}'::jsonb,
  '3mAVBNEqop5UbHtD8oxQ'
);

-- 2. Create auth user (run via Supabase admin API or dashboard)
-- Email: febri@medpersona.id
-- Password: testpass123
--
-- Using supabase admin client:
--   await supabase.auth.admin.createUser({
--     email: 'febri@medpersona.id',
--     password: 'testpass123',
--     email_confirm: true,
--     user_metadata: { full_name: 'dr. Febri Andika', role: 'doctor' }
--   })
--
-- The handle_new_user trigger will auto-create the profile row.
-- Then update the profile to link to the doctor:
--
--   UPDATE public.profiles
--   SET doctor_id = 'dr-febri-andika', phone = '08xxxxxxxxxx'
--   WHERE email = 'febri@medpersona.id';

-- 3. Create admin user for yourself
-- Email: bahariagent001@gmail.com
-- Password: (set your own)
--
--   await supabase.auth.admin.createUser({
--     email: 'bahariagent001@gmail.com',
--     password: 'your-password-here',
--     email_confirm: true,
--     user_metadata: { full_name: 'Admin', role: 'super_admin' }
--   })
