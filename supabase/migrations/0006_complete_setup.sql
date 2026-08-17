-- Complete database setup for issue management system
-- This migration ensures all required tables and columns exist

-- 1. Create departments table
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  email VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add department_id column to issues table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'issues' AND column_name = 'department_id'
  ) THEN
    ALTER TABLE issues ADD COLUMN department_id UUID REFERENCES departments(id);
  END IF;
END $$;

-- 3. Add assigned_to column to issues table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'issues' AND column_name = 'assigned_to'
  ) THEN
    ALTER TABLE issues ADD COLUMN assigned_to UUID REFERENCES profiles(id);
  END IF;
END $$;

-- 4. Add completed_at column to issues table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'issues' AND column_name = 'completed_at'
  ) THEN
    ALTER TABLE issues ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- 4. Create issue_updates table for timeline tracking
CREATE TABLE IF NOT EXISTS issue_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID REFERENCES issues(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  status VARCHAR(50),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create issue_workflow_states table for detailed tracking
CREATE TABLE IF NOT EXISTS issue_workflow_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID REFERENCES issues(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL,
  department_id UUID REFERENCES departments(id),
  assigned_to UUID REFERENCES profiles(id),
  notes TEXT,
  estimated_completion TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Ensure notifications table has all required columns
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'issue_id'
  ) THEN
    ALTER TABLE notifications ADD COLUMN issue_id UUID REFERENCES issues(id);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'link'
  ) THEN
    ALTER TABLE notifications ADD COLUMN link VARCHAR(500);
  END IF;
END $$;

-- 7. Insert default departments
INSERT INTO departments (name, description, email, is_active) VALUES
  ('Public Works', 'Roads, infrastructure, and general maintenance', 'publicworks@city.gov', true),
  ('Utilities', 'Water, electricity, and utility services', 'utilities@city.gov', true),
  ('Sanitation', 'Waste management and cleaning services', 'sanitation@city.gov', true),
  ('Transportation', 'Traffic management and public transport', 'transportation@city.gov', true),
  ('Public Safety', 'Safety and emergency services', 'safety@city.gov', true),
  ('Environmental Services', 'Environmental and health services', 'environment@city.gov', true),
  ('General Services', 'General municipal services', 'general@city.gov', true)
ON CONFLICT (name) DO NOTHING;

-- 8. Enable RLS on new tables
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_workflow_states ENABLE ROW LEVEL SECURITY;

-- 9. Create RLS policies
-- Departments - readable by all authenticated users
DROP POLICY IF EXISTS "Allow authenticated users to read departments" ON departments;
CREATE POLICY "Allow authenticated users to read departments" ON departments
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow admins to modify departments" ON departments;
CREATE POLICY "Allow admins to modify departments" ON departments
  FOR ALL TO authenticated USING (true);

-- Issue updates - readable by all, writable by authenticated users
DROP POLICY IF EXISTS "Allow authenticated users to read issue updates" ON issue_updates;
CREATE POLICY "Allow authenticated users to read issue updates" ON issue_updates
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to create issue updates" ON issue_updates;
CREATE POLICY "Allow authenticated users to create issue updates" ON issue_updates
  FOR INSERT TO authenticated WITH CHECK (true);

-- Workflow states - readable by all, writable by authenticated users
DROP POLICY IF EXISTS "Allow authenticated users to read workflow states" ON issue_workflow_states;
CREATE POLICY "Allow authenticated users to read workflow states" ON issue_workflow_states
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to create workflow states" ON issue_workflow_states;
CREATE POLICY "Allow authenticated users to create workflow states" ON issue_workflow_states
  FOR INSERT TO authenticated WITH CHECK (true);

-- 10. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_issues_department_id ON issues(department_id);
CREATE INDEX IF NOT EXISTS idx_issues_assigned_to ON issues(assigned_to);
CREATE INDEX IF NOT EXISTS idx_issue_updates_issue_id ON issue_updates(issue_id);
CREATE INDEX IF NOT EXISTS idx_issue_workflow_states_issue_id ON issue_workflow_states(issue_id);
CREATE INDEX IF NOT EXISTS idx_notifications_issue_id ON notifications(issue_id);

-- 11. Update any existing issues to have a default status if null
UPDATE issues SET status = 'submitted' WHERE status IS NULL;

-- 12. Ensure all issues have proper timestamps
UPDATE issues SET 
  created_at = COALESCE(created_at, NOW()),
  updated_at = COALESCE(updated_at, NOW())
WHERE created_at IS NULL OR updated_at IS NULL;