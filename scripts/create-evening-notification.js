import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';

const prisma = new PrismaClient();

// Configuration WhatsApp
const WHATSAPP_API_URL = 'https://graph.facebook.com/v17.0';
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

async function sendWhatsAppMessage(phoneNumber, message) {
    try {
        console.log(`📱 Envoi WhatsApp à ${phoneNumber}:`);
        console.log(message);

        const url = `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
        console.log(`🔗 URL de l'API: ${url}`);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`
            },
            body: JSON.stringify({
                messaging_product: 'whatsapp',
                to: phoneNumber,
                type: 'text',
                text: {
                    preview_url: false,
                    body: message
                }
            })
        });

        const responseText = await response.text();
        console.log(`📬 Réponse de l'API (${response.status}):`, responseText);

        if (!response.ok) {
            throw new Error(`WhatsApp API error: ${response.status} ${response.statusText}\n${responseText}`);
        }

        console.log('✅ Message WhatsApp envoyé avec succès');
        return JSON.parse(responseText);
    } catch (error) {
        console.error('❌ Erreur lors de l\'envoi du message WhatsApp:', error);
        throw error;
    }
}

async function sendEveningNotification() {
    try {
        // Récupérer l'utilisateur et ses paramètres
        const user = await prisma.user.findFirst({
            where: {
                email: 'noah.lugagne@free.fr'
            },
            include: {
                notificationSettings: true
            }
        });

        if (!user) {
            console.error('❌ Utilisateur non trouvé');
            return;
        }

        // Créer le contenu de la notification
        const content = `🌙 C'est l'heure du bilan et de préparer demain !

🎯 Que veux-tu accomplir demain ?

Pour créer une tâche, réponds avec ce format :
📌 titre: [Titre de la tâche]
⚡️ priorité: 1-4 (1:basse, 4:urgente)
🔋 énergie: 1-3 (1:faible, 3:élevée)
📅 date: JJ/MM (optionnel)`;

        // Créer la notification
        const notification = await prisma.notificationHistory.create({
            data: {
                userId: user.id,
                type: 'EVENING_PLANNING',
                content,
                scheduledFor: new Date(),
                status: 'pending'
            }
        });

        console.log('✅ Notification créée:', notification);

        // Envoyer la notification via WhatsApp
        if (user.notificationSettings?.whatsappEnabled && user.notificationSettings?.whatsappNumber) {
            try {
                await sendWhatsAppMessage(
                    user.notificationSettings.whatsappNumber,
                    `🌙 Préparons demain ensemble\n\n${content}\n\n_Envoyé via Productif.io_`
                );
                
                // Mettre à jour le statut de la notification
                await prisma.notificationHistory.update({
                    where: { id: notification.id },
                    data: {
                        status: 'sent',
                        sentAt: new Date()
                    }
                });
                
                console.log('✅ Notification envoyée avec succès');
            } catch (error) {
                console.error('❌ Erreur lors de l\'envoi WhatsApp:', error);
                
                // Marquer la notification comme échouée
                await prisma.notificationHistory.update({
                    where: { id: notification.id },
                    data: {
                        status: 'failed',
                        error: error.message
                    }
                });
            }
        }
    } catch (error) {
        console.error('❌ Erreur:', error);
    } finally {
        await prisma.$disconnect();
    }
}

sendEveningNotification(); 