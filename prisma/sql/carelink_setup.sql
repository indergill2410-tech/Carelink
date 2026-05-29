-- =============================================================
-- CARELINK FULL DATABASE SETUP  (idempotent — safe to re-run)
-- https://supabase.com/dashboard/project/ansojajzpnkbrcqoeile/sql
-- =============================================================

-- 1. ENUMS (skip if already exist)

DO $$ BEGIN
  CREATE TYPE "Role" AS ENUM ('ADMIN', 'NURSE', 'EN', 'PCA');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ShiftStatus" AS ENUM ('DRAFT', 'PENDING', 'MATCHED', 'COMPLETED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- 2. TABLES

CREATE TABLE IF NOT EXISTS "User" (
    "id"               TEXT NOT NULL,
    "email"            TEXT NOT NULL,
    "name"             TEXT,
    "role"             "Role" NOT NULL DEFAULT 'PCA',
    "complianceStatus" TEXT DEFAULT 'RED',
    "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "facilityId"       TEXT,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Facility" (
    "id"        TEXT NOT NULL,
    "name"      TEXT NOT NULL,
    "address"   TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Facility_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Shift" (
    "id"         TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "role"       "Role" NOT NULL,
    "status"     "ShiftStatus" NOT NULL DEFAULT 'PENDING',
    "startTime"  TIMESTAMP(3) NOT NULL,
    "endTime"    TIMESTAMP(3) NOT NULL,
    "hourlyRate" DOUBLE PRECISION NOT NULL,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "workerId"   TEXT,
    CONSTRAINT "Shift_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");

-- Add any columns that may be missing if the table was created from an older schema
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "facilityId" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "name" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "complianceStatus" TEXT DEFAULT 'RED';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Shift" ADD COLUMN IF NOT EXISTS "workerId" TEXT;
ALTER TABLE "Shift" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Shift" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

DO $$ BEGIN
  ALTER TABLE "User" ADD CONSTRAINT "User_facilityId_fkey"
    FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Shift" ADD CONSTRAINT "Shift_facilityId_fkey"
    FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Shift" ADD CONSTRAINT "Shift_workerId_fkey"
    FOREIGN KEY ("workerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- 3. AUTH TRIGGER

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public."User" ("id","email","name","role","complianceStatus","createdAt","updatedAt")
  VALUES (
    NEW.id::text,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)),
    COALESCE((NEW.raw_app_meta_data->>'role')::public."Role", 'PCA'::public."Role"),
    'RED', NOW(), NOW()
  )
  ON CONFLICT ("id") DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- 4. JWT ROLE CLAIM HOOK
-- After running: Supabase Dashboard → Authentication → Hooks
-- → Customize Access Token → function: public.custom_access_token_hook

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
    claims := jsonb_set(claims, '{role}',       to_jsonb(user_row.role), true);
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

GRANT USAGE  ON SCHEMA public TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;


-- 5. ROW LEVEL SECURITY

ALTER TABLE public."User"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Facility" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Shift"    ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN CREATE POLICY "users_read_own" ON public."User" FOR SELECT USING (auth.uid()::text = id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "users_update_own" ON public."User" FOR UPDATE USING (auth.uid()::text = id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "admins_read_all_users" ON public."User" FOR SELECT USING (
  EXISTS (SELECT 1 FROM public."User" u WHERE u.id = auth.uid()::text AND u.role = 'ADMIN'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "admins_update_any_user" ON public."User" FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public."User" u WHERE u.id = auth.uid()::text AND u.role = 'ADMIN'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE POLICY "admins_read_all_facilities" ON public."Facility" FOR SELECT USING (
  EXISTS (SELECT 1 FROM public."User" u WHERE u.id = auth.uid()::text AND u.role = 'ADMIN'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "admins_insert_facility" ON public."Facility" FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public."User" u WHERE u.id = auth.uid()::text AND u.role = 'ADMIN'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "facility_admin_update_own" ON public."Facility" FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public."User" u WHERE u.id = auth.uid()::text AND u."facilityId" = "Facility".id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE POLICY "workers_read_open_or_own" ON public."Shift" FOR SELECT USING (
  status = 'PENDING' OR "workerId" = auth.uid()::text);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "facility_read_own_shifts" ON public."Shift" FOR SELECT USING (
  EXISTS (SELECT 1 FROM public."User" u WHERE u.id = auth.uid()::text AND u."facilityId" = "Shift"."facilityId"));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "admins_read_all_shifts" ON public."Shift" FOR SELECT USING (
  EXISTS (SELECT 1 FROM public."User" u WHERE u.id = auth.uid()::text AND u.role = 'ADMIN'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "facility_insert_shifts" ON public."Shift" FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public."User" u WHERE u.id = auth.uid()::text AND u."facilityId" = "facilityId"));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "workers_accept_shift" ON public."Shift" FOR UPDATE USING (
  "workerId" IS NULL AND status = 'PENDING');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "admins_update_any_shift" ON public."Shift" FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public."User" u WHERE u.id = auth.uid()::text AND u.role = 'ADMIN'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- 6. DEMO ACCOUNTS  (password: Veerji786)

DO $$
DECLARE
  v_pwd      TEXT := crypt('Veerji786', gen_salt('bf'));
  v_admin_id UUID;
  v_fac_id   UUID;
  v_nurse_id UUID;
BEGIN
  -- Admin
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
  VALUES (gen_random_uuid(),'00000000-0000-0000-0000-000000000000','authenticated','authenticated',
    'admin@demo.carelink.app', v_pwd, NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,'{"name":"Demo Admin"}'::jsonb,
    NOW(),NOW(),'','','','')
  ON CONFLICT (email) DO UPDATE SET updated_at = NOW()
  RETURNING id INTO v_admin_id;
  INSERT INTO public."User" (id,email,name,role,"complianceStatus","createdAt","updatedAt")
  VALUES (v_admin_id::text,'admin@demo.carelink.app','Demo Admin','ADMIN','GREEN',NOW(),NOW())
  ON CONFLICT (id) DO UPDATE SET role='ADMIN',"complianceStatus"='GREEN',"updatedAt"=NOW();

  -- Facility Manager
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
  VALUES (gen_random_uuid(),'00000000-0000-0000-0000-000000000000','authenticated','authenticated',
    'facility@demo.carelink.app', v_pwd, NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,'{"name":"Demo Facility Manager"}'::jsonb,
    NOW(),NOW(),'','','','')
  ON CONFLICT (email) DO UPDATE SET updated_at = NOW()
  RETURNING id INTO v_fac_id;
  INSERT INTO public."User" (id,email,name,role,"complianceStatus","createdAt","updatedAt")
  VALUES (v_fac_id::text,'facility@demo.carelink.app','Demo Facility Manager','ADMIN','GREEN',NOW(),NOW())
  ON CONFLICT (id) DO UPDATE SET role='ADMIN',"complianceStatus"='GREEN',"updatedAt"=NOW();

  -- Nurse
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
  VALUES (gen_random_uuid(),'00000000-0000-0000-0000-000000000000','authenticated','authenticated',
    'nurse@demo.carelink.app', v_pwd, NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,'{"name":"Demo Nurse"}'::jsonb,
    NOW(),NOW(),'','','','')
  ON CONFLICT (email) DO UPDATE SET updated_at = NOW()
  RETURNING id INTO v_nurse_id;
  INSERT INTO public."User" (id,email,name,role,"complianceStatus","createdAt","updatedAt")
  VALUES (v_nurse_id::text,'nurse@demo.carelink.app','Demo Nurse','NURSE','GREEN',NOW(),NOW())
  ON CONFLICT (id) DO UPDATE SET role='NURSE',"complianceStatus"='GREEN',"updatedAt"=NOW();
END $$;
