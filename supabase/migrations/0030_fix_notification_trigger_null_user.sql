-- 0030_fix_notification_trigger_null_user.sql
-- The public.issues.user_id column was made nullable in 0029 to support
-- anonymous voice reports (via api_create_issue_anon_by_dept). The
-- pre-existing create_issue_notification() trigger function unconditionally
-- inserted NEW.user_id into public.notifications.user_id (NOT NULL), which
-- broke any status transition away from 'submitted' (e.g. auto-assignment)
-- for anonymous issues with a 23502 not-null violation.
--
-- Fix: skip creating a notification when there's no user to notify. An
-- anonymous report has no citizen waiting on a notification, so this is
-- correct behavior, not a workaround. Everything else in the function body
-- is preserved byte-identical to the live definition (no SECURITY DEFINER,
-- no SET search_path, in the original — none added here either).

BEGIN;

CREATE OR REPLACE FUNCTION public.create_issue_notification()
RETURNS TRIGGER AS $$
DECLARE
  notification_title TEXT;
  notification_message TEXT;
  notification_link TEXT;
  department_name TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.status = 'submitted' THEN
      RETURN NEW;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF (NEW.status IS NOT DISTINCT FROM OLD.status)
       AND (NEW.department_id IS NOT DISTINCT FROM OLD.department_id) THEN
      RETURN NEW;
    END IF;
  END IF;

  notification_link := '/citizen/issues/' || NEW.id;

  IF NEW.department_id IS NOT NULL THEN
    SELECT name INTO department_name FROM public.departments WHERE id = NEW.department_id;
  END IF;

  CASE NEW.status
    WHEN 'assigned' THEN
      notification_title := 'Issue Assigned';
      IF department_name IS NOT NULL THEN
        notification_message := 'Your issue "' || NEW.title || '" has been assigned to ' || department_name || ' for review.';
      ELSE
        notification_message := 'Your issue "' || NEW.title || '" has been assigned to a department for review.';
      END IF;
    WHEN 'in_progress' THEN
      notification_title := 'Work Started';
      notification_message := 'Work has started on your issue "' || NEW.title || '".';
    WHEN 'resolved' THEN
      notification_title := 'Issue Resolved';
      notification_message := 'Your issue "' || NEW.title || '" has been marked as resolved.';
    WHEN 'closed' THEN
      notification_title := 'Issue Closed';
      notification_message := 'Your issue "' || NEW.title || '" has been closed.';
    ELSE
      notification_title := 'Issue Updated';
      notification_message := 'Your issue "' || NEW.title || '" has been updated.';
  END CASE;

  IF NEW.user_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, message, link, issue_id)
    VALUES (NEW.user_id, notification_title, notification_message, notification_link, NEW.id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMIT;
