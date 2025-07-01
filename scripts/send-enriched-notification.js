import { PrismaClient } from '@prisma/client';

// Simple test d'envoi enrichi sans les imports complexes
async function sendEnrichedNotification() {
    const prisma = new PrismaClient();
    
    try {
        console.log('🧪 === ENVOI DIRECT DE NOTIFICATION ENRICHIE ===\n');
        
        const userId = 'cma6li3j1000ca64sisjbjyfs'; // ID de Noah
        console.log(`👤 Test pour userId: ${userId}`);
        
        // Récupérer l'utilisateur et ses préférences
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                notificationSettings: true
            }
        });
        
        if (!user || !user.notificationSettings?.whatsappEnabled || !user.whatsappNumber) {
            console.log('❌ WhatsApp non configuré pour cet utilisateur');
            return;
        }
        
        console.log(`📱 WhatsApp configuré: ${user.whatsappNumber}`);
        
        // Générer le contenu enrichi manuellement (comme dans notre test réussi)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Récupérer les tâches prioritaires
        const tasks = await prisma.task.findMany({
            where: {
                userId,
                completed: false,
                OR: [
                    { dueDate: { equals: today } },
                    { scheduledFor: { equals: today } }
                ],
                priority: {
                    not: null,
                    gte: 3
                }
            },
            orderBy: [
                { priority: 'desc' },
                { dueDate: 'asc' }
            ],
            take: 5
        });
        
        // Récupérer les habitudes du jour
        const dayNameEN = today.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        const habits = await prisma.habit.findMany({
            where: {
                userId,
                daysOfWeek: {
                    has: dayNameEN
                }
            },
            include: {
                entries: {
                    where: {
                        date: today
                    }
                }
            }
        });
        
        console.log(`🎯 Tâches prioritaires trouvées: ${tasks.length}`);
        console.log(`💫 Habitudes trouvées: ${habits.length}`);
        
        // Construire le message enrichi
        let content = "🌅 C'est parti pour une nouvelle journée !\n\n";
        
        if (tasks.length > 0) {
            content += "🎯 Voici tes tâches prioritaires pour le deep work :\n";
            tasks.forEach((task, index) => {
                const priorityLabel = task.priority === 4 ? "⚡️" :
                                    task.priority === 3 ? "🔥" :
                                    task.priority === 2 ? "⭐️" :
                                    task.priority === 1 ? "📌" : "📝";
                const energyLabel = task.energyLevel === 3 ? "🔋🔋🔋" :
                                  task.energyLevel === 2 ? "🔋🔋" : "🔋";
                content += `${index + 1}. ${priorityLabel} ${energyLabel} ${task.title}\n`;
            });
            content += "\n";
        }
        
        if (habits.length > 0) {
            content += "💫 Tes habitudes pour aujourd'hui :\n";
            habits.forEach((habit, index) => {
                const completed = habit.entries.length > 0 && habit.entries[0].completed;
                const status = completed ? "✅" : "⭕️";
                content += `${index + 1}. ${status} ${habit.name}\n`;
            });
        }
        
        console.log('\n📝 === CONTENU ENRICHI ===');
        console.log('==========================================');
        console.log(content);
        console.log('==========================================');
        
        // Créer la notification en base de données
        const notification = await prisma.notificationHistory.create({
            data: {
                userId,
                type: 'MORNING_REMINDER',
                content: content,
                scheduledFor: new Date(),
                status: 'pending'
            }
        });
        
        console.log(`\n✅ Notification créée avec ID: ${notification.id}`);
        
        // Envoyer via WhatsApp en utilisant fetch directement
        console.log('\n🚀 Envoi via WhatsApp...');
        
        const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
        const token = process.env.WHATSAPP_ACCESS_TOKEN;
        const apiUrl = `https://graph.facebook.com/v17.0/${phoneNumberId}/messages`;
        
        // Formater le numéro de téléphone
        let cleanedPhone = user.whatsappNumber.replace(/\D/g, '');
        if (cleanedPhone.startsWith('0')) {
            cleanedPhone = '33' + cleanedPhone.substring(1);
        }
        
        const whatsappMessage = `🌅 Bonjour et bonne journée !\n\n${content}\n\n_Envoyé via Productif.io_`;
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                messaging_product: 'whatsapp',
                to: cleanedPhone,
                type: 'text',
                text: {
                    preview_url: false,
                    body: whatsappMessage
                }
            })
        });
        
        const responseData = await response.text();
        
        if (response.ok) {
            console.log('✅ Message WhatsApp envoyé avec succès !');
            
            // Mettre à jour le statut de la notification
            await prisma.notificationHistory.update({
                where: { id: notification.id },
                data: {
                    status: 'sent',
                    sentAt: new Date()
                }
            });
            
            console.log('✅ Statut mis à jour en base de données');
            
            console.log('\n🎉 === SUCCÈS COMPLET ===');
            console.log('🎊 Notification enrichie envoyée avec succès !');
            console.log(`📊 Contenu: ${content.length} caractères`);
            console.log(`🎯 Tâches: ${tasks.length}`);
            console.log(`💫 Habitudes: ${habits.length}`);
            
        } else {
            console.log('❌ Erreur lors de l\'envoi WhatsApp');
            console.log('Response:', responseData);
            
            // Marquer comme échouée
            await prisma.notificationHistory.update({
                where: { id: notification.id },
                data: {
                    status: 'failed',
                    error: `WhatsApp API error: ${response.status}`
                }
            });
        }
        
    } catch (error) {
        console.error('❌ Erreur lors de l\'envoi:', error);
        console.error('Stack trace:', error.stack);
    } finally {
        await prisma.$disconnect();
    }
}

sendEnrichedNotification(); 