import { PrismaClient } from '@prisma/client';

async function fixNotificationDuplicates() {
    const prisma = new PrismaClient();
    
    console.log('🔧 === CORRECTION DES DUPLICATAS DE NOTIFICATIONS ===\n');
    
    try {
        // Étape 1: Analyser les duplicatas existants
        console.log('📊 Étape 1: Analyse des duplicatas existants...\n');
        
        const duplicates = await prisma.$queryRaw`
            SELECT 
                "userId", 
                type, 
                TO_CHAR("scheduledFor", 'YYYY-MM-DD HH24:MI') as scheduled_time,
                COUNT(*) as count,
                                 STRING_AGG(id::text, ',') as notification_ids,
                 STRING_AGG(status, ',') as statuses
             FROM "notification_history" 
             WHERE "scheduledFor" >= NOW() - INTERVAL '7 days'
             GROUP BY "userId", type, TO_CHAR("scheduledFor", 'YYYY-MM-DD HH24:MI')
            HAVING COUNT(*) > 1
            ORDER BY scheduled_time DESC, count DESC
        `;
        
        console.log(`🚨 Duplicatas trouvés: ${duplicates.length}`);
        
        if (duplicates.length > 0) {
            console.log('\n📋 Détail des duplicatas:');
            duplicates.forEach((dup, index) => {
                console.log(`${index + 1}. ${dup.type} - ${dup.scheduled_time}`);
                console.log(`   Utilisateur: ${dup.userId}`);
                console.log(`   Occurrences: ${dup.count}`);
                console.log(`   IDs: ${dup.notification_ids}`);
                console.log(`   Statuts: ${dup.statuses}`);
                console.log('');
            });
        }
        
        // Étape 2: Nettoyer les duplicatas existants
        console.log('🧹 Étape 2: Nettoyage des duplicatas...\n');
        
        let cleanedCount = 0;
        
        for (const duplicate of duplicates) {
            const notificationIds = duplicate.notification_ids.split(',');
            
            // Garder seulement la première notification (la plus ancienne)
            const toDelete = notificationIds.slice(1);
            
            if (toDelete.length > 0) {
                console.log(`🗑️ Suppression de ${toDelete.length} duplicatas pour ${duplicate.type} à ${duplicate.scheduled_time}`);
                
                const deleteResult = await prisma.notificationHistory.deleteMany({
                    where: {
                        id: {
                            in: toDelete
                        }
                    }
                });
                
                cleanedCount += deleteResult.count;
                console.log(`   ✅ ${deleteResult.count} notifications supprimées`);
            }
        }
        
        console.log(`\n✅ Total nettoyé: ${cleanedCount} duplicatas supprimés\n`);
        
        // Étape 3: Créer une contrainte unique (si pas déjà existante)
        console.log('🔐 Étape 3: Création de contrainte unique...\n');
        
        try {
            // Vérifier si l'index existe déjà
            const existingIndexes = await prisma.$queryRaw`
                SELECT constraint_name 
                FROM information_schema.table_constraints 
                WHERE table_name = 'notification_history' 
                AND constraint_name = 'unique_notification_schedule'
                AND constraint_type = 'UNIQUE'
            `;
            
            if (existingIndexes.length === 0) {
                console.log('📝 Création de l\'index unique...');
                
                await prisma.$executeRaw`
                    ALTER TABLE "notification_history" 
                    ADD CONSTRAINT unique_notification_schedule 
                    UNIQUE ("userId", type, "scheduledFor")
                `;
                
                console.log('✅ Contrainte unique créée avec succès');
            } else {
                console.log('✅ Contrainte unique déjà existante');
            }
        } catch (error) {
            console.log('⚠️ Impossible de créer la contrainte unique:', error.message);
            console.log('   (Cela peut être normal si elle existe déjà)');
        }
        
        // Étape 4: Vérifier l'état après nettoyage
        console.log('\n📊 Étape 4: Vérification post-nettoyage...\n');
        
        const remainingDuplicates = await prisma.$queryRaw`
            SELECT 
                "userId", 
                type, 
                                 TO_CHAR("scheduledFor", 'YYYY-MM-DD HH24:MI') as scheduled_time,
                 COUNT(*) as count
             FROM "notification_history" 
             WHERE "scheduledFor" >= NOW() - INTERVAL '7 days'
             GROUP BY "userId", type, TO_CHAR("scheduledFor", 'YYYY-MM-DD HH24:MI')
            HAVING COUNT(*) > 1
        `;
        
        if (remainingDuplicates.length === 0) {
            console.log('🎉 Aucun duplicata restant détecté !');
        } else {
            console.log(`⚠️ ${remainingDuplicates.length} duplicatas restants (nécessitent une attention manuelle)`);
        }
        
        // Étape 5: Recommandations pour éviter les futurs duplicatas
        console.log('\n💡 RECOMMANDATIONS POUR ÉVITER LES FUTURS DUPLICATAS:\n');
        console.log('1. 🔐 Utiliser des transactions atomiques pour la création de notifications');
        console.log('2. 🎯 Implémenter un système de verrous Redis pour la concurrence');
        console.log('3. 📝 Améliorer la logique anti-duplicate avec upsert');
        console.log('4. 🔍 Ajouter des logs de debug pour tracer les conditions de course');
        console.log('5. ⚡ Optimiser le système réactif pour réduire les race conditions');
        
        console.log('\n✅ Correction des duplicatas terminée avec succès !');
        
    } catch (error) {
        console.error('❌ Erreur lors de la correction:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Exécuter la correction
fixNotificationDuplicates().catch(console.error); 