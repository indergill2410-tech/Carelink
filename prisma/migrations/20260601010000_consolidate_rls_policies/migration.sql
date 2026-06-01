-- Consolidate RLS policies to avoid repeated auth calls and overlapping permissive policies.

ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Facility" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Shift" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ComplianceDocument" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Notification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ShiftRating" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Timesheet" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_read_own" ON public."User";
DROP POLICY IF EXISTS "admins_read_all_users" ON public."User";
DROP POLICY IF EXISTS "users_update_own" ON public."User";
DROP POLICY IF EXISTS "admins_update_any_user" ON public."User";
DROP POLICY IF EXISTS "service_role_manage_users" ON public."User";

CREATE POLICY "authenticated_select_users" ON public."User"
  FOR SELECT TO authenticated
  USING (
    (select auth.uid())::text = id
    OR EXISTS (SELECT 1 FROM public."User" u WHERE u.id = (select auth.uid())::text AND u.role = 'ADMIN')
  );

CREATE POLICY "authenticated_update_users" ON public."User"
  FOR UPDATE TO authenticated
  USING (
    (select auth.uid())::text = id
    OR EXISTS (SELECT 1 FROM public."User" u WHERE u.id = (select auth.uid())::text AND u.role = 'ADMIN')
  )
  WITH CHECK (
    (select auth.uid())::text = id
    OR EXISTS (SELECT 1 FROM public."User" u WHERE u.id = (select auth.uid())::text AND u.role = 'ADMIN')
  );

CREATE POLICY "service_role_manage_users" ON public."User"
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "facility_admin_read_own" ON public."Facility";
DROP POLICY IF EXISTS "global_admin_read_all_facilities" ON public."Facility";
DROP POLICY IF EXISTS "admins_read_all_facilities" ON public."Facility";
DROP POLICY IF EXISTS "admins_insert_facility" ON public."Facility";
DROP POLICY IF EXISTS "facility_admin_update_own" ON public."Facility";
DROP POLICY IF EXISTS "service_role_manage_facilities" ON public."Facility";

CREATE POLICY "authenticated_select_facilities" ON public."Facility"
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public."User" u
      WHERE u.id = (select auth.uid())::text
      AND (u.role = 'ADMIN' OR u."facilityId" = "Facility".id)
    )
  );

CREATE POLICY "authenticated_insert_facilities" ON public."Facility"
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public."User" u WHERE u.id = (select auth.uid())::text AND u.role = 'ADMIN')
  );

CREATE POLICY "authenticated_update_facilities" ON public."Facility"
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public."User" u
      WHERE u.id = (select auth.uid())::text
      AND (u.role = 'ADMIN' OR u."facilityId" = "Facility".id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public."User" u
      WHERE u.id = (select auth.uid())::text
      AND (u.role = 'ADMIN' OR u."facilityId" = "Facility".id)
    )
  );

CREATE POLICY "service_role_manage_facilities" ON public."Facility"
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "workers_read_open_or_own" ON public."Shift";
DROP POLICY IF EXISTS "workers_read_open_or_own_shifts" ON public."Shift";
DROP POLICY IF EXISTS "facility_read_own_shifts" ON public."Shift";
DROP POLICY IF EXISTS "facility_admin_read_own_shifts" ON public."Shift";
DROP POLICY IF EXISTS "global_admin_read_all_shifts" ON public."Shift";
DROP POLICY IF EXISTS "admins_read_all_shifts" ON public."Shift";
DROP POLICY IF EXISTS "facility_insert_shifts" ON public."Shift";
DROP POLICY IF EXISTS "facility_admin_insert_shifts" ON public."Shift";
DROP POLICY IF EXISTS "workers_accept_shift" ON public."Shift";
DROP POLICY IF EXISTS "workers_complete_own_shift" ON public."Shift";
DROP POLICY IF EXISTS "admins_update_any_shift" ON public."Shift";
DROP POLICY IF EXISTS "admins_manage_shifts" ON public."Shift";
DROP POLICY IF EXISTS "service_role_manage_shifts" ON public."Shift";

CREATE POLICY "authenticated_select_shifts" ON public."Shift"
  FOR SELECT TO authenticated
  USING (
    status = 'PENDING'
    OR "workerId" = (select auth.uid())::text
    OR EXISTS (
      SELECT 1 FROM public."User" u
      WHERE u.id = (select auth.uid())::text
      AND (u.role = 'ADMIN' OR u."facilityId" = "Shift"."facilityId")
    )
  );

CREATE POLICY "authenticated_insert_shifts" ON public."Shift"
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public."User" u
      WHERE u.id = (select auth.uid())::text
      AND (u.role = 'ADMIN' OR u."facilityId" = "facilityId")
    )
  );

CREATE POLICY "authenticated_update_shifts" ON public."Shift"
  FOR UPDATE TO authenticated
  USING (
    "workerId" = (select auth.uid())::text
    OR ("workerId" IS NULL AND status = 'PENDING')
    OR EXISTS (
      SELECT 1 FROM public."User" u
      WHERE u.id = (select auth.uid())::text
      AND (u.role = 'ADMIN' OR u."facilityId" = "Shift"."facilityId")
    )
  )
  WITH CHECK (
    "workerId" = (select auth.uid())::text
    OR EXISTS (
      SELECT 1 FROM public."User" u
      WHERE u.id = (select auth.uid())::text
      AND (u.role = 'ADMIN' OR u."facilityId" = "Shift"."facilityId")
    )
  );

CREATE POLICY "service_role_manage_shifts" ON public."Shift"
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "users_read_own_docs" ON public."ComplianceDocument";
DROP POLICY IF EXISTS "users_insert_own_docs" ON public."ComplianceDocument";
DROP POLICY IF EXISTS "users_update_own_docs" ON public."ComplianceDocument";
DROP POLICY IF EXISTS "admins_read_all_docs" ON public."ComplianceDocument";
DROP POLICY IF EXISTS "admins_update_docs" ON public."ComplianceDocument";
DROP POLICY IF EXISTS "service_role_manage_docs" ON public."ComplianceDocument";

CREATE POLICY "authenticated_select_docs" ON public."ComplianceDocument"
  FOR SELECT TO authenticated
  USING (
    (select auth.uid())::text = "userId"
    OR EXISTS (SELECT 1 FROM public."User" u WHERE u.id = (select auth.uid())::text AND u.role = 'ADMIN')
  );

CREATE POLICY "authenticated_insert_docs" ON public."ComplianceDocument"
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid())::text = "userId");

CREATE POLICY "authenticated_update_docs" ON public."ComplianceDocument"
  FOR UPDATE TO authenticated
  USING (
    (select auth.uid())::text = "userId"
    OR EXISTS (SELECT 1 FROM public."User" u WHERE u.id = (select auth.uid())::text AND u.role = 'ADMIN')
  )
  WITH CHECK (
    (select auth.uid())::text = "userId"
    OR EXISTS (SELECT 1 FROM public."User" u WHERE u.id = (select auth.uid())::text AND u.role = 'ADMIN')
  );

CREATE POLICY "service_role_manage_docs" ON public."ComplianceDocument"
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "users_read_own_notifications" ON public."Notification";
DROP POLICY IF EXISTS "users_update_own_notifications" ON public."Notification";
DROP POLICY IF EXISTS "admins_insert_notifications" ON public."Notification";
DROP POLICY IF EXISTS "service_role_manage_notifications" ON public."Notification";

CREATE POLICY "authenticated_select_notifications" ON public."Notification"
  FOR SELECT TO authenticated
  USING ((select auth.uid())::text = "userId");

CREATE POLICY "authenticated_update_notifications" ON public."Notification"
  FOR UPDATE TO authenticated
  USING ((select auth.uid())::text = "userId")
  WITH CHECK ((select auth.uid())::text = "userId");

CREATE POLICY "authenticated_insert_notifications" ON public."Notification"
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public."User" u WHERE u.id = (select auth.uid())::text AND u.role = 'ADMIN')
  );

CREATE POLICY "service_role_manage_notifications" ON public."Notification"
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "users_read_ratings_for_own_shifts" ON public."ShiftRating";
DROP POLICY IF EXISTS "users_insert_own_ratings" ON public."ShiftRating";
DROP POLICY IF EXISTS "admins_read_all_ratings" ON public."ShiftRating";
DROP POLICY IF EXISTS "service_role_manage_ratings" ON public."ShiftRating";

CREATE POLICY "authenticated_select_ratings" ON public."ShiftRating"
  FOR SELECT TO authenticated
  USING (
    (select auth.uid())::text = "raterId"
    OR (select auth.uid())::text = "rateeId"
    OR EXISTS (SELECT 1 FROM public."User" u WHERE u.id = (select auth.uid())::text AND u.role = 'ADMIN')
  );

CREATE POLICY "authenticated_insert_ratings" ON public."ShiftRating"
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid())::text = "raterId");

CREATE POLICY "service_role_manage_ratings" ON public."ShiftRating"
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "workers_read_own_timesheets" ON public."Timesheet";
DROP POLICY IF EXISTS "workers_insert_own_timesheets" ON public."Timesheet";
DROP POLICY IF EXISTS "workers_update_own_timesheets" ON public."Timesheet";
DROP POLICY IF EXISTS "admins_manage_timesheets" ON public."Timesheet";
DROP POLICY IF EXISTS "service_role_manage_timesheets" ON public."Timesheet";

CREATE POLICY "authenticated_select_timesheets" ON public."Timesheet"
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public."Shift" s
      WHERE s.id = "shiftId"
      AND (
        s."workerId" = (select auth.uid())::text
        OR EXISTS (SELECT 1 FROM public."User" u WHERE u.id = (select auth.uid())::text AND u.role = 'ADMIN')
      )
    )
  );

CREATE POLICY "authenticated_insert_timesheets" ON public."Timesheet"
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public."Shift" s
      WHERE s.id = "shiftId"
      AND (
        s."workerId" = (select auth.uid())::text
        OR EXISTS (SELECT 1 FROM public."User" u WHERE u.id = (select auth.uid())::text AND u.role = 'ADMIN')
      )
    )
  );

CREATE POLICY "authenticated_update_timesheets" ON public."Timesheet"
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public."Shift" s
      WHERE s.id = "shiftId"
      AND (
        s."workerId" = (select auth.uid())::text
        OR EXISTS (SELECT 1 FROM public."User" u WHERE u.id = (select auth.uid())::text AND u.role = 'ADMIN')
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public."Shift" s
      WHERE s.id = "shiftId"
      AND (
        s."workerId" = (select auth.uid())::text
        OR EXISTS (SELECT 1 FROM public."User" u WHERE u.id = (select auth.uid())::text AND u.role = 'ADMIN')
      )
    )
  );

CREATE POLICY "service_role_manage_timesheets" ON public."Timesheet"
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);
