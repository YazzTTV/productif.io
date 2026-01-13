-- Migration: Freemium Model
-- Description: Passage du modèle free trial au modèle freemium
-- Date: 2024-12-19
--
-- Changements:
-- 1. Retrait du default "trial" sur subscriptionStatus pour permettre le modèle freemium
--    (les nouveaux utilisateurs seront en free par défaut, pas en trial)
-- 2. Documentation du modèle freemium dans le schéma Prisma
--
-- Le plan est déterminé par resolvePlan() dans lib/plans.ts:
-- - Premium si: subscriptionStatus in ["active", "trialing", "paid"] 
--            OR subscriptionTier in ["pro", "premium", "starter", "enterprise", "paid"]
--            OR stripeSubscriptionId exists
-- - Free sinon (default)

-- Retirer le default "trial" de subscriptionStatus
-- Les valeurs existantes restent inchangées, seuls les nouveaux utilisateurs n'auront plus de default
ALTER TABLE "User" 
  ALTER COLUMN "subscriptionStatus" DROP DEFAULT;

-- Commentaire sur la colonne pour documenter le modèle freemium
COMMENT ON COLUMN "User"."subscriptionStatus" IS 
  'Plan utilisateur: null = free (freemium), "active"|"trialing"|"paid" = premium, "cancelled"|"expired" = free. Déterminé par resolvePlan() dans lib/plans.ts';

COMMENT ON COLUMN "User"."subscriptionTier" IS 
  'Tier d''abonnement: "starter"|"pro"|"premium"|"enterprise"|"paid" = premium. Utilisé par resolvePlan() pour déterminer le plan.';

COMMENT ON COLUMN "User"."stripeSubscriptionId" IS 
  'ID de l''abonnement Stripe. Présence = premium (utilisé par resolvePlan()).';
