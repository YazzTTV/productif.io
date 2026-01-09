-- Migration: Add studyLevel field to OnboardingData
-- This migration adds the studyLevel column without resetting the database

-- Add studyLevel column to OnboardingData table
ALTER TABLE "OnboardingData" 
ADD COLUMN IF NOT EXISTS "studyLevel" INTEGER;
