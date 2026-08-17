-- 0014_add_ai_urgency.sql
-- Add AI urgency detection fields to issues table

BEGIN;

-- Add AI urgency fields to issues table
ALTER TABLE public.issues 
ADD COLUMN IF NOT EXISTS ai_urgency TEXT DEFAULT 'medium' CHECK (ai_urgency IN ('low', 'medium', 'high')),
ADD COLUMN IF NOT EXISTS ai_confidence DECIMAL(3,2) DEFAULT 0.0;

-- Create index for AI urgency for efficient sorting
CREATE INDEX IF NOT EXISTS idx_issues_ai_urgency ON public.issues(ai_urgency);

-- Create index for combined ranking (ai_urgency + upvotes)
CREATE INDEX IF NOT EXISTS idx_issues_combined_ranking ON public.issues(ai_urgency, upvotes);

-- Add comment for documentation
COMMENT ON COLUMN public.issues.ai_urgency IS 'AI-detected urgency level: low, medium, or high';
COMMENT ON COLUMN public.issues.ai_confidence IS 'Confidence score (0.0-1.0) from AI model';

COMMIT;
