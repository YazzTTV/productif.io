\set ON_ERROR_STOP on
BEGIN;
INSERT INTO "User" (id,name,email,password,"updatedAt") VALUES ('study-test','Study','study-test@example.invalid','unused',NOW());
INSERT INTO "Task" (id,title,"userId","updatedAt",completed) VALUES ('study-task','Test','study-test',NOW(),false);
UPDATE "Task" SET completed=true WHERE id='study-task';
DO $$ BEGIN
 IF (SELECT "completedAt" IS NULL FROM "Task" WHERE id='study-task') THEN RAISE EXCEPTION 'completion timestamp missing'; END IF;
 IF (SELECT count(*) FROM "TaskHistory" WHERE "taskId"='study-task' AND kind='completed') <> 1 THEN RAISE EXCEPTION 'completion history missing'; END IF;
END $$;
UPDATE "Task" SET title='Renamed' WHERE id='study-task';
DO $$ BEGIN
 IF (SELECT count(*) FROM "TaskHistory" WHERE "taskId"='study-task' AND kind='completed') <> 1 THEN RAISE EXCEPTION 'rename duplicated completion'; END IF;
END $$;
UPDATE "Task" SET completed=false WHERE id='study-task';
UPDATE "Task" SET "scheduledFor"='2026-09-15' WHERE id='study-task';
UPDATE "Task" SET "scheduledFor"='2026-09-16' WHERE id='study-task';
DO $$ BEGIN
 IF (SELECT "completedAt" IS NOT NULL FROM "Task" WHERE id='study-task') THEN RAISE EXCEPTION 'reopen retained timestamp'; END IF;
 IF (SELECT count(*) FROM "TaskHistory" WHERE "taskId"='study-task' AND kind='scheduled') <> 2 THEN RAISE EXCEPTION 'schedule history missing'; END IF;
END $$;
INSERT INTO "StudySession" ("userId","clientId",source,"startedAt","endedAt","plannedSeconds",status,segments,revision,"updatedAt") VALUES ('study-test','s','focus',NOW(),NOW(),1500,'completed','[]',2,NOW());
INSERT INTO "StudySession" ("userId","clientId",source,"startedAt","endedAt","plannedSeconds",status,segments,revision,"updatedAt") VALUES ('study-test','s','focus',NOW(),NOW(),1500,'completed','[]',1,NOW()) ON CONFLICT DO NOTHING;
UPDATE "StudySession" SET revision=1 WHERE "userId"='study-test' AND "clientId"='s' AND revision<1;
DO $$ BEGIN
 IF (SELECT count(*) FROM "StudySession" WHERE "userId"='study-test') <> 1 THEN RAISE EXCEPTION 'session duplicated'; END IF;
 IF (SELECT revision FROM "StudySession" WHERE "userId"='study-test' AND "clientId"='s') <> 2 THEN RAISE EXCEPTION 'stale write accepted'; END IF;
END $$;
DELETE FROM "Task" WHERE id='study-task';
DELETE FROM "User" WHERE id='study-test';
DO $$ BEGIN
 IF EXISTS (SELECT 1 FROM "StudySession" WHERE "userId"='study-test') OR EXISTS (SELECT 1 FROM "TaskHistory" WHERE "userId"='study-test') THEN RAISE EXCEPTION 'deletion did not cascade'; END IF;
END $$;
ROLLBACK;
