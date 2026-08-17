-- Update notifications trigger logic to not depend on issues.assigned_to

BEGIN;

-- Recreate trigger as in previous fix but ensure no dependency on assigned_to
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

  INSERT INTO public.notifications (user_id, title, message, link, issue_id)
  VALUES (NEW.user_id, notification_title, notification_message, notification_link, NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_issue_notification ON public.issues;
CREATE TRIGGER trigger_issue_notification
  AFTER INSERT OR UPDATE OF status, department_id ON public.issues
  FOR EACH ROW
  EXECUTE FUNCTION public.create_issue_notification();

COMMIT;
