#!/usr/bin/env node

import { PrismaClient } from '@prisma/client';
import whatsappService from '../src/services/WhatsAppService.js';

const prisma = new PrismaClient();

async function testWhatsAppDeduplication() {
    console.log('\n🧪 TEST DE DÉDUPLICATION WHATSAPP CORRIGÉE');
    console.log('=' .repeat(60));

    const testPhone = process.env.TEST_PHONE || '33783642205';
    const testMessage = `🧪 Test déduplication - ${new Date().toISOString()}`;

    console.log(`📱 Numéro de test: ${testPhone}`);
    console.log(`💬 Message: ${testMessage}`);
    console.log('');

    try {
        // Test 1: Premier envoi (devrait réussir)
        console.log('🔄 Test 1: Premier envoi...');
        const result1 = await whatsappService.sendMessage(testPhone, testMessage);
        console.log(`✅ Résultat 1:`, result1.blocked ? '❌ BLOQUÉ' : '✅ ENVOYÉ');
        
        // Attendre 1 seconde
        console.log('⏱️ Attente de 1 seconde...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Test 2: Deuxième envoi immédiat (devrait être bloqué)
        console.log('🔄 Test 2: Deuxième envoi immédiat...');
        const result2 = await whatsappService.sendMessage(testPhone, testMessage);
        console.log(`🛡️ Résultat 2:`, result2.blocked ? '✅ BLOQUÉ (correct)' : '❌ ENVOYÉ (problème)');
        
        // Test 3: Troisième envoi après 2 secondes (devrait être bloqué)
        console.log('⏱️ Attente de 2 secondes...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log('🔄 Test 3: Troisième envoi après 2 secondes...');
        const result3 = await whatsappService.sendMessage(testPhone, testMessage);
        console.log(`🛡️ Résultat 3:`, result3.blocked ? '✅ BLOQUÉ (correct)' : '❌ ENVOYÉ (problème)');

        // Résumé des tests
        console.log('\n📊 RÉSUMÉ DES TESTS:');
        console.log('=' .repeat(40));
        console.log(`Test 1 (premier): ${result1.blocked ? '❌ ÉCHEC' : '✅ SUCCÈS'}`);
        console.log(`Test 2 (duplicata): ${result2.blocked ? '✅ SUCCÈS' : '❌ ÉCHEC'}`);
        console.log(`Test 3 (duplicata): ${result3.blocked ? '✅ SUCCÈS' : '❌ ÉCHEC'}`);

        const success = !result1.blocked && result2.blocked && result3.blocked;
        console.log(`\n🎯 DÉDUPLICATION: ${success ? '✅ FONCTIONNE' : '❌ PROBLÈME'}`);

        if (success) {
            console.log('🎉 La déduplication corrigée fonctionne parfaitement !');
            console.log('🛡️ Les duplicatas dans la même fenêtre de 5 minutes sont bloqués');
        } else {
            console.log('⚠️ Il y a encore un problème avec la déduplication');
            console.log('📝 Vérifiez les logs pour plus de détails');
        }

    } catch (error) {
        console.error('❌ Erreur lors du test:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Exécuter le test
testWhatsAppDeduplication().catch(console.error); 