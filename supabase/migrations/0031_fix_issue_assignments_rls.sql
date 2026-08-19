-- 0031_fix_issue_assignments_rls.sql
-- issue_assignments had RLS disabled entirely (flagged by Supabase's
-- security advisor), meaning any anon/authenticated caller with the
-- public anon key could read or write it directly via PostgREST. It also
-- meant PATCH /api/issues/[id]/assign (which writes via the RLS-governed
-- client, not the service role, and has no role check of its own) could
-- be called by any signed-in citizen to reassign issues to arbitrary
-- staff. This closes both: reads stay open (the app already surfaces
-- assignment info in the general issue feed to any signed-in viewer),
-- writes require an admin-type role (roles.level > 0), matching how the
-- rest of the app treats admin-only actions.

BEGIN;

ALTER TABLE public.issue_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "issue_assignments_select_all" ON public.issue_assignments
  FOR SELECT USING (true);

CREATE POLICY "issue_assignments_admin_write" ON public.issue_assignments
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.roles r ON r.id = p.role_id
      WHERE p.id = auth.uid() AND r.level > 0
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.roles r ON r.id = p.role_id
      WHERE p.id = auth.uid() AND r.level > 0
    )
  );

COMMIT;
