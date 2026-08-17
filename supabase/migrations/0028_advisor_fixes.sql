-- 0028_advisor_fixes.sql
-- Fixes for Supabase advisor findings that are attributable to this rebuild
-- (Task 4's new public.campaigns table). Findings on the original 26
-- migrations (pre-0027) are pre-existing conditions inherited from the app's
-- history and are intentionally left alone here; they are recorded as known
-- items in SETUP.md (Task 9) instead, per the Task 6 brief's scope rule.

BEGIN;

-- Performance advisor (unindexed_foreign_keys): the campaigns_created_by_fkey
-- foreign key (public.campaigns.created_by -> public.profiles.id) had no
-- covering index, which can force a sequential scan on lookups/joins
-- filtering or joining on created_by (e.g. "my campaigns" queries).
CREATE INDEX IF NOT EXISTS idx_campaigns_created_by ON public.campaigns(created_by);

COMMIT;
