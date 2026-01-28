#!/usr/bin/env node

/**
 * Script pour créer une notification de test pour l'utilisateur "yazz" sur Android
 * Utilise l'API backend (nécessite un token JWT valide)
 * Usage: node scripts/test-notification-yazz-android-api.js [JWT_TOKEN]
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'https://www.productif.io';

async function createTestNotificationForYazz(jwtToken) {
  try {
    console.log('🧪 Création d\'une notification de test pour yazz via l\'API\n');
    console.log(`🌐 API URL: ${API_URL}\n`);

    if (!jwtToken) {
      console.error('❌ Token JWT requis');
      console.log('\n💡 Usage: node scripts/test-notification-yazz-android-api.js [JWT_TOKEN]');
      console.log('   Vous pouvez obtenir un token JWT en vous connectant à l\'app et en regardant les logs\n');
      process.exit(1);
    }

    // Note: Cette approche nécessite un endpoint API pour créer des notifications
    // Pour l'instant, le script SQL reste la meilleure option
    
    console.log('💡 Pour créer la notification, utilisez le script SQL:');
    console.log('   scripts/test-notification-yazz-android.sql\n');
    
    console.log('Ou exécutez le script JS sur Railway où la DB est accessible:');
    console.log('   railway run node scripts/test-notification-yazz-android.js\n');

  } catch (error) {
    console.error('\n❌ Erreur:', error);
    process.exit(1);
  }
}

const jwtToken = process.argv[2] || null;
createTestNotificationForYazz(jwtToken)
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erreur fatale:', error);
    process.exit(1);
  });
