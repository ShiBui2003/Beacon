-- Create mapping table for issue assignments and drop assignment columns from issues

BEGIN;

-- 1) Create issue_assignments table
CREATE TABLE IF NOT EXISTS public.issue_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id uuid NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  assigned_by uuid NOT NULL REFERENCES public.profiles(id),
  assigned_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_issue_assignments_issue ON public.issue_assignments(issue_id);
CREATE INDEX IF NOT EXISTS idx_issue_assignments_active ON public.issue_assignments(issue_id) WHERE ended_at IS NULL;

-- 2) Drop assignment columns from issues if they exist

COMMIT;
