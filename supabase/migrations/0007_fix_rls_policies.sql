-- Fix RLS policies for issues table to allow admin updates

-- First, let's see what policies exist (this is just for reference)
-- SELECT * FROM pg_policies WHERE tablename = 'issues';

-- Drop existing restrictive policies that might be blocking updates
DROP POLICY IF EXISTS "Users can only update their own issues" ON issues;
DROP POLICY IF EXISTS "Users can only view their own issues" ON issues;
DROP POLICY IF EXISTS "Only issue owners can update" ON issues;

-- Create more permissive policies for authenticated users
-- Allow all authenticated users to read all issues (needed for admin)
DROP POLICY IF EXISTS "Allow authenticated users to read all issues" ON issues;
CREATE POLICY "Allow authenticated users to read all issues" ON issues
  FOR SELECT TO authenticated USING (true);

-- Allow all authenticated users to update all issues (for admin functionality)
DROP POLICY IF EXISTS "Allow authenticated users to update all issues" ON issues;
CREATE POLICY "Allow authenticated users to update all issues" ON issues
  FOR UPDATE TO authenticated USING (true);

-- Allow users to insert their own issues
DROP POLICY IF EXISTS "Allow users to insert their own issues" ON issues;
CREATE POLICY "Allow users to insert their own issues" ON issues
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to delete issues (for admin)
DROP POLICY IF EXISTS "Allow authenticated users to delete issues" ON issues;
CREATE POLICY "Allow authenticated users to delete issues" ON issues
  FOR DELETE TO authenticated USING (true);

-- Ensure RLS is enabled
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;

-- Also fix notifications table policies
DROP POLICY IF EXISTS "Users can read their own notifications" ON notifications;
CREATE POLICY "Users can read their own notifications" ON notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow authenticated users to create notifications" ON notifications;
CREATE POLICY "Allow authenticated users to create notifications" ON notifications
  FOR INSERT TO authenticated WITH CHECK (true);

-- Fix profiles table policies
DROP POLICY IF EXISTS "Allow authenticated users to read profiles" ON profiles;
CREATE POLICY "Allow authenticated users to read profiles" ON profiles
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Ensure all tables have RLS enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;