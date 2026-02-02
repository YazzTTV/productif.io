#!/usr/bin/env node

/**
 * Script pour mettre l'utilisateur silgadogaetan@gmail.com en mode premium
 */

import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';

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

async function main() {
  try {
    console.log('\n' + '='.repeat(70));
    log('MISE EN MODE PREMIUM - silgadogaetan@gmail.com', 'bright');
    console.log('='.repeat(70) + '\n');

    const email = 'silgadogaetan@gmail.com';

    // Trouver l'utilisateur
    logInfo(`Recherche de l'utilisateur: ${email}`);
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        subscriptionStatus: true,
        subscriptionTier: true,
        stripeSubscriptionId: true,
        stripeCustomerId: true,
        subscriptionEndDate: true,
      }
    });

    if (!user) {
      logError(`Utilisateur non trouvé avec l'email: ${email}`);
      process.exit(1);
    }

    logSuccess(`Utilisateur trouvé: ${user.email}`);
    console.log('\n📊 Statut actuel:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.name || 'N/A'}`);
    console.log(`   subscriptionStatus: ${user.subscriptionStatus || 'null (freemium)'}`);
    console.log(`   subscriptionTier: ${user.subscriptionTier || 'null (freemium)'}`);
    console.log(`   stripeSubscriptionId: ${user.stripeSubscriptionId || 'null'}`);
    console.log(`   subscriptionEndDate: ${user.subscriptionEndDate || 'null'}`);

    // Vérifier si déjà premium
    const isAlreadyPremium = 
      (user.subscriptionStatus && ['active', 'trialing', 'paid'].includes(user.subscriptionStatus)) ||
      (user.subscriptionTier && ['pro', 'premium', 'starter', 'enterprise', 'paid'].includes(user.subscriptionTier.toLowerCase())) ||
      user.stripeSubscriptionId;

    if (isAlreadyPremium) {
      logWarning('L\'utilisateur est déjà en mode premium !');
      console.log('\n📊 Statut actuel (déjà premium):');
      console.log(`   subscriptionStatus: ${user.subscriptionStatus}`);
      console.log(`   subscriptionTier: ${user.subscriptionTier}`);
      console.log(`   stripeSubscriptionId: ${user.stripeSubscriptionId || 'null'}`);
      return;
    }

    // Mettre en premium
    console.log('\n🔄 Passage en mode premium...');
    const now = new Date();
    const subscriptionEndDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 an

    await prisma.user.update({
      where: { id: user.id },
      data: {
        subscriptionStatus: 'active',
        subscriptionTier: 'pro',
        subscriptionEndDate,
        convertedAt: now,
      }
    });

    logSuccess('Utilisateur mis en mode premium (tier: pro)');

    // Vérifier le nouveau statut
    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        subscriptionStatus: true,
        subscriptionTier: true,
        stripeSubscriptionId: true,
        subscriptionEndDate: true,
      }
    });

    console.log('\n📊 Nouveau statut:');
    console.log(`   subscriptionStatus: ${updatedUser.subscriptionStatus}`);
    console.log(`   subscriptionTier: ${updatedUser.subscriptionTier}`);
    console.log(`   subscriptionEndDate: ${updatedUser.subscriptionEndDate}`);
    console.log(`   stripeSubscriptionId: ${updatedUser.stripeSubscriptionId || 'null'}`);

    logSuccess('\n✅ L\'utilisateur est maintenant en mode Premium !');
    logInfo('Limites Premium activées:');
    console.log('   - Focus par jour: Illimité');
    console.log('   - Durée max focus: Illimitée');
    console.log('   - Habitudes max: Illimitées');
    console.log('   - Exam Mode: Activé ✅');

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
