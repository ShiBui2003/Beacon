-- Migration: Role and Department System Update
-- Description: Updates the system to support hierarchical roles and department assignments

BEGIN;

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  level INTEGER NOT NULL, -- 1=Department Head, 2=Supervisor, 3=Field Worker, 4=Clerk/Operator, 5=Technician
  permissions JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert the new roles
INSERT INTO roles (name, description, level, permissions) VALUES
  ('Department Head', 'Head of department with full administrative access', 1, '{"admin": true, "manage_users": true, "manage_issues": true, "view_analytics": true, "manage_departments": true}'::jsonb),
  ('Supervisor', 'Supervisor with team management and issue oversight', 2, '{"manage_issues": true, "view_analytics": true, "assign_tasks": true, "manage_team": true}'::jsonb),
  ('Field Worker', 'Field worker who handles on-ground issue resolution', 3, '{"manage_issues": true, "update_status": true, "view_assigned": true}'::jsonb),
  ('Clerk/Operator', 'Clerk or operator for administrative tasks', 4, '{"view_issues": true, "update_basic": true, "manage_documents": true}'::jsonb),
  ('Technician', 'Technical specialist for complex issue resolution', 5, '{"manage_issues": true, "technical_analysis": true, "update_status": true}'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- Add role_id and department_id to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS role_id UUID REFERENCES roles(id),
ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_role_id ON profiles(role_id);
CREATE INDEX IF NOT EXISTS idx_profiles_department_id ON profiles(department_id);

-- Update existing profiles to have default role (citizen)
-- First, let's create a citizen role if it doesn't exist
INSERT INTO roles (name, description, level, permissions) VALUES
  ('Citizen', 'Regular citizen who can report issues', 0, '{"report_issues": true, "view_own_issues": true, "comment": true}'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- Update existing profiles to have citizen role
UPDATE profiles 
SET role_id = (SELECT id FROM roles WHERE name = 'Citizen')
WHERE role_id IS NULL;

-- Create user_roles table for role history/audit (optional)
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  assigned_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  notes TEXT
);

-- Create index for user_roles
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_department_id ON user_roles(department_id);

-- Update departments table to reference the new role system
-- Add role_id to departments table to specify which role can be department head
ALTER TABLE departments 
ADD COLUMN IF NOT EXISTS required_role_id UUID REFERENCES roles(id);

-- Update departments to require Department Head role
UPDATE departments 
SET required_role_id = (SELECT id FROM roles WHERE name = 'Department Head')
WHERE required_role_id IS NULL;

-- Create function to get user permissions
CREATE OR REPLACE FUNCTION get_user_permissions(user_uuid UUID)
RETURNS JSONB AS $$
DECLARE
  user_role_id UUID;
  user_permissions JSONB;
BEGIN
  -- Get user's role
  SELECT role_id INTO user_role_id
  FROM profiles
  WHERE id = user_uuid;
  
  -- Get role permissions
  SELECT permissions INTO user_permissions
  FROM roles
  WHERE id = user_role_id;
  
  RETURN COALESCE(user_permissions, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql;

-- Create function to check if user has permission
CREATE OR REPLACE FUNCTION has_permission(user_uuid UUID, permission_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_permissions JSONB;
BEGIN
  user_permissions := get_user_permissions(user_uuid);
  RETURN COALESCE((user_permissions->>permission_name)::boolean, false);
END;
$$ LANGUAGE plpgsql;

-- Create function to get user role info
CREATE OR REPLACE FUNCTION get_user_role_info(user_uuid UUID)
RETURNS TABLE (
  role_name TEXT,
  role_level INTEGER,
  department_name TEXT,
  permissions JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.name,
    r.level,
    d.name,
    r.permissions
  FROM profiles p
  LEFT JOIN roles r ON p.role_id = r.id
  LEFT JOIN departments d ON p.department_id = d.id
  WHERE p.id = user_uuid;
END;
$$ LANGUAGE plpgsql;

-- Update RLS policies for roles
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies for roles
DROP POLICY IF EXISTS "Allow authenticated users to read roles" ON roles;
DROP POLICY IF EXISTS "Allow department heads to manage roles" ON roles;

-- Allow all authenticated users to read roles
CREATE POLICY "Allow authenticated users to read roles" ON roles
  FOR SELECT TO authenticated USING (true);

-- For now, only allow read access to roles to avoid circular dependency
-- Role management will be handled at application level

-- Drop and recreate policies for user_roles
DROP POLICY IF EXISTS "Allow authenticated users to read user_roles" ON user_roles;
DROP POLICY IF EXISTS "Allow department heads to manage user_roles" ON user_roles;

-- Allow all authenticated users to read user_roles
CREATE POLICY "Allow authenticated users to read user_roles" ON user_roles
  FOR SELECT TO authenticated USING (true);

-- For now, only allow read access to user_roles to avoid circular dependency
-- User role management will be handled at application level

-- Update profiles RLS to include role-based access
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Department heads can view department profiles" ON profiles;

-- Create simple role-based policies (without circular dependency)
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

-- For now, remove the department heads policy to avoid circular dependency
-- Department-level access will be handled at the application level

-- Create view for user role information
CREATE OR REPLACE VIEW user_role_view AS
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.phone,
  p.location,
  r.name as role_name,
  r.level as role_level,
  r.description as role_description,
  d.name as department_name,
  d.description as department_description,
  r.permissions,
  p.created_at,
  p.updated_at
FROM profiles p
LEFT JOIN roles r ON p.role_id = r.id
LEFT JOIN departments d ON p.department_id = d.id;

-- Grant access to the view
GRANT SELECT ON user_role_view TO authenticated;

-- Add helpful comments
COMMENT ON TABLE roles IS 'Defines user roles with hierarchical levels and permissions';
COMMENT ON TABLE user_roles IS 'Tracks user role assignments and history';
COMMENT ON FUNCTION get_user_permissions IS 'Returns user permissions based on their role';
COMMENT ON FUNCTION has_permission IS 'Checks if user has a specific permission';
COMMENT ON FUNCTION get_user_role_info IS 'Returns comprehensive user role information';
COMMENT ON VIEW user_role_view IS 'Comprehensive view of users with their roles and departments';

COMMIT;
