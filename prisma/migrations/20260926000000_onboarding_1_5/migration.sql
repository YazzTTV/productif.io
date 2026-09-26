-- Onboarding 1.5 : "ton planning, puis l'essai". Uniquement des ajouts, avec
-- valeur par defaut : aucune ligne existante ne change de sens.

-- Reponses du questionnaire, relues sur l'ecran du planning et avant le paywall.
ALTER TABLE "User" ADD COLUMN "onboardingAnswers" JSONB;
-- Idempotence de POST /api/onboarding/plan : une requete rejouee (reseau lent,
-- app tuee puis relancee) ne recree pas les matieres.
ALTER TABLE "User" ADD COLUMN "onboardingPlanKey" TEXT;
-- Emploi du temps de secours ("tu finis vers 12h, 14h, 16h, 18h ?") quand aucun
-- agenda n'est lisible. Pas dans calendar_busy_snapshots : une ligne par
-- utilisateur, source "apple" seulement, ignoree au bout de 3 jours.
ALTER TABLE "User" ADD COLUMN "weeklyBusy" JSONB;
-- Seances Mode Examen gratuites avec blocage : compteur tenu par le serveur pour
-- pouvoir changer la regle sans nouveau build.
ALTER TABLE "User" ADD COLUMN "examFreeUsed" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "examFreeRefunded" INTEGER NOT NULL DEFAULT 0;
-- Idempotence de POST /api/exam/start : si la reponse se perd apres le decompte,
-- l'app rejoue la meme cle et recoit le meme jeton, sans second decompte.
ALTER TABLE "User" ADD COLUMN "examFreeLastKey" TEXT;
ALTER TABLE "User" ADD COLUMN "examFreeLastToken" TEXT;

-- Seances generiques d'une matiere sans chapitres, supprimees au premier import.
ALTER TABLE "Task" ADD COLUMN "generated" BOOLEAN NOT NULL DEFAULT false;
