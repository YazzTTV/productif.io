#!/usr/bin/env node

/**
 * Script de sauvegarde automatique de la base de données PostgreSQL
 * 
 * Ce script:
 * 1. Utilise l'URL de connexion PostgreSQL depuis les variables d'environnement
 * 2. Crée une sauvegarde avec une approche Node.js compatible
 * 3. Peut être exécuté manuellement ou programmé via cron/planificateur de tâches
 */

import { exec, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import os from 'os';
import { PrismaClient } from '@prisma/client';

// Obtenir le chemin du répertoire actuel en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// Utiliser Prisma pour exporter les données
try {
  console.log("Création d'une sauvegarde via Prisma...");
  
  // Exporter le schéma Prisma pour référence
  const schemaPath = path.join(backupDir, `schema_${dateStr}.prisma`);
  try {
    // Utiliser le schéma principal schema.prisma qui contient tous les modèles
    const schemaSourcePath = path.join(__dirname, '../prisma/schema.prisma');
    if (fs.existsSync(schemaSourcePath)) {
      fs.copyFileSync(schemaSourcePath, schemaPath);
      console.log(`Schéma Prisma copié vers ${schemaPath}`);
    } else {
      console.warn(`Le fichier ${schemaSourcePath} n'existe pas, tentative avec schema.web.prisma...`);
      fs.copyFileSync(path.join(__dirname, '../prisma/schema.web.prisma'), schemaPath);
      console.log(`Schéma Prisma (web) copié vers ${schemaPath}`);
    }
  } catch (err) {
    console.error(`Impossible de copier le schéma Prisma: ${err.message}`);
  }
  
  console.log("Extraction des données avec Prisma client...");
  
  const prisma = new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL,
  });
  
  // Fonction pour détecter automatiquement tous les modèles Prisma disponibles
  function detectPrismaModels() {
    const models = [];
    const excludedKeys = ['$connect', '$disconnect', '$on', '$transaction', '$use', '$extends', '_base', '_dmmf', '_engine', '_fetcher', '_queryEngine', '_runtime'];
    
    // Parcourir toutes les propriétés du client Prisma
    for (const key in prisma) {
      // Ignorer les méthodes internes et les propriétés système
      if (excludedKeys.includes(key) || key.startsWith('_') || key.startsWith('$')) {
        continue;
      }
      
      // Vérifier si c'est un modèle (a une méthode findMany)
      if (prisma[key] && typeof prisma[key].findMany === 'function') {
        // Convertir camelCase en PascalCase pour le nom du modèle
        const modelName = key.charAt(0).toUpperCase() + key.slice(1);
        models.push(modelName);
      }
    }
    
    return models.sort(); // Trier par ordre alphabétique
  }
  
  // Liste manuelle des modèles (fallback si la détection automatique échoue)
  const manualModels = [
    // Tables principales
    'User', 'Company', 'UserCompany', 'Session', 'Project',
    'Process', 'ProcessStep', 'Task', 'TimeEntry', 'DeepWorkSession',
    
    // Tables de gamification
    'UserGamification', 'Achievement', 'UserAchievement',
    'StreakHistory',
    
    // Tables de notifications
    'NotificationSettings', 'NotificationHistory',
    
    // Tables de missions et objectifs
    'Mission', 'Objective', 'ObjectiveAction', 'Initiative',
    'WarMapEvent',
    
    // Tables d'API et waitlist
    'ApiToken', 'WaitlistEntry',
    
    // Tables d'habitudes
    'Habit', 'HabitEntry',
    
    // Tables WhatsApp
    'WhatsAppConversation', 'WhatsAppMessage',
    
    // Tables de journal et insights
    'JournalEntry', 'DailyInsight',
    
    // Tables d'analyse comportementale
    'BehaviorCheckIn', 'BehaviorPattern', 'CheckInSchedule',
    'UserConversationState',
    
    // Tables de notifications d'essai et interactions agent
    'TrialNotification', 'AgentInteraction'
  ];
  
  // Détecter automatiquement les modèles ou utiliser la liste manuelle
  let models;
  try {
    models = detectPrismaModels();
    console.log(`✅ Détection automatique: ${models.length} modèles trouvés`);
    if (models.length === 0) {
      console.warn('⚠️ Aucun modèle détecté automatiquement, utilisation de la liste manuelle');
      models = manualModels;
    }
  } catch (err) {
    console.warn(`⚠️ Erreur lors de la détection automatique: ${err.message}`);
    console.log('Utilisation de la liste manuelle des modèles');
    models = manualModels;
  }
  
  console.log(`📋 Modèles à exporter: ${models.join(', ')}\n`);
  
  // Fonction pour extraire les données
  async function exportData() {
    try {
      const data = {};
      let totalRecords = 0;
      const exportedModels = [];
      const skippedModels = [];
      
      // Extraire les données pour chaque modèle
      for (const model of models) {
        console.log(`Exportation du modèle ${model}...`);
        try {
          // Conversion du nom du modèle au format camelCase pour l'API Prisma
          const modelName = model.charAt(0).toLowerCase() + model.slice(1);
          
          // Vérifier si le modèle existe dans le client Prisma
          if (typeof prisma[modelName] !== 'undefined' && typeof prisma[modelName].findMany === 'function') {
            data[model] = await prisma[modelName].findMany();
            totalRecords += data[model].length;
            exportedModels.push(model);
            console.log(`  ✅ ${data[model].length} enregistrements exportés`);
          } else {
            console.warn(`  ⚠️ Le modèle ${model} n'est pas disponible dans le client Prisma`);
            skippedModels.push(model);
            data[model] = [];
          }
        } catch (err) {
          console.error(`  ❌ Erreur lors de l'exportation du modèle ${model}: ${err.message}`);
          skippedModels.push(model);
          // Sauvegarder quand même une liste vide pour ce modèle
          data[model] = [];
        }
      }
      
      // Afficher un résumé
      console.log(`\n📊 Résumé de l'exportation:`);
      console.log(`  ✅ Modèles exportés avec succès: ${exportedModels.length}`);
      if (skippedModels.length > 0) {
        console.log(`  ⚠️ Modèles ignorés/erreurs: ${skippedModels.length} (${skippedModels.join(', ')})`);
      }
      
      // Écrire les données dans un fichier JSON
      fs.writeFileSync(backupFilePath, JSON.stringify(data, null, 2));
      console.log(`\nSauvegarde terminée: ${backupFilePath}`);
      console.log(`Total des enregistrements sauvegardés: ${totalRecords}`);
      
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