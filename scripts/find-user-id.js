import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function findUserId() {
    console.log('🔍 Recherche des utilisateurs dans la base de données');
    console.log('=' * 50);
    
    try {
        // Chercher tous les utilisateurs
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                whatsappNumber: true,
                createdAt: true,
                _count: {
                    select: {
                        habits: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        
        console.log(`\n👥 ${users.length} utilisateur(s) trouvé(s):`);
        
        users.forEach((user, index) => {
            console.log(`\n${index + 1}. 👤 ${user.name || 'Sans nom'}`);
            console.log(`   📧 Email: ${user.email}`);
            console.log(`   🆔 ID: ${user.id}`);
            console.log(`   📱 WhatsApp: ${user.whatsappNumber || 'Non configuré'}`);
            console.log(`   📅 Créé: ${user.createdAt.toLocaleDateString('fr-FR')}`);
            console.log(`   📋 Habitudes: ${user._count.habits}`);
        });
        
        // Chercher spécifiquement l'utilisateur avec le numéro WhatsApp de test
        const testPhone = '33783642205';
        const userWithTestPhone = users.find(u => u.whatsappNumber === testPhone);
        
        if (userWithTestPhone) {
            console.log(`\n🎯 UTILISATEUR AVEC LE NUMÉRO DE TEST TROUVÉ !`);
            console.log(`   📧 Email: ${userWithTestPhone.email}`);
            console.log(`   🆔 ID: ${userWithTestPhone.id}`);
            console.log(`   📱 WhatsApp: ${userWithTestPhone.whatsappNumber}`);
            
            // Lister ses habitudes
            const habits = await prisma.habit.findMany({
                where: { userId: userWithTestPhone.id },
                select: { id: true, name: true }
            });
            
            console.log(`\n📋 Ses ${habits.length} habitudes:`);
            habits.forEach((habit, index) => {
                console.log(`   ${index + 1}. ${habit.name} (${habit.id})`);
            });
            
        } else {
            console.log(`\n❌ Aucun utilisateur trouvé avec le numéro WhatsApp ${testPhone}`);
            
            if (users.length > 0) {
                console.log('\n💡 Suggestion: Utilisez l\'ID du premier utilisateur pour les tests:');
                console.log(`   🆔 ID à utiliser: ${users[0].id}`);
                console.log(`   📧 Email: ${users[0].email}`);
            }
        }
        
    } catch (error) {
        console.error('❌ Erreur:', error);
    } finally {
        await prisma.$disconnect();
    }
}

findUserId(); 