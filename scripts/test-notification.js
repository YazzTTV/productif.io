import { PrismaClient } from '@prisma/client';
import NotificationService from '../src/services/NotificationService.js';

const prisma = new PrismaClient();
const notificationService = new NotificationService(prisma);

async function testNotification() {
    try {
        const userId = 'cma6li3j1000ca64sisjbjyfs'; // ID de l'utilisateur noah.lugagne@free.fr
        const now = new Date();
        
        console.log('🔔 Test d\'envoi de notification...');
        
        await notificationService.createNotification(
            userId,
            'TEST_NOTIFICATION',
            '🧪 Ceci est une notification de test pour vérifier le système de notifications.',
            now
        );
        
        console.log('✅ Notification créée avec succès');
        console.log('⏳ Traitement des notifications en attente...');
        
        await notificationService.processNotifications();
        
        console.log('✨ Test terminé !');
        process.exit(0);
    } catch (error) {
        console.error('❌ Erreur lors du test:', error);
        process.exit(1);
    }
}

testNotification(); 