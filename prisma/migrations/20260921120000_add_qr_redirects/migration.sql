CREATE TABLE "qr_redirects" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "targetUrl" TEXT NOT NULL,
    "label" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "qr_redirects_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "qr_redirect_scans" (
    "id" TEXT NOT NULL,
    "qrRedirectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "referer" TEXT,
    "userAgent" TEXT,
    "ipHash" TEXT,
    "destination" TEXT NOT NULL,
    "query" JSONB,

    CONSTRAINT "qr_redirect_scans_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "qr_redirects_slug_key" ON "qr_redirects"("slug");
CREATE INDEX "qr_redirects_isActive_idx" ON "qr_redirects"("isActive");
CREATE INDEX "qr_redirect_scans_qrRedirectId_idx" ON "qr_redirect_scans"("qrRedirectId");
CREATE INDEX "qr_redirect_scans_createdAt_idx" ON "qr_redirect_scans"("createdAt");

ALTER TABLE "qr_redirect_scans"
ADD CONSTRAINT "qr_redirect_scans_qrRedirectId_fkey"
FOREIGN KEY ("qrRedirectId") REFERENCES "qr_redirects"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "qr_redirects" ("id", "slug", "targetUrl", "label", "description", "isActive", "createdAt", "updatedAt")
VALUES
  (
    'qr_montpellier_bu_richter',
    'montpellier-bu-richter',
    'https://productif.io/mode-examen?utm_source=qr&utm_medium=offline&utm_campaign=montpellier-campus&utm_content=montpellier-bu-richter',
    'Affiche Montpellier - BU Richter',
    'QR dynamique pour les affiches placees a la BU Richter.',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'qr_montpellier_bu_sciences',
    'montpellier-bu-sciences',
    'https://productif.io/mode-examen?utm_source=qr&utm_medium=offline&utm_campaign=montpellier-campus&utm_content=montpellier-bu-sciences',
    'Affiche Montpellier - BU Sciences',
    'QR dynamique pour les affiches placees a la BU Sciences.',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'qr_montpellier_bu_triolet',
    'montpellier-bu-triolet',
    'https://productif.io/mode-examen?utm_source=qr&utm_medium=offline&utm_campaign=montpellier-campus&utm_content=montpellier-bu-triolet',
    'Affiche Montpellier - BU Triolet',
    'QR dynamique pour les affiches placees a la BU Triolet.',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'qr_montpellier_fac_moma',
    'montpellier-fac-moma',
    'https://productif.io/mode-examen?utm_source=qr&utm_medium=offline&utm_campaign=montpellier-campus&utm_content=montpellier-fac-moma',
    'Affiche Montpellier - Fac MOMA',
    'QR dynamique pour les affiches placees a la fac MOMA.',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'qr_montpellier_fac_eco',
    'montpellier-fac-eco',
    'https://productif.io/mode-examen?utm_source=qr&utm_medium=offline&utm_campaign=montpellier-campus&utm_content=montpellier-fac-eco',
    'Affiche Montpellier - Fac Eco',
    'QR dynamique pour les affiches placees a la fac d''economie.',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'qr_montpellier_fac_medecine',
    'montpellier-fac-medecine',
    'https://productif.io/mode-examen?utm_source=qr&utm_medium=offline&utm_campaign=montpellier-campus&utm_content=montpellier-fac-medecine',
    'Affiche Montpellier - Fac Medecine',
    'QR dynamique pour les affiches placees a la fac de medecine.',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'qr_montpellier_fac_droit',
    'montpellier-fac-droit',
    'https://productif.io/mode-examen?utm_source=qr&utm_medium=offline&utm_campaign=montpellier-campus&utm_content=montpellier-fac-droit',
    'Affiche Montpellier - Fac Droit',
    'QR dynamique pour les affiches placees a la fac de droit.',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  )
ON CONFLICT ("slug") DO UPDATE SET
  "targetUrl" = EXCLUDED."targetUrl",
  "label" = EXCLUDED."label",
  "description" = EXCLUDED."description",
  "isActive" = EXCLUDED."isActive",
  "updatedAt" = CURRENT_TIMESTAMP;
