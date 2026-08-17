-- 0002_rls_policies.sql
-- Enable Row Level Security and define policies

BEGIN;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Profiles: allow reading by all authenticated users (for relation embedding)
DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;
CREATE POLICY "profiles_select_all" ON public.profiles FOR SELECT TO authenticated USING (true);

-- Allow users to insert/update their own profile row
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Issues
DROP POLICY IF EXISTS "issues_select_all" ON public.issues;
CREATE POLICY "issues_select_all" ON public.issues FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "issues_insert_authenticated" ON public.issues;
CREATE POLICY "issues_insert_authenticated" ON public.issues FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "issues_update_own" ON public.issues;
CREATE POLICY "issues_update_own" ON public.issues FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "issues_delete_own" ON public.issues;
CREATE POLICY "issues_delete_own" ON public.issues FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Issue votes
DROP POLICY IF EXISTS "votes_select_all" ON public.issue_votes;
CREATE POLICY "votes_select_all" ON public.issue_votes FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "votes_insert_own" ON public.issue_votes;
CREATE POLICY "votes_insert_own" ON public.issue_votes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "votes_delete_own" ON public.issue_votes;
CREATE POLICY "votes_delete_own" ON public.issue_votes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Comments
DROP POLICY IF EXISTS "comments_select_all" ON public.comments;
CREATE POLICY "comments_select_all" ON public.comments FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "comments_insert_authenticated" ON public.comments;
CREATE POLICY "comments_insert_authenticated" ON public.comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "comments_update_own" ON public.comments;
CREATE POLICY "comments_update_own" ON public.comments FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "comments_delete_own" ON public.comments;
CREATE POLICY "comments_delete_own" ON public.comments FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Issue updates
DROP POLICY IF EXISTS "updates_select_all" ON public.issue_updates;
CREATE POLICY "updates_select_all" ON public.issue_updates FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "updates_insert_authenticated" ON public.issue_updates;
CREATE POLICY "updates_insert_authenticated" ON public.issue_updates FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Notifications
DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
CREATE POLICY "notifications_select_own" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_insert_system" ON public.notifications;
CREATE POLICY "notifications_insert_system" ON public.notifications FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
CREATE POLICY "notifications_update_own" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Reload schema
NOTIFY pgrst, 'reload schema';

COMMIT;
