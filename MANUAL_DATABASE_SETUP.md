# Manual Database Setup for Roles and Departments

## Step 1: Add Columns to Profiles Table

Go to your Supabase dashboard → SQL Editor and run this SQL:

```sql
-- Add role_id and department_id columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS role_id UUID,
ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_role_id ON profiles(role_id);
CREATE INDEX IF NOT EXISTS idx_profiles_department_id ON profiles(department_id);
```

## Step 2: Create Roles Table

Run this SQL to create the roles table:

```sql
-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  level INTEGER NOT NULL,
  permissions JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert the roles
INSERT INTO roles (name, description, level, permissions) VALUES
  ('Citizen', 'Regular citizen who can report issues', 0, '{"report_issues": true, "view_own_issues": true, "comment": true}'::jsonb),
  ('Department Head', 'Head of department with full administrative access', 1, '{"admin": true, "manage_users": true, "manage_issues": true, "view_analytics": true, "manage_departments": true}'::jsonb),
  ('Supervisor', 'Supervisor with team management and issue oversight', 2, '{"manage_issues": true, "view_analytics": true, "assign_tasks": true, "manage_team": true}'::jsonb),
  ('Field Worker', 'Field worker who handles on-ground issue resolution', 3, '{"manage_issues": true, "update_status": true, "view_assigned": true}'::jsonb),
  ('Clerk/Operator', 'Clerk or operator for administrative tasks', 4, '{"view_issues": true, "update_basic": true, "manage_documents": true}'::jsonb),
  ('Technician', 'Technical specialist for complex issue resolution', 5, '{"manage_issues": true, "technical_analysis": true, "update_status": true}'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- Add foreign key constraint for role_id
ALTER TABLE profiles 
ADD CONSTRAINT fk_profiles_role_id 
FOREIGN KEY (role_id) REFERENCES roles(id);
```

## Step 3: Update Existing Profiles

If you have existing profiles, update them to have the citizen role:

```sql
-- Update existing profiles to have citizen role
UPDATE profiles 
SET role_id = (SELECT id FROM roles WHERE name = 'Citizen')
WHERE role_id IS NULL;
```

## Step 4: Verify Setup

After running the SQL, test that everything works:

1. Check that the roles table exists and has data
2. Check that profiles table has the new columns
3. Test the signup process to ensure roles and departments are stored

## What This Achieves

- ✅ Roles stored in `profiles.role_id` (references `roles.id`)
- ✅ Departments stored in `profiles.department_id` (references `departments.id`)
- ✅ Proper foreign key relationships
- ✅ Indexes for better performance
- ✅ Your existing code will automatically use the database data instead of fallbacks

## After Setup

Once you run these SQL commands, your system will:
- Store roles and departments directly in the profiles table
- Use database data instead of user metadata
- Have proper relational integrity
- Support complex queries and reporting
