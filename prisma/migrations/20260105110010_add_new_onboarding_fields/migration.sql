-- Migration: Add new onboarding fields and Apple Calendar connection
-- This migration adds only the new fields without resetting the database

-- Add new columns to OnboardingData table
ALTER TABLE "OnboardingData" 
ADD COLUMN IF NOT EXISTS "firstName" TEXT,
ADD COLUMN IF NOT EXISTS "studentType" TEXT,
ADD COLUMN IF NOT EXISTS "goals" JSONB,
ADD COLUMN IF NOT EXISTS "pressureLevel" INTEGER,
ADD COLUMN IF NOT EXISTS "currentSituation" TEXT,
ADD COLUMN IF NOT EXISTS "dailyStruggles" JSONB,
ADD COLUMN IF NOT EXISTS "mentalLoad" INTEGER,
ADD COLUMN IF NOT EXISTS "focusQuality" INTEGER,
ADD COLUMN IF NOT EXISTS "satisfaction" INTEGER,
ADD COLUMN IF NOT EXISTS "overthinkTasks" BOOLEAN,
ADD COLUMN IF NOT EXISTS "shouldDoMore" BOOLEAN,
ADD COLUMN IF NOT EXISTS "wantToChange" JSONB,
ADD COLUMN IF NOT EXISTS "timeHorizon" TEXT,
ADD COLUMN IF NOT EXISTS "rawTasks" TEXT,
ADD COLUMN IF NOT EXISTS "clarifiedTasks" JSONB,
ADD COLUMN IF NOT EXISTS "idealDay" JSONB;

-- Create AppleCalendarConnection table
CREATE TABLE IF NOT EXISTS "apple_calendar_connections" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "granted" BOOLEAN NOT NULL DEFAULT true,
    "calendarIds" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "apple_calendar_connections_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint on userId
CREATE UNIQUE INDEX IF NOT EXISTS "apple_calendar_connections_userId_key" ON "apple_calendar_connections"("userId");

-- Create index on userId
CREATE INDEX IF NOT EXISTS "apple_calendar_connections_userId_idx" ON "apple_calendar_connections"("userId");

-- Add foreign key to User table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'apple_calendar_connections_userId_fkey'
    ) THEN
        ALTER TABLE "apple_calendar_connections" 
        ADD CONSTRAINT "apple_calendar_connections_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Add appleCalendarConnection relation to User table (this is handled by Prisma, but we ensure the foreign key exists)
-- Note: The relation in Prisma schema is already defined, this migration just ensures the table and constraints exist

