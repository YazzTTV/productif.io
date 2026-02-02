#!/usr/bin/env node

/**
 * Script pour supprimer les N derniers utilisateurs créés
 * Usage: node scripts/delete-last-users.js [nombre] [--force]
 * 
 * Options:
 *   nombre: Nombre d'utilisateurs à supprimer (défaut: 10)
 *   --force: Supprime sans demander de confirmation
 * 
 * Protection: Ne supprime pas les utilisateurs avec le rôle SUPER_ADMIN ou ADMIN
 */

import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import readline from 'readline';

config();

const prisma = new PrismaClient();

// Fonction pour créer une interface readline
function createReadlineInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

// Fonction pour demander une confirmation
function askConfirmation(rl, question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.toLowerCase() === 'oui' || answer.toLowerCase() === 'o' || answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

async function deleteLastUsers(limit = 10, force = false) {
  const rl = createReadlineInterface();
  
  try {
    console.log(`🔍 Récupération des ${limit} derniers utilisateurs créés...\n`);

    // Récupérer les utilisateurs à supprimer
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
        role: true,
        subscriptionStatus: true,
        subscriptionTier: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        managedCompanyId: true,
        googleCalendarToken: {
          select: {
            id: true,
          }
        }
      }
    });

    if (users.length === 0) {
      console.log('❌ Aucun utilisateur trouvé dans la base de données');
      return;
    }

    // Séparer les utilisateurs selon leur rôle
    const adminUsers = users.filter(u => u.role === 'SUPER_ADMIN' || u.role === 'ADMIN');
    const companyAdmins = users.filter(u => u.managedCompanyId !== null);
    const regularUsers = users.filter(u => 
      u.role !== 'SUPER_ADMIN' && 
      u.role !== 'ADMIN' && 
      u.managedCompanyId === null
    );

    console.log(`✅ ${users.length} utilisateur(s) trouvé(s):\n`);
    console.log('═'.repeat(100));

    // Afficher les utilisateurs qui seront supprimés
    regularUsers.forEach((user, index) => {
      const isGoogleAccount = !user.password || user.password === '';
      const hasGoogleCalendar = user.googleCalendarToken !== null;
      
      console.log(`\n${index + 1}. ${user.name || 'Sans nom'}`);
      console.log('─'.repeat(100));
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   🆔 ID: ${user.id}`);
      console.log(`   🔐 Type: ${isGoogleAccount ? '🔵 Google OAuth' : '📝 Email/Password'}`);
      if (hasGoogleCalendar) {
        console.log(`   📅 Google Calendar: ✅ Connecté`);
      }
      console.log(`   👤 Rôle: ${user.role || 'USER'}`);
      console.log(`   📅 Créé le: ${user.createdAt.toLocaleString('fr-FR', { 
        dateStyle: 'full', 
        timeStyle: 'short' 
      })}`);
      
      const plan = user.stripeSubscriptionId || 
                   (user.subscriptionStatus && ['active', 'trialing', 'paid'].includes(user.subscriptionStatus)) ||
                   (user.subscriptionTier && ['pro', 'premium', 'starter', 'enterprise', 'paid'].includes(user.subscriptionTier))
                   ? 'Premium' : 'Free';
      console.log(`   💳 Plan: ${plan}`);
    });

    // Afficher les utilisateurs protégés
    if (adminUsers.length > 0) {
      console.log('\n\n⚠️  UTILISATEURS PROTÉGÉS (ne seront PAS supprimés):');
      console.log('═'.repeat(100));
      adminUsers.forEach((user, index) => {
        console.log(`\n${index + 1}. ${user.name || 'Sans nom'} (${user.role})`);
        console.log(`   📧 Email: ${user.email}`);
        console.log(`   🆔 ID: ${user.id}`);
      });
    }

    if (companyAdmins.length > 0) {
      console.log('\n\n⚠️  ADMINISTRATEURS D\'ENTREPRISE (ne seront PAS supprimés):');
      console.log('═'.repeat(100));
      companyAdmins.forEach((user, index) => {
        console.log(`\n${index + 1}. ${user.name || 'Sans nom'}`);
        console.log(`   📧 Email: ${user.email}`);
        console.log(`   🆔 ID: ${user.id}`);
      });
    }

    console.log('\n' + '═'.repeat(100));
    console.log(`\n📊 Résumé:`);
    console.log(`   ✅ À supprimer: ${regularUsers.length} utilisateur(s)`);
    if (adminUsers.length > 0) {
      console.log(`   ⚠️  Protégés (admins): ${adminUsers.length} utilisateur(s)`);
    }
    if (companyAdmins.length > 0) {
      console.log(`   ⚠️  Protégés (admin entreprise): ${companyAdmins.length} utilisateur(s)`);
    }

    if (regularUsers.length === 0) {
      console.log('\n❌ Aucun utilisateur à supprimer (tous sont protégés)');
      return;
    }

    // Demander confirmation
    if (!force) {
      console.log('\n⚠️  ATTENTION: Cette action est irréversible !');
      const confirmed = await askConfirmation(
        rl,
        `\nÊtes-vous sûr de vouloir supprimer ${regularUsers.length} utilisateur(s) ? (oui/non): `
      );

      if (!confirmed) {
        console.log('\n❌ Suppression annulée');
        return;
      }
    }

    // Supprimer les utilisateurs
    console.log('\n🗑️  Suppression en cours...\n');
    const deletedUsers = [];
    const errors = [];

    for (const user of regularUsers) {
      try {
        // Supprimer manuellement les données liées qui n'ont pas onDelete: Cascade
        // 1. Supprimer les habitudes (et leurs entrées via cascade)
        await prisma.habit.deleteMany({
          where: { userId: user.id }
        });

        // 2. Supprimer la gamification
        await prisma.userGamification.deleteMany({
          where: { userId: user.id }
        });

        // 3. Supprimer l'utilisateur (les autres relations ont onDelete: Cascade)
        await prisma.user.delete({
          where: { id: user.id }
        });
        deletedUsers.push(user);
        console.log(`✅ Supprimé: ${user.email} (${user.id})`);
      } catch (error) {
        errors.push({ user, error: error.message });
        console.error(`❌ Erreur lors de la suppression de ${user.email}: ${error.message}`);
      }
    }

    // Résumé final
    console.log('\n' + '═'.repeat(100));
    console.log('\n📊 Résumé de la suppression:');
    console.log(`   ✅ Supprimés avec succès: ${deletedUsers.length}`);
    if (errors.length > 0) {
      console.log(`   ❌ Erreurs: ${errors.length}`);
      errors.forEach(({ user, error }) => {
        console.log(`      - ${user.email}: ${error}`);
      });
    }
    if (adminUsers.length > 0 || companyAdmins.length > 0) {
      console.log(`   ⚠️  Protégés (non supprimés): ${adminUsers.length + companyAdmins.length}`);
    }

  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
    process.exit(1);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

// Parser les arguments
const args = process.argv.slice(2);
const limitArg = args.find(arg => !arg.startsWith('--'));
const limit = limitArg ? parseInt(limitArg) : 10;
const force = args.includes('--force');

if (isNaN(limit) || limit <= 0) {
  console.error('❌ Erreur: Le nombre doit être un entier positif');
  console.log('\nUsage: node scripts/delete-last-users.js [nombre] [--force]');
  process.exit(1);
}

deleteLastUsers(limit, force);
