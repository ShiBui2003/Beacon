-- 0009_fix_schema_issues.sql
-- Fix any remaining schema issues and ensure all tables have required columns

BEGIN;

-- Ensure issue_votes table has vote_type column
DO $$ 
BEGIN
    -- Check if vote_type column exists, if not add it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'issue_votes' 
        AND column_name = 'vote_type'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.issue_votes 
        ADD COLUMN vote_type TEXT DEFAULT 'up' CHECK (vote_type IN ('up', 'down', 'dispute'));
        
        -- Update existing votes to have 'up' type
        UPDATE public.issue_votes 
        SET vote_type = 'up' 
        WHERE vote_type IS NULL;
        
        -- Add indexes
        CREATE INDEX IF NOT EXISTS idx_issue_votes_type ON public.issue_votes(vote_type);
        CREATE INDEX IF NOT EXISTS idx_issue_votes_issue_type ON public.issue_votes(issue_id, vote_type);
    END IF;
END $$;

-- Ensure admin_notifications table exists with all required columns
DO $$ 
BEGIN
    -- Create table if it doesn't exist
    CREATE TABLE IF NOT EXISTS public.admin_notifications (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT DEFAULT 'info' CHECK (type IN ('info', 'warning', 'urgent', 'success')),
        link TEXT,
        issue_id UUID REFERENCES public.issues(id) ON DELETE CASCADE,
        admin_id UUID REFERENCES public.profiles(id),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    -- Add is_read column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'admin_notifications' 
        AND column_name = 'is_read'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.admin_notifications 
        ADD COLUMN is_read BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Enable RLS on admin_notifications if not already enabled
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for admin_notifications
DROP POLICY IF EXISTS "Admins can view all notifications" ON public.admin_notifications;
CREATE POLICY "Admins can view all notifications" ON public.admin_notifications
    FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

DROP POLICY IF EXISTS "System can insert notifications" ON public.admin_notifications;
CREATE POLICY "System can insert notifications" ON public.admin_notifications
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can update notifications" ON public.admin_notifications;
CREATE POLICY "Admins can update notifications" ON public.admin_notifications
    FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

-- Add indexes for admin_notifications
CREATE INDEX IF NOT EXISTS idx_admin_notifications_issue_id ON public.admin_notifications(issue_id);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_admin_id ON public.admin_notifications(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_at ON public.admin_notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_is_read ON public.admin_notifications(is_read);

-- Create the update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at trigger for admin_notifications
DROP TRIGGER IF EXISTS update_admin_notifications_updated_at ON public.admin_notifications;
CREATE TRIGGER update_admin_notifications_updated_at
    BEFORE UPDATE ON public.admin_notifications
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Ensure comments table has dispute columns
DO $$ 
BEGIN
    -- Check if is_dispute column exists, if not add it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'comments' 
        AND column_name = 'is_dispute'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.comments 
        ADD COLUMN is_dispute BOOLEAN DEFAULT FALSE,
        ADD COLUMN dispute_reason TEXT;
        
        -- Add index for dispute comments
        CREATE INDEX IF NOT EXISTS idx_comments_dispute ON public.comments(is_dispute) WHERE is_dispute = TRUE;
    END IF;
END $$;

-- Create or replace the dispute notification function
CREATE OR REPLACE FUNCTION create_dispute_notification()
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
  EXECUTE FUNCTION create_dispute_notification();

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';

COMMIT;