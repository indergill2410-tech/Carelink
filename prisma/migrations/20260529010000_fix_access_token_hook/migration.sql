CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event JSONB)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  claims   JSONB;
  user_row RECORD;
BEGIN
  SELECT role, "complianceStatus", "facilityId" INTO user_row
  FROM public."User" WHERE id = (event->>'user_id');

  claims := COALESCE(event->'claims', '{}'::jsonb);

  IF FOUND THEN
    claims := jsonb_set(claims, '{role}', to_jsonb(user_row.role), true);
    IF user_row."complianceStatus" IS NOT NULL THEN
      claims := jsonb_set(claims, '{compliance}', to_jsonb(user_row."complianceStatus"), true);
    END IF;

    IF user_row."facilityId" IS NOT NULL THEN
      claims := jsonb_set(claims, '{facilityId}', to_jsonb(user_row."facilityId"), true);
    END IF;
  END IF;

  RETURN jsonb_set(event, '{claims}', claims, true);
END;
$$;

GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook(JSONB) TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook(JSONB) FROM PUBLIC;
