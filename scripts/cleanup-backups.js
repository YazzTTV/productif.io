#!/usr/bin/env node

/**
 * Script de nettoyage des anciennes sauvegardes de la base de données
 * 
 * Ce script:
 * 1. Supprime les sauvegardes plus anciennes qu'un certain nombre de jours
 * 2. Conserve un nombre minimum de sauvegardes, quelle que soit leur ancienneté
 */

const fs = require('fs');
const path = require('path');

// Configuration
const MAX_AGE_DAYS = 30; // Conserver les sauvegardes des 30 derniers jours
const MIN_BACKUPS_TO_KEEP = 5; // Conserver au moins 5 sauvegardes

// Dossier des sauvegardes
const backupDir = path.join(__dirname, '../backups');

// Vérifier si le dossier de sauvegarde existe
if (!fs.existsSync(backupDir)) {
  console.log('Le dossier de sauvegardes n\'existe pas. Rien à nettoyer.');
  process.exit(0);
}

// Lire tous les fichiers de sauvegarde
console.log('Analyse des fichiers de sauvegarde...');
const backupFiles = fs.readdirSync(backupDir)
  .filter(file => {
    // Inclure à la fois les fichiers SQL et JSON
    return (file.startsWith('productif_io_backup_') && 
           (file.endsWith('.sql') || file.endsWith('.json')));
  })
  .map(file => ({
    name: file,
    path: path.join(backupDir, file),
    stats: fs.statSync(path.join(backupDir, file))
  }))
  .sort((a, b) => b.stats.mtime.getTime() - a.stats.mtime.getTime()); // Trier par date, plus récent en premier

console.log(`${backupFiles.length} fichiers de sauvegarde trouvés.`);

// Lire les fichiers de schéma
const schemaFiles = fs.readdirSync(backupDir)
  .filter(file => file.startsWith('schema_') && file.endsWith('.prisma'))
  .map(file => ({
    name: file,
    path: path.join(backupDir, file),
    stats: fs.statSync(path.join(backupDir, file))
  }))
  .sort((a, b) => b.stats.mtime.getTime() - a.stats.mtime.getTime()); // Trier par date, plus récent en premier

console.log(`${schemaFiles.length} fichiers de schéma trouvés.`);

// Si nous avons moins ou exactement le minimum de fichiers à conserver, ne rien faire
if (backupFiles.length <= MIN_BACKUPS_TO_KEEP) {
  console.log(`Seulement ${backupFiles.length} sauvegardes trouvées, moins que le minimum de ${MIN_BACKUPS_TO_KEEP}. Rien à supprimer.`);
  process.exit(0);
}

// Calculer la date limite
const now = new Date();
const cutoffDate = new Date(now.getTime() - (MAX_AGE_DAYS * 24 * 60 * 60 * 1000));

// Identifier les fichiers à supprimer (anciens, mais en gardant le minimum requis)
const filesToDelete = backupFiles.slice(MIN_BACKUPS_TO_KEEP)
  .filter(file => file.stats.mtime < cutoffDate);

const schemasToDelete = schemaFiles.slice(MIN_BACKUPS_TO_KEEP)
  .filter(file => file.stats.mtime < cutoffDate);

if (filesToDelete.length === 0 && schemasToDelete.length === 0) {
  console.log('Aucun fichier de sauvegarde ne répond aux critères de suppression.');
  process.exit(0);
}

// Supprimer les fichiers de sauvegarde
if (filesToDelete.length > 0) {
  console.log(`Suppression de ${filesToDelete.length} fichiers de sauvegarde anciens...`);
  filesToDelete.forEach(file => {
    try {
      fs.unlinkSync(file.path);
      console.log(`Supprimé: ${file.name}`);
    } catch (error) {
      console.error(`Erreur lors de la suppression de ${file.name}: ${error.message}`);
    }
  });
}

// Supprimer les fichiers de schéma
if (schemasToDelete.length > 0) {
  console.log(`Suppression de ${schemasToDelete.length} fichiers de schéma anciens...`);
  schemasToDelete.forEach(file => {
    try {
      fs.unlinkSync(file.path);
      console.log(`Supprimé: ${file.name}`);
    } catch (error) {
      console.error(`Erreur lors de la suppression de ${file.name}: ${error.message}`);
    }
  });
}

console.log('Nettoyage terminé.'); 