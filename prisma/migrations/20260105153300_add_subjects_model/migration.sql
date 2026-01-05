-- CreateTable
CREATE TABLE IF NOT EXISTS "subjects" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "coefficient" INTEGER NOT NULL DEFAULT 1,
    "deadline" TIMESTAMP(3),
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subjects_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "subjects_userId_idx" ON "subjects"("userId");

-- AddColumn to Task table (subjectId)
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "subjectId" TEXT;

-- AddForeignKey for Task.subjectId
ALTER TABLE "Task" ADD CONSTRAINT "Task_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex for Task.subjectId
CREATE INDEX IF NOT EXISTS "Task_subjectId_idx" ON "Task"("subjectId");

-- Remove old subject column if it exists (it's a String field, we're replacing it with a relation)
-- Note: This will preserve data if needed, but we're moving to a proper relation
-- ALTER TABLE "Task" DROP COLUMN IF EXISTS "subject";
