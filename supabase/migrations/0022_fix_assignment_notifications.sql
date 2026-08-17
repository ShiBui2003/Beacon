-- Fix assignment causing notifications insert with null title
-- Adjust issue notification trigger to avoid firing on assigned_to changes
-- and ensure we only create notifications when status or department changes.

BEGIN;

-- Replace function to guard inserts and guarantee non-null title
CREATE OR REPLACE FUNCTION public.create_issue_notification()
RETURNS TRIGGER AS $$
DECLARE
  notification_title TEXT;
  notification_message TEXT;
  notification_link TEXT;
  department_name TEXT;
BEGIN
  -- Only act for:
  --   INSERTs where status is not 'submitted', or
  --   UPDATEs where status or department_id changed
  IF TG_OP = 'INSERT' THEN
    IF NEW.status = 'submitted' THEN
      RETURN NEW;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF (NEW.status IS NOT DISTINCT FROM OLD.status)
       AND (NEW.department_id IS NOT DISTINCT FROM OLD.department_id) THEN
      -- Ignore updates that only change assigned_to or other fields
      RETURN NEW;
    END IF;
  END IF;

  -- Set link
  notification_link := '/citizen/issues/' || NEW.id;

  -- Department name, if present
  IF NEW.department_id IS NOT NULL THEN
    SELECT name INTO department_name FROM public.departments WHERE id = NEW.department_id;
  END IF;

  -- Compose non-null title/message based on status
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

  -- Insert notification to the reporter
  INSERT INTO public.notifications (user_id, title, message, link, issue_id)
  VALUES (NEW.user_id, notification_title, notification_message, notification_link, NEW.id);

  -- Always record workflow state for visibility
  INSERT INTO public.issue_workflow_states (
    issue_id,
    status,
    department_id,
    assigned_to,
    created_by
  ) VALUES (
    NEW.id,
    NEW.status,
    NEW.department_id,
    NEW.assigned_to,
    COALESCE(NEW.assigned_to, NEW.user_id)
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger without assigned_to in the watched columns
DROP TRIGGER IF EXISTS trigger_issue_notification ON public.issues;
CREATE TRIGGER trigger_issue_notification
  AFTER INSERT OR UPDATE OF status, department_id ON public.issues
  FOR EACH ROW
  EXECUTE FUNCTION public.create_issue_notification();

COMMIT;
