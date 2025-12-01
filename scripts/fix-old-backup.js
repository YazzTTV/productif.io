import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Chemins des fichiers
const oldBackupPath = path.join(__dirname, '../backups/productif_io_backup_2025-10-29_17-46-52-133Z.json');
const newBackupPath = path.join(__dirname, '../backups/productif_io_backup_2025-11-02_16-04-49-114Z.json');
const fixedBackupPath = path.join(__dirname, '../backups/productif_io_backup_2025-10-29_17-46-52-133Z_FIXED.json');

// Option pour mettre à jour l'original aussi (par défaut: true)
const updateOriginal = process.argv.includes('--update-original') || true;

console.log('🔧 Réparation de l\'ancienne sauvegarde...');
console.log(`📁 Ancienne sauvegarde: ${oldBackupPath}`);
console.log(`📁 Nouvelle sauvegarde: ${newBackupPath}`);
console.log(`📁 Sauvegarde réparée: ${fixedBackupPath}\n`);

// Vérifier que les fichiers existent
if (!fs.existsSync(oldBackupPath)) {
  console.error(`❌ Erreur: L'ancienne sauvegarde n'existe pas: ${oldBackupPath}`);
  process.exit(1);
}

if (!fs.existsSync(newBackupPath)) {
  console.error(`❌ Erreur: La nouvelle sauvegarde n'existe pas: ${newBackupPath}`);
  process.exit(1);
}

// Lire les sauvegardes
console.log('📖 Lecture des sauvegardes...');
const oldBackup = JSON.parse(fs.readFileSync(oldBackupPath, 'utf8'));
const newBackup = JSON.parse(fs.readFileSync(newBackupPath, 'utf8'));

// Vérifier les Users
const oldUserCount = oldBackup.User ? oldBackup.User.length : 0;
const newUserCount = newBackup.User ? newBackup.User.length : 0;

console.log(`\n📊 Statistiques:`);
console.log(`  - Users dans l'ancienne sauvegarde: ${oldUserCount}`);
console.log(`  - Users dans la nouvelle sauvegarde: ${newUserCount}`);

if (oldUserCount > 0) {
  console.log(`\n⚠️  L'ancienne sauvegarde contient déjà ${oldUserCount} utilisateurs.`);
  console.log(`   Voulez-vous quand même remplacer par les ${newUserCount} utilisateurs de la nouvelle sauvegarde ?`);
}

// Ajouter les Users de la nouvelle sauvegarde à l'ancienne
if (newBackup.User && newBackup.User.length > 0) {
  console.log(`\n✅ Ajout de ${newBackup.User.length} utilisateurs à l'ancienne sauvegarde...`);
  oldBackup.User = newBackup.User;
  console.log(`   ✅ ${oldBackup.User.length} utilisateurs ajoutés`);
} else {
  console.error(`❌ Erreur: La nouvelle sauvegarde ne contient pas d'utilisateurs`);
  process.exit(1);
}

// Sauvegarder la sauvegarde réparée
console.log(`\n💾 Sauvegarde de la sauvegarde réparée...`);
fs.writeFileSync(fixedBackupPath, JSON.stringify(oldBackup, null, 2));

// Afficher un résumé
const stats = fs.statSync(fixedBackupPath);
console.log(`✅ Sauvegarde réparée créée avec succès !`);
console.log(`📁 Fichier: ${fixedBackupPath}`);
console.log(`📊 Taille: ${(stats.size / 1024 / 1024).toFixed(2)} Mo`);

// Optionnellement, mettre à jour l'original aussi
if (updateOriginal) {
  console.log(`\n💾 Mise à jour de l'ancienne sauvegarde originale...`);
  // Créer une copie de sauvegarde de l'original
  const backupOriginalPath = path.join(__dirname, '../backups/productif_io_backup_2025-10-29_17-46-52-133Z_ORIGINAL.json');
  if (!fs.existsSync(backupOriginalPath)) {
    fs.copyFileSync(oldBackupPath, backupOriginalPath);
    console.log(`   📋 Copie de sauvegarde créée: ${backupOriginalPath}`);
  }
  
  // Mettre à jour l'original
  fs.writeFileSync(oldBackupPath, JSON.stringify(oldBackup, null, 2));
  console.log(`   ✅ Ancienne sauvegarde mise à jour avec ${oldBackup.User.length} utilisateurs`);
}

// Afficher un résumé des données
console.log(`\n📈 Résumé des données dans la sauvegarde réparée:`);
Object.keys(oldBackup).forEach(key => {
  if (Array.isArray(oldBackup[key])) {
    console.log(`  - ${key}: ${oldBackup[key].length} enregistrements`);
  }
});

console.log(`\n🎉 Réparation terminée !`);
console.log(`💡 Vous pouvez maintenant restaurer avec:`);
console.log(`   npm run restore-backup backups/productif_io_backup_2025-10-29_17-46-52-133Z_FIXED.json`);

