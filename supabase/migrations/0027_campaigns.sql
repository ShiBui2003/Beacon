-- 0027_campaigns.sql
-- Crowdfunding campaigns table. Reconstructed from frontend usage in
-- components/CampaignForm.tsx and app/citizen|admin/crowdfunding — this
-- table previously existed only as a hand-created table in the old
-- Supabase project, with no migration file.

BEGIN;

CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  target_amount NUMERIC NOT NULL DEFAULT 0,
  raised_amount NUMERIC NOT NULL DEFAULT 0,
  role TEXT NOT NULL CHECK (role IN ('citizen', 'government')),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaigns_role ON public.campaigns(role);

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

-- Anyone (including anonymous visitors) can view campaigns.
CREATE POLICY "campaigns_select_all" ON public.campaigns
  FOR SELECT USING (true);

-- Any authenticated user can create a campaign.
CREATE POLICY "campaigns_insert_authenticated" ON public.campaigns
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Client-side raised_amount updates are intentionally NOT allowed by RLS.
-- Task 12 adds a server route that updates raised_amount using the
-- service-role key after verifying the Razorpay payment signature, which
-- bypasses RLS by design — this policy set exists so that, until Task 12
-- ships, no anonymous/authenticated client can forge a raised_amount bump.

COMMIT;
