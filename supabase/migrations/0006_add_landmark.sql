-- 0006_add_landmark.sql
-- Add optional landmark column to issues

BEGIN;

ALTER TABLE public.issues
  ADD COLUMN IF NOT EXISTS landmark TEXT;

COMMIT;
