-- Enable RLS on previously exposed tables
ALTER TABLE public."ComplianceDocument" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Notification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ShiftRating" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Timesheet" ENABLE ROW LEVEL SECURITY;

-- ComplianceDocument policies
CREATE POLICY "users_read_own_docs" ON public."ComplianceDocument"
  FOR SELECT USING (auth.uid()::text = "userId");

CREATE POLICY "users_insert_own_docs" ON public."ComplianceDocument"
  FOR INSERT WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "users_update_own_docs" ON public."ComplianceDocument"
  FOR UPDATE USING (auth.uid()::text = "userId");

CREATE POLICY "admins_read_all_docs" ON public."ComplianceDocument"
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public."User" u
      WHERE u.id = auth.uid()::text AND u.role = 'ADMIN')
  );

CREATE POLICY "admins_update_docs" ON public."ComplianceDocument"
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public."User" u
      WHERE u.id = auth.uid()::text AND u.role = 'ADMIN')
  );

CREATE POLICY "service_role_manage_docs" ON public."ComplianceDocument"
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Notification policies
CREATE POLICY "users_read_own_notifications" ON public."Notification"
  FOR SELECT USING (auth.uid()::text = "userId");

CREATE POLICY "users_update_own_notifications" ON public."Notification"
  FOR UPDATE USING (auth.uid()::text = "userId");

CREATE POLICY "service_role_manage_notifications" ON public."Notification"
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "admins_insert_notifications" ON public."Notification"
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public."User" u
      WHERE u.id = auth.uid()::text AND u.role = 'ADMIN')
    OR auth.role() = 'service_role'
  );

-- ShiftRating policies
CREATE POLICY "users_read_ratings_for_own_shifts" ON public."ShiftRating"
  FOR SELECT USING (
    auth.uid()::text = "raterId" OR auth.uid()::text = "rateeId"
  );

CREATE POLICY "users_insert_own_ratings" ON public."ShiftRating"
  FOR INSERT WITH CHECK (auth.uid()::text = "raterId");

CREATE POLICY "admins_read_all_ratings" ON public."ShiftRating"
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public."User" u
      WHERE u.id = auth.uid()::text AND u.role = 'ADMIN')
  );

CREATE POLICY "service_role_manage_ratings" ON public."ShiftRating"
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Timesheet policies
CREATE POLICY "workers_read_own_timesheets" ON public."Timesheet"
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public."Shift" s
      WHERE s.id = "shiftId" AND s."workerId" = auth.uid()::text)
  );

CREATE POLICY "workers_insert_own_timesheets" ON public."Timesheet"
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public."Shift" s
      WHERE s.id = "shiftId" AND s."workerId" = auth.uid()::text)
  );

CREATE POLICY "workers_update_own_timesheets" ON public."Timesheet"
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public."Shift" s
      WHERE s.id = "shiftId" AND s."workerId" = auth.uid()::text)
  );

CREATE POLICY "admins_manage_timesheets" ON public."Timesheet"
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public."User" u
      WHERE u.id = auth.uid()::text AND u.role = 'ADMIN')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public."User" u
      WHERE u.id = auth.uid()::text AND u.role = 'ADMIN')
  );

CREATE POLICY "service_role_manage_timesheets" ON public."Timesheet"
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
