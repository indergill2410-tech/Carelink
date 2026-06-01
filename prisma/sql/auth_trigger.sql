-- Run this entire script in the Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)

-- 1. Create a function that automatically inserts a row into the Prisma User table
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requested_role text := new.raw_user_meta_data->>'requested_role';
  app_role "Role";
BEGIN
  app_role := CASE requested_role
    WHEN 'FACILITY' THEN 'FACILITY_ADMIN'::"Role"
    WHEN 'NURSE' THEN 'NURSE'::"Role"
    WHEN 'EN' THEN 'EN'::"Role"
    WHEN 'PCA' THEN 'PCA'::"Role"
    ELSE 'NURSE'::"Role"
  END;

  INSERT INTO public."User" (id, email, name, role, "complianceStatus")
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'name', 'Unknown User'), 
    app_role,
    'RED'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(public."User".name, EXCLUDED.name),
    role = public."User".role;

  RETURN new;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;

-- 2. Create the trigger that calls the function every time someone signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
