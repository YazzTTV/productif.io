-- CreateTable
CREATE TABLE "scan_captures" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    "email" TEXT,
    "sessionId" TEXT,
    "query" TEXT,
    "sourceUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "error" TEXT,

    "attribution" JSONB,
    "ocrText" TEXT,
    "aiJson" JSONB,

    "imageMime" TEXT,
    "imageData" BYTEA,

    CONSTRAINT "scan_captures_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "scan_captures_email_idx" ON "scan_captures"("email");

-- CreateIndex
CREATE INDEX "scan_captures_sessionId_idx" ON "scan_captures"("sessionId");

-- CreateIndex
CREATE INDEX "scan_captures_status_idx" ON "scan_captures"("status");
