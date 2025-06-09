const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixPaymentStatus(email) {
  try {
    console.log(`🔧 Correction du statut de paiement pour: ${email}`);

    // Trouver l'entrée waitlist
    const waitlistEntry = await prisma.waitlistEntry.findUnique({
      where: { email }
    });

    if (!waitlistEntry) {
      console.log(`❌ Aucune entrée waitlist trouvée pour ${email}`);
      return;
    }

    console.log('📋 Entrée actuelle:');
    console.log(`   Email: ${waitlistEntry.email}`);
    console.log(`   Status: ${waitlistEntry.status}`);
    console.log(`   Étape: ${waitlistEntry.currentStep}`);
    console.log(`   Session Stripe: ${waitlistEntry.stripeSessionId || 'N/A'}`);
    console.log(`   Créé: ${waitlistEntry.createdAt.toISOString()}`);
    console.log(`   Mis à jour: ${waitlistEntry.updatedAt.toISOString()}`);

    if (waitlistEntry.status === 'paye') {
      console.log('✅ L\'entrée est déjà marquée comme payée');
      return;
    }

    // Mettre à jour le statut
    const updatedEntry = await prisma.waitlistEntry.update({
      where: { email },
      data: {
        status: 'paye',
        currentStep: 3, // S'assurer que l'étape est à 3 (paiement)
        updatedAt: new Date()
      }
    });

    console.log('✅ Statut mis à jour avec succès!');
    console.log('📋 Nouvelle entrée:');
    console.log(`   Email: ${updatedEntry.email}`);
    console.log(`   Status: ${updatedEntry.status}`);
    console.log(`   Étape: ${updatedEntry.currentStep}`);
    console.log(`   Mis à jour: ${updatedEntry.updatedAt.toISOString()}`);

  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function listWaitlistEntries() {
  try {
    console.log('📋 Liste de toutes les entrées waitlist:\n');

    const entries = await prisma.waitlistEntry.findMany({
      orderBy: { createdAt: 'desc' }
    });

    if (entries.length === 0) {
      console.log('   Aucune entrée trouvée');
      return;
    }

    entries.forEach((entry, index) => {
      console.log(`   ${index + 1}. ${entry.email}`);
      console.log(`      Status: ${entry.status}`);
      console.log(`      Étape: ${entry.currentStep}`);
      console.log(`      Session: ${entry.stripeSessionId ? 'Oui' : 'Non'}`);
      console.log(`      Créé: ${entry.createdAt.toISOString()}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Script principal
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('📝 Usage:');
    console.log('   node scripts/fix-payment-status.js list                    # Lister toutes les entrées');
    console.log('   node scripts/fix-payment-status.js fix <email>            # Corriger le statut d\'un email');
    console.log('');
    console.log('📧 Exemple:');
    console.log('   node scripts/fix-payment-status.js fix noah.lugagne@free.fr');
    return;
  }

  const command = args[0];

  if (command === 'list') {
    await listWaitlistEntries();
  } else if (command === 'fix') {
    const email = args[1];
    if (!email) {
      console.log('❌ Email requis pour la correction');
      console.log('📧 Exemple: node scripts/fix-payment-status.js fix noah.lugagne@free.fr');
      return;
    }
    await fixPaymentStatus(email);
  } else {
    console.log('❌ Commande inconnue. Utilisez "list" ou "fix <email>"');
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  main();
}

module.exports = { fixPaymentStatus, listWaitlistEntries }; 