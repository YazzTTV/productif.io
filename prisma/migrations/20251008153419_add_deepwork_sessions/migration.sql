-- CreateTable
CREATE TABLE "DeepWorkSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "timeEntryId" TEXT NOT NULL,
    "plannedDuration" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "type" TEXT NOT NULL DEFAULT 'deepwork',
    "interruptions" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeepWorkSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DeepWorkSession_timeEntryId_key" ON "DeepWorkSession"("timeEntryId");

-- CreateIndex
CREATE INDEX "DeepWorkSession_userId_status_idx" ON "DeepWorkSession"("userId", "status");

-- CreateIndex
CREATE INDEX "DeepWorkSession_userId_createdAt_idx" ON "DeepWorkSession"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "DeepWorkSession" ADD CONSTRAINT "DeepWorkSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeepWorkSession" ADD CONSTRAINT "DeepWorkSession_timeEntryId_fkey" FOREIGN KEY ("timeEntryId") REFERENCES "TimeEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
