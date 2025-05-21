-- This is an empty migration.

-- CreateTable
CREATE TABLE "api_tokens" (
  "id" TEXT NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "token" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "description" TEXT,
  "scopes" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "lastUsed" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "api_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "api_tokens_token_key" ON "api_tokens"("token");

-- CreateIndex
CREATE INDEX "api_tokens_userId_idx" ON "api_tokens"("userId");

-- AddForeignKey
ALTER TABLE "api_tokens" ADD CONSTRAINT "api_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;