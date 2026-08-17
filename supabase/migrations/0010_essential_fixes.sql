-- 0010_essential_fixes.sql
-- Essential fixes for immediate issues

BEGIN;

-- Fix 1: Ensure vote_type column exists in issue_votes table
DO $$ 
BEGIN
    -- Check if vote_type column exists, if not add it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'issue_votes' 
        AND column_name = 'vote_type'
        AND table_schema = 'public'
    ) THEN
        -- Add the column
        ALTER TABLE public.issue_votes 
        ADD COLUMN vote_type TEXT DEFAULT 'up';
        
        -- Add the constraint
        ALTER TABLE public.issue_votes 
        ADD CONSTRAINT issue_votes_vote_type_check 
        CHECK (vote_type IN ('up', 'down', 'dispute'));
        
        -- Update existing votes to have 'up' type
        UPDATE public.issue_votes 
        SET vote_type = 'up' 
        WHERE vote_type IS NULL;
        
        -- Add indexes
        CREATE INDEX IF NOT EXISTS idx_issue_votes_type ON public.issue_votes(vote_type);
        CREATE INDEX IF NOT EXISTS idx_issue_votes_issue_type ON public.issue_votes(issue_id, vote_type);
    END IF;
END $$;

-- Fix 2: Ensure completed_at column exists in issues table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'issues' 
        AND column_name = 'completed_at'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.issues 
        ADD COLUMN completed_at TIMESTAMPTZ;
        
        CREATE INDEX IF NOT EXISTS idx_issues_completed_at ON public.issues(completed_at);
    END IF;
END $$;

-- Fix 3: Create basic admin_notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.admin_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    link TEXT,
    issue_id UUID REFERENCES public.issues(id) ON DELETE CASCADE,
    admin_id UUID REFERENCES public.profiles(id),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on admin_notifications
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- Basic RLS policy for admin_notifications
DROP POLICY IF EXISTS "System can insert notifications" ON public.admin_notifications;
CREATE POLICY "System can insert notifications" ON public.admin_notifications
    FOR INSERT WITH CHECK (true);

-- Fix 4: Create basic departments table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    email TEXT,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add some basic departments
INSERT INTO public.departments (name, email, description) VALUES 
    ('Road Maintenance', 'roads@municipality.gov', 'Handles road repairs, potholes, and street maintenance'),
    ('Electrical Services', 'electrical@municipality.gov', 'Manages streetlights, traffic signals, and electrical infrastructure'),
    ('Sanitation', 'sanitation@municipality.gov', 'Garbage collection, waste management, and cleanliness'),
    ('Water & Sewage', 'water@municipality.gov', 'Water supply, drainage, and sewage management')
ON CONFLICT (name) DO NOTHING;

-- Fix 5: Add department_id to issues if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'issues' 
        AND column_name = 'department_id'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.issues 
        ADD COLUMN department_id UUID REFERENCES public.departments(id);
        
        CREATE INDEX IF NOT EXISTS idx_issues_department_id ON public.issues(department_id);
    END IF;
END $$;

-- Fix 6: Create workflow_states table if it doesn't exist
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

-- Enable RLS on new tables
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_states ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies
CREATE POLICY "Departments are viewable by everyone" ON public.departments
    FOR SELECT USING (true);

CREATE POLICY "Workflow states are viewable by everyone" ON public.workflow_states
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert workflow states" ON public.workflow_states
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_workflow_states_issue_id ON public.workflow_states(issue_id);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_issue_id ON public.admin_notifications(issue_id);

COMMIT;