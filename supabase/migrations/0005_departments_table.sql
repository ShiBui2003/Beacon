-- Create departments table
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  email VARCHAR(255),
  phone VARCHAR(50),
  head_id UUID REFERENCES profiles(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create category to department mapping table
CREATE TABLE IF NOT EXISTS category_department_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(100) NOT NULL,
  department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add department_id column to issues table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'issues' AND column_name = 'department_id') THEN
    ALTER TABLE issues ADD COLUMN department_id UUID REFERENCES departments(id);
  END IF;
END $$;

-- Insert default departments (let UUID be auto-generated)
INSERT INTO departments (name, description, email, is_active) VALUES
  ('Public Works', 'Roads, infrastructure, and general maintenance', 'publicworks@city.gov', true),
  ('Utilities', 'Water, electricity, and utility services', 'utilities@city.gov', true),
  ('Sanitation', 'Waste management and cleaning services', 'sanitation@city.gov', true),
  ('Transportation', 'Traffic management and public transport', 'transportation@city.gov', true),
  ('Public Safety', 'Safety and emergency services', 'safety@city.gov', true),
  ('Environmental Services', 'Environmental and health services', 'environment@city.gov', true),
  ('General Services', 'General municipal services', 'general@city.gov', true)
ON CONFLICT (name) DO NOTHING;

-- Insert category mappings (using department names to find IDs)
INSERT INTO category_department_mapping (category, department_id, is_primary) 
SELECT 'Roads', d.id, true FROM departments d WHERE d.name = 'Public Works'
UNION ALL
SELECT 'Roads', d.id, false FROM departments d WHERE d.name = 'Transportation'
UNION ALL
SELECT 'Lighting', d.id, true FROM departments d WHERE d.name = 'Public Works'
UNION ALL
SELECT 'Lighting', d.id, false FROM departments d WHERE d.name = 'Utilities'
UNION ALL
SELECT 'Sanitation', d.id, true FROM departments d WHERE d.name = 'Sanitation'
UNION ALL
SELECT 'Water', d.id, true FROM departments d WHERE d.name = 'Utilities'
UNION ALL
SELECT 'Water', d.id, false FROM departments d WHERE d.name = 'Public Works'
UNION ALL
SELECT 'Traffic', d.id, true FROM departments d WHERE d.name = 'Transportation'
UNION ALL
SELECT 'Traffic', d.id, false FROM departments d WHERE d.name = 'Public Safety'
UNION ALL
SELECT 'Other', d.id, true FROM departments d WHERE d.name = 'General Services'
ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_departments_active ON departments(is_active);
CREATE INDEX IF NOT EXISTS idx_departments_name ON departments(name);
CREATE INDEX IF NOT EXISTS idx_category_mapping_category ON category_department_mapping(category);
CREATE INDEX IF NOT EXISTS idx_issues_department ON issues(department_id);

-- Add RLS policies for departments
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_department_mapping ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read departments
-- (DROP IF EXISTS first: a sibling same-numbered migration,
-- 0005_departments_simple.sql, may have already created a policy with this
-- exact name on this same table when migrations are applied in filename order.)
DROP POLICY IF EXISTS "Allow authenticated users to read departments" ON departments;
CREATE POLICY "Allow authenticated users to read departments" ON departments
  FOR SELECT TO authenticated USING (true);

-- Allow all authenticated users to read category mappings
DROP POLICY IF EXISTS "Allow authenticated users to read category mappings" ON category_department_mapping;
CREATE POLICY "Allow authenticated users to read category mappings" ON category_department_mapping
  FOR SELECT TO authenticated USING (true);

-- Only allow admins to modify departments (you may need to adjust this based on your admin role system)
DROP POLICY IF EXISTS "Allow admins to modify departments" ON departments;
CREATE POLICY "Allow admins to modify departments" ON departments
  FOR ALL TO authenticated USING (true); -- Adjust this based on your admin role system

DROP POLICY IF EXISTS "Allow admins to modify category mappings" ON category_department_mapping;
CREATE POLICY "Allow admins to modify category mappings" ON category_department_mapping
  FOR ALL TO authenticated USING (true); -- Adjust this based on your admin role system