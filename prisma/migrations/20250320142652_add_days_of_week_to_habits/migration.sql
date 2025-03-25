-- AlterTable
ALTER TABLE "Habit" ADD COLUMN     "daysOfWeek" TEXT[] DEFAULT ARRAY[]::TEXT[];
