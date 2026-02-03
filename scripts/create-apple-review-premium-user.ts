#!/usr/bin/env node

/**
 * Script pour créer (ou mettre à jour) un compte dédié
 * à l'équipe de review Apple, déjà en mode Premium.
 *
 * Usage:
 *   pnpm ts-node scripts/create-apple-review-premium-user.ts
 *   ou
 *   node -r ts-node/register scripts/create-apple-review-premium-user.ts
 *
 * Le script est idempotent :
 * - s'il n'y a pas d'utilisateur avec cet email, il le crée
 * - s'il existe déjà, il met simplement à jour le mot de passe et le statut premium
 */

import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import bcrypt from 'bcryptjs';

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

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message: string) {
  log(`✅ ${message}`, 'green');
}

function logError(message: string) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message: string) {
  log(`ℹ️  ${message}`, 'blue');
}

function logWarning(message: string) {
  log(`⚠️  ${message}`, 'yellow');
}

// Paramètres du compte Apple Review
const APPLE_REVIEW_EMAIL = process.env.APPLE_REVIEW_EMAIL || 'apple-review@productif.io';
const APPLE_REVIEW_PASSWORD = process.env.APPLE_REVIEW_PASSWORD || 'Productif-Review-2026';
const APPLE_REVIEW_NAME = process.env.APPLE_REVIEW_NAME || 'Apple App Review';

async function main() {
  try {
    console.log('\n' + '='.repeat(70));
    log('CREATION / MISE A JOUR COMPTE APPLE REVIEW (PREMIUM)', 'bright');
    console.log('='.repeat(70) + '\n');

    logInfo('Paramètres du compte:');
    console.log(`   Email: ${APPLE_REVIEW_EMAIL}`);
    console.log(`   Nom:   ${APPLE_REVIEW_NAME}`);
    console.log(`   Mot de passe (à communiquer à Apple): ${APPLE_REVIEW_PASSWORD}\n`);

    // Normaliser l'email
    const email = APPLE_REVIEW_EMAIL.trim().toLowerCase();

    // Vérifier si l'utilisateur existe déjà
    logInfo(`Recherche de l'utilisateur: ${email}`);
    let user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        subscriptionStatus: true,
        subscriptionTier: true,
        stripeSubscriptionId: true,
        subscriptionEndDate: true,
      },
    });

    const now = new Date();
    // On donne une longue période pour éviter tout problème pendant les reviews
    const subscriptionEndDate = new Date(now.getTime() + 5 * 365 * 24 * 60 * 60 * 1000); // 5 ans

    if (!user) {
      logWarning('Aucun utilisateur trouvé avec cet email, création en cours...');

      const hashedPassword = await bcrypt.hash(APPLE_REVIEW_PASSWORD, 10);

      user = await prisma.user.create({
        data: {
          name: APPLE_REVIEW_NAME,
          email,
          password: hashedPassword,
          role: 'USER',
          subscriptionStatus: 'active',
          subscriptionTier: 'pro',
          subscriptionEndDate,
          convertedAt: now,
        },
        select: {
          id: true,
          email: true,
          name: true,
          subscriptionStatus: true,
          subscriptionTier: true,
          stripeSubscriptionId: true,
          subscriptionEndDate: true,
        },
      });

      logSuccess('Utilisateur Apple Review créé et mis en Premium.');
    } else {
      logSuccess(`Utilisateur existant trouvé: ${user.email}`);
      console.log('\n📊 Statut actuel:');
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Name: ${user.name || 'N/A'}`);
      console.log(`   subscriptionStatus: ${user.subscriptionStatus || 'null (freemium)'}`);
      console.log(`   subscriptionTier: ${user.subscriptionTier || 'null (freemium)'}`);
      console.log(`   stripeSubscriptionId: ${user.stripeSubscriptionId || 'null'}`);
      console.log(`   subscriptionEndDate: ${user.subscriptionEndDate || 'null'}`);

      logInfo('\nMise à jour du mot de passe et passage en Premium...');

      const hashedPassword = await bcrypt.hash(APPLE_REVIEW_PASSWORD, 10);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          subscriptionStatus: 'active',
          subscriptionTier: 'pro',
          subscriptionEndDate,
          convertedAt: now,
        },
      });

      logSuccess('Compte Apple Review mis à jour et en mode Premium.');
    }

    // Vérifier le nouveau statut
    const updatedUser = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        subscriptionStatus: true,
        subscriptionTier: true,
        stripeSubscriptionId: true,
        subscriptionEndDate: true,
      },
    });

    console.log('\n📊 Statut final du compte Apple Review:');
    console.log(`   ID: ${updatedUser?.id}`);
    console.log(`   Email: ${updatedUser?.email}`);
    console.log(`   Name: ${updatedUser?.name}`);
    console.log(`   subscriptionStatus: ${updatedUser?.subscriptionStatus}`);
    console.log(`   subscriptionTier: ${updatedUser?.subscriptionTier}`);
    console.log(`   subscriptionEndDate: ${updatedUser?.subscriptionEndDate}`);
    console.log(`   stripeSubscriptionId: ${updatedUser?.stripeSubscriptionId || 'null'}`);

    console.log('\n' + '='.repeat(70));
    logSuccess('Le compte Apple Review est prêt et en mode Premium ✅');
    console.log('='.repeat(70) + '\n');

    logInfo('Identifiants à fournir à Apple:');
    console.log(`   Email: ${APPLE_REVIEW_EMAIL}`);
    console.log(`   Mot de passe: ${APPLE_REVIEW_PASSWORD}\n`);
  } catch (error: any) {
    logError(`Erreur: ${error.message}`);
    if (error?.stack) {
      console.error(error.stack);
    }
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

