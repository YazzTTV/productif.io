#!/usr/bin/env node

/**
 * Script pour restaurer uniquement les entrées de la waitlist depuis une sauvegarde
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Charger les variables d'environnement
dotenv.config();

const prisma = new PrismaClient();

async function restoreWaitlistOnly(backupFilePath) {
  console.log('🔄 Début de la restauration de la waitlist...');
  console.log(`📁 Fichier de sauvegarde: ${backupFilePath}`);

  try {
    // Vérifier que le fichier existe
    if (!fs.existsSync(backupFilePath)) {
      throw new Error(`Le fichier de sauvegarde n'existe pas: ${backupFilePath}`);
    }

    // Lire le fichier de sauvegarde
    console.log('📖 Lecture du fichier de sauvegarde...');
    const backupData = JSON.parse(fs.readFileSync(backupFilePath, 'utf8'));

    // Récupérer les entrées de la waitlist
    const waitlistEntries = backupData.WaitlistEntry || backupData.waitlistEntry || [];

    if (waitlistEntries.length === 0) {
      console.log('⚠️  Aucune entrée waitlist trouvée dans la sauvegarde');
      return;
    }

    console.log(`📋 ${waitlistEntries.length} entrées waitlist trouvées dans la sauvegarde\n`);

    let restoredCount = 0;
    let skippedCount = 0;
    let updatedCount = 0;

    // Restaurer chaque entrée
    for (const entry of waitlistEntries) {
      try {
        const { id, email, phone, motivation, status, currentStep, stripeSessionId, createdAt, updatedAt } = entry;

        // Vérifier si l'entrée existe déjà (par email qui est unique)
        const existing = await prisma.waitlistEntry.findUnique({
          where: { email }
        });

        if (existing) {
          // Mettre à jour l'entrée existante
          await prisma.waitlistEntry.update({
            where: { email },
            data: {
              phone: phone || null,
              motivation: motivation || null,
              status: status || 'pas_paye',
              currentStep: currentStep || 1,
              stripeSessionId: stripeSessionId || null,
              updatedAt: updatedAt ? new Date(updatedAt) : new Date()
            }
          });
          updatedCount++;
          console.log(`  ✅ Mis à jour: ${email}`);
        } else {
          // Créer une nouvelle entrée
          await prisma.waitlistEntry.create({
            data: {
              id,
              email,
              phone: phone || null,
              motivation: motivation || null,
              status: status || 'pas_paye',
              currentStep: currentStep || 1,
              stripeSessionId: stripeSessionId || null,
              createdAt: createdAt ? new Date(createdAt) : new Date(),
              updatedAt: updatedAt ? new Date(updatedAt) : new Date()
            }
          });
          restoredCount++;
          console.log(`  ✅ Restauré: ${email}`);
        }
      } catch (err) {
        console.error(`  ❌ Erreur pour ${entry.email}: ${err.message}`);
        skippedCount++;
      }
    }

    // Afficher le résumé
    console.log(`\n📊 Résumé de la restauration:`);
    console.log(`  ✅ Entrées restaurées (nouvelles): ${restoredCount}`);
    console.log(`  🔄 Entrées mises à jour: ${updatedCount}`);
    console.log(`  ⚠️  Entrées ignorées/erreurs: ${skippedCount}`);
    console.log(`  📝 Total traité: ${waitlistEntries.length}`);

  } catch (err) {
    console.error(`❌ Erreur lors de la restauration: ${err.message}`);
    throw err;
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
    // Si c'est un chemin relatif, le résoudre par rapport au dossier backups
    if (!path.isAbsolute(backupFile)) {
      backupFile = path.join(__dirname, '../backups', backupFile);
    }
  } else {
    // Utiliser la sauvegarde spécifique qui contient les données waitlist
    const backupDir = path.join(__dirname, '../backups');
    backupFile = path.join(backupDir, 'productif_io_backup_2025-10-08_15-30-33-854Z.json');
    
    if (!fs.existsSync(backupFile)) {
      console.error(`❌ Fichier de sauvegarde non trouvé: ${backupFile}`);
      console.log('💡 Utilisation: node scripts/restore-waitlist-only.js [chemin_vers_backup.json]');
      process.exit(1);
    }
    
    console.log(`🔍 Utilisation de la sauvegarde: productif_io_backup_2025-10-08_15-30-33-854Z.json`);
  }

  await restoreWaitlistOnly(backupFile);
}

// Exécuter le script
main().catch((error) => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});

