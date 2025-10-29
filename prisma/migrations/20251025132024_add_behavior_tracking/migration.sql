-- CreateTable
CREATE TABLE "BehaviorCheckIn" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "note" TEXT,
    "context" JSONB,
    "triggeredBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BehaviorCheckIn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BehaviorPattern" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "patterns" JSONB NOT NULL,
    "avgMood" DOUBLE PRECISION,
    "avgFocus" DOUBLE PRECISION,
    "avgMotivation" DOUBLE PRECISION,
    "avgEnergy" DOUBLE PRECISION,
    "avgStress" DOUBLE PRECISION,
    "insights" TEXT[],
    "recommendations" TEXT[],
    "correlations" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BehaviorPattern_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CheckInSchedule" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "frequency" TEXT NOT NULL DEFAULT '3x_daily',
    "schedules" JSONB NOT NULL,
    "randomize" BOOLEAN NOT NULL DEFAULT true,
    "skipWeekends" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CheckInSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserConversationState" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "data" JSONB,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserConversationState_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BehaviorCheckIn_userId_timestamp_idx" ON "BehaviorCheckIn"("userId", "timestamp");

-- CreateIndex
CREATE INDEX "BehaviorCheckIn_userId_type_timestamp_idx" ON "BehaviorCheckIn"("userId", "type", "timestamp");

-- CreateIndex
CREATE INDEX "BehaviorPattern_userId_startDate_idx" ON "BehaviorPattern"("userId", "startDate");

-- CreateIndex
CREATE UNIQUE INDEX "CheckInSchedule_userId_key" ON "CheckInSchedule"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserConversationState_userId_key" ON "UserConversationState"("userId");

-- AddForeignKey
ALTER TABLE "BehaviorCheckIn" ADD CONSTRAINT "BehaviorCheckIn_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BehaviorPattern" ADD CONSTRAINT "BehaviorPattern_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckInSchedule" ADD CONSTRAINT "CheckInSchedule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserConversationState" ADD CONSTRAINT "UserConversationState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
