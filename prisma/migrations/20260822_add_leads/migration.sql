-- Capture d'email des pages publiques.
--
-- Ecrit en IF NOT EXISTS volontairement : la table est creee a la main en
-- production le 22 aout pour debloquer la page avant le lancement Product Hunt
-- du 26. Cette migration doit donc rester un no-op si elle est rejouee plus
-- tard par `prisma migrate deploy`, au lieu d'echouer sur "table existe deja".

CREATE TABLE IF NOT EXISTS "leads" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'mode-examen',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "leads_email_key" ON "leads"("email");
CREATE INDEX IF NOT EXISTS "leads_source_idx" ON "leads"("source");
CREATE INDEX IF NOT EXISTS "leads_createdAt_idx" ON "leads"("createdAt");
