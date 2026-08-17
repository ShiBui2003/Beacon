-- 0029_anon_report_rpc.sql
-- Recreates the anonymous voice-reporting RPC function that the existing
-- Vapi "civic" assistant's send_report tool calls directly via PostgREST.
-- The original function (and the Supabase project it lived in) was lost
-- when the backend was erased; this is a reconstruction from the Tool's
-- known parameter contract, not a byte-exact recovery.

BEGIN;

-- Anonymous voice reports have no authenticated reporter, so user_id must
-- be nullable for this one write path. Every other insert path in this
-- app (the manual report form, POST /api/issues) continues to always
-- supply a real user_id; this only relaxes the constraint, it doesn't
-- change any other behavior.
ALTER TABLE public.issues ALTER COLUMN user_id DROP NOT NULL;

CREATE OR REPLACE FUNCTION public.api_create_issue_anon_by_dept(
  p_lat NUMERIC,
  p_lng NUMERIC,
  p_title TEXT,
  p_priority TEXT,
  p_description TEXT,
  p_department_name TEXT DEFAULT NULL,
  p_assign BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_department_id UUID;
  v_priority TEXT;
  v_status TEXT := 'submitted';
  v_issue_id UUID;
BEGIN
  IF p_title IS NULL OR btrim(p_title) = '' THEN
    RAISE EXCEPTION 'p_title is required';
  END IF;
  IF p_description IS NULL OR btrim(p_description) = '' THEN
    RAISE EXCEPTION 'p_description is required';
  END IF;

  v_priority := CASE
    WHEN lower(coalesce(p_priority, '')) IN ('low', 'medium', 'high') THEN lower(p_priority)
    ELSE 'medium'
  END;

  IF p_department_name IS NOT NULL AND btrim(p_department_name) <> '' THEN
    SELECT id INTO v_department_id
    FROM public.departments
    WHERE lower(name) = lower(btrim(p_department_name))
    LIMIT 1;
  END IF;

  IF p_assign AND v_department_id IS NOT NULL THEN
    v_status := 'assigned';
  END IF;

  INSERT INTO public.issues (
    title, description, category, priority, status,
    location_lat, location_lng, location_address,
    user_id, department_id
  )
  VALUES (
    p_title,
    p_description,
    COALESCE(p_department_name, 'General'),
    v_priority,
    v_status,
    p_lat,
    p_lng,
    CASE WHEN p_lat IS NOT NULL AND p_lng IS NOT NULL
      THEN p_lat::text || ', ' || p_lng::text
      ELSE 'Reported via voice — location unavailable'
    END,
    NULL,
    v_department_id
  )
  RETURNING id INTO v_issue_id;

  RETURN jsonb_build_object(
    'success', true,
    'issue_id', v_issue_id,
    'department_matched', v_department_id IS NOT NULL,
    'status', v_status
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.api_create_issue_anon_by_dept(
  NUMERIC, NUMERIC, TEXT, TEXT, TEXT, TEXT, BOOLEAN
) TO anon, authenticated;

COMMIT;
