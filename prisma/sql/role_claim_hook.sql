-- Run in Supabase SQL Editor, then register under Authentication > Hooks > Custom Access Token
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  claims jsonb;
  user_role text;
  has_user boolean;
BEGIN
  SELECT role INTO user_role FROM public."User" WHERE id = (event->>'user_id');
  has_user := FOUND;
  claims := COALESCE(event->'claims', '{}'::jsonb);
  IF has_user THEN
    claims := jsonb_set(claims, '{role}', to_jsonb(user_role), true);
  END IF;
  RETURN jsonb_set(event, '{claims}', claims, true);
END;
$$;

GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM PUBLIC;
