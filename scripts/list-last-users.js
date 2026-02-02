#!/usr/bin/env node

/**
 * Script pour afficher les 10 derniers utilisateurs créés
 * Usage: node scripts/list-last-users.js [nombre]
 */

import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';

config();

const prisma = new PrismaClient();

async function listLastUsers(limit = 10) {
  try {
    console.log(`🔍 Récupération des ${limit} derniers utilisateurs créés...\n`);

    const users = await prisma.user.findMany({
      take: limit,
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        whatsappNumber: true,
        createdAt: true,
        updatedAt: true,
        role: true,
        subscriptionStatus: true,
        subscriptionTier: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        googleCalendarToken: {
          select: {
            id: true,
            createdAt: true,
          }
        }
      }
    });

    if (users.length === 0) {
      console.log('❌ Aucun utilisateur trouvé dans la base de données');
      return;
    }

    console.log(`✅ ${users.length} utilisateur(s) trouvé(s):\n`);
    console.log('═'.repeat(100));

    users.forEach((user, index) => {
      // Détecter si c'est un compte Google (password vide)
      const isGoogleAccount = !user.password || user.password === '';
      const hasGoogleCalendar = user.googleCalendarToken !== null;
      
      console.log(`\n${index + 1}. ${user.name || 'Sans nom'}`);
      console.log('─'.repeat(100));
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   🆔 ID: ${user.id}`);
      console.log(`   🔐 Type de compte: ${isGoogleAccount ? '🔵 Google OAuth' : '📝 Email/Password'}`);
      if (hasGoogleCalendar) {
        console.log(`   📅 Google Calendar: ✅ Connecté`);
      }
      console.log(`   📱 WhatsApp: ${user.whatsappNumber || 'Non renseigné'}`);
      console.log(`   👤 Rôle: ${user.role || 'USER'}`);
      console.log(`   📅 Créé le: ${user.createdAt.toLocaleString('fr-FR', { 
        dateStyle: 'full', 
        timeStyle: 'short' 
      })}`);
      console.log(`   🔄 Modifié le: ${user.updatedAt.toLocaleString('fr-FR', { 
        dateStyle: 'full', 
        timeStyle: 'short' 
      })}`);
      
      // Informations d'abonnement
      const plan = user.stripeSubscriptionId || 
                   (user.subscriptionStatus && ['active', 'trialing', 'paid'].includes(user.subscriptionStatus)) ||
                   (user.subscriptionTier && ['pro', 'premium', 'starter', 'enterprise', 'paid'].includes(user.subscriptionTier))
                   ? 'Premium' : 'Free';
      
      console.log(`   💳 Plan: ${plan}`);
      if (user.subscriptionStatus) {
        console.log(`   📊 Statut abonnement: ${user.subscriptionStatus}`);
      }
      if (user.subscriptionTier) {
        console.log(`   🎯 Tier: ${user.subscriptionTier}`);
      }
      if (user.stripeCustomerId) {
        console.log(`   💰 Stripe Customer ID: ${user.stripeCustomerId.substring(0, 20)}...`);
      }
    });

    console.log('\n' + '═'.repeat(100));
    console.log(`\n📊 Total: ${users.length} utilisateur(s)`);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

const limit = parseInt(process.argv[2]) || 10;
listLastUsers(limit);
