import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugNoteJournee() {
    console.log('🔍 Debug: Recherche des dernières entrées "Note de sa journée"');
    console.log('=' * 60);
    
    try {
        // Trouver l'utilisateur
        const user = await prisma.user.findUnique({
            where: { whatsappNumber: '33783642205' }
        });

        if (!user) {
            console.log('❌ Utilisateur non trouvé');
            return;
        }

        // Chercher l'habitude "Note de sa journée"
        const noteHabit = await prisma.habit.findFirst({
            where: {
                userId: user.id,
                name: {
                    contains: 'note de sa journée',
                    mode: 'insensitive'
                }
            }
        });

        if (!noteHabit) {
            console.log('❌ Habitude "Note de sa journée" non trouvée');
            return;
        }

        console.log(`🎯 Habitude: "${noteHabit.name}"`);
        console.log(`   ID: ${noteHabit.id}`);
        console.log('');

        // Chercher TOUTES les entrées récentes (dernières 10)
        const recentEntries = await prisma.habitEntry.findMany({
            where: {
                habitId: noteHabit.id
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 10
        });

        console.log(`📊 Dernières entrées trouvées: ${recentEntries.length}`);
        console.log('');

        if (recentEntries.length === 0) {
            console.log('❌ Aucune entrée trouvée pour cette habitude');
        } else {
            recentEntries.forEach((entry, index) => {
                console.log(`${index + 1}. 📅 Date: ${entry.date.toLocaleDateString('fr-FR')}`);
                console.log(`   📅 Date UTC: ${entry.date.toISOString()}`);
                console.log(`   ✅ Complétée: ${entry.completed}`);
                console.log(`   🕐 Créée: ${entry.createdAt.toLocaleString('fr-FR')}`);
                
                if (entry.rating !== null) {
                    console.log(`   ⭐ Note: ${entry.rating}/10`);
                }
                
                if (entry.note) {
                    const notePreview = entry.note.length > 100 
                        ? entry.note.substring(0, 100) + '...' 
                        : entry.note;
                    console.log(`   📝 Note: "${notePreview}"`);
                }
                console.log('');
            });
        }

        // Vérifier les conversations WhatsApp récentes
        console.log('💬 CONVERSATIONS WHATSAPP RÉCENTES (pour debug)');
        console.log('-' * 50);

        const recentMessages = await prisma.whatsAppMessage.findMany({
            where: {
                conversation: {
                    userId: user.id
                }
            },
            include: {
                conversation: true
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 10
        });

        console.log(`📱 Messages récents: ${recentMessages.length}`);
        console.log('');

        recentMessages.forEach((message, index) => {
            const role = message.isFromUser ? '👤 User' : '🤖 IA';
            const preview = message.content.substring(0, 80) + (message.content.length > 80 ? '...' : '');
            console.log(`${index + 1}. ${role}: "${preview}"`);
            console.log(`   🕐 ${message.createdAt.toLocaleString('fr-FR')}`);
        });

    } catch (error) {
        console.error('❌ Erreur:', error);
    } finally {
        await prisma.$disconnect();
    }
}

debugNoteJournee(); 