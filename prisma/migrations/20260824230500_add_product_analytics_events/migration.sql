CREATE TABLE "product_analytics_events" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "eventName" TEXT NOT NULL,
  "params" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "product_analytics_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "product_analytics_events_userId_idx" ON "product_analytics_events"("userId");
CREATE INDEX "product_analytics_events_eventName_idx" ON "product_analytics_events"("eventName");
CREATE INDEX "product_analytics_events_createdAt_idx" ON "product_analytics_events"("createdAt");

ALTER TABLE "product_analytics_events"
  ADD CONSTRAINT "product_analytics_events_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
