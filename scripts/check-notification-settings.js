import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkNotificationSettings() {
    try {
        const settings = await prisma.notificationSettings.findMany({
            include: {
                user: true
            }
        });

        console.log('\n📊 Paramètres de notification actuels :');
        for (const setting of settings) {
            console.log(`\n👤 Utilisateur: ${setting.user.email}`);
            console.log(`  - Notifications activées: ${setting.isEnabled ? '✅' : '❌'}`);
            console.log(`  - WhatsApp: ${setting.whatsappEnabled ? '✅' : '❌'}`);
            console.log(`  - Numéro WhatsApp: ${setting.whatsappNumber || '❌'}`);
            console.log(`  - Plage horaire: ${setting.startHour}h-${setting.endHour}h`);
            console.log('\n  Horaires des notifications :');
            console.log(`  - Matin: ${setting.morningTime}`);
            console.log(`  - Midi: ${setting.noonTime}`);
            console.log(`  - Après-midi: ${setting.afternoonTime}`);
            console.log(`  - Soir: ${setting.eveningTime}`);
            console.log(`  - Nuit: ${setting.nightTime}`);
        }
    } catch (error) {
        console.error('❌ Erreur lors de la vérification des paramètres:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkNotificationSettings(); 