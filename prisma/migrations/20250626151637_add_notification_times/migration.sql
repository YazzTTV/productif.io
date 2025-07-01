-- AlterTable
ALTER TABLE "notification_settings" ADD COLUMN     "afternoonTime" TEXT NOT NULL DEFAULT '14:00',
ADD COLUMN     "eveningTime" TEXT NOT NULL DEFAULT '18:00',
ADD COLUMN     "morningTime" TEXT NOT NULL DEFAULT '08:00',
ADD COLUMN     "nightTime" TEXT NOT NULL DEFAULT '22:00',
ADD COLUMN     "noonTime" TEXT NOT NULL DEFAULT '12:00',
ALTER COLUMN "notificationTypes" SET DEFAULT ARRAY[]::TEXT[];
