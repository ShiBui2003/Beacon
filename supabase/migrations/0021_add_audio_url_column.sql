-- 0021_add_audio_url_column.sql
-- Add audio_url column to issues table for voice recordings

BEGIN;

-- Add audio_url column to issues table if it doesn't exist
ALTER TABLE issues ADD COLUMN IF NOT EXISTS audio_url TEXT;

-- Comment for the column
COMMENT ON COLUMN issues.audio_url IS 'URL to the audio recording stored in Supabase storage';

-- Update the issues table to ensure audio_url is included in all relevant operations
-- Refresh RLS policies to ensure they work with the new column

-- Citizens can view all issues (including audio_url)
DROP POLICY IF EXISTS "Citizens can view all issues" ON issues;
CREATE POLICY "Citizens can view all issues" ON issues
    FOR SELECT
    USING (true);

-- Citizens can create issues with audio_url
DROP POLICY IF EXISTS "Citizens can create issues" ON issues;
CREATE POLICY "Citizens can create issues" ON issues
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Citizens can update their own issues (including audio_url)
DROP POLICY IF EXISTS "Citizens can update their own issues" ON issues;
CREATE POLICY "Citizens can update their own issues" ON issues
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Update the database types cache to include the new column
NOTIFY pgrst, 'reload schema';

COMMIT;