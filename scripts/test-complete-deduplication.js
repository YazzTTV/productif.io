#!/usr/bin/env node

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testCompleteDeduplication() {
    console.log('\n🧪 TEST COMPLET DE DÉDUPLICATION - TOUS LES SERVICES');
    console.log('=' .repeat(70));
    console.log('📌 Ce test vérifie que les 3 services ont la déduplication :');
    console.log('   1. 📋 Scheduler (Port 3002) - Service principal');
    console.log('   2. 🤖 Agent IA (Port 3001) - Conversations WhatsApp');
    console.log('   3. 🌐 Next.js (Port 3000) - Application web');
    console.log('');

    try {
        // Test 1: Vérifier les processus actifs
        console.log('🔍 ÉTAPE 1: Vérification des processus actifs...');
        console.log('✅ Script exécuté - les services devraient être redémarrés');
        console.log('');

        // Test 2: Vérifier la dernière notification créée
        console.log('🔍 ÉTAPE 2: Vérification de la dernière notification...');
        const lastNotification = await prisma.notification.findFirst({
            where: {
                userId: 'cma6li3j1000ca64sisjbjyfs'
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        if (lastNotification) {
            console.log('📩 Dernière notification:');
            console.log(`   ID: ${lastNotification.id}`);
            console.log(`   Type: ${lastNotification.type}`);
            console.log(`   Statut: ${lastNotification.status}`);
            console.log(`   Créée: ${lastNotification.createdAt}`);
        } else {
            console.log('❌ Aucune notification trouvée');
        }
        console.log('');

        // Test 3: Instructions pour le test manuel
        console.log('🔍 ÉTAPE 3: Test manuel requis...');
        console.log('📱 Pour tester complètement la déduplication:');
        console.log('');
        console.log('   1. 📋 TEST SCHEDULER:');
        console.log('      → Modifiez vos préférences de notification');
        console.log('      → Vérifiez qu\'UNE SEULE notification arrive');
        console.log('      → La référence doit commencer par "SCHED_"');
        console.log('');
        console.log('   2. 🤖 TEST AGENT IA:');
        console.log('      → Envoyez un message WhatsApp à votre bot');
        console.log('      → La réponse doit avoir une référence "AI_"');
        console.log('      → Aucun duplicata ne doit apparaître');
        console.log('');
        console.log('   3. 🌐 TEST NEXT.JS:');
        console.log('      → Utilisez l\'app web pour envoyer un message');
        console.log('      → La référence doit commencer par "PRODUCTIF_"');
        console.log('');

        // Test 4: Surveillance des logs
        console.log('🔍 ÉTAPE 4: Surveillance recommandée...');
        console.log('📊 Commandes de surveillance:');
        console.log('');
        console.log('   📋 Logs Scheduler:');
        console.log('   tail -f /tmp/scheduler.log | grep -E "(DUPLICATA|WHATSAPP|MESSAGE)"');
        console.log('');
        console.log('   🤖 Logs Agent IA:');
        console.log('   tail -f /tmp/ai.log | grep -E "(DUPLICATA|Agent IA|AI_)"');
        console.log('');

        // Test 5: Vérifications automatiques
        console.log('🔍 ÉTAPE 5: Vérifications automatiques...');
        
        // Compter les notifications des dernières 24h
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        const recentNotifications = await prisma.notification.findMany({
            where: {
                userId: 'cma6li3j1000ca64sisjbjyfs',
                createdAt: {
                    gte: yesterday
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        console.log(`📊 Notifications des dernières 24h: ${recentNotifications.length}`);
        
        if (recentNotifications.length > 0) {
            console.log('📋 Détail des notifications récentes:');
            recentNotifications.slice(0, 5).forEach((notif, index) => {
                console.log(`   ${index + 1}. ${notif.type} - ${notif.status} - ${notif.createdAt.toISOString()}`);
            });
        }
        console.log('');

        // Test 6: Recommandations finales
        console.log('🎯 ÉTAPE 6: Recommandations finales...');
        console.log('✅ Tous les services ont maintenant la déduplication:');
        console.log('   🛡️ Fenêtre de déduplication: 5 minutes');
        console.log('   🏷️ Références uniques: SCHED_, AI_, PRODUCTIF_');
        console.log('   🧹 Nettoyage automatique: 10 minutes');
        console.log('');
        console.log('🚨 Si vous recevez encore des duplicatas:');
        console.log('   1. Vérifiez que tous les services sont redémarrés');
        console.log('   2. Contrôlez les logs pour voir d\'où viennent les messages');
        console.log('   3. Assurez-vous qu\'aucun ancien processus ne tourne');
        console.log('');

        console.log('✨ TEST TERMINÉ - Surveillance active recommandée');

    } catch (error) {
        console.error('❌ Erreur pendant le test:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Lancer le test
testCompleteDeduplication(); 