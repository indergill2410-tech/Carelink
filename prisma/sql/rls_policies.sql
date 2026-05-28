-- Enable RLS on all application tables
ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Facility" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Shift" ENABLE ROW LEVEL SECURITY;

-- =====================
-- USER TABLE POLICIES
-- =====================

-- Users can read their own record
CREATE POLICY "users_read_own" ON public."User"
  FOR SELECT USING (auth.uid()::text = id);

-- Admins can read all users
CREATE POLICY "admins_read_all_users" ON public."User"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public."User" u
      WHERE u.id = auth.uid()::text AND u.role = 'ADMIN'
    )
  );

-- Users can update their own record (limited fields only - enforce in app layer)
CREATE POLICY "users_update_own" ON public."User"
  FOR UPDATE USING (auth.uid()::text = id);

-- Admins can update any user
CREATE POLICY "admins_update_any_user" ON public."User"
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public."User" u
      WHERE u.id = auth.uid()::text AND u.role = 'ADMIN'
    )
  );

-- ========================
-- FACILITY TABLE POLICIES
-- ========================

-- Facility admins can read their own facility
CREATE POLICY "facility_admin_read_own" ON public."Facility"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public."User" u
      WHERE u.id = auth.uid()::text AND u."facilityId" = "Facility".id
    )
  );

-- Global admins can read all facilities
CREATE POLICY "global_admin_read_all_facilities" ON public."Facility"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public."User" u
      WHERE u.id = auth.uid()::text AND u.role = 'ADMIN'
    )
  );

-- Admins can insert facilities
CREATE POLICY "admins_insert_facility" ON public."Facility"
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public."User" u
      WHERE u.id = auth.uid()::text AND u.role = 'ADMIN'
    )
  );

-- Facility admins can update their own facility
CREATE POLICY "facility_admin_update_own" ON public."Facility"
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public."User" u
      WHERE u.id = auth.uid()::text AND u."facilityId" = "Facility".id
    )
  );

-- ====================
-- SHIFT TABLE POLICIES
-- ====================

-- Workers can read open (REQUESTED) shifts or shifts assigned to them
CREATE POLICY "workers_read_open_or_own_shifts" ON public."Shift"
  FOR SELECT USING (
    status = 'PENDING' OR "workerId" = auth.uid()::text
  );

-- Facility admins can read shifts for their facility
CREATE POLICY "facility_admin_read_own_shifts" ON public."Shift"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public."User" u
      WHERE u.id = auth.uid()::text AND u."facilityId" = "Shift"."facilityId"
    )
  );

-- Global admins can read all shifts
CREATE POLICY "global_admin_read_all_shifts" ON public."Shift"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public."User" u
      WHERE u.id = auth.uid()::text AND u.role = 'ADMIN'
    )
  );

-- Facility admins can insert shifts for their facility only
CREATE POLICY "facility_admin_insert_shifts" ON public."Shift"
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public."User" u
      WHERE u.id = auth.uid()::text AND u."facilityId" = "facilityId"
    )
  );

-- Workers can accept an unassigned shift (set themselves as workerId)
CREATE POLICY "workers_accept_shift" ON public."Shift"
  FOR UPDATE USING (
    "workerId" IS NULL AND status = 'PENDING'
  );
