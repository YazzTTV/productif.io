#!/usr/bin/env node

/**
 * Script pour mettre un utilisateur en mode premium (enlever le freemium)
 * 
 * Usage: 
 *   node scripts/set-user-premium.js [userId|email]
 *   node scripts/set-user-premium.js [userId|email] --tier pro|premium|starter|enterprise
 */

import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
// Import dynamique pour TypeScript
let resolvePlan, getPlanInfo;
try {
  const plansModule = await import('../lib/plans.ts');
  resolvePlan = plansModule.resolvePlan;
  getPlanInfo = plansModule.getPlanInfo;
} catch (error) {
  // Fallback: implémenter la logique directement
  const PREMIUM_STATUSES = new Set(["active", "trialing", "paid"]);
  const PREMIUM_TIERS = new Set(["pro", "premium", "starter", "enterprise", "paid"]);
  
  resolvePlan = (user) => {
    if (
      (user.subscriptionStatus && PREMIUM_STATUSES.has(user.subscriptionStatus)) ||
      (user.subscriptionTier && PREMIUM_TIERS.has(user.subscriptionTier.toLowerCase())) ||
      user.stripeSubscriptionId
    ) {
      return "premium";
    }
    return "free";
  };
  
  getPlanInfo = (user) => {
    const plan = resolvePlan(user);
    return {
      plan,
      isPremium: plan === "premium",
      limits: {
        focusPerDay: plan === "premium" ? null : 1,
        focusMaxDurationMinutes: plan === "premium" ? null : 30,
        maxHabits: plan === "premium" ? null : 3,
        examModeEnabled: plan === "premium"
      }
    };
  };
}

config();

const prisma = new PrismaClient();

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

async function findUser(identifier) {
  // Essayer par ID d'abord
  let user = await prisma.user.findUnique({
    where: { id: identifier },
    select: {
      id: true,
      email: true,
      name: true,
      subscriptionStatus: true,
      subscriptionTier: true,
      stripeSubscriptionId: true,
      stripeCustomerId: true,
    }
  });

  // Si pas trouvé, essayer par email
  if (!user) {
    user = await prisma.user.findUnique({
      where: { email: identifier },
      select: {
        id: true,
        email: true,
        name: true,
        subscriptionStatus: true,
        subscriptionTier: true,
        stripeSubscriptionId: true,
        stripeCustomerId: true,
      }
    });
  }

  return user;
}

async function setUserPremium(userId, tier = 'pro') {
  const validTiers = ['pro', 'premium', 'starter', 'enterprise', 'paid'];
  
  if (!validTiers.includes(tier.toLowerCase())) {
    throw new Error(`Tier invalide. Valeurs acceptées: ${validTiers.join(', ')}`);
  }

  const now = new Date();
  const subscriptionEndDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 an

  await prisma.user.update({
    where: { id: userId },
    data: {
      subscriptionStatus: 'active',
      subscriptionTier: tier.toLowerCase(),
      subscriptionEndDate,
      convertedAt: now,
      // Optionnel: créer un stripeSubscriptionId factice pour les tests
      // stripeSubscriptionId: `manual_${userId}_${Date.now()}`,
    }
  });

  logSuccess(`Utilisateur mis en mode premium (tier: ${tier})`);
}

async function setUserFreemium(userId) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      subscriptionStatus: 'free',
      subscriptionTier: 'free',
      subscriptionEndDate: null,
      stripeSubscriptionId: null,
    }
  });

  logSuccess('Utilisateur remis en mode freemium');
}

async function main() {
  try {
    console.log('\n' + '='.repeat(70));
    log('GESTION DU STATUT PREMIUM/FREEMIUM', 'bright');
    console.log('='.repeat(70) + '\n');

    const args = process.argv.slice(2);
    const identifier = args.find(arg => !arg.startsWith('--'));
    const tierArg = args.find(arg => arg.startsWith('--tier='));
    const tier = tierArg ? tierArg.split('=')[1] : 'pro';
    const setFreemium = args.includes('--freemium');

    if (!identifier) {
      logError('Usage: node scripts/set-user-premium.js [userId|email] [--tier=pro|premium|starter|enterprise] [--freemium]');
      logInfo('Exemples:');
      logInfo('  node scripts/set-user-premium.js cma6li3j1000ca64sisjbjyfs');
      logInfo('  node scripts/set-user-premium.js noah.lugagne@free.fr --tier=premium');
      logInfo('  node scripts/set-user-premium.js cma6li3j1000ca64sisjbjyfs --freemium');
      process.exit(1);
    }

    // Trouver l'utilisateur
    logInfo(`Recherche de l'utilisateur: ${identifier}`);
    const user = await findUser(identifier);

    if (!user) {
      logError(`Utilisateur non trouvé: ${identifier}`);
      process.exit(1);
    }

    logSuccess(`Utilisateur trouvé: ${user.email || user.name || user.id}`);
    console.log('\n📊 Statut actuel:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email || 'N/A'}`);
    console.log(`   Name: ${user.name || 'N/A'}`);
    console.log(`   subscriptionStatus: ${user.subscriptionStatus || 'null (freemium)'}`);
    console.log(`   subscriptionTier: ${user.subscriptionTier || 'null (freemium)'}`);
    console.log(`   stripeSubscriptionId: ${user.stripeSubscriptionId || 'null'}`);
    
    // Vérifier le plan actuel
    const currentPlan = resolvePlan(user);
    const planInfo = getPlanInfo(user);
    console.log(`   Plan actuel: ${currentPlan} (${planInfo.isPremium ? 'Premium' : 'Freemium'})`);

    if (setFreemium) {
      // Remettre en freemium
      console.log('\n🔄 Remise en mode freemium...');
      await setUserFreemium(user.id);
    } else {
      // Mettre en premium
      console.log(`\n🔄 Passage en mode premium (tier: ${tier})...`);
      await setUserPremium(user.id, tier);
    }

    // Vérifier le nouveau statut
    const updatedUser = await findUser(user.id);
    const newPlan = resolvePlan(updatedUser);
    const newPlanInfo = getPlanInfo(updatedUser);

    console.log('\n📊 Nouveau statut:');
    console.log(`   subscriptionStatus: ${updatedUser.subscriptionStatus || 'null'}`);
    console.log(`   subscriptionTier: ${updatedUser.subscriptionTier || 'null'}`);
    console.log(`   Plan: ${newPlan} (${newPlanInfo.isPremium ? 'Premium ✅' : 'Freemium'})`);

    if (newPlanInfo.isPremium) {
      logSuccess('\n✅ L\'utilisateur est maintenant en mode Premium !');
      logInfo('Limites Premium:');
      console.log(`   - Focus par jour: ${newPlanInfo.limits.focusPerDay === null ? 'Illimité' : newPlanInfo.limits.focusPerDay}`);
      console.log(`   - Durée max focus: ${newPlanInfo.limits.focusMaxDurationMinutes === null ? 'Illimitée' : newPlanInfo.limits.focusMaxDurationMinutes + ' min'}`);
      console.log(`   - Habitudes max: ${newPlanInfo.limits.maxHabits === null ? 'Illimitées' : newPlanInfo.limits.maxHabits}`);
      console.log(`   - Exam Mode: ${newPlanInfo.limits.examModeEnabled ? 'Activé ✅' : 'Désactivé'}`);
    } else {
      logWarning('\n⚠️  L\'utilisateur est toujours en mode Freemium');
    }

  } catch (error) {
    logError(`Erreur: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Erreur fatale:', error);
    process.exit(1);
  });
