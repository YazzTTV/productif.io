/*
  Warnings:

  - You are about to drop the `notification_settings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `scheduled_notifications` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[whatsappId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "notification_settings" DROP CONSTRAINT "notification_settings_userId_fkey";

-- DropForeignKey
ALTER TABLE "scheduled_notifications" DROP CONSTRAINT "scheduled_notifications_settingsId_fkey";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isAuthenticated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "token" TEXT,
ADD COLUMN     "whatsappId" TEXT;

-- DropTable
DROP TABLE "notification_settings";

-- DropTable
DROP TABLE "scheduled_notifications";

-- CreateTable
CREATE TABLE "NotificationSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "phoneNumber" TEXT,
    "notificationTime" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Paris',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduledNotification" (
    "id" TEXT NOT NULL,
    "settingsId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "sent" BOOLEAN NOT NULL DEFAULT false,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduledNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NotificationSettings_userId_key" ON "NotificationSettings"("userId");

-- CreateIndex
CREATE INDEX "NotificationSettings_userId_idx" ON "NotificationSettings"("userId");

-- CreateIndex
CREATE INDEX "ScheduledNotification_settingsId_idx" ON "ScheduledNotification"("settingsId");

-- CreateIndex
CREATE INDEX "ScheduledNotification_scheduledFor_idx" ON "ScheduledNotification"("scheduledFor");

-- CreateIndex
CREATE UNIQUE INDEX "User_whatsappId_key" ON "User"("whatsappId");

-- AddForeignKey
ALTER TABLE "NotificationSettings" ADD CONSTRAINT "NotificationSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledNotification" ADD CONSTRAINT "ScheduledNotification_settingsId_fkey" FOREIGN KEY ("settingsId") REFERENCES "NotificationSettings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
