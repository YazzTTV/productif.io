#!/usr/bin/env node

/**
 * Script de restauration de la base de données depuis une sauvegarde JSON
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function restoreBackup(backupFilePath) {
  console.log('🔄 Début de la restauration...');
  console.log(`📁 Fichier de sauvegarde: ${backupFilePath}`);

  try {
    // Vérifier que le fichier existe
    if (!fs.existsSync(backupFilePath)) {
      throw new Error(`Le fichier de sauvegarde n'existe pas: ${backupFilePath}`);
    }

    // Lire le fichier de sauvegarde
    console.log('📖 Lecture du fichier de sauvegarde...');
    const backupData = JSON.parse(fs.readFileSync(backupFilePath, 'utf8'));

    // Ordre de restauration (important pour les relations)
    const restoreOrder = [
      'User',
      'Company', 
      'UserCompany',
      'Session',
      'Project',
      'Process',
      'Task',
      'TimeEntry',
      'Habit',
      'HabitEntry',
      'Mission',
      'Objective',
      'ObjectiveAction',
      'Initiative',
      'WarMapEvent',
      'ApiToken'
    ];

    let totalRestored = 0;

    for (const modelName of restoreOrder) {
      if (backupData[modelName] && backupData[modelName].length > 0) {
        console.log(`\n📝 Restauration de ${modelName}...`);
        
        const modelNameLower = modelName.charAt(0).toLowerCase() + modelName.slice(1);
        
        try {
          // Vérifier si le modèle existe dans Prisma
          if (typeof prisma[modelNameLower] !== 'undefined') {
            const records = backupData[modelName];
            let restoredCount = 0;
            
            // Restaurer enregistrement par enregistrement avec upsert
            for (const record of records) {
              try {
                // Traiter les données pour s'assurer qu'elles sont compatibles
                const processed = { ...record };
                
                // Convertir les champs de date
                ['createdAt', 'updatedAt', 'date', 'dueDate', 'scheduledFor', 'startTime', 'endTime', 'startDate', 'endDate', 'expiresAt', 'lastUsed', 'trialEndsAt', 'unlockedAt'].forEach(dateField => {
                  if (processed[dateField]) {
                    processed[dateField] = new Date(processed[dateField]);
                  }
                });

                // Définir les clés uniques selon le modèle
                let whereClause = {};
                let updateData = { ...processed };
                let createData = { ...processed };

                // Supprimer l'id des données de mise à jour si présent
                delete updateData.id;

                switch (modelName) {
                  case 'User':
                    whereClause = { id: processed.id };
                    break;
                  case 'Company':
                    whereClause = { id: processed.id };
                    break;
                  case 'UserCompany':
                    whereClause = { 
                      userId_companyId: {
                        userId: processed.userId,
                        companyId: processed.companyId
                      }
                    };
                    break;
                  case 'Session':
                    whereClause = { id: processed.id };
                    break;
                  case 'Project':
                    whereClause = { id: processed.id };
                    break;
                  case 'Process':
                    whereClause = { id: processed.id };
                    break;
                  case 'Task':
                    whereClause = { id: processed.id };
                    break;
                  case 'TimeEntry':
                    whereClause = { id: processed.id };
                    break;
                  case 'Habit':
                    whereClause = { id: processed.id };
                    break;
                  case 'HabitEntry':
                    whereClause = { 
                      habitId_date: {
                        habitId: processed.habitId,
                        date: processed.date
                      }
                    };
                    break;
                  case 'Mission':
                    whereClause = { id: processed.id };
                    break;
                  case 'Objective':
                    whereClause = { id: processed.id };
                    break;
                  case 'ObjectiveAction':
                    whereClause = { id: processed.id };
                    break;
                  case 'WarMapEvent':
                    whereClause = { id: processed.id };
                    break;
                  case 'ApiToken':
                    whereClause = { id: processed.id };
                    break;
                  default:
                    whereClause = { id: processed.id };
                }

                await prisma[modelNameLower].upsert({
                  where: whereClause,
                  update: updateData,
                  create: createData
                });

                restoredCount++;
              } catch (recordError) {
                console.error(`    ⚠️  Erreur pour un enregistrement de ${modelName}:`, recordError.message);
                // Continuer avec les autres enregistrements
              }
            }

            console.log(`  ✅ ${restoredCount} enregistrements restaurés sur ${records.length} disponibles`);
            totalRestored += restoredCount;
          } else {
            console.log(`  ⚠️  Modèle ${modelName} non trouvé dans Prisma, ignoré`);
          }
        } catch (error) {
          console.error(`  ❌ Erreur lors de la restauration de ${modelName}:`, error.message);
          // Continuer avec les autres modèles
        }
      } else {
        console.log(`  ℹ️  Aucune donnée pour ${modelName}`);
      }
    }

    console.log(`\n🎉 Restauration terminée !`);
    console.log(`📊 Total d'enregistrements restaurés: ${totalRestored}`);

    // Afficher un résumé
    console.log('\n📈 Résumé de la restauration:');
    for (const modelName of restoreOrder) {
      if (backupData[modelName] && backupData[modelName].length > 0) {
        const modelNameLower = modelName.charAt(0).toLowerCase() + modelName.slice(1);
        if (typeof prisma[modelNameLower] !== 'undefined') {
          try {
            const count = await prisma[modelNameLower].count();
            console.log(`  - ${modelName}: ${count} enregistrements`);
          } catch (error) {
            console.log(`  - ${modelName}: Erreur lors du comptage`);
          }
        }
      }
    }

  } catch (error) {
    console.error('❌ Erreur lors de la restauration:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Fonction principale
async function main() {
  const args = process.argv.slice(2);
  
  let backupFile;
  if (args.length > 0) {
    backupFile = args[0];
  } else {
    // Utiliser la sauvegarde la plus récente par défaut
    const backupDir = path.join(__dirname, '../backups');
    const files = fs.readdirSync(backupDir)
      .filter(file => file.endsWith('.json') && file.startsWith('productif_io_backup_'))
      .sort()
      .reverse();
    
    if (files.length === 0) {
      console.error('❌ Aucun fichier de sauvegarde trouvé');
      process.exit(1);
    }
    
    backupFile = path.join(backupDir, files[0]);
    console.log(`🔍 Utilisation de la sauvegarde la plus récente: ${files[0]}`);
  }

  await restoreBackup(backupFile);
}

// Exécuter le script
if (require.main === module) {
  main();
}

module.exports = { restoreBackup }; 