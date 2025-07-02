#!/usr/bin/env node

/**
 * 🧪 TEST DE DÉDUPLICATION WHATSAPP AVEC ANALYSE DES LOGS
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testWhatsAppDeduplication() {
    console.log('\n🧪 TEST DE DÉDUPLICATION WHATSAPP AVEC LOGS AVANCÉS');
    console.log('=' .repeat(60));
    
    const userId = 'cma6li3j1000ca64sisjbjyfs';
    
    try {
        // Récupérer les préférences actuelles
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { notificationSettings: true }
        });
        
        if (!user || !user.notificationSettings) {
            console.log('❌ Utilisateur ou préférences non trouvés');
            return;
        }
        
        const currentEvening = user.notificationSettings.eveningTime;
        console.log(`⏰ Heure actuelle du soir: ${currentEvening}`);
        
        // Calculer une nouvelle heure (ajout de 1 minute)
        const [hour, minute] = currentEvening.split(':').map(Number);
        const newMinute = (minute + 1) % 60;
        const newHour = newMinute === 0 ? (hour + 1) % 24 : hour;
        const newEvening = `${newHour.toString().padStart(2, '0')}:${newMinute.toString().padStart(2, '0')}`;
        
        console.log(`🎯 Nouvelle heure du soir: ${newEvening}`);
        console.log('🚀 DÉCLENCHEMENT DU TEST...');
        console.log('📊 SURVEILLEZ LES LOGS DU SCHEDULER !');
        
        // Mettre à jour les préférences
        await prisma.notificationSettings.update({
            where: { userId: userId },
            data: { eveningTime: newEvening }
        });
        
        console.log('✅ Préférences mises à jour !');
        console.log(`⏰ Notification prévue à: ${newEvening}`);
        
    } catch (error) {
        console.error('❌ Erreur lors du test:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testWhatsAppDeduplication();
