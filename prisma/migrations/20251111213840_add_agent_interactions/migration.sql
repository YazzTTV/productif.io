-- AlterTable
ALTER TABLE "User" ALTER COLUMN "subscriptionStatus" SET DEFAULT 'trial';

-- CreateTable
CREATE TABLE "AgentInteraction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "intentType" TEXT NOT NULL,
    "intentCategory" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "actionExecuted" TEXT,
    "handled" BOOLEAN NOT NULL DEFAULT false,
    "emotionalContext" TEXT,
    "responseTime" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentInteraction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AgentInteraction_userId_createdAt_idx" ON "AgentInteraction"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AgentInteraction_intentCategory_idx" ON "AgentInteraction"("intentCategory");

-- CreateIndex
CREATE INDEX "AgentInteraction_emotionalContext_idx" ON "AgentInteraction"("emotionalContext");

-- AddForeignKey
ALTER TABLE "AgentInteraction" ADD CONSTRAINT "AgentInteraction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
