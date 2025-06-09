const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Test de simulation d'un événement webhook
async function simulateWebhookEvent(email) {
  console.log('🧪 Simulation d\'un événement webhook checkout.session.completed');
  
  // Créer d'abord une entrée waitlist pour le test
  try {
    await prisma.waitlistEntry.create({
      data: {
        email: email,
        status: 'pas_paye',
        currentStep: 3,
        stripeSessionId: 'cs_test_simulation_123'
      }
    });
    console.log(`✅ Entrée waitlist créée pour ${email}`);
  } catch (error) {
    console.log(`ℹ️  Entrée waitlist existe déjà pour ${email}`);
  }

  // Simuler l'événement webhook
  const mockEvent = {
    id: 'evt_test_123',
    type: 'checkout.session.completed',
    data: {
      object: {
        id: 'cs_test_simulation_123',
        payment_status: 'paid',
        customer_email: email,
        metadata: {
          type: 'waitlist',
          email: email
        }
      }
    }
  };

  console.log('📨 Événement simulé:', JSON.stringify(mockEvent, null, 2));

  // Simuler la logique du webhook
  const session = mockEvent.data.object;
  
  if (session.metadata && session.metadata.type === 'waitlist') {
    const emailToUpdate = session.metadata.email || session.customer_email;
    
    if (emailToUpdate) {
      console.log(`🔄 Mise à jour du statut pour ${emailToUpdate}`);
      
      try {
        const updatedEntry = await prisma.waitlistEntry.update({
          where: { email: emailToUpdate },
          data: {
            status: 'paye',
            currentStep: 3,
            updatedAt: new Date()
          }
        });
        
        console.log('✅ Succès! Statut mis à jour:');
        console.log(`   Email: ${updatedEntry.email}`);
        console.log(`   Status: ${updatedEntry.status}`);
        console.log(`   Étape: ${updatedEntry.currentStep}`);
        console.log(`   Mis à jour: ${updatedEntry.updatedAt.toISOString()}`);
      } catch (error) {
        console.error('❌ Erreur lors de la mise à jour:', error);
      }
    }
  }
}

async function testWebhookEndpoint() {
  console.log('🌐 Test de l\'endpoint webhook via HTTP');
  
  const testPayload = {
    id: 'evt_test_webhook',
    type: 'checkout.session.completed',
    data: {
      object: {
        id: 'cs_test_http_123',
        payment_status: 'paid',
        customer_email: 'test-webhook@example.com',
        metadata: {
          type: 'waitlist',
          email: 'test-webhook@example.com'
        }
      }
    }
  };

  try {
    const response = await fetch('http://localhost:3000/api/stripe/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 'test_signature'
      },
      body: JSON.stringify(testPayload)
    });

    console.log(`📡 Réponse HTTP: ${response.status}`);
    const result = await response.text();
    console.log(`📄 Corps de la réponse: ${result}`);
    
  } catch (error) {
    console.error('❌ Erreur lors du test HTTP:', error.message);
    console.log('ℹ️  Assurez-vous que le serveur local tourne sur http://localhost:3000');
  }
}

async function cleanupTestData(email) {
  console.log(`🧹 Nettoyage des données de test pour ${email}`);
  
  try {
    await prisma.waitlistEntry.delete({
      where: { email }
    });
    console.log('✅ Données de test supprimées');
  } catch (error) {
    console.log('ℹ️  Aucune donnée de test à supprimer');
  }
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const email = args[1] || 'test-webhook@example.com';

  console.log('🧪 === TESTS WEBHOOK STRIPE ===\n');

  switch (command) {
    case 'simulate':
      await simulateWebhookEvent(email);
      break;
      
    case 'http':
      await testWebhookEndpoint();
      break;
      
    case 'cleanup':
      await cleanupTestData(email);
      break;
      
    case 'full':
      console.log('🚀 Test complet...\n');
      await simulateWebhookEvent(email);
      console.log('\n---\n');
      await testWebhookEndpoint();
      console.log('\n---\n');
      await cleanupTestData(email);
      break;
      
    default:
      console.log('📝 Usage:');
      console.log('  node scripts/test-webhook.js simulate [email]  # Simuler la logique webhook');
      console.log('  node scripts/test-webhook.js http              # Tester l\'endpoint HTTP');
      console.log('  node scripts/test-webhook.js cleanup [email]   # Nettoyer les données test');
      console.log('  node scripts/test-webhook.js full [email]      # Test complet');
      console.log('');
      console.log('📧 Exemple:');
      console.log('  node scripts/test-webhook.js simulate test@example.com');
  }

  await prisma.$disconnect();
}

if (require.main === module) {
  main();
}

module.exports = { simulateWebhookEvent, testWebhookEndpoint, cleanupTestData }; 