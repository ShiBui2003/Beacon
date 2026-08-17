-- 0014_create_audio_bucket.sql
-- Create audio storage bucket for voice recordings

BEGIN;

-- Create the audio bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'audio',
    'audio',
    true,
    10485760, -- 10MB limit
    ARRAY['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/wav', 'audio/ogg']
) ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for the audio bucket
CREATE POLICY "Users can upload their own audio files" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'audio' AND
        auth.uid()::text = split_part(name, '/', 1)
    );

CREATE POLICY "Users can view their own audio files" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'audio' AND
        auth.uid()::text = split_part(name, '/', 1)
    );

CREATE POLICY "Users can delete their own audio files" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'audio' AND
        auth.uid()::text = split_part(name, '/', 1)
    );

-- Allow public access to audio files (for playback)
CREATE POLICY "Public can view audio files" ON storage.objects
    FOR SELECT USING (bucket_id = 'audio');

COMMIT;