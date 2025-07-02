#!/usr/bin/env node

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function triggerTestNotification() {
    console.log('\n🧪 DÉCLENCHEMENT D\'UNE NOTIFICATION DE TEST');
    console.log('=' .repeat(50));
    
    try {
        // Mettre à jour les préférences pour déclencher une notification
        const userId = 'cma6li3j1000ca64sisjbjyfs';
        const currentTime = new Date().toTimeString().slice(0, 5);
        const testTime = new Date(Date.now() + 2 * 60 * 1000).toTimeString().slice(0, 5); // +2 minutes
        
        console.log(`⏰ Heure actuelle: ${currentTime}`);
        console.log(`🎯 Programmation notification à: ${testTime}`);
        console.log('');
        
        // Mettre à jour l'heure du soir pour déclencher une notification
        await prisma.notificationSettings.update({
            where: { userId },
            data: {
                eveningTime: testTime,
                updatedAt: new Date()
            }
        });
        
        console.log('✅ Préférences mises à jour !');
        console.log('🔍 Surveillez maintenant:');
        console.log('   1. Les logs du scheduler (avec EXTREME_LOG)');
        console.log('   2. Votre WhatsApp dans 2 minutes');
        console.log('   3. Le script de surveillance');
        console.log('');
        console.log('⚠️  Si vous recevez 2 messages, les logs EXTREME_LOG nous diront d\'où viennent les duplicatas !');
        
    } catch (error) {
        console.error('❌ Erreur:', error);
    } finally {
        await prisma.$disconnect();
    }
}

triggerTestNotification(); 