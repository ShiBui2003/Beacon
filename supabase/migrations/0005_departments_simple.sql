-- Simple departments setup
-- Create departments table
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  email VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add department_id column to issues table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'issues' AND column_name = 'department_id'
  ) THEN
    ALTER TABLE issues ADD COLUMN department_id UUID REFERENCES departments(id);
  END IF;
END $$;

-- Insert default departments
INSERT INTO departments (name, description, email, is_active) VALUES
  ('Public Works', 'Roads, infrastructure, and general maintenance', 'publicworks@city.gov', true),
  ('Utilities', 'Water, electricity, and utility services', 'utilities@city.gov', true),
  ('Sanitation', 'Waste management and cleaning services', 'sanitation@city.gov', true),
  ('Transportation', 'Traffic management and public transport', 'transportation@city.gov', true),
  ('Public Safety', 'Safety and emergency services', 'safety@city.gov', true),
  ('Environmental Services', 'Environmental and health services', 'environment@city.gov', true),
  ('General Services', 'General municipal services', 'general@city.gov', true)
ON CONFLICT (name) DO NOTHING;

-- Enable RLS
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read departments
DROP POLICY IF EXISTS "Allow authenticated users to read departments" ON departments;
CREATE POLICY "Allow authenticated users to read departments" ON departments
  FOR SELECT TO authenticated USING (true);

-- Allow all authenticated users to modify departments (adjust as needed)
DROP POLICY IF EXISTS "Allow admins to modify departments" ON departments;
CREATE POLICY "Allow admins to modify departments" ON departments
  FOR ALL TO authenticated USING (true);