-- Harden the Supabase auth trigger function and reduce RLS/index advisor warnings.

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

CREATE INDEX IF NOT EXISTS "Shift_facilityId_idx" ON public."Shift"("facilityId");
CREATE INDEX IF NOT EXISTS "Shift_workerId_idx" ON public."Shift"("workerId");
CREATE INDEX IF NOT EXISTS "Shift_status_startTime_idx" ON public."Shift"("status", "startTime");
CREATE INDEX IF NOT EXISTS "ShiftRating_raterId_idx" ON public."ShiftRating"("raterId");
CREATE INDEX IF NOT EXISTS "Timesheet_shiftId_idx" ON public."Timesheet"("shiftId");
CREATE INDEX IF NOT EXISTS "User_facilityId_idx" ON public."User"("facilityId");

DROP POLICY IF EXISTS "users_read_own_docs" ON public."ComplianceDocument";
DROP POLICY IF EXISTS "users_insert_own_docs" ON public."ComplianceDocument";
DROP POLICY IF EXISTS "users_update_own_docs" ON public."ComplianceDocument";
DROP POLICY IF EXISTS "admins_read_all_docs" ON public."ComplianceDocument";
DROP POLICY IF EXISTS "admins_update_docs" ON public."ComplianceDocument";
DROP POLICY IF EXISTS "service_role_manage_docs" ON public."ComplianceDocument";

CREATE POLICY "users_read_own_docs" ON public."ComplianceDocument"
  FOR SELECT USING ((select auth.uid())::text = "userId");

CREATE POLICY "users_insert_own_docs" ON public."ComplianceDocument"
  FOR INSERT WITH CHECK ((select auth.uid())::text = "userId");

CREATE POLICY "users_update_own_docs" ON public."ComplianceDocument"
  FOR UPDATE USING ((select auth.uid())::text = "userId");

CREATE POLICY "admins_read_all_docs" ON public."ComplianceDocument"
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public."User" u
      WHERE u.id = (select auth.uid())::text AND u.role = 'ADMIN')
  );

CREATE POLICY "admins_update_docs" ON public."ComplianceDocument"
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public."User" u
      WHERE u.id = (select auth.uid())::text AND u.role = 'ADMIN')
  );

CREATE POLICY "service_role_manage_docs" ON public."ComplianceDocument"
  FOR ALL USING ((select auth.role()) = 'service_role')
  WITH CHECK ((select auth.role()) = 'service_role');

DROP POLICY IF EXISTS "users_read_own_notifications" ON public."Notification";
DROP POLICY IF EXISTS "users_update_own_notifications" ON public."Notification";
DROP POLICY IF EXISTS "service_role_manage_notifications" ON public."Notification";
DROP POLICY IF EXISTS "admins_insert_notifications" ON public."Notification";

CREATE POLICY "users_read_own_notifications" ON public."Notification"
  FOR SELECT USING ((select auth.uid())::text = "userId");

CREATE POLICY "users_update_own_notifications" ON public."Notification"
  FOR UPDATE USING ((select auth.uid())::text = "userId");

CREATE POLICY "service_role_manage_notifications" ON public."Notification"
  FOR ALL USING ((select auth.role()) = 'service_role')
  WITH CHECK ((select auth.role()) = 'service_role');

CREATE POLICY "admins_insert_notifications" ON public."Notification"
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public."User" u
      WHERE u.id = (select auth.uid())::text AND u.role = 'ADMIN')
    OR (select auth.role()) = 'service_role'
  );

DROP POLICY IF EXISTS "users_read_ratings_for_own_shifts" ON public."ShiftRating";
DROP POLICY IF EXISTS "users_insert_own_ratings" ON public."ShiftRating";
DROP POLICY IF EXISTS "admins_read_all_ratings" ON public."ShiftRating";
DROP POLICY IF EXISTS "service_role_manage_ratings" ON public."ShiftRating";

CREATE POLICY "users_read_ratings_for_own_shifts" ON public."ShiftRating"
  FOR SELECT USING (
    (select auth.uid())::text = "raterId" OR (select auth.uid())::text = "rateeId"
  );

CREATE POLICY "users_insert_own_ratings" ON public."ShiftRating"
  FOR INSERT WITH CHECK ((select auth.uid())::text = "raterId");

CREATE POLICY "admins_read_all_ratings" ON public."ShiftRating"
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public."User" u
      WHERE u.id = (select auth.uid())::text AND u.role = 'ADMIN')
  );

CREATE POLICY "service_role_manage_ratings" ON public."ShiftRating"
  FOR ALL USING ((select auth.role()) = 'service_role')
  WITH CHECK ((select auth.role()) = 'service_role');

DROP POLICY IF EXISTS "workers_read_own_timesheets" ON public."Timesheet";
DROP POLICY IF EXISTS "workers_insert_own_timesheets" ON public."Timesheet";
DROP POLICY IF EXISTS "workers_update_own_timesheets" ON public."Timesheet";
DROP POLICY IF EXISTS "admins_manage_timesheets" ON public."Timesheet";
DROP POLICY IF EXISTS "service_role_manage_timesheets" ON public."Timesheet";

CREATE POLICY "workers_read_own_timesheets" ON public."Timesheet"
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public."Shift" s
      WHERE s.id = "shiftId" AND s."workerId" = (select auth.uid())::text)
  );

CREATE POLICY "workers_insert_own_timesheets" ON public."Timesheet"
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public."Shift" s
      WHERE s.id = "shiftId" AND s."workerId" = (select auth.uid())::text)
  );

CREATE POLICY "workers_update_own_timesheets" ON public."Timesheet"
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public."Shift" s
      WHERE s.id = "shiftId" AND s."workerId" = (select auth.uid())::text)
  );

CREATE POLICY "admins_manage_timesheets" ON public."Timesheet"
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public."User" u
      WHERE u.id = (select auth.uid())::text AND u.role = 'ADMIN')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public."User" u
      WHERE u.id = (select auth.uid())::text AND u.role = 'ADMIN')
  );

CREATE POLICY "service_role_manage_timesheets" ON public."Timesheet"
  FOR ALL USING ((select auth.role()) = 'service_role')
  WITH CHECK ((select auth.role()) = 'service_role');
