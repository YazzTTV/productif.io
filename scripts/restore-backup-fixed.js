import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

/**
 * Script de restauration de la base de données depuis une sauvegarde JSON
 * Version améliorée qui gère les nouveaux champs du système de trial
 */

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
      'Company',
      'User',
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
      'ApiToken',
      'UserGamification',
      'Achievement',
      'UserAchievement',
      'StreakHistory',
      'NotificationSettings'
    ];

    let totalRestored = 0;
    const restoredIds = new Map();

    // Restaurer les données dans l'ordre
    for (const modelName of restoreOrder) {
      if (!backupData[modelName] || backupData[modelName].length === 0) {
        continue;
      }

      console.log(`\n📝 Restauration de ${modelName}...`);
      const modelNameLower = modelName.charAt(0).toLowerCase() + modelName.slice(1);
      let restoredCount = 0;

      // Stocker les IDs restaurés pour ce modèle
      if (!restoredIds.has(modelName)) {
        restoredIds.set(modelName, new Set());
      }

      for (const record of backupData[modelName]) {
        try {
          const { id, ...data } = record;
          const whereClause = { id };
          let createData = { id, ...data };
          let updateData = { ...data };

          // Nettoyer les champs spécifiques aux Users pour le système de trial
          if (modelName === 'User') {
            // Initialiser les nouveaux champs de trial
            createData.trialStartDate = null;
            createData.trialEndDate = null;
            createData.trialStatus = 'active';
            createData.subscriptionStatus = 'trial';
            createData.subscriptionTier = null;
            createData.subscriptionEndDate = null;
            createData.convertedAt = null;
            createData.cancelledAt = null;
            
            updateData.trialStartDate = null;
            updateData.trialEndDate = null;
            updateData.trialStatus = 'active';
            updateData.subscriptionStatus = 'trial';
            updateData.subscriptionTier = null;
            updateData.subscriptionEndDate = null;
            updateData.convertedAt = null;
            updateData.cancelledAt = null;
          }

          // Vérifier les relations avant de restaurer
          let canRestore = true;

          // Vérifier la relation Company pour les utilisateurs
          if (modelName === 'User' && data.managedCompanyId) {
            const companyExists = restoredIds.get('Company')?.has(data.managedCompanyId);
            if (!companyExists) {
              console.log(`    ⚠️  Entreprise ${data.managedCompanyId} non trouvée pour l'utilisateur ${id}`);
              delete createData.managedCompanyId;
              delete updateData.managedCompanyId;
            }
          }

          // Vérifier la relation User
          if (data.userId) {
            const userExists = restoredIds.get('User')?.has(data.userId);
            if (!userExists) {
              console.log(`    ⚠️  Utilisateur ${data.userId} non trouvé pour ${modelName} ${id}`);
              canRestore = false;
            }
          }

          // Vérifier la relation Habit
          if (modelName === 'HabitEntry' && data.habitId) {
            const habitExists = restoredIds.get('Habit')?.has(data.habitId);
            if (!habitExists) {
              console.log(`    ⚠️  Habitude ${data.habitId} non trouvée pour l'entrée ${id}`);
              canRestore = false;
            }
          }

          // Vérifier la relation Project
          if (data.projectId) {
            const projectExists = restoredIds.get('Project')?.has(data.projectId);
            if (!projectExists && data.projectId !== null) {
              console.log(`    ⚠️  Projet ${data.projectId} non trouvé pour ${modelName} ${id}`);
              canRestore = false;
            }
          }

          if (!canRestore) {
            continue;
          }

          // Supprimer les champs non présents dans le schéma
          if (modelName === 'ApiToken') {
            delete updateData.description;
            delete createData.description;
            delete updateData.scopes;
            delete createData.scopes;
          }

          // Gérer les champs spéciaux pour WarMapEvent
          if (modelName === 'WarMapEvent') {
            updateData.date = updateData.startDate;
            createData.date = createData.startDate;
          }

          const result = await prisma[modelNameLower].upsert({
            where: whereClause,
            update: updateData,
            create: createData
          });

          // Stocker l'ID restauré
          restoredIds.get(modelName).add(result.id);
          restoredCount++;
        } catch (error) {
          console.log(`    ⚠️  Erreur pour un enregistrement de ${modelName} (${record.id}): \n${error.message}`);
        }
      }

      console.log(`  ✅ ${restoredCount} enregistrements restaurés sur ${backupData[modelName].length} disponibles`);
      totalRestored += restoredCount;
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
main().catch(console.error);

export { restoreBackup };

