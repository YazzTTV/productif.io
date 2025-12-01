-- CreateTable
CREATE TABLE "OnboardingData" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mainGoal" TEXT,
    "role" TEXT,
    "frustration" TEXT,
    "language" TEXT DEFAULT 'fr',
    "whatsappNumber" TEXT,
    "whatsappConsent" BOOLEAN NOT NULL DEFAULT false,
    "diagBehavior" TEXT,
    "timeFeeling" TEXT,
    "phoneHabit" TEXT,
    "offer" TEXT,
    "utmParams" JSONB,
    "emailFallback" TEXT,
    "billingCycle" TEXT,
    "currentStep" INTEGER DEFAULT 1,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OnboardingData_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OnboardingData_userId_key" ON "OnboardingData"("userId");

-- CreateIndex
CREATE INDEX "OnboardingData_userId_idx" ON "OnboardingData"("userId");

-- AddForeignKey
ALTER TABLE "OnboardingData" ADD CONSTRAINT "OnboardingData_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
