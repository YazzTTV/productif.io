#!/usr/bin/env node

/**
 * Script de test pour la planification des sauvegardes automatiques
 * 
 * Ce script exécute une sauvegarde immédiatement et se termine.
 */

const { spawn } = require('child_process');
const path = require('path');

// Chemins des scripts
const backupScript = path.resolve(__dirname, 'backup-database.js');

console.log('Test de sauvegarde automatique...');
console.log(`Chemin du script: ${backupScript}`);

try {
  console.log('Exécution de la sauvegarde...');
  const backup = spawn('node', [backupScript], { 
    stdio: 'inherit',
    shell: true
  });
  
  backup.on('close', (code) => {
    if (code === 0) {
      console.log('Test de sauvegarde terminé avec succès.');
    } else {
      console.error(`Le processus de sauvegarde s'est terminé avec le code ${code}`);
    }
    console.log('Test terminé, vérifiez le dossier "backups" pour voir le résultat.');
  });
} catch (error) {
  console.error('Erreur pendant le test de sauvegarde:', error.message);
  process.exit(1);
} 