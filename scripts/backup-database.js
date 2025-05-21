#!/usr/bin/env node

/**
 * Script de sauvegarde automatique de la base de données PostgreSQL
 * 
 * Ce script:
 * 1. Utilise l'URL de connexion PostgreSQL depuis les variables d'environnement
 * 2. Crée une sauvegarde avec une approche Node.js compatible
 * 3. Peut être exécuté manuellement ou programmé via cron/planificateur de tâches
 */

const { exec, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const os = require('os');

// Charger les variables d'environnement
dotenv.config();

// Obtenir l'URL de la base de données
const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('La variable d\'environnement DATABASE_URL n\'est pas définie');
  process.exit(1);
}

// Créer le dossier de sauvegardes s'il n'existe pas
const backupDir = path.join(__dirname, '../backups');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

// Générer un nom de fichier basé sur la date et l'heure
const now = new Date();
const dateStr = now.toISOString().replace(/[:.]/g, '-').replace('T', '_').split('.')[0];
const backupFilePath = path.join(backupDir, `productif_io_backup_${dateStr}.json`);

console.log(`Sauvegarde de la base de données en cours...`);
console.log(`Fichier de destination: ${backupFilePath}`);

// Utiliser Prisma pour exporter les données (si prisma-client-js est disponible)
try {
  console.log("Création d'une sauvegarde via Prisma...");
  
  // Exporter le schéma Prisma pour référence
  const schemaPath = path.join(backupDir, `schema_${dateStr}.prisma`);
  try {
    fs.copyFileSync(path.join(__dirname, '../prisma/schema.prisma'), schemaPath);
    console.log(`Schéma Prisma copié vers ${schemaPath}`);
  } catch (err) {
    console.error(`Impossible de copier le schéma Prisma: ${err.message}`);
  }
  
  // Méthode alternative: utiliser prisma db pull pour obtenir le schéma actuel
  console.log("Génération d'une sauvegarde alternative...");
  
  // Utiliser le client Prisma pour extraire les données
  console.log("Extraction des données avec Prisma client...");
  
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  
  // Liste des modèles à exporter (en fonction du schéma)
  const models = [
    'User', 'Company', 'UserCompany', 'Session', 'Project',
    'Process', 'Task', 'TimeEntry', 'Habit', 'HabitEntry',
    'Mission', 'Objective', 'ObjectiveAction', 'Initiative',
    'WarMapEvent', 'ApiToken'
  ];
  
  // Fonction pour extraire les données
  async function exportData() {
    try {
      const data = {};
      
      // Extraire les données pour chaque modèle
      for (const model of models) {
        console.log(`Exportation du modèle ${model}...`);
        try {
          // Conversion du nom du modèle au format camelCase pour l'API Prisma
          const modelName = model.charAt(0).toLowerCase() + model.slice(1);
          
          // Vérifier si le modèle existe dans le client Prisma
          if (typeof prisma[modelName] !== 'undefined') {
            data[model] = await prisma[modelName].findMany();
            console.log(`  - ${data[model].length} enregistrements exportés`);
          } else {
            console.warn(`  - Le modèle ${model} n'est pas disponible dans le client Prisma`);
          }
        } catch (err) {
          console.error(`  - Erreur lors de l'exportation du modèle ${model}: ${err.message}`);
        }
      }
      
      // Écrire les données dans un fichier JSON
      fs.writeFileSync(backupFilePath, JSON.stringify(data, null, 2));
      console.log(`Sauvegarde terminée: ${backupFilePath}`);
      
      // Afficher la taille du fichier
      const stats = fs.statSync(backupFilePath);
      console.log(`Taille du fichier: ${(stats.size / 1024 / 1024).toFixed(2)} Mo`);
      
      // Fermer la connexion Prisma
      await prisma.$disconnect();
    } catch (err) {
      console.error(`Erreur globale: ${err.message}`);
      process.exit(1);
    }
  }
  
  // Exécuter l'exportation
  exportData();
  
} catch (err) {
  console.error(`Erreur lors de la sauvegarde: ${err.message}`);
  process.exit(1);
} 