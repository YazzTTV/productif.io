-- AlterTable: Add calendar scheduling fields to Task
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "estimatedMinutes" INTEGER;
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "subject" TEXT;
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "googleCalendarEventId" TEXT;
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "schedulingStatus" TEXT DEFAULT 'draft';
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "proposedSlotStart" TIMESTAMP(3);
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "proposedSlotEnd" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "Task_schedulingStatus_idx" ON "Task"("schedulingStatus");

-- CreateTable: ScheduledTaskEvent
CREATE TABLE IF NOT EXISTS "scheduled_task_events" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "googleEventId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "reminderSentAt" TIMESTAMP(3),
    "postCheckSentAt" TIMESTAMP(3),
    "userResponse" TEXT,
    "rescheduledCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scheduled_task_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "scheduled_task_events_googleEventId_key" ON "scheduled_task_events"("googleEventId");
CREATE INDEX IF NOT EXISTS "scheduled_task_events_userId_idx" ON "scheduled_task_events"("userId");
CREATE INDEX IF NOT EXISTS "scheduled_task_events_startTime_idx" ON "scheduled_task_events"("startTime");
CREATE INDEX IF NOT EXISTS "scheduled_task_events_endTime_idx" ON "scheduled_task_events"("endTime");
CREATE INDEX IF NOT EXISTS "scheduled_task_events_googleEventId_idx" ON "scheduled_task_events"("googleEventId");

-- AddForeignKey
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'scheduled_task_events_taskId_fkey'
    ) THEN
        ALTER TABLE "scheduled_task_events" ADD CONSTRAINT "scheduled_task_events_taskId_fkey" 
        FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
