import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkPreferences() {
    try {
        const preferences = await prisma.notificationSettings.findMany({
            select: {
                userId: true,
                isEnabled: true,
                emailEnabled: true,
                pushEnabled: true,
                whatsappEnabled: true,
                whatsappNumber: true,
                startHour: true,
                endHour: true,
                morningTime: true,
                noonTime: true,
                afternoonTime: true,
                eveningTime: true,
                nightTime: true,
                reminderTime: true,
                allowedDays: true,
                notificationTypes: true,
            }
        });

        console.log('📋 Préférences de notification trouvées:');
        for (const pref of preferences) {
            console.log(`\n👤 Utilisateur: ${pref.userId}`);
            console.log(`🔔 Notifications activées: ${pref.isEnabled}`);
            console.log(`📧 Email: ${pref.emailEnabled}`);
            console.log(`🔔 Push: ${pref.pushEnabled}`);
            console.log(`📱 WhatsApp: ${pref.whatsappEnabled}`);
            if (pref.whatsappNumber) {
                console.log(`📞 Numéro WhatsApp: ${pref.whatsappNumber}`);
            }
            console.log('⏰ Heures:');
            console.log(`  - Début: ${pref.startHour}h`);
            console.log(`  - Fin: ${pref.endHour}h`);
            console.log(`  - Rappels quotidiens: ${pref.reminderTime}`);
            console.log(`  - Matin: ${pref.morningTime}`);
            console.log(`  - Midi: ${pref.noonTime}`);
            console.log(`  - Après-midi: ${pref.afternoonTime}`);
            console.log(`  - Soir: ${pref.eveningTime}`);
            console.log(`  - Nuit: ${pref.nightTime}`);
            console.log('📅 Jours autorisés:', pref.allowedDays);
            console.log('📝 Types de notifications:', pref.notificationTypes);
        }
    } catch (error) {
        console.error('Erreur lors de la vérification des préférences:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkPreferences(); 