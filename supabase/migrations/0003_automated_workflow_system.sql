-- 0003_automated_workflow_system.sql
-- Complete automated workflow system for issue management

BEGIN;

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Create departments table
CREATE TABLE IF NOT EXISTS public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  email TEXT,
  phone TEXT,
  head_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for departments
CREATE INDEX IF NOT EXISTS idx_departments_name ON public.departments(name);
CREATE INDEX IF NOT EXISTS idx_departments_active ON public.departments(is_active);

-- 2. Insert default departments
INSERT INTO public.departments (name, description, email) VALUES
  ('Road Maintenance', 'Handles road repairs, potholes, and street maintenance', 'roads@city.gov'),
  ('Electrical Services', 'Manages streetlights, traffic signals, and electrical infrastructure', 'electrical@city.gov'),
  ('Sanitation', 'Waste management, garbage collection, and cleanliness', 'sanitation@city.gov'),
  ('Water & Sewage', 'Water supply, drainage, and sewage systems', 'water@city.gov'),
  ('Parks & Recreation', 'Parks maintenance, playgrounds, and recreational facilities', 'parks@city.gov'),
  ('Traffic Management', 'Traffic control, parking, and road safety', 'traffic@city.gov')
ON CONFLICT (name) DO NOTHING;

-- 3. Create category to department mapping table
CREATE TABLE IF NOT EXISTS public.category_department_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(category, department_id)
);

-- Create index for category mappings
CREATE INDEX IF NOT EXISTS idx_category_mapping_category ON public.category_department_mapping(category);
CREATE INDEX IF NOT EXISTS idx_category_mapping_department ON public.category_department_mapping(department_id);

-- 4. Insert category mappings
INSERT INTO public.category_department_mapping (category, department_id, is_primary) 
SELECT 
  mapping.category,
  d.id,
  mapping.is_primary
FROM (VALUES
  ('roads', (SELECT id FROM public.departments WHERE name = 'Road Maintenance'), TRUE),
  ('potholes', (SELECT id FROM public.departments WHERE name = 'Road Maintenance'), TRUE),
  ('streetlights', (SELECT id FROM public.departments WHERE name = 'Electrical Services'), TRUE),
  ('traffic-lights', (SELECT id FROM public.departments WHERE name = 'Electrical Services'), TRUE),
  ('electrical', (SELECT id FROM public.departments WHERE name = 'Electrical Services'), TRUE),
  ('garbage', (SELECT id FROM public.departments WHERE name = 'Sanitation'), TRUE),
  ('waste', (SELECT id FROM public.departments WHERE name = 'Sanitation'), TRUE),
  ('sanitation', (SELECT id FROM public.departments WHERE name = 'Sanitation'), TRUE),
  ('water', (SELECT id FROM public.departments WHERE name = 'Water & Sewage'), TRUE),
  ('drainage', (SELECT id FROM public.departments WHERE name = 'Water & Sewage'), TRUE),
  ('sewage', (SELECT id FROM public.departments WHERE name = 'Water & Sewage'), TRUE),
  ('parks', (SELECT id FROM public.departments WHERE name = 'Parks & Recreation'), TRUE),
  ('playground', (SELECT id FROM public.departments WHERE name = 'Parks & Recreation'), TRUE),
  ('trees', (SELECT id FROM public.departments WHERE name = 'Parks & Recreation'), TRUE),
  ('traffic', (SELECT id FROM public.departments WHERE name = 'Traffic Management'), TRUE),
  ('parking', (SELECT id FROM public.departments WHERE name = 'Traffic Management'), TRUE),
  ('other', (SELECT id FROM public.departments WHERE name = 'Road Maintenance'), TRUE)
) AS mapping(category, department_id, is_primary)
JOIN public.departments d ON d.id = mapping.department_id
ON CONFLICT (category, department_id) DO NOTHING;

-- 5. Add department_id to issues table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'issues' AND column_name = 'department_id') THEN
    ALTER TABLE public.issues 
    ADD COLUMN department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create index for department_id in issues
CREATE INDEX IF NOT EXISTS idx_issues_department_id ON public.issues(department_id);

-- 6. Fix notifications table column name if needed
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'notifications' AND column_name = 'is_read') THEN
    ALTER TABLE public.notifications RENAME COLUMN is_read TO read;
  END IF;
END $$;

-- 7. Add issue_id to notifications table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'notifications' AND column_name = 'issue_id') THEN
    ALTER TABLE public.notifications 
    ADD COLUMN issue_id UUID REFERENCES public.issues(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create index for issue_id in notifications
CREATE INDEX IF NOT EXISTS idx_notifications_issue_id ON public.notifications(issue_id);

-- 8. Create issue workflow states table
CREATE TABLE IF NOT EXISTS public.issue_workflow_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  notes TEXT,
  estimated_completion TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for workflow states
CREATE INDEX IF NOT EXISTS idx_workflow_states_issue_id ON public.issue_workflow_states(issue_id);
CREATE INDEX IF NOT EXISTS idx_workflow_states_department_id ON public.issue_workflow_states(department_id);
CREATE INDEX IF NOT EXISTS idx_workflow_states_status ON public.issue_workflow_states(status);
CREATE INDEX IF NOT EXISTS idx_workflow_states_created_at ON public.issue_workflow_states(created_at);

-- 9. Create function to auto-assign issues to departments
CREATE OR REPLACE FUNCTION auto_assign_issue_to_department()
RETURNS TRIGGER AS $$
DECLARE
  target_department_id UUID;
BEGIN
  -- Find the primary department for this category
  SELECT department_id INTO target_department_id
  FROM public.category_department_mapping
  WHERE category = NEW.category AND is_primary = TRUE
  LIMIT 1;
  
  -- If department found, assign it and update status
  IF target_department_id IS NOT NULL THEN
    NEW.department_id := target_department_id;
    NEW.status := 'assigned';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Create trigger for auto-assignment on new issues
DROP TRIGGER IF EXISTS trigger_auto_assign_department ON public.issues;
CREATE TRIGGER trigger_auto_assign_department
  BEFORE INSERT ON public.issues
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_issue_to_department();

-- 11. Create function to create notifications and workflow states
CREATE OR REPLACE FUNCTION create_issue_notification()
RETURNS TRIGGER AS $$
DECLARE
  notification_title TEXT;
  notification_message TEXT;
  notification_link TEXT;
  department_name TEXT;
BEGIN
  -- Set notification link
  notification_link := '/citizen/issues/' || NEW.id;
  
  -- Get department name if assigned
  IF NEW.department_id IS NOT NULL THEN
    SELECT name INTO department_name FROM public.departments WHERE id = NEW.department_id;
  END IF;
  
  -- Handle different status changes
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
  
  -- Create notification for the issue reporter (only for status changes, not initial creation)
  IF TG_OP = 'UPDATE' OR (TG_OP = 'INSERT' AND NEW.status != 'submitted') THEN
    INSERT INTO public.notifications (user_id, title, message, link, issue_id)
    VALUES (NEW.user_id, notification_title, notification_message, notification_link, NEW.id);
  END IF;
  
  -- Create workflow state record for all changes
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

-- 12. Create trigger for notifications on issue updates
DROP TRIGGER IF EXISTS trigger_issue_notification ON public.issues;
CREATE TRIGGER trigger_issue_notification
  AFTER INSERT OR UPDATE OF status, assigned_to, department_id ON public.issues
  FOR EACH ROW
  EXECUTE FUNCTION create_issue_notification();

-- 13. Create function to update issue timestamp
CREATE OR REPLACE FUNCTION update_issue_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 14. Create trigger to update timestamp on issue changes
DROP TRIGGER IF EXISTS trigger_update_issue_timestamp ON public.issues;
CREATE TRIGGER trigger_update_issue_timestamp
  BEFORE UPDATE ON public.issues
  FOR EACH ROW
  EXECUTE FUNCTION update_issue_timestamp();

-- 15. Create function to update department timestamp
CREATE OR REPLACE FUNCTION update_department_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 16. Create trigger to update department timestamp
DROP TRIGGER IF EXISTS trigger_update_department_timestamp ON public.departments;
CREATE TRIGGER trigger_update_department_timestamp
  BEFORE UPDATE ON public.departments
  FOR EACH ROW
  EXECUTE FUNCTION update_department_timestamp();

-- 17. Update existing issues to have departments assigned
UPDATE public.issues 
SET department_id = (
  SELECT cdm.department_id 
  FROM public.category_department_mapping cdm 
  WHERE cdm.category = public.issues.category 
  AND cdm.is_primary = TRUE 
  LIMIT 1
),
status = CASE 
  WHEN status = 'submitted' AND department_id IS NULL THEN 'assigned'
  ELSE status 
END
WHERE department_id IS NULL;

-- 18. Create view for issue statistics by department
CREATE OR REPLACE VIEW public.department_issue_stats AS
SELECT 
  d.id,
  d.name,
  d.email,
  COUNT(i.id) as total_issues,
  COUNT(CASE WHEN i.status = 'submitted' THEN 1 END) as submitted_count,
  COUNT(CASE WHEN i.status = 'assigned' THEN 1 END) as assigned_count,
  COUNT(CASE WHEN i.status = 'in_progress' THEN 1 END) as in_progress_count,
  COUNT(CASE WHEN i.status = 'resolved' THEN 1 END) as resolved_count,
  COUNT(CASE WHEN i.status = 'closed' THEN 1 END) as closed_count,
  ROUND(
    COUNT(CASE WHEN i.status IN ('resolved', 'closed') THEN 1 END) * 100.0 / 
    NULLIF(COUNT(i.id), 0), 2
  ) as completion_rate
FROM public.departments d
LEFT JOIN public.issues i ON d.id = i.department_id
WHERE d.is_active = TRUE
GROUP BY d.id, d.name, d.email
ORDER BY d.name;

-- 19. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_issues_status_created_at ON public.issues(status, created_at);
CREATE INDEX IF NOT EXISTS idx_issues_category_status ON public.issues(category, status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);

-- 20. Add RLS (Row Level Security) policies if needed
-- Enable RLS on sensitive tables
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_workflow_states ENABLE ROW LEVEL SECURITY;

-- Policy for departments (readable by all authenticated users)
CREATE POLICY "Departments are viewable by authenticated users" ON public.departments
  FOR SELECT USING (auth.role() = 'authenticated');

-- Policy for workflow states (users can view their own issue workflows)
CREATE POLICY "Users can view workflow for their issues" ON public.issue_workflow_states
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.issues 
      WHERE issues.id = issue_workflow_states.issue_id 
      AND issues.user_id = auth.uid()
    )
  );

-- Policy for admins to view all workflow states (you may need to adjust based on your admin role system)
CREATE POLICY "Admins can view all workflow states" ON public.issue_workflow_states
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.email LIKE '%@admin.%'  -- Adjust this condition based on your admin identification
    )
  );

COMMIT;

-- Add helpful comments
COMMENT ON TABLE public.departments IS 'Government departments that handle different types of issues';
COMMENT ON TABLE public.category_department_mapping IS 'Maps issue categories to responsible departments';
COMMENT ON TABLE public.issue_workflow_states IS 'Tracks the complete workflow history of each issue';
COMMENT ON FUNCTION auto_assign_issue_to_department() IS 'Automatically assigns new issues to appropriate departments based on category';
COMMENT ON FUNCTION create_issue_notification() IS 'Creates notifications and workflow records when issue status changes';
COMMENT ON VIEW public.department_issue_stats IS 'Provides statistics about issues handled by each department';