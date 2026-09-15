ALTER TABLE "Task" ADD COLUMN "completedAt" TIMESTAMP(3);
CREATE TABLE "StudySession" (
 "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
 "clientId" TEXT NOT NULL, "source" TEXT NOT NULL, "serverSessionId" TEXT,
 "startedAt" TIMESTAMP(3) NOT NULL, "endedAt" TIMESTAMP(3),
 "plannedSeconds" INTEGER NOT NULL, "status" TEXT NOT NULL, "segments" JSONB NOT NULL,
 "revision" INTEGER NOT NULL, "recommendationId" TEXT,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
 PRIMARY KEY ("userId", "clientId")
);
CREATE INDEX "StudySession_userId_startedAt_idx" ON "StudySession"("userId", "startedAt");
CREATE TABLE "StudyCheckIn" (
 "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
 "clientId" TEXT NOT NULL, "sessionId" TEXT, "type" TEXT NOT NULL,
 "value" INTEGER NOT NULL CHECK ("value" BETWEEN 1 AND 10), "timestamp" TIMESTAMP(3) NOT NULL,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY ("userId", "clientId")
);
CREATE INDEX "StudyCheckIn_userId_timestamp_idx" ON "StudyCheckIn"("userId", "timestamp");
CREATE TABLE "TaskHistory" (
 "id" TEXT PRIMARY KEY, "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
 "taskId" TEXT NOT NULL REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE, "kind" TEXT NOT NULL,
 "previousDate" TIMESTAMP(3), "nextDate" TIMESTAMP(3),
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "TaskHistory_userId_createdAt_idx" ON "TaskHistory"("userId", "createdAt");
-- All writers (mobile, web, agent, bulk updates) share the same completion clock.
-- Existing completed tasks deliberately retain NULL: their completion time is unknown.
CREATE FUNCTION study_task_history() RETURNS trigger AS $$
BEGIN
 IF TG_OP = 'INSERT' THEN
   IF NEW.completed THEN NEW."completedAt" := CURRENT_TIMESTAMP; END IF;
   RETURN NEW;
 END IF;
 IF NEW.completed IS DISTINCT FROM OLD.completed THEN
   NEW."completedAt" := CASE WHEN NEW.completed THEN CURRENT_TIMESTAMP ELSE NULL END;
   INSERT INTO "TaskHistory" (id, "userId", "taskId", kind)
   VALUES (md5(random()::text || clock_timestamp()::text), NEW."userId", NEW.id,
     CASE WHEN NEW.completed THEN 'completed' ELSE 'reopened' END);
 ELSE
   NEW."completedAt" := OLD."completedAt";
 END IF;
 IF NEW."scheduledFor" IS DISTINCT FROM OLD."scheduledFor" THEN
   INSERT INTO "TaskHistory" (id, "userId", "taskId", kind, "previousDate", "nextDate")
   VALUES (md5(random()::text || clock_timestamp()::text), NEW."userId", NEW.id,
     'scheduled', OLD."scheduledFor", NEW."scheduledFor");
 END IF;
 RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER study_task_history_trigger BEFORE INSERT OR UPDATE ON "Task"
FOR EACH ROW EXECUTE FUNCTION study_task_history();
