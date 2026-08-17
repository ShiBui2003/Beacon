-- 0004_seed_data.sql (optional)
-- Seed a test user and some issues for development

BEGIN;

-- Safe helper to create/get a test user
CREATE OR REPLACE FUNCTION public.get_or_create_test_user()
RETURNS UUID AS $$
DECLARE
  test_user_id UUID;
BEGIN
  SELECT id INTO test_user_id FROM auth.users WHERE email = 'test@example.com' LIMIT 1;

  IF test_user_id IS NULL THEN
    test_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at, recovery_sent_at, last_sign_in_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      test_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'test@example.com',
      '$2a$10$2XQ8hPlGh2j2tFDduEhJk.6JxG6pX5v5z5X5v5X5v5X5v5X5v5X5u',
      NOW(), NOW(), NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"email":"test@example.com","full_name":"Test User","role":"citizen"}',
      NOW(), NOW(),
      '', '', '', ''
    );
  END IF;

  -- Ensure profile exists
  INSERT INTO public.profiles (id, email, full_name, created_at, updated_at)
  VALUES (test_user_id, 'test@example.com', 'Test User', NOW(), NOW())
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, full_name = EXCLUDED.full_name, updated_at = NOW();

  RETURN test_user_id;
END;
$$ LANGUAGE plpgsql;

-- Seed sample issues
DO $$
DECLARE
  uid UUID;
BEGIN
  SELECT public.get_or_create_test_user() INTO uid;

  IF NOT EXISTS (SELECT 1 FROM public.issues WHERE title = 'Pothole on Main Street') THEN
    INSERT INTO public.issues (title, description, category, status, location_address, location_lat, location_lng, user_id, upvotes)
    VALUES ('Pothole on Main Street', 'Large pothole causing damage near Main & Oak.', 'Roads', 'submitted', '123 Main Street', 40.7128, -74.0060, uid, 15);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.issues WHERE title = 'Broken Streetlight') THEN
    INSERT INTO public.issues (title, description, category, status, location_address, location_lat, location_lng, user_id, upvotes)
    VALUES ('Broken Streetlight', 'Streetlight has been out for 2 weeks.', 'Lighting', 'in_progress', '456 Oak Avenue', 40.7589, -73.9851, uid, 8);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.issues WHERE title = 'Overflowing Garbage Bin') THEN
    INSERT INTO public.issues (title, description, category, status, location_address, location_lat, location_lng, user_id, upvotes)
    VALUES ('Overflowing Garbage Bin', 'Public garbage bin overflowing for days.', 'Sanitation', 'resolved', '789 Pine Street', 40.7831, -73.9712, uid, 3);
  END IF;
END $$;

-- Reload schema
NOTIFY pgrst, 'reload schema';

COMMIT;
