-- 0002_departments_and_workflow.sql
-- Add departments table and workflow automation

BEGIN;

-- Departments table
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

-- Insert default departments
INSERT INTO public.departments (name, description, email) VALUES
  ('Road Maintenance', 'Handles road repairs, potholes, and street maintenance', 'roads@city.gov'),
  ('Electrical Services', 'Manages streetlights, traffic signals, and electrical infrastructure', 'electrical@city.gov'),
  ('Sanitation', 'Waste management, garbage collection, and cleanliness', 'sanitation@city.gov'),
  ('Water & Sewage', 'Water supply, drainage, and sewage systems', 'water@city.gov'),
  ('Parks & Recreation', 'Parks maintenance, playgrounds, and recreational facilities', 'parks@city.gov'),
  ('Traffic Management', 'Traffic control, parking, and road safety', 'traffic@city.gov')
ON CONFLICT (name) DO NOTHING;

-- Category to department mapping table
CREATE TABLE IF NOT EXISTS public.category_department_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(category, department_id)
);

-- Insert category mappings
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

-- Add department_id to issues table
ALTER TABLE public.issues 
ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL;

-- Add index for department_id
CREATE INDEX IF NOT EXISTS idx_issues_department_id ON public.issues(department_id);

-- Update notifications table to use 'read' instead of 'is_read' for consistency
ALTER TABLE public.notifications 
RENAME COLUMN is_read TO read;

-- Issue workflow states table
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
CREATE INDEX IF NOT EXISTS idx_workflow_states_created_at ON public.issue_workflow_states(created_at);

-- Function to auto-assign issues to departments
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
  
  -- If department found, assign it
  IF target_department_id IS NOT NULL THEN
    NEW.department_id := target_department_id;
    NEW.status := 'assigned';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-assignment
DROP TRIGGER IF EXISTS trigger_auto_assign_department ON public.issues;
CREATE TRIGGER trigger_auto_assign_department
  BEFORE INSERT ON public.issues
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_issue_to_department();

-- Function to create notifications for issue updates
CREATE OR REPLACE FUNCTION create_issue_notification()
RETURNS TRIGGER AS $$
DECLARE
  notification_title TEXT;
  notification_message TEXT;
  notification_link TEXT;
BEGIN
  -- Set notification link
  notification_link := '/citizen/issues/' || NEW.id;
  
  -- Handle different status changes
  CASE NEW.status
    WHEN 'assigned' THEN
      notification_title := 'Issue Assigned';
      notification_message := 'Your issue "' || NEW.title || '" has been assigned to a department for review.';
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
  
  -- Create notification for the issue reporter
  INSERT INTO public.notifications (user_id, title, message, link, issue_id)
  VALUES (NEW.user_id, notification_title, notification_message, notification_link, NEW.id);
  
  -- Create workflow state record
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

-- Create trigger for notifications on issue updates
DROP TRIGGER IF EXISTS trigger_issue_notification ON public.issues;
CREATE TRIGGER trigger_issue_notification
  AFTER INSERT OR UPDATE OF status, assigned_to, department_id ON public.issues
  FOR EACH ROW
  EXECUTE FUNCTION create_issue_notification();

-- Add issue_id to notifications table for better tracking
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS issue_id UUID REFERENCES public.issues(id) ON DELETE CASCADE;

-- Create index for issue_id in notifications
CREATE INDEX IF NOT EXISTS idx_notifications_issue_id ON public.notifications(issue_id);

COMMIT;