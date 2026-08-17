-- Create issue_updates table for tracking timeline of issue status changes
CREATE TABLE IF NOT EXISTS issue_updates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    comment TEXT,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_issue_updates_issue_id ON issue_updates(issue_id);
CREATE INDEX IF NOT EXISTS idx_issue_updates_created_at ON issue_updates(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_issue_updates_status ON issue_updates(status);

-- Enable RLS
ALTER TABLE issue_updates ENABLE ROW LEVEL SECURITY;

-- RLS policies for issue_updates
CREATE POLICY "Anyone can view issue updates" ON issue_updates
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create issue updates" ON issue_updates
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own issue updates" ON issue_updates
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own issue updates" ON issue_updates
    FOR DELETE USING (auth.uid() = user_id);

-- Create a trigger to automatically create an issue update when issue status changes
CREATE OR REPLACE FUNCTION create_issue_update_on_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create update if status actually changed
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO issue_updates (issue_id, status, comment, user_id)
        VALUES (
            NEW.id,
            NEW.status,
            CASE 
                WHEN NEW.status = 'assigned' THEN 'Issue has been assigned for resolution'
                WHEN NEW.status = 'in_progress' THEN 'Work has started on this issue'
                WHEN NEW.status = 'resolved' THEN 'Issue has been resolved'
                WHEN NEW.status = 'closed' THEN 'Issue has been closed'
                ELSE 'Issue status updated'
            END,
            COALESCE(NEW.assigned_to, auth.uid())
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_create_issue_update_on_status_change ON issues;
CREATE TRIGGER trigger_create_issue_update_on_status_change
    AFTER UPDATE ON issues
    FOR EACH ROW
    EXECUTE FUNCTION create_issue_update_on_status_change();

-- Insert initial updates for existing issues (optional - for historical data)
INSERT INTO issue_updates (issue_id, status, comment, user_id, created_at)
SELECT 
    id,
    status,
    'Initial status',
    user_id,
    created_at
FROM issues
WHERE NOT EXISTS (
    SELECT 1 FROM issue_updates WHERE issue_updates.issue_id = issues.id
);

-- Add updated_at trigger for issue_updates table
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_issue_updates_updated_at ON issue_updates;
CREATE TRIGGER update_issue_updates_updated_at
    BEFORE UPDATE ON issue_updates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();