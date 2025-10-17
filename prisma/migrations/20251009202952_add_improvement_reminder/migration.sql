-- AlterTable
ALTER TABLE "notification_settings" ADD COLUMN     "improvementReminder" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "improvementTime" TEXT NOT NULL DEFAULT '08:30';
