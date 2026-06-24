-- ============================================================================
-- CareLink — demo worker data seed (idempotent)
-- ----------------------------------------------------------------------------
-- Gives the three demo carer accounts (nurse@ / en@ / pca@) full live data so
-- every worker dashboard section renders: compliance (GREEN, one near-expiry),
-- completed shifts (earnings), today's + upcoming confirmed shifts, open offers,
-- ratings (rating_avg). Safe to re-run — rows use deterministic md5-derived ids
-- and upsert / delete-then-insert.
--
-- Apply against the CareLink project (ansojajzpnkbrcqoeile) only.
--   psql "$DIRECT_URL" -f prisma/seed-demo-workers.sql
-- or via the Supabase SQL editor / MCP execute_sql.
--
-- Account ids (from auth.users / public."User"):
--   nurse@demo.carelink.app  d389ab4b-1bd8-438c-aa2a-b70bd6c5fb71  NURSE
--   en@demo.carelink.app     4c6988c2-7cc6-4a9c-bc92-5f020e9632ed  EN
--   pca@demo.carelink.app    c729741a-6b50-41c0-a552-1c01171f1c5e  PCA
--   facility manager (rater) b533274d-c6f8-4e47-9449-7526877be2e7
--   Sunrise Aged Care (Demo) c15b3e83-dee1-4bce-87fc-574515b5ff70
--   Oakwood Nursing Home     358d5bcc-d07d-4b1b-815a-ea0ff8d9a840
-- ============================================================================

-- 1. Compliance documents — all required docs APPROVED (nurse First Aid in 28d) -
INSERT INTO "ComplianceDocument" (id, "userId", "docType", url, status, "expiresAt", "createdAt", "updatedAt")
SELECT md5('cl-seed-doc:'||w.uid||':'||d.dtype)::uuid, w.uid, d.dtype,
       'demo://seed/placeholder.pdf', 'APPROVED',
       CASE
         WHEN d.dtype = 'ID_PROOF' THEN NULL
         WHEN w.uid = 'd389ab4b-1bd8-438c-aa2a-b70bd6c5fb71' AND d.dtype = 'FIRST_AID' THEN now() + interval '28 days'
         ELSE now() + interval '1 year'
       END,
       now(), now()
FROM (VALUES
  ('d389ab4b-1bd8-438c-aa2a-b70bd6c5fb71'),
  ('4c6988c2-7cc6-4a9c-bc92-5f020e9632ed'),
  ('c729741a-6b50-41c0-a552-1c01171f1c5e')
) AS w(uid)
CROSS JOIN (VALUES ('POLICE_CHECK'),('WORKING_WITH_CHILDREN'),('FIRST_AID'),('IMMUNISATION'),('ID_PROOF')) AS d(dtype)
ON CONFLICT ("userId","docType") DO UPDATE
  SET status = excluded.status, "expiresAt" = excluded."expiresAt", url = excluded.url, "updatedAt" = now();

INSERT INTO "ComplianceDocument" (id, "userId", "docType", url, status, "expiresAt", "createdAt", "updatedAt")
SELECT md5('cl-seed-doc:'||w.uid||':NURSING_REGISTRATION')::uuid, w.uid, 'NURSING_REGISTRATION',
       'demo://seed/placeholder.pdf', 'APPROVED', now() + interval '1 year', now(), now()
FROM (VALUES
  ('d389ab4b-1bd8-438c-aa2a-b70bd6c5fb71'),
  ('4c6988c2-7cc6-4a9c-bc92-5f020e9632ed')
) AS w(uid)
ON CONFLICT ("userId","docType") DO UPDATE
  SET status = excluded.status, "expiresAt" = excluded."expiresAt", url = excluded.url, "updatedAt" = now();

UPDATE "User" SET "complianceStatus" = 'GREEN'
WHERE id IN ('d389ab4b-1bd8-438c-aa2a-b70bd6c5fb71','4c6988c2-7cc6-4a9c-bc92-5f020e9632ed','c729741a-6b50-41c0-a552-1c01171f1c5e');

-- 2. Assigned shifts — completed (this/last week) + today + upcoming ------------
INSERT INTO "Shift" (id,"facilityId",role,status,"startTime","endTime","hourlyRate",urgent,"workerId","clockInAt","clockOutAt","notes","createdAt","updatedAt")
SELECT (md5('cl-seed-shift:'||w.uid||':'||s.tag)::uuid)::text,
  s.fac, w.role::"Role", s.status::"ShiftStatus",
  date_trunc(s.base, now()) + s.off::interval,
  date_trunc(s.base, now()) + s.off::interval + (s.dur||' hours')::interval,
  w.rate, false, w.uid,
  CASE WHEN s.status='COMPLETED' THEN date_trunc(s.base,now()) + s.off::interval END,
  CASE WHEN s.status='COMPLETED' THEN date_trunc(s.base,now()) + s.off::interval + (s.dur||' hours')::interval END,
  NULL, now(), now()
FROM (VALUES
  ('d389ab4b-1bd8-438c-aa2a-b70bd6c5fb71','NURSE',55.0),
  ('4c6988c2-7cc6-4a9c-bc92-5f020e9632ed','EN',45.0),
  ('c729741a-6b50-41c0-a552-1c01171f1c5e','PCA',32.5)
) AS w(uid,role,rate)
CROSS JOIN (VALUES
  ('comp1','COMPLETED','week','0 hours','8','c15b3e83-dee1-4bce-87fc-574515b5ff70'),
  ('comp2','COMPLETED','week','1 day','8','358d5bcc-d07d-4b1b-815a-ea0ff8d9a840'),
  ('comp3','COMPLETED','week','-3 days','8','c15b3e83-dee1-4bce-87fc-574515b5ff70'),
  ('today','MATCHED','day','6 hours','8','c15b3e83-dee1-4bce-87fc-574515b5ff70'),
  ('up1','MATCHED','day','2 days','8','358d5bcc-d07d-4b1b-815a-ea0ff8d9a840'),
  ('up2','MATCHED','day','4 days 6 hours','8','c15b3e83-dee1-4bce-87fc-574515b5ff70')
) AS s(tag,status,base,off,dur,fac)
ON CONFLICT (id) DO UPDATE SET
  "facilityId"=excluded."facilityId", role=excluded.role, status=excluded.status,
  "startTime"=excluded."startTime","endTime"=excluded."endTime","hourlyRate"=excluded."hourlyRate",
  "workerId"=excluded."workerId","clockInAt"=excluded."clockInAt","clockOutAt"=excluded."clockOutAt","updatedAt"=now();

-- 3. Open offers (PENDING, unassigned) per role --------------------------------
INSERT INTO "Shift" (id,"facilityId",role,status,"startTime","endTime","hourlyRate",urgent,"workerId","notes","createdAt","updatedAt")
SELECT (md5('cl-seed-offer:'||s.role||':'||s.tag)::uuid)::text,
  s.fac, s.role::"Role", 'PENDING'::"ShiftStatus",
  date_trunc('day',now()) + s.off::interval,
  date_trunc('day',now()) + s.off::interval + (s.dur||' hours')::interval,
  s.rate, s.urgent, NULL, s.notes, now(), now()
FROM (VALUES
  ('offer1','NURSE','1 day 6 hours','8','c15b3e83-dee1-4bce-87fc-574515b5ff70',false,55.0,'Morning RN shift — handover at 07:00.'),
  ('offer2','NURSE','3 days 14 hours','10','358d5bcc-d07d-4b1b-815a-ea0ff8d9a840',true,55.0,'Urgent night cover needed.'),
  ('offer1','EN','1 day 6 hours','8','358d5bcc-d07d-4b1b-815a-ea0ff8d9a840',false,45.0,'Medication round support.'),
  ('offer2','EN','2 days 6 hours','8','c15b3e83-dee1-4bce-87fc-574515b5ff70',false,45.0,NULL),
  ('offer1','PCA','1 day 6 hours','8','c15b3e83-dee1-4bce-87fc-574515b5ff70',true,32.5,'Urgent personal-care cover.'),
  ('offer2','PCA','3 days 6 hours','8','358d5bcc-d07d-4b1b-815a-ea0ff8d9a840',false,32.5,NULL)
) AS s(tag,role,off,dur,fac,urgent,rate,notes)
ON CONFLICT (id) DO UPDATE SET
  "facilityId"=excluded."facilityId", status='PENDING'::"ShiftStatus",
  "startTime"=excluded."startTime","endTime"=excluded."endTime","hourlyRate"=excluded."hourlyRate",
  urgent=excluded.urgent, "workerId"=NULL, notes=excluded.notes, "updatedAt"=now();

-- 4. Timesheets for completed shifts (idempotent: delete-then-insert) ----------
WITH seed_shifts AS (
  SELECT (md5('cl-seed-shift:'||w.uid||':'||t.tag)::uuid)::text AS sid
  FROM (VALUES ('d389ab4b-1bd8-438c-aa2a-b70bd6c5fb71'),('4c6988c2-7cc6-4a9c-bc92-5f020e9632ed'),('c729741a-6b50-41c0-a552-1c01171f1c5e')) w(uid)
  CROSS JOIN (VALUES ('comp1'),('comp2'),('comp3')) t(tag)
)
DELETE FROM "Timesheet" WHERE "shiftId" IN (SELECT sid FROM seed_shifts);

INSERT INTO "Timesheet" (id,"shiftId","clockIn","clockOut",status,"createdAt","updatedAt")
SELECT (md5('cl-seed-ts:'||sh.id)::uuid)::text, sh.id, sh."clockInAt", sh."clockOutAt", 'APPROVED'::"TimesheetStatus", now(), now()
FROM "Shift" sh
WHERE sh.status='COMPLETED' AND sh.id IN (
  SELECT (md5('cl-seed-shift:'||w.uid||':'||t.tag)::uuid)::text
  FROM (VALUES ('d389ab4b-1bd8-438c-aa2a-b70bd6c5fb71'),('4c6988c2-7cc6-4a9c-bc92-5f020e9632ed'),('c729741a-6b50-41c0-a552-1c01171f1c5e')) w(uid)
  CROSS JOIN (VALUES ('comp1'),('comp2'),('comp3')) t(tag)
);

-- 5. Ratings by the facility manager + rating_avg rollup -----------------------
INSERT INTO "ShiftRating" (id,"shiftId","raterId","rateeId",rating,comment,"createdAt")
SELECT (md5('cl-seed-rating:'||sh.id)::uuid)::text, sh.id, 'b533274d-c6f8-4e47-9449-7526877be2e7', sh."workerId",
       CASE r.tag WHEN 'comp1' THEN 5 WHEN 'comp2' THEN 4 ELSE 5 END,
       CASE r.tag WHEN 'comp1' THEN 'Wonderful with our residents — would book again.'
                  WHEN 'comp2' THEN 'Reliable and professional.'
                  ELSE 'Outstanding care and great communication.' END,
       now()
FROM (VALUES ('d389ab4b-1bd8-438c-aa2a-b70bd6c5fb71'),('4c6988c2-7cc6-4a9c-bc92-5f020e9632ed'),('c729741a-6b50-41c0-a552-1c01171f1c5e')) w(uid)
CROSS JOIN (VALUES ('comp1'),('comp2'),('comp3')) r(tag)
JOIN "Shift" sh ON sh.id = (md5('cl-seed-shift:'||w.uid||':'||r.tag)::uuid)::text
ON CONFLICT ("shiftId","raterId") DO UPDATE SET rating=excluded.rating, comment=excluded.comment;

UPDATE "User" u
SET rating = sub.avg
FROM (SELECT "rateeId", round(avg(rating)::numeric,1)::float8 AS avg FROM "ShiftRating" GROUP BY "rateeId") sub
WHERE u.id = sub."rateeId";
