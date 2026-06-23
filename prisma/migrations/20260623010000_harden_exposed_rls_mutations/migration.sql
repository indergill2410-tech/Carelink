-- Harden exposed Data API mutations.
-- The application performs profile, shift, and timesheet mutations through
-- server-side routes/actions. RLS should not also allow broad direct writes
-- from authenticated browser clients.

DROP POLICY IF EXISTS "authenticated_update_users" ON public."User";
CREATE POLICY "authenticated_update_users_admin_only" ON public."User"
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public."User" u
      WHERE u.id = (select auth.uid())::text
      AND u.role = 'ADMIN'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public."User" u
      WHERE u.id = (select auth.uid())::text
      AND u.role = 'ADMIN'
    )
  );

DROP POLICY IF EXISTS "authenticated_update_shifts" ON public."Shift";
CREATE POLICY "authenticated_update_shifts_admin_or_facility" ON public."Shift"
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public."User" u
      WHERE u.id = (select auth.uid())::text
      AND (u.role = 'ADMIN' OR u."facilityId" = "Shift"."facilityId")
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public."User" u
      WHERE u.id = (select auth.uid())::text
      AND (u.role = 'ADMIN' OR u."facilityId" = "Shift"."facilityId")
    )
  );

DROP POLICY IF EXISTS "authenticated_insert_timesheets" ON public."Timesheet";
CREATE POLICY "authenticated_insert_timesheets_admin_only" ON public."Timesheet"
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public."User" u
      WHERE u.id = (select auth.uid())::text
      AND u.role = 'ADMIN'
    )
  );

DROP POLICY IF EXISTS "authenticated_update_timesheets" ON public."Timesheet";
CREATE POLICY "authenticated_update_timesheets_admin_only" ON public."Timesheet"
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public."User" u
      WHERE u.id = (select auth.uid())::text
      AND u.role = 'ADMIN'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public."User" u
      WHERE u.id = (select auth.uid())::text
      AND u.role = 'ADMIN'
    )
  );
