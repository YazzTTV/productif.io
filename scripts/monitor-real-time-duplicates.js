#!/usr/bin/env node

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
    log: ['error', 'warn'],
});

// Cache pour suivre les appels WhatsApp
const whatsappCalls = new Map();

async function monitorRealTimeDuplicates() {
    console.log('\n🔍 SURVEILLANCE TEMPS RÉEL - DUPLICATAS WHATSAPP');
    console.log('=' .repeat(60));
    console.log('🚨 Ce script va surveiller TOUS les appels WhatsApp');
    console.log('📊 Patchez temporairement les services pour logging...');
    console.log('');

    // Surveillance des notifications en base
    setInterval(async () => {
        try {
            const recentNotifications = await prisma.notificationHistory.findMany({
                where: {
                    userId: 'cma6li3j1000ca64sisjbjyfs',
                    scheduledFor: {
                        gte: new Date(Date.now() - 5 * 60 * 1000) // 5 dernières minutes
                    }
                },
                orderBy: {
                    scheduledFor: 'desc'
                },
                take: 10
            });

            if (recentNotifications.length > 0) {
                console.log(`\n📊 ${new Date().toISOString()} - ${recentNotifications.length} notifications récentes:`);
                recentNotifications.forEach(notif => {
                    console.log(`   📩 ${notif.id} - ${notif.type} - ${notif.status} - ${notif.scheduledFor.toISOString()} - sent: ${notif.sentAt || 'pending'}`);
                });
            }
        } catch (error) {
            console.error('❌ Erreur surveillance DB:', error);
        }
    }, 10000); // Toutes les 10 secondes

    console.log('👀 Surveillance active...');
    console.log('📱 Modifiez vos préférences pour déclencher une notification');
    console.log('🛑 Appuyez sur Ctrl+C pour arrêter');
    console.log('');

    // Garder le script vivant
    process.on('SIGINT', async () => {
        console.log('\n\n📋 RÉSUMÉ DE SURVEILLANCE:');
        console.log('🔍 Utilisez ce script avec les logs pour identifier les duplicatas');
        console.log('💡 Prochaine étape: Patcher temporairement les services WhatsApp');
        await prisma.$disconnect();
        process.exit(0);
    });
}

monitorRealTimeDuplicates(); 