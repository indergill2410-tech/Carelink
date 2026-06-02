-- Configure private Supabase Storage for worker compliance documents.
-- Files are stored under <userId>/<docType>_<uuid>.<ext>.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'compliance-docs',
  'compliance-docs',
  false,
  10485760,
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

DROP POLICY IF EXISTS "Admins read all compliance docs" ON storage.objects;
DROP POLICY IF EXISTS "compliance_docs_select_own_or_admin" ON storage.objects;
DROP POLICY IF EXISTS "compliance_docs_insert_own" ON storage.objects;
DROP POLICY IF EXISTS "compliance_docs_update_own_or_admin" ON storage.objects;
DROP POLICY IF EXISTS "compliance_docs_delete_own_or_admin" ON storage.objects;

CREATE POLICY "compliance_docs_select_own_or_admin" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'compliance-docs'
    AND (
      (select auth.uid())::text = (storage.foldername(name))[1]
      OR EXISTS (
        SELECT 1 FROM public."User" u
        WHERE u.id = (select auth.uid())::text
        AND u.role = 'ADMIN'
      )
    )
  );

CREATE POLICY "compliance_docs_insert_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'compliance-docs'
    AND (select auth.uid())::text = (storage.foldername(name))[1]
  );

CREATE POLICY "compliance_docs_update_own_or_admin" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'compliance-docs'
    AND (
      (select auth.uid())::text = (storage.foldername(name))[1]
      OR EXISTS (
        SELECT 1 FROM public."User" u
        WHERE u.id = (select auth.uid())::text
        AND u.role = 'ADMIN'
      )
    )
  )
  WITH CHECK (
    bucket_id = 'compliance-docs'
    AND (
      (select auth.uid())::text = (storage.foldername(name))[1]
      OR EXISTS (
        SELECT 1 FROM public."User" u
        WHERE u.id = (select auth.uid())::text
        AND u.role = 'ADMIN'
      )
    )
  );

CREATE POLICY "compliance_docs_delete_own_or_admin" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'compliance-docs'
    AND (
      (select auth.uid())::text = (storage.foldername(name))[1]
      OR EXISTS (
        SELECT 1 FROM public."User" u
        WHERE u.id = (select auth.uid())::text
        AND u.role = 'ADMIN'
      )
    )
  );
