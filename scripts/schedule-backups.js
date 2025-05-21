#!/usr/bin/env node

/**
 * Script de planification des sauvegardes automatiques
 * 
 * Ce script configure des tâches cron pour:
 * 1. Exécuter la sauvegarde de la base de données quotidiennement
 * 2. Nettoyer les anciennes sauvegardes une fois par semaine
 */

const { CronJob } = require('cron');
const { execSync } = require('child_process');
const path = require('path');

// Chemins des scripts
const backupScript = path.join(__dirname, 'backup-database.js');
const cleanupScript = path.join(__dirname, 'cleanup-backups.js');

// Vérifier si les modules nécessaires sont installés
try {
  require.resolve('cron');
} catch (e) {
  console.log('Installation du module cron...');
  execSync('npm install cron --save');
  console.log('Module cron installé.');
}

try {
  require.resolve('dotenv');
} catch (e) {
  console.log('Installation du module dotenv...');
  execSync('npm install dotenv --save');
  console.log('Module dotenv installé.');
}

console.log('Configuration des tâches de sauvegarde automatique...');

// Exécuter une sauvegarde quotidienne à 3h du matin
const backupJob = new CronJob(
  '0 3 * * *', // Tous les jours à 3h du matin
  function() {
    console.log('Exécution de la sauvegarde quotidienne...');
    try {
      execSync(`node ${backupScript}`, { stdio: 'inherit' });
      console.log('Sauvegarde terminée.');
    } catch (error) {
      console.error('Erreur pendant la sauvegarde:', error.message);
    }
  },
  null,
  true,
  'Europe/Paris'
);

// Nettoyer les anciennes sauvegardes tous les dimanches à 4h du matin
const cleanupJob = new CronJob(
  '0 4 * * 0', // Tous les dimanches à 4h du matin
  function() {
    console.log('Nettoyage des anciennes sauvegardes...');
    try {
      execSync(`node ${cleanupScript}`, { stdio: 'inherit' });
      console.log('Nettoyage terminé.');
    } catch (error) {
      console.error('Erreur pendant le nettoyage:', error.message);
    }
  },
  null,
  true,
  'Europe/Paris'
);

// Démarrer les tâches
backupJob.start();
cleanupJob.start();

console.log('Tâches de sauvegarde automatique configurées:');
console.log('- Sauvegarde quotidienne à 3h00 (heure de Paris)');
console.log('- Nettoyage hebdomadaire le dimanche à 4h00 (heure de Paris)');
console.log('Appuyez sur Ctrl+C pour arrêter le planificateur.');

// Garder le processus en vie
process.stdin.resume(); 