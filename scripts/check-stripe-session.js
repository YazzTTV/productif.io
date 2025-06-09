const { PrismaClient } = require('@prisma/client');
const Stripe = require('stripe');

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-02-24.acacia',
});

async function checkStripeSession(sessionId) {
  try {
    console.log(`🔍 Vérification de la session Stripe: ${sessionId}`);
    
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    console.log('📊 Détails de la session:');
    console.log(`   ID: ${session.id}`);
    console.log(`   Status: ${session.status}`);
    console.log(`   Payment Status: ${session.payment_status}`);
    console.log(`   Amount Total: ${session.amount_total} centimes`);
    console.log(`   Currency: ${session.currency}`);
    console.log(`   Customer Email: ${session.customer_email}`);
    console.log(`   Created: ${new Date(session.created * 1000).toISOString()}`);
    
    return session;
  } catch (error) {
    console.error(`❌ Erreur lors de la récupération de la session ${sessionId}:`, error.message);
    return null;
  }
}

async function checkAndFixWaitlistPayments() {
  try {
    console.log('🔍 Vérification des paiements Stripe pour les entrées waitlist...\n');

    // Récupérer toutes les entrées waitlist avec une session Stripe
    const waitlistEntries = await prisma.waitlistEntry.findMany({
      where: {
        stripeSessionId: { not: null }
      }
    });

    console.log(`📋 ${waitlistEntries.length} entrées waitlist avec session Stripe trouvées\n`);

    for (const entry of waitlistEntries) {
      console.log(`📧 Vérification de ${entry.email}:`);
      console.log(`   Statut actuel dans DB: ${entry.status}`);
      console.log(`   Session ID: ${entry.stripeSessionId}`);
      
      const session = await checkStripeSession(entry.stripeSessionId);
      
      if (session) {
        if (session.payment_status === 'paid' && entry.status !== 'paye') {
          console.log('   🔧 CORRECTION NÉCESSAIRE: Le paiement est confirmé dans Stripe mais pas dans la DB');
          
          // Mettre à jour la base de données
          await prisma.waitlistEntry.update({
            where: { id: entry.id },
            data: {
              status: 'paye',
              updatedAt: new Date()
            }
          });
          
          console.log('   ✅ Statut mis à jour vers "paye"');
        } else if (session.payment_status === 'paid' && entry.status === 'paye') {
          console.log('   ✅ Paiement confirmé et DB à jour');
        } else {
          console.log(`   ⏳ Paiement non confirmé (${session.payment_status})`);
        }
      }
      
      console.log('');
    }

    // Vérification finale
    console.log('🔄 Vérification finale...');
    const updatedEntries = await prisma.waitlistEntry.findMany({
      where: { status: 'paye' }
    });
    
    console.log(`✅ Total d'entrées payées après correction: ${updatedEntries.length}`);
    
    if (updatedEntries.length > 0) {
      console.log('📋 Entrées payées:');
      updatedEntries.forEach((entry, index) => {
        console.log(`   ${index + 1}. ${entry.email} - Créé: ${entry.createdAt.toISOString()}`);
      });
    }

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  checkAndFixWaitlistPayments();
}

module.exports = { checkAndFixWaitlistPayments, checkStripeSession }; 