-- Add XP columns to UserGamification
ALTER TABLE "UserGamification"
ADD COLUMN IF NOT EXISTS "totalXp" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "nextLevelXp" INTEGER NOT NULL DEFAULT 100;

-- Create XpEvent table
CREATE TABLE IF NOT EXISTS "XpEvent" (
    "id" TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "xpAwarded" INTEGER NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT "XpEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "XpEvent_userId_createdAt_idx" ON "XpEvent"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "XpEvent_type_idx" ON "XpEvent"("type");

