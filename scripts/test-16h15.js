#!/usr/bin/env node
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testNotification16h15() {
    console.log('\n🎯 TEST NOTIFICATION 16:15 - AVEC LOGS ULTRA-PRÉCIS');
    console.log('=' .repeat(60));
    
    const userId = 'cma6li3j1000ca64sisjbjyfs';
    
    try {
        await prisma.notificationSettings.update({
            where: { userId: userId },
            data: { eveningTime: '16:15' }
        });
        
        console.log('✅ Préférences mises à jour : notification à 16:15');
        console.log('📊 SURVEILLEZ LES LOGS DU SCHEDULER !');
        console.log('⏰ Notification dans 4 minutes...');
        
    } catch (error) {
        console.error('❌ Erreur:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testNotification16h15();
