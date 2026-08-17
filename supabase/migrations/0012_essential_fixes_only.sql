-- 0012_essential_fixes_only.sql
-- Essential fixes for immediate API errors - minimal and safe

BEGIN;

-- ============================================================================
-- ESSENTIAL FUNCTIONS
-- ============================================================================

-- Create the update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FIX 1: VOTE_TYPE COLUMN IN ISSUE_VOTES
-- ============================================================================

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'issue_votes' AND column_name = 'vote_type' AND table_schema = 'public'
    ) THEN
        -- Add the column
        ALTER TABLE public.issue_votes ADD COLUMN vote_type TEXT DEFAULT 'up';
        
        -- Add the constraint
        ALTER TABLE public.issue_votes 
        ADD CONSTRAINT issue_votes_vote_type_check 
        CHECK (vote_type IN ('up', 'down', 'dispute'));
        
        -- Update existing votes
        UPDATE public.issue_votes SET vote_type = 'up' WHERE vote_type IS NULL;
        
        -- Add indexes
        CREATE INDEX IF NOT EXISTS idx_issue_votes_type ON public.issue_votes(vote_type);
        CREATE INDEX IF NOT EXISTS idx_issue_votes_issue_type ON public.issue_votes(issue_id, vote_type);
    END IF;
END $$;

-- ============================================================================
-- FIX 2: COMPLETED_AT COLUMN IN ISSUES
-- ============================================================================

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'issues' AND column_name = 'completed_at' AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.issues ADD COLUMN completed_at TIMESTAMPTZ;
        CREATE INDEX IF NOT EXISTS idx_issues_completed_at ON public.issues(completed_at);
    END IF;
END $$;

-- ============================================================================
-- FIX 3: DEPARTMENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.departments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
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
    ('Road Maintenance', 'Handles road repairs, potholes, and street maintenance', 'roads@municipality.gov'),
    ('Electrical Services', 'Manages streetlights, traffic signals, and electrical infrastructure', 'electrical@municipality.gov'),
    ('Sanitation', 'Garbage collection, waste management, and cleanliness', 'sanitation@municipality.gov'),
    ('Water & Sewage', 'Water supply, drainage, and sewage management', 'water@municipality.gov'),
    ('Traffic Management', 'Traffic signals, road signs, and traffic flow management', 'traffic@municipality.gov'),
    ('Parks & Recreation', 'Park maintenance, recreational facilities, and green spaces', 'parks@municipality.gov')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- FIX 4: DEPARTMENT_ID IN ISSUES
-- ============================================================================

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'issues' AND column_name = 'department_id' AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.issues ADD COLUMN department_id UUID;
        CREATE INDEX IF NOT EXISTS idx_issues_department_id ON public.issues(department_id);
    END IF;
END $$;

-- Add foreign key constraint if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'issues_department_id_fkey' AND table_name = 'issues'
    ) THEN
        ALTER TABLE public.issues 
        ADD CONSTRAINT issues_department_id_fkey 
        FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE SET NULL;
    END IF;
END $$;

-- ============================================================================
-- FIX 5: WORKFLOW_STATES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.workflow_states (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    notes TEXT,
    estimated_completion TIMESTAMPTZ,
    created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workflow_states_issue_id ON public.workflow_states(issue_id);
CREATE INDEX IF NOT EXISTS idx_workflow_states_created_at ON public.workflow_states(created_at);

-- ============================================================================
-- FIX 6: ADMIN_NOTIFICATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.admin_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info' CHECK (type IN ('info', 'warning', 'urgent', 'success', 'new_issue', 'status_update', 'system')),
    link TEXT,
    issue_id UUID REFERENCES public.issues(id) ON DELETE CASCADE,
    admin_id UUID REFERENCES public.profiles(id),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_notifications_issue_id ON public.admin_notifications(issue_id);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_is_read ON public.admin_notifications(is_read);

-- ============================================================================
-- FIX 7: ESSENTIAL TRIGGERS
-- ============================================================================

-- Function to automatically set completed_at when status changes to resolved
CREATE OR REPLACE FUNCTION public.set_completed_at()
RETURNS TRIGGER AS $$
BEGIN
    -- If status is being changed to resolved, set completed_at
    IF NEW.status = 'resolved' AND (OLD.status IS NULL OR OLD.status != 'resolved') THEN
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

-- Create trigger for completed_at
DROP TRIGGER IF EXISTS trigger_set_completed_at ON public.issues;
CREATE TRIGGER trigger_set_completed_at
    BEFORE UPDATE ON public.issues
    FOR EACH ROW
    EXECUTE FUNCTION public.set_completed_at();

-- Function to create dispute notifications
CREATE OR REPLACE FUNCTION public.create_dispute_notification()
RETURNS TRIGGER AS $$
DECLARE
    issue_title TEXT;
BEGIN
    -- Get issue title
    SELECT title INTO issue_title FROM public.issues WHERE id = NEW.issue_id;
    
    -- Create admin notification for dispute votes
    IF NEW.vote_type = 'dispute' THEN
        INSERT INTO public.admin_notifications (
            title,
            message,
            type,
            link,
            issue_id
        ) VALUES (
            '⚠️ Issue Status Disputed',
            'A citizen has disputed the status update for issue "' || issue_title || '". Please review the issue and any comments.',
            'urgent',
            '/admin/issues/' || NEW.issue_id,
            NEW.issue_id
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for dispute notifications
DROP TRIGGER IF EXISTS trigger_dispute_notification ON public.issue_votes;
CREATE TRIGGER trigger_dispute_notification
    AFTER INSERT ON public.issue_votes
    FOR EACH ROW
    WHEN (NEW.vote_type = 'dispute')
    EXECUTE FUNCTION public.create_dispute_notification();

-- ============================================================================
-- FIX 8: BASIC RLS POLICIES
-- ============================================================================

-- Enable RLS on essential tables
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- Basic policies
DROP POLICY IF EXISTS "Departments are viewable by everyone" ON public.departments;
CREATE POLICY "Departments are viewable by everyone" ON public.departments
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Workflow states are viewable by everyone" ON public.workflow_states;
CREATE POLICY "Workflow states are viewable by everyone" ON public.workflow_states
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert workflow states" ON public.workflow_states;
CREATE POLICY "Authenticated users can insert workflow states" ON public.workflow_states
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "System can insert admin notifications" ON public.admin_notifications;
CREATE POLICY "System can insert admin notifications" ON public.admin_notifications
    FOR INSERT WITH CHECK (true);

-- Vote policies
DROP POLICY IF EXISTS "Users can vote on issues" ON public.issue_votes;
CREATE POLICY "Users can vote on issues" ON public.issue_votes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view votes" ON public.issue_votes;
CREATE POLICY "Users can view votes" ON public.issue_votes
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update their votes" ON public.issue_votes;
CREATE POLICY "Users can update their votes" ON public.issue_votes
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their votes" ON public.issue_votes;
CREATE POLICY "Users can delete their votes" ON public.issue_votes
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- FIX 9: DATA UPDATES
-- ============================================================================

-- Update existing resolved issues to have completed_at set
UPDATE public.issues 
SET completed_at = updated_at 
WHERE status = 'resolved' AND completed_at IS NULL;

COMMIT;