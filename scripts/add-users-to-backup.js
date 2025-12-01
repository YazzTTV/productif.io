import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

/**
 * Script pour ajouter les utilisateurs manquants à une ancienne sauvegarde
 */
async function addUsersToBackup(backupFilePath) {
  console.log('🔄 Ajout des utilisateurs à la sauvegarde...');
  console.log(`📁 Fichier de sauvegarde: ${backupFilePath}`);

  try {
    // Vérifier que le fichier existe
    if (!fs.existsSync(backupFilePath)) {
      throw new Error(`Le fichier de sauvegarde n'existe pas: ${backupFilePath}`);
    }

    // Lire la sauvegarde existante
    console.log('📖 Lecture de la sauvegarde existante...');
    const backupData = JSON.parse(fs.readFileSync(backupFilePath, 'utf8'));

    // Vérifier combien d'utilisateurs sont déjà dans la sauvegarde
    const existingUsers = backupData.User || [];
    console.log(`📊 Utilisateurs dans la sauvegarde: ${existingUsers.length}`);

    // Récupérer tous les utilisateurs de la base de données
    console.log('📥 Récupération des utilisateurs depuis la base de données...');
    const allUsers = await prisma.user.findMany();
    console.log(`📊 Utilisateurs dans la base de données: ${allUsers.length}`);

    // Créer un Set des IDs d'utilisateurs déjà présents dans la sauvegarde
    const existingUserIds = new Set(existingUsers.map(u => u.id));

    // Filtrer les utilisateurs qui ne sont pas déjà dans la sauvegarde
    const usersToAdd = allUsers.filter(user => !existingUserIds.has(user.id));

    if (usersToAdd.length === 0) {
      console.log('✅ Tous les utilisateurs sont déjà dans la sauvegarde !');
      return;
    }

    console.log(`➕ Ajout de ${usersToAdd.length} utilisateurs à la sauvegarde...`);

    // Ajouter les utilisateurs à la sauvegarde
    backupData.User = [...existingUsers, ...usersToAdd];

    // Créer une sauvegarde du fichier original
    const backupDir = path.dirname(backupFilePath);
    const backupFileName = path.basename(backupFilePath);
    const backupOriginalPath = path.join(backupDir, `${backupFileName}.original`);
    
    console.log(`💾 Sauvegarde du fichier original: ${backupOriginalPath}`);
    fs.copyFileSync(backupFilePath, backupOriginalPath);

    // Écrire la sauvegarde modifiée
    console.log(`💾 Écriture de la sauvegarde modifiée...`);
    fs.writeFileSync(backupFilePath, JSON.stringify(backupData, null, 2));

    // Afficher un résumé
    console.log(`\n✅ Sauvegarde mise à jour avec succès !`);
    console.log(`📊 Utilisateurs dans la sauvegarde maintenant: ${backupData.User.length}`);
    console.log(`📁 Fichier original sauvegardé: ${backupOriginalPath}`);

  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout des utilisateurs:', error);
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
    // Utiliser l'ancienne sauvegarde par défaut
    const backupDir = path.join(__dirname, '../backups');
    backupFile = path.join(backupDir, 'productif_io_backup_2025-10-29_17-46-52-133Z.json');
    console.log(`🔍 Utilisation de la sauvegarde par défaut: ${path.basename(backupFile)}`);
  }

  await addUsersToBackup(backupFile);
}

// Exécuter le script
main().catch(console.error);

