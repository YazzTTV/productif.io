-- Migration restored from production history.
--
-- This migration exists in the production _prisma_migrations table but was
-- missing from the local repository. Keep it idempotent so fresh databases get
-- the attribution/affiliate schema while existing production databases remain
-- unchanged if the SQL is ever evaluated manually.

ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "referredBy" TEXT,
ADD COLUMN IF NOT EXISTS "attributionSource" TEXT,
ADD COLUMN IF NOT EXISTS "attributionProvider" TEXT,
ADD COLUMN IF NOT EXISTS "attributionData" JSONB,
ADD COLUMN IF NOT EXISTS "attributedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "installId" TEXT,
ADD COLUMN IF NOT EXISTS "ambassadorTier" TEXT,
ADD COLUMN IF NOT EXISTS "ambassadorScore" INTEGER,
ADD COLUMN IF NOT EXISTS "ambassadorVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "ambassadorScoredAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "User_referredBy_idx" ON "User"("referredBy");

CREATE TABLE IF NOT EXISTS "subscription_events" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "eventName" TEXT NOT NULL,
  "productId" TEXT,
  "transactionId" TEXT,
  "price" DOUBLE PRECISION,
  "currency" TEXT DEFAULT 'EUR',
  "provider" TEXT NOT NULL DEFAULT 'superwall',
  "rawPayload" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "subscription_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "subscription_events_transactionId_key"
ON "subscription_events"("transactionId");

CREATE INDEX IF NOT EXISTS "subscription_events_userId_idx"
ON "subscription_events"("userId");

CREATE INDEX IF NOT EXISTS "subscription_events_eventName_idx"
ON "subscription_events"("eventName");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'subscription_events_userId_fkey'
  ) THEN
    ALTER TABLE "subscription_events"
    ADD CONSTRAINT "subscription_events_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "commission_ledger" (
  "id" TEXT NOT NULL,
  "affiliateId" TEXT NOT NULL,
  "referredUserId" TEXT NOT NULL,
  "subscriptionEventId" TEXT,
  "amountGross" DOUBLE PRECISION NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'EUR',
  "commissionRate" DOUBLE PRECISION NOT NULL DEFAULT 0.20,
  "commissionAmount" DOUBLE PRECISION NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "eligibleAt" TIMESTAMP(3),
  "paidAt" TIMESTAMP(3),
  "reversedAt" TIMESTAMP(3),
  "reverseReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "commission_ledger_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "commission_ledger_affiliateId_idx"
ON "commission_ledger"("affiliateId");

CREATE INDEX IF NOT EXISTS "commission_ledger_status_idx"
ON "commission_ledger"("status");

CREATE INDEX IF NOT EXISTS "commission_ledger_referredUserId_idx"
ON "commission_ledger"("referredUserId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'commission_ledger_referredUserId_fkey'
  ) THEN
    ALTER TABLE "commission_ledger"
    ADD CONSTRAINT "commission_ledger_referredUserId_fkey"
    FOREIGN KEY ("referredUserId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'commission_ledger_subscriptionEventId_fkey'
  ) THEN
    ALTER TABLE "commission_ledger"
    ADD CONSTRAINT "commission_ledger_subscriptionEventId_fkey"
    FOREIGN KEY ("subscriptionEventId") REFERENCES "subscription_events"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "creator_applications" (
  "id" TEXT NOT NULL,
  "firstName" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "country" TEXT NOT NULL,
  "platform" TEXT NOT NULL,
  "handle" TEXT NOT NULL,
  "followers" TEXT NOT NULL,
  "motivation" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "reviewedAt" TIMESTAMP(3),
  "userId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "creator_applications_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "creator_applications_email_key"
ON "creator_applications"("email");

CREATE UNIQUE INDEX IF NOT EXISTS "creator_applications_userId_key"
ON "creator_applications"("userId");

CREATE INDEX IF NOT EXISTS "creator_applications_status_idx"
ON "creator_applications"("status");

CREATE INDEX IF NOT EXISTS "creator_applications_email_idx"
ON "creator_applications"("email");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'creator_applications_userId_fkey'
  ) THEN
    ALTER TABLE "creator_applications"
    ADD CONSTRAINT "creator_applications_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
