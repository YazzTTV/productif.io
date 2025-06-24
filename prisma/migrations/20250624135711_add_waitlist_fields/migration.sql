-- AlterTable
ALTER TABLE "WaitlistEntry" ADD COLUMN     "currentStep" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "motivation" TEXT,
ADD COLUMN     "phone" TEXT;
