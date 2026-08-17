-- 0005_comments_and_voting.sql
-- Add enhanced comments and voting system with dispute functionality

BEGIN;

-- Add vote_type column to issue_votes table
ALTER TABLE public.issue_votes 
ADD COLUMN IF NOT EXISTS vote_type TEXT DEFAULT 'up' CHECK (vote_type IN ('up', 'down', 'dispute'));

-- Update existing votes to have 'up' type (assuming they were upvotes)
UPDATE public.issue_votes 
SET vote_type = 'up' 
WHERE vote_type IS NULL;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_issue_votes_type ON public.issue_votes(vote_type);
CREATE INDEX IF NOT EXISTS idx_issue_votes_issue_type ON public.issue_votes(issue_id, vote_type);

-- Add a dispute_reason column to comments for detailed dispute reports
ALTER TABLE public.comments 
ADD COLUMN IF NOT EXISTS dispute_reason TEXT,
ADD COLUMN IF NOT EXISTS is_dispute BOOLEAN DEFAULT FALSE;

-- Create index for dispute comments
CREATE INDEX IF NOT EXISTS idx_comments_dispute ON public.comments(is_dispute) WHERE is_dispute = TRUE;

-- Create a view for issue statistics including disputes
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

-- Function to create admin notification for disputed issues
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

-- Function to create admin notification for dispute comments
CREATE OR REPLACE FUNCTION create_dispute_comment_notification()
RETURNS TRIGGER AS $$
DECLARE
  issue_title TEXT;
  commenter_name TEXT;
BEGIN
  -- Only trigger for dispute comments
  IF NEW.is_dispute = TRUE THEN
    -- Get issue title and commenter name
    SELECT i.title, p.full_name 
    INTO issue_title, commenter_name
    FROM public.issues i, public.profiles p
    WHERE i.id = NEW.issue_id AND p.id = NEW.user_id;
    
    -- Create admin notification
    INSERT INTO public.admin_notifications (
      title,
      message,
      type,
      link,
      issue_id
    ) VALUES (
      '💬 Dispute Comment Added',
      (commenter_name || ' added a dispute comment on issue "' || issue_title || '": "' || 
       LEFT(NEW.content, 100) || CASE WHEN LENGTH(NEW.content) > 100 THEN '...' ELSE '' END || '"'),
      'urgent',
      '/admin/issues/' || NEW.issue_id,
      NEW.issue_id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for dispute comment notifications
DROP TRIGGER IF EXISTS trigger_dispute_comment_notification ON public.comments;
CREATE TRIGGER trigger_dispute_comment_notification
  AFTER INSERT ON public.comments
  FOR EACH ROW
  WHEN (NEW.is_dispute = TRUE)
  EXECUTE FUNCTION create_dispute_comment_notification();

-- Add RLS policies for the new features
-- Policy for issue votes (users can vote on any issue, but only see their own votes)
CREATE POLICY "Users can vote on issues" ON public.issue_votes
  FOR INSERT USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own votes" ON public.issue_votes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own votes" ON public.issue_votes
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy for comments (users can comment on any issue and view all comments)
CREATE POLICY "Users can create comments" ON public.comments
  FOR INSERT USING (auth.uid() = user_id);

CREATE POLICY "Users can view all comments" ON public.comments
  FOR SELECT USING (TRUE);

CREATE POLICY "Users can update their own comments" ON public.comments
  FOR UPDATE USING (auth.uid() = user_id);

-- Create a function to get user's vote on an issue
CREATE OR REPLACE FUNCTION get_user_vote(issue_uuid UUID, user_uuid UUID)
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

COMMIT;

-- Add helpful comments
COMMENT ON COLUMN public.issue_votes.vote_type IS 'Type of vote: up (support), down (disagree), dispute (challenge status update)';
COMMENT ON COLUMN public.comments.is_dispute IS 'Whether this comment is disputing an admin action';
COMMENT ON COLUMN public.comments.dispute_reason IS 'Reason for disputing (if is_dispute is true)';
COMMENT ON VIEW public.issue_vote_stats IS 'Statistics about votes and comments for each issue';
COMMENT ON FUNCTION create_dispute_notification() IS 'Creates admin notifications when citizens dispute issue status';
COMMENT ON FUNCTION get_user_vote(UUID, UUID) IS 'Gets the current vote type for a user on a specific issue';