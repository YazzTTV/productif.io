#!/usr/bin/env node

// Script pour tester l'initialisation Firebase avec les variables d'environnement
import 'dotenv/config';
import admin from 'firebase-admin';

console.log('🔧 Test d\'initialisation Firebase...\n');

// Vérifier les variables d'environnement
console.log('📋 Variables d\'environnement:');
console.log(`   - FIREBASE_PROJECT_ID: ${process.env.FIREBASE_PROJECT_ID ? '✅ Présent (' + process.env.FIREBASE_PROJECT_ID + ')' : '❌ Manquant'}`);
console.log(`   - FIREBASE_CLIENT_EMAIL: ${process.env.FIREBASE_CLIENT_EMAIL ? '✅ Présent (' + process.env.FIREBASE_CLIENT_EMAIL + ')' : '❌ Manquant'}`);
console.log(`   - FIREBASE_PRIVATE_KEY: ${process.env.FIREBASE_PRIVATE_KEY ? '✅ Présent (' + process.env.FIREBASE_PRIVATE_KEY.length + ' caractères)' : '❌ Manquant'}`);
console.log('');

// Tester l'initialisation
try {
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    console.log('🚀 Tentative d\'initialisation Firebase...');
    
    const app = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      })
    });
    
    console.log('✅ Firebase initialisé avec succès!');
    console.log(`   - Project ID: ${app.options.projectId}`);
    console.log(`   - Apps actifs: ${admin.apps.length}`);
    
    // Nettoyer
    await app.delete();
    console.log('🧹 Firebase nettoyé');
    
    process.exit(0);
  } else {
    console.error('❌ Variables d\'environnement Firebase manquantes!');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Erreur lors de l\'initialisation Firebase:');
  console.error(error);
  process.exit(1);
}
