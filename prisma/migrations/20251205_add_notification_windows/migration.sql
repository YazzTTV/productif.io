-- Add new reminder flags
ALTER TABLE "notification_settings" ADD COLUMN IF NOT EXISTS "noonReminder" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "notification_settings" ADD COLUMN IF NOT EXISTS "afternoonReminder" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "notification_settings" ADD COLUMN IF NOT EXISTS "eveningReminder" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "notification_settings" ADD COLUMN IF NOT EXISTS "nightReminder" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "notification_settings" ADD COLUMN IF NOT EXISTS "recapReminder" BOOLEAN NOT NULL DEFAULT true;

-- Add recap time and timezone
ALTER TABLE "notification_settings" ADD COLUMN IF NOT EXISTS "recapTime" TEXT NOT NULL DEFAULT '21:00';
ALTER TABLE "notification_settings" ADD COLUMN IF NOT EXISTS "timezone" TEXT NOT NULL DEFAULT 'Europe/Paris';

-- Add random question toggles and windows
ALTER TABLE "notification_settings" ADD COLUMN IF NOT EXISTS "moodEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "notification_settings" ADD COLUMN IF NOT EXISTS "stressEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "notification_settings" ADD COLUMN IF NOT EXISTS "focusEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "notification_settings" ADD COLUMN IF NOT EXISTS "moodWindows" JSONB;
ALTER TABLE "notification_settings" ADD COLUMN IF NOT EXISTS "stressWindows" JSONB;
ALTER TABLE "notification_settings" ADD COLUMN IF NOT EXISTS "focusWindows" JSONB;
ALTER TABLE "notification_settings" ADD COLUMN IF NOT EXISTS "moodDailyCount" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "notification_settings" ADD COLUMN IF NOT EXISTS "stressDailyCount" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "notification_settings" ADD COLUMN IF NOT EXISTS "focusDailyCount" INTEGER NOT NULL DEFAULT 1;
