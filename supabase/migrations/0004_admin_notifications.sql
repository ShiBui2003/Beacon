-- 0004_admin_notifications.sql
-- Add admin notifications for new citizen reports

BEGIN;

-- Create admin notifications table
CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'new_issue',
  link TEXT,
  read BOOLEAN DEFAULT FALSE,
  issue_id UUID REFERENCES public.issues(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for admin notifications
CREATE INDEX IF NOT EXISTS idx_admin_notifications_read ON public.admin_notifications(read);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_at ON public.admin_notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_issue_id ON public.admin_notifications(issue_id);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_type ON public.admin_notifications(type);

-- Function to create admin notifications for new issues
CREATE OR REPLACE FUNCTION create_admin_notification_for_new_issue()
RETURNS TRIGGER AS $$
DECLARE
  department_name TEXT;
  category_display TEXT;
BEGIN
  -- Get department name if assigned
  IF NEW.department_id IS NOT NULL THEN
    SELECT name INTO department_name FROM public.departments WHERE id = NEW.department_id;
  END IF;
  
  -- Format category for display
  category_display := INITCAP(REPLACE(NEW.category, '_', ' '));
  
  -- Create admin notification for new issue
  INSERT INTO public.admin_notifications (
    title,
    message,
    type,
    link,
    issue_id
  ) VALUES (
    'New Issue Reported',
    'A new ' || category_display || ' issue has been reported' || 
    CASE 
      WHEN department_name IS NOT NULL THEN ' and assigned to ' || department_name
      ELSE ''
    END || '. Location: ' || NEW.location_address,
    'new_issue',
    '/admin/issues/' || NEW.id,
    NEW.id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for admin notifications on new issues
DROP TRIGGER IF EXISTS trigger_admin_notification_new_issue ON public.issues;
CREATE TRIGGER trigger_admin_notification_new_issue
  AFTER INSERT ON public.issues
  FOR EACH ROW
  EXECUTE FUNCTION create_admin_notification_for_new_issue();

-- Function to create admin notifications for urgent issues
CREATE OR REPLACE FUNCTION create_admin_notification_for_urgent_issue()
RETURNS TRIGGER AS $$
BEGIN
  -- Create urgent notification if priority is high or urgent
  IF NEW.priority IN ('high', 'urgent') AND (OLD.priority IS NULL OR OLD.priority NOT IN ('high', 'urgent')) THEN
    INSERT INTO public.admin_notifications (
      title,
      message,
      type,
      link,
      issue_id
    ) VALUES (
      'Urgent Issue Requires Attention',
      'Issue "' || NEW.title || '" has been marked as ' || NEW.priority || ' priority and requires immediate attention.',
      'urgent',
      '/admin/issues/' || NEW.id,
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for urgent issue notifications
DROP TRIGGER IF EXISTS trigger_admin_notification_urgent_issue ON public.issues;
CREATE TRIGGER trigger_admin_notification_urgent_issue
  AFTER UPDATE OF priority ON public.issues
  FOR EACH ROW
  EXECUTE FUNCTION create_admin_notification_for_urgent_issue();

-- Function to create admin notifications for status changes
CREATE OR REPLACE FUNCTION create_admin_notification_for_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Create notification when issue status changes to resolved (for tracking)
  IF NEW.status = 'resolved' AND OLD.status != 'resolved' THEN
    INSERT INTO public.admin_notifications (
      title,
      message,
      type,
      link,
      issue_id
    ) VALUES (
      'Issue Resolved',
      'Issue "' || NEW.title || '" has been marked as resolved.',
      'status_update',
      '/admin/issues/' || NEW.id,
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for status change notifications
DROP TRIGGER IF EXISTS trigger_admin_notification_status_change ON public.issues;
CREATE TRIGGER trigger_admin_notification_status_change
  AFTER UPDATE OF status ON public.issues
  FOR EACH ROW
  EXECUTE FUNCTION create_admin_notification_for_status_change();

-- Add RLS policy for admin notifications
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- Policy for admins to view all admin notifications
CREATE POLICY "Admins can view all admin notifications" ON public.admin_notifications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (
        auth.users.email LIKE '%@admin.%' OR 
        auth.users.email LIKE '%@city.gov' OR
        (auth.users.raw_user_meta_data->>'role') = 'admin'
      )
    )
  );

-- Create a view for admin notification statistics
CREATE OR REPLACE VIEW public.admin_notification_stats AS
SELECT 
  COUNT(*) as total_notifications,
  COUNT(CASE WHEN read = FALSE THEN 1 END) as unread_count,
  COUNT(CASE WHEN type = 'new_issue' THEN 1 END) as new_issues_count,
  COUNT(CASE WHEN type = 'urgent' THEN 1 END) as urgent_count,
  COUNT(CASE WHEN created_at >= NOW() - INTERVAL '24 hours' THEN 1 END) as last_24h_count,
  COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as last_7d_count
FROM public.admin_notifications;

-- Insert some sample admin notifications for testing (optional)
-- You can remove this section if you don't want sample data
INSERT INTO public.admin_notifications (title, message, type, link) VALUES
  ('System Update', 'The civic reporting system has been updated with new features.', 'system', '/admin/dashboard'),
  ('Weekly Report Ready', 'Your weekly issues report is ready for review.', 'system', '/admin/reports')
ON CONFLICT DO NOTHING;

COMMIT;

-- Add helpful comments
COMMENT ON TABLE public.admin_notifications IS 'Notifications for admin users about new issues and system events';
COMMENT ON FUNCTION create_admin_notification_for_new_issue() IS 'Creates admin notifications when citizens report new issues';
COMMENT ON FUNCTION create_admin_notification_for_urgent_issue() IS 'Creates urgent notifications for high priority issues';
COMMENT ON VIEW public.admin_notification_stats IS 'Provides statistics about admin notifications';