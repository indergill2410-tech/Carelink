-- Supabase exposes the public schema to PostgREST, so keep Prisma's
-- migration history table protected by RLS once Prisma has created it.

ALTER TABLE public."_prisma_migrations" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_manage_prisma_migrations" ON public."_prisma_migrations";
CREATE POLICY "service_role_manage_prisma_migrations" ON public."_prisma_migrations"
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);
