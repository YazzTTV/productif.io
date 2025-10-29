-- AlterTable
ALTER TABLE "User" 
ADD COLUMN IF NOT EXISTS "cancelledAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "convertedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "subscriptionEndDate" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "subscriptionTier" TEXT,
ADD COLUMN IF NOT EXISTS "trialEndDate" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "trialStartDate" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "trialStatus" TEXT DEFAULT 'active';

-- Update existing users to have default values
UPDATE "User" SET "subscriptionStatus" = 'trial' WHERE "subscriptionStatus" IS NULL;
UPDATE "User" SET "trialStatus" = 'active' WHERE "trialStatus" IS NULL;

-- CreateTable
CREATE TABLE IF NOT EXISTS "TrialNotification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "channel" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrialNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "TrialNotification_userId_type_idx" ON "TrialNotification"("userId", "type");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "TrialNotification_sentAt_idx" ON "TrialNotification"("sentAt");

-- AddForeignKey
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'TrialNotification_userId_fkey'
    ) THEN
        ALTER TABLE "TrialNotification" 
        ADD CONSTRAINT "TrialNotification_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "User"("id") 
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

