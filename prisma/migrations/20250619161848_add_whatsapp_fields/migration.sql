-- AlterTable
ALTER TABLE "UserNotificationPreference" ADD COLUMN     "whatsappEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "whatsappNumber" TEXT;
