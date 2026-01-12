-- Add inferredCategory and userCategoryOverride to habits
ALTER TABLE "habits"
ADD COLUMN IF NOT EXISTS "inferredCategory" TEXT,
ADD COLUMN IF NOT EXISTS "userCategoryOverride" TEXT;






















