ALTER TABLE "notification_settings"
ADD COLUMN IF NOT EXISTS "journalTime" TEXT;

UPDATE "notification_settings"
SET "journalTime" = COALESCE("journalTime", "recapTime", '21:00');

ALTER TABLE "notification_settings"
ALTER COLUMN "journalTime" SET NOT NULL;

ALTER TABLE "notification_settings"
ALTER COLUMN "journalTime" SET DEFAULT '21:00';
