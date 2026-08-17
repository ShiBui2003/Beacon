-- 0011_comprehensive_schema_fix.sql
-- Complete schema fix covering all missing tables, columns, and functions

BEGIN;

-- ============================================================================
-- UTILITY FUNCTIONS
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
-- CORE TABLES FIXES
-- ============================================================================

-- Fix profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Fix issues table - add all missing columns
DO $$ 
BEGIN
    -- Add completed_at column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'issues' AND column_name = 'completed_at' AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.issues ADD COLUMN completed_at TIMESTAMPTZ;
        CREATE INDEX IF NOT EXISTS idx_issues_completed_at ON public.issues(completed_at);
    END IF;
    
    -- Add estimated_completion column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'issues' AND column_name = 'estimated_completion' AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.issues ADD COLUMN estimated_completion TIMESTAMPTZ;
        CREATE INDEX IF NOT EXISTS idx_issues_estimated_completion ON public.issues(estimated_completion);
    END IF;
    
    -- Add landmark column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'issues' AND column_name = 'landmark' AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.issues ADD COLUMN landmark TEXT;
    END IF;
    
    -- Add department_id column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'issues' AND column_name = 'department_id' AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.issues ADD COLUMN department_id UUID;
        CREATE INDEX IF NOT EXISTS idx_issues_department_id ON public.issues(department_id);
    END IF;
END $$;

-- Fix issue_votes table - add vote_type column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'issue_votes' AND column_name = 'vote_type' AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.issue_votes ADD COLUMN vote_type TEXT DEFAULT 'up';
        ALTER TABLE public.issue_votes ADD CONSTRAINT issue_votes_vote_type_check 
        CHECK (vote_type IN ('up', 'down', 'dispute'));
        
        -- Update existing votes
        UPDATE public.issue_votes SET vote_type = 'up' WHERE vote_type IS NULL;
        
        -- Add indexes
        CREATE INDEX IF NOT EXISTS idx_issue_votes_type ON public.issue_votes(vote_type);
        CREATE INDEX IF NOT EXISTS idx_issue_votes_issue_type ON public.issue_votes(issue_id, vote_type);
    END IF;
END $$;

-- Fix comments table - add missing columns
DO $$ 
BEGIN
    -- Add updated_at column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'comments' AND column_name = 'updated_at' AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.comments ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
    
    -- Add dispute columns
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'comments' AND column_name = 'is_dispute' AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.comments 
        ADD COLUMN is_dispute BOOLEAN DEFAULT FALSE,
        ADD COLUMN dispute_reason TEXT;
        
        CREATE INDEX IF NOT EXISTS idx_comments_dispute ON public.comments(is_dispute) WHERE is_dispute = TRUE;
    END IF;
END $$;

-- Fix notifications table - ensure consistent column naming
DO $$ 
BEGIN
    -- First, check what column exists and handle accordingly
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'is_read' AND table_schema = 'public'
    ) THEN
        -- If is_read exists, rename it to read
        ALTER TABLE public.notifications RENAME COLUMN is_read TO read;
    ELSIF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'read' AND table_schema = 'public'
    ) THEN
        -- If neither is_read nor read exists, create read column
        ALTER TABLE public.notifications ADD COLUMN read BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Add issue_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'issue_id' AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.notifications ADD COLUMN issue_id UUID REFERENCES public.issues(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create index for issue_id in notifications (after ensuring column exists)
CREATE INDEX IF NOT EXISTS idx_notifications_issue_id ON public.notifications(issue_id);

-- ============================================================================
-- DEPARTMENTS TABLE
-- ============================================================================

-- Create departments table
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

-- Add foreign key constraint to issues.department_id if not exists
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
-- WORKFLOW STATES TABLE
-- ============================================================================

-- Create workflow_states table (note: some migrations use issue_workflow_states)
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

-- Create issue_workflow_states table if it doesn't exist (for compatibility)
CREATE TABLE IF NOT EXISTS public.issue_workflow_states (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    notes TEXT,
    estimated_completion TIMESTAMPTZ,
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for workflow tables
CREATE INDEX IF NOT EXISTS idx_workflow_states_issue_id ON public.workflow_states(issue_id);
CREATE INDEX IF NOT EXISTS idx_workflow_states_created_at ON public.workflow_states(created_at);
CREATE INDEX IF NOT EXISTS idx_issue_workflow_states_issue_id ON public.issue_workflow_states(issue_id);
CREATE INDEX IF NOT EXISTS idx_issue_workflow_states_created_at ON public.issue_workflow_states(created_at);

-- ============================================================================
-- ADMIN NOTIFICATIONS TABLE
-- ============================================================================

-- Create admin_notifications table
CREATE TABLE IF NOT EXISTS public.admin_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info' CHECK (type IN ('info', 'warning', 'urgent', 'success', 'new_issue', 'status_update', 'system')),
    link TEXT,
    issue_id UUID REFERENCES public.issues(id) ON DELETE CASCADE,
    admin_id UUID REFERENCES public.profiles(id),
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add is_read column for compatibility
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'admin_notifications' AND column_name = 'is_read' AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.admin_notifications ADD COLUMN is_read BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Create indexes for admin_notifications
CREATE INDEX IF NOT EXISTS idx_admin_notifications_issue_id ON public.admin_notifications(issue_id);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_admin_id ON public.admin_notifications(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_at ON public.admin_notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_read ON public.admin_notifications(read);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_is_read ON public.admin_notifications(is_read);

-- ============================================================================
-- ISSUE UPDATES TABLE
-- ============================================================================

-- Create issue_updates table
CREATE TABLE IF NOT EXISTS public.issue_updates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    comment TEXT,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for issue_updates
CREATE INDEX IF NOT EXISTS idx_issue_updates_issue_id ON public.issue_updates(issue_id);
CREATE INDEX IF NOT EXISTS idx_issue_updates_created_at ON public.issue_updates(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_issue_updates_status ON public.issue_updates(status);

-- ============================================================================
-- CATEGORY DEPARTMENT MAPPING
-- ============================================================================

-- Create category_department_mapping table
CREATE TABLE IF NOT EXISTS public.category_department_mapping (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
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

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
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

-- Function to auto-assign issues to departments
CREATE OR REPLACE FUNCTION public.auto_assign_issue_to_department()
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
        IF NEW.status = 'submitted' THEN
            NEW.status := 'assigned';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-assignment
DROP TRIGGER IF EXISTS trigger_auto_assign_department ON public.issues;
CREATE TRIGGER trigger_auto_assign_department
    BEFORE INSERT ON public.issues
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_assign_issue_to_department();

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

-- Function to create admin notifications for new issues
CREATE OR REPLACE FUNCTION public.create_admin_notification_for_new_issue()
RETURNS TRIGGER AS $$
DECLARE
    department_name TEXT;
    category_display TEXT;
BEGIN
    -- Get department name if assigned
    IF NEW.department_id IS NOT NULL THEN
        SELECT name INTO department_name FROM public.departments WHERE id = NEW.department_id;
    END IF;
    
    -- Format category for display
    category_display := INITCAP(REPLACE(NEW.category, '_', ' '));
    
    -- Create admin notification for new issue
    INSERT INTO public.admin_notifications (
        title,
        message,
        type,
        link,
        issue_id
    ) VALUES (
        'New Issue Reported',
        'A new ' || category_display || ' issue has been reported' || 
        CASE 
            WHEN department_name IS NOT NULL THEN ' and assigned to ' || department_name
            ELSE ''
        END || '. Location: ' || COALESCE(NEW.location_address, 'Not specified'),
        'new_issue',
        '/admin/issues/' || NEW.id,
        NEW.id
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new issue notifications
DROP TRIGGER IF EXISTS trigger_admin_notification_new_issue ON public.issues;
CREATE TRIGGER trigger_admin_notification_new_issue
    AFTER INSERT ON public.issues
    FOR EACH ROW
    EXECUTE FUNCTION public.create_admin_notification_for_new_issue();

-- ============================================================================
-- UPDATED_AT TRIGGERS
-- ============================================================================

-- Add updated_at triggers for all tables that need them
DROP TRIGGER IF EXISTS update_departments_updated_at ON public.departments;
CREATE TRIGGER update_departments_updated_at
    BEFORE UPDATE ON public.departments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_workflow_states_updated_at ON public.workflow_states;
CREATE TRIGGER update_workflow_states_updated_at
    BEFORE UPDATE ON public.workflow_states
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_admin_notifications_updated_at ON public.admin_notifications;
CREATE TRIGGER update_admin_notifications_updated_at
    BEFORE UPDATE ON public.admin_notifications
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_issue_updates_updated_at ON public.issue_updates;
CREATE TRIGGER update_issue_updates_updated_at
    BEFORE UPDATE ON public.issue_updates
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_comments_updated_at ON public.comments;
CREATE TRIGGER update_comments_updated_at
    BEFORE UPDATE ON public.comments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_workflow_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_updates ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (you may need to adjust based on your auth system)

-- Departments - viewable by everyone
DROP POLICY IF EXISTS "Departments are viewable by everyone" ON public.departments;
CREATE POLICY "Departments are viewable by everyone" ON public.departments
    FOR SELECT USING (true);

-- Workflow states - viewable by everyone
DROP POLICY IF EXISTS "Workflow states are viewable by everyone" ON public.workflow_states;
CREATE POLICY "Workflow states are viewable by everyone" ON public.workflow_states
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert workflow states" ON public.workflow_states;
CREATE POLICY "Authenticated users can insert workflow states" ON public.workflow_states
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Admin notifications - system can insert
DROP POLICY IF EXISTS "System can insert admin notifications" ON public.admin_notifications;
CREATE POLICY "System can insert admin notifications" ON public.admin_notifications
    FOR INSERT WITH CHECK (true);

-- Issue votes - users can vote
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

-- Comments - users can comment and view all comments
DROP POLICY IF EXISTS "Users can create comments" ON public.comments;
CREATE POLICY "Users can create comments" ON public.comments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view all comments" ON public.comments;
CREATE POLICY "Users can view all comments" ON public.comments
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update their comments" ON public.comments;
CREATE POLICY "Users can update their comments" ON public.comments
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their comments" ON public.comments;
CREATE POLICY "Users can delete their comments" ON public.comments
    FOR DELETE USING (auth.uid() = user_id);

-- Issue updates - viewable by everyone, authenticated users can create
DROP POLICY IF EXISTS "Anyone can view issue updates" ON public.issue_updates;
CREATE POLICY "Anyone can view issue updates" ON public.issue_updates
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create issue updates" ON public.issue_updates;
CREATE POLICY "Authenticated users can create issue updates" ON public.issue_updates
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Create issue vote stats view
CREATE OR REPLACE VIEW public.issue_vote_stats AS
SELECT 
    i.id as issue_id,
    i.title,
    i.status,
    COUNT(CASE WHEN iv.vote_type = 'up' THEN 1 END) as upvotes,
    COUNT(CASE WHEN iv.vote_type = 'down' THEN 1 END) as downvotes,
    COUNT(CASE WHEN iv.vote_type = 'dispute' THEN 1 END) as disputes,
    COUNT(iv.id) as total_votes,
    COUNT(c.id) as total_comments,
    COUNT(CASE WHEN c.is_dispute = TRUE THEN 1 END) as dispute_comments
FROM public.issues i
LEFT JOIN public.issue_votes iv ON i.id = iv.issue_id
LEFT JOIN public.comments c ON i.id = c.issue_id
GROUP BY i.id, i.title, i.status;

-- Create department stats view
CREATE OR REPLACE VIEW public.department_issue_stats AS
SELECT 
    d.id,
    d.name,
    d.email,
    COUNT(i.id) as total_issues,
    COUNT(CASE WHEN i.status = 'submitted' THEN 1 END) as submitted_count,
    COUNT(CASE WHEN i.status = 'assigned' THEN 1 END) as assigned_count,
    COUNT(CASE WHEN i.status = 'in_progress' THEN 1 END) as in_progress_count,
    COUNT(CASE WHEN i.status = 'resolved' THEN 1 END) as resolved_count,
    COUNT(CASE WHEN i.status = 'closed' THEN 1 END) as closed_count,
    ROUND(
        COUNT(CASE WHEN i.status IN ('resolved', 'closed') THEN 1 END) * 100.0 / 
        NULLIF(COUNT(i.id), 0), 2
    ) as completion_rate
FROM public.departments d
LEFT JOIN public.issues i ON d.id = i.department_id
WHERE d.is_active = TRUE
GROUP BY d.id, d.name, d.email
ORDER BY d.name;

-- ============================================================================
-- UTILITY FUNCTIONS
-- ============================================================================

-- Function to get user's vote on an issue
CREATE OR REPLACE FUNCTION public.get_user_vote(issue_uuid UUID, user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
    user_vote TEXT;
BEGIN
    SELECT vote_type INTO user_vote
    FROM public.issue_votes
    WHERE issue_id = issue_uuid AND user_id = user_uuid;
    
    RETURN COALESCE(user_vote, 'none');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- DATA FIXES
-- ============================================================================

-- Update existing resolved issues to have completed_at set
UPDATE public.issues 
SET completed_at = updated_at 
WHERE status = 'resolved' AND completed_at IS NULL;

-- Update existing issues to have departments assigned
UPDATE public.issues 
SET department_id = (
    SELECT cdm.department_id 
    FROM public.category_department_mapping cdm 
    WHERE cdm.category = public.issues.category 
    AND cdm.is_primary = TRUE 
    LIMIT 1
),
status = CASE 
    WHEN status = 'submitted' AND department_id IS NULL THEN 'assigned'
    ELSE status 
END
WHERE department_id IS NULL;

-- ============================================================================
-- PERFORMANCE INDEXES
-- ============================================================================

-- Additional performance indexes
CREATE INDEX IF NOT EXISTS idx_issues_status_created_at ON public.issues(status, created_at);
CREATE INDEX IF NOT EXISTS idx_issues_category_status ON public.issues(category, status);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_departments_name ON public.departments(name);
CREATE INDEX IF NOT EXISTS idx_departments_active ON public.departments(is_active);
CREATE INDEX IF NOT EXISTS idx_category_mapping_category ON public.category_department_mapping(category);

-- Create read column index only after ensuring the column exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'read' AND table_schema = 'public'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, read);
    END IF;
END $$;

COMMIT;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.departments IS 'Government departments that handle different types of issues';
COMMENT ON TABLE public.workflow_states IS 'Tracks the complete workflow history of each issue';
COMMENT ON TABLE public.admin_notifications IS 'Notifications for admin users about new issues and system events';
COMMENT ON TABLE public.category_department_mapping IS 'Maps issue categories to responsible departments';
COMMENT ON COLUMN public.issue_votes.vote_type IS 'Type of vote: up (support), down (disagree), dispute (challenge status update)';
COMMENT ON COLUMN public.comments.is_dispute IS 'Whether this comment is disputing an admin action';
COMMENT ON COLUMN public.issues.completed_at IS 'Timestamp when the issue was marked as resolved';
COMMENT ON COLUMN public.issues.estimated_completion IS 'Estimated completion date for the issue';
COMMENT ON FUNCTION public.set_completed_at() IS 'Automatically sets completed_at when issue status changes to resolved';
COMMENT ON FUNCTION public.auto_assign_issue_to_department() IS 'Automatically assigns new issues to appropriate departments based on category';
COMMENT ON VIEW public.issue_vote_stats IS 'Statistics about votes and comments for each issue';
COMMENT ON VIEW public.department_issue_stats IS 'Statistics about issues handled by each department';