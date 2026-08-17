-- Update the handle_new_user function to assign default citizen role
--
-- NOTE: This migration originally assumed the `public.roles` table and
-- `public.profiles.role_id` column already existed. Those are only created
-- by 0026_role_department_system.sql, which runs much later in filename
-- order. Applying migrations in filename order therefore left every new
-- auth.users signup broken (the on_auth_user_created trigger calls this
-- function) from this migration until 0026 ran. Fixed here to check for
-- the table/column at runtime and fall back to the pre-role-system insert
-- when they are not yet present, so it works correctly both before and
-- after 0026 runs.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  citizen_role_id UUID;
  has_roles_table BOOLEAN;
  has_role_id_column BOOLEAN;
BEGIN
  -- Detect whether the role system (added in a later migration) is present.
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'roles'
  ) INTO has_roles_table;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role_id'
  ) INTO has_role_id_column;

  IF has_roles_table THEN
    -- Get the citizen role ID (assuming citizen role exists in roles table)
    SELECT id INTO citizen_role_id
    FROM public.roles
    WHERE name = 'Citizen' OR name = 'citizen'
    LIMIT 1;
  END IF;

  IF has_role_id_column THEN
    -- Insert profile with citizen role as default
    INSERT INTO public.profiles (id, email, full_name, role_id, created_at, updated_at)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
      citizen_role_id,
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
      role_id = COALESCE(profiles.role_id, citizen_role_id),
      updated_at = NOW();
  ELSE
    -- Role system not present yet: fall back to the original insert shape.
    INSERT INTO public.profiles (id, email, full_name, created_at, updated_at)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
      updated_at = NOW();
  END IF;

  RETURN NEW;
END;
$$;