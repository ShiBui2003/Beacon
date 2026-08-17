-- Update the handle_new_user function to assign default citizen role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  citizen_role_id UUID;
BEGIN
  -- Get the citizen role ID (assuming citizen role exists in roles table)
  SELECT id INTO citizen_role_id 
  FROM public.roles 
  WHERE name = 'Citizen' OR name = 'citizen' 
  LIMIT 1;

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
    
  RETURN NEW;
END;
$$;