-- Add completed_at column to issues table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'issues' AND column_name = 'completed_at'
  ) THEN
    ALTER TABLE issues ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Add estimated_completion column to issues table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'issues' AND column_name = 'estimated_completion'
  ) THEN
    ALTER TABLE issues ADD COLUMN estimated_completion TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Add updated_at column to comments table for edit tracking
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'comments' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE comments ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_issues_completed_at ON issues(completed_at);
CREATE INDEX IF NOT EXISTS idx_issues_estimated_completion ON issues(estimated_completion);

-- Update existing resolved issues to have completion date
UPDATE issues 
SET completed_at = updated_at 
WHERE status = 'resolved' AND completed_at IS NULL;