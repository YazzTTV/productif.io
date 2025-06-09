const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkPaymentStatus() {
  try {
    console.log('🔍 Vérification des données de paiement et de waitlist...\n');

    // 1. Vérifier les entrées de waitlist
    console.log('📋 Entrées Waitlist:');
    const waitlistEntries = await prisma.waitlistEntry.findMany({
      orderBy: { createdAt: 'desc' }
    });

    if (waitlistEntries.length === 0) {
      console.log('   Aucune entrée waitlist trouvée');
    } else {
      waitlistEntries.forEach((entry, index) => {
        console.log(`   ${index + 1}. Email: ${entry.email}`);
        console.log(`      Status: ${entry.status}`);
        console.log(`      Étape: ${entry.currentStep}`);
        console.log(`      Stripe Session: ${entry.stripeSessionId || 'N/A'}`);
        console.log(`      Créé: ${entry.createdAt.toISOString()}`);
        console.log(`      Mis à jour: ${entry.updatedAt.toISOString()}`);
        console.log('');
      });
    }

    // 2. Vérifier les utilisateurs avec informations Stripe
    console.log('👥 Utilisateurs avec informations Stripe:');
    const usersWithStripe = await prisma.user.findMany({
      where: {
        OR: [
          { stripeCustomerId: { not: null } },
          { stripeSubscriptionId: { not: null } },
          { subscriptionStatus: { not: null } }
        ]
      },
      select: {
        id: true,
        email: true,
        name: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        subscriptionStatus: true,
        trialEndsAt: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    if (usersWithStripe.length === 0) {
      console.log('   Aucun utilisateur avec informations Stripe trouvé');
    } else {
      usersWithStripe.forEach((user, index) => {
        console.log(`   ${index + 1}. Email: ${user.email}`);
        console.log(`      Nom: ${user.name || 'N/A'}`);
        console.log(`      ID: ${user.id}`);
        console.log(`      Stripe Customer ID: ${user.stripeCustomerId || 'N/A'}`);
        console.log(`      Stripe Subscription ID: ${user.stripeSubscriptionId || 'N/A'}`);
        console.log(`      Status d'abonnement: ${user.subscriptionStatus || 'N/A'}`);
        console.log(`      Fin d'essai: ${user.trialEndsAt ? user.trialEndsAt.toISOString() : 'N/A'}`);
        console.log(`      Créé: ${user.createdAt.toISOString()}`);
        console.log('');
      });
    }

    // 3. Chercher des correspondances entre waitlist et utilisateurs
    console.log('🔗 Correspondances Email Waitlist ↔ Utilisateurs:');
    const allUsers = await prisma.user.findMany({
      select: { email: true, name: true, createdAt: true }
    });

    const emailMatches = [];
    waitlistEntries.forEach(waitlistEntry => {
      const matchingUser = allUsers.find(user => user.email === waitlistEntry.email);
      if (matchingUser) {
        emailMatches.push({
          email: waitlistEntry.email,
          waitlistStatus: waitlistEntry.status,
          waitlistStep: waitlistEntry.currentStep,
          userExists: true,
          userName: matchingUser.name,
          userCreated: matchingUser.createdAt
        });
      }
    });

    if (emailMatches.length === 0) {
      console.log('   Aucune correspondance trouvée');
    } else {
      emailMatches.forEach((match, index) => {
        console.log(`   ${index + 1}. Email: ${match.email}`);
        console.log(`      Waitlist Status: ${match.waitlistStatus}`);
        console.log(`      Waitlist Étape: ${match.waitlistStep}`);
        console.log(`      Utilisateur: ${match.userName || 'Nom non défini'}`);
        console.log(`      Utilisateur créé: ${match.userCreated.toISOString()}`);
        console.log('');
      });
    }

    // 4. Résumé
    console.log('📊 Résumé:');
    console.log(`   Total entrées waitlist: ${waitlistEntries.length}`);
    console.log(`   Entrées payées: ${waitlistEntries.filter(e => e.status === 'paye').length}`);
    console.log(`   Total utilisateurs: ${allUsers.length}`);
    console.log(`   Utilisateurs avec Stripe: ${usersWithStripe.length}`);
    console.log(`   Correspondances Email: ${emailMatches.length}`);

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  checkPaymentStatus();
}

module.exports = { checkPaymentStatus }; 