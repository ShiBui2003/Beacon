-- 0008_add_missing_columns.sql
-- Add missing columns and tables that are referenced in the API

BEGIN;

-- Create the update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create departments table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create some default departments
INSERT INTO public.departments (name, email, description) VALUES 
    ('Road Maintenance', 'roads@municipality.gov', 'Handles road repairs, potholes, and street maintenance'),
    ('Electrical Services', 'electrical@municipality.gov', 'Manages streetlights, traffic signals, and electrical infrastructure'),
    ('Sanitation', 'sanitation@municipality.gov', 'Garbage collection, waste management, and cleanliness'),
    ('Water & Sewage', 'water@municipality.gov', 'Water supply, drainage, and sewage management'),
    ('Traffic Management', 'traffic@municipality.gov', 'Traffic signals, road signs, and traffic flow management'),
    ('Parks & Recreation', 'parks@municipality.gov', 'Park maintenance, recreational facilities, and green spaces')
ON CONFLICT (name) DO NOTHING;

-- Add completed_at column to issues table
ALTER TABLE public.issues 
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Add department_id column to issues table
ALTER TABLE public.issues 
ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id);

-- Add estimated_completion column to issues table
ALTER TABLE public.issues 
ADD COLUMN IF NOT EXISTS estimated_completion TIMESTAMPTZ;

-- Create workflow_states table for tracking issue workflow history
CREATE TABLE IF NOT EXISTS public.workflow_states (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    department_id UUID REFERENCES public.departments(id),
    assigned_to UUID REFERENCES public.profiles(id),
    notes TEXT,
    estimated_completion TIMESTAMPTZ,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_issues_completed_at ON public.issues(completed_at);
CREATE INDEX IF NOT EXISTS idx_issues_department_id ON public.issues(department_id);
CREATE INDEX IF NOT EXISTS idx_issues_estimated_completion ON public.issues(estimated_completion);
CREATE INDEX IF NOT EXISTS idx_workflow_states_issue_id ON public.workflow_states(issue_id);
CREATE INDEX IF NOT EXISTS idx_workflow_states_created_at ON public.workflow_states(created_at);

-- Create a function to automatically set completed_at when status changes to resolved
CREATE OR REPLACE FUNCTION public.set_completed_at()
RETURNS TRIGGER AS $$
BEGIN
  -- If status is being changed to resolved, set completed_at
  IF NEW.status = 'resolved' AND OLD.status != 'resolved' THEN
    NEW.completed_at = NOW();
  END IF;
  
  -- If status is being changed from resolved to something else, clear completed_at
  IF NEW.status != 'resolved' AND OLD.status = 'resolved' THEN
    NEW.completed_at = NULL;
  END IF;
  
  -- Always update updated_at
  NEW.updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically set completed_at
DROP TRIGGER IF EXISTS trigger_set_completed_at ON public.issues;
CREATE TRIGGER trigger_set_completed_at
  BEFORE UPDATE ON public.issues
  FOR EACH ROW
  EXECUTE FUNCTION public.set_completed_at();

-- Update existing resolved issues to have completed_at set to updated_at
UPDATE public.issues 
SET completed_at = updated_at 
WHERE status = 'resolved' AND completed_at IS NULL;

-- Enable RLS on new tables
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_states ENABLE ROW LEVEL SECURITY;

-- RLS Policies for departments table
CREATE POLICY "Departments are viewable by everyone" ON public.departments
    FOR SELECT USING (true);

CREATE POLICY "Only admins can insert departments" ON public.departments
    FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Only admins can update departments" ON public.departments
    FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Only admins can delete departments" ON public.departments
    FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');

-- RLS Policies for workflow_states table
CREATE POLICY "Workflow states are viewable by everyone" ON public.workflow_states
    FOR SELECT USING (true);

CREATE POLICY "Only authenticated users can insert workflow states" ON public.workflow_states
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Only admins can update workflow states" ON public.workflow_states
    FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Only admins can delete workflow states" ON public.workflow_states
    FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');

-- Create updated_at trigger for departments
CREATE TRIGGER update_departments_updated_at
    BEFORE UPDATE ON public.departments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create updated_at trigger for workflow_states
CREATE TRIGGER update_workflow_states_updated_at
    BEFORE UPDATE ON public.workflow_states
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

COMMIT;