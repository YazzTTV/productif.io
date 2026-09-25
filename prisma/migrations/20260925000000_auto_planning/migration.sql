ALTER TABLE "Task" ADD COLUMN "autoPlannedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "autoPlanRunAt" TIMESTAMP(3);

CREATE TABLE "calendar_busy_snapshots" (
    "userId" TEXT NOT NULL,
    "slots" JSONB NOT NULL,
    "source" TEXT NOT NULL,
    "rangeStart" TIMESTAMP(3) NOT NULL,
    "rangeEnd" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calendar_busy_snapshots_pkey" PRIMARY KEY ("userId")
);

ALTER TABLE "calendar_busy_snapshots" ADD CONSTRAINT "calendar_busy_snapshots_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
