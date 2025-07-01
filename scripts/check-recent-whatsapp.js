import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkRecentWhatsApp() {
    console.log('💬 Derniers messages WhatsApp');
    console.log('=' * 40);
    
    try {
        const user = await prisma.user.findUnique({
            where: { whatsappNumber: '33783642205' }
        });

        if (!user) {
            console.log('❌ Utilisateur non trouvé');
            return;
        }

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

        recentMessages.forEach((message, index) => {
            const role = message.isFromUser ? '👤 User' : '🤖 IA';
            const preview = message.content.length > 100 
                ? message.content.substring(0, 100) + '...' 
                : message.content;
            console.log(`${index + 1}. ${role}: "${preview}"`);
            console.log(`   🕐 ${message.createdAt.toLocaleString('fr-FR')}`);
            console.log('');
        });

    } catch (error) {
        console.error('❌ Erreur:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkRecentWhatsApp(); 