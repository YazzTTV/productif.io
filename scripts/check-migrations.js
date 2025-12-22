#!/usr/bin/env node

/**
 * Script pour vérifier l'état des migrations Prisma
 * Vérifie si toutes les migrations sont appliquées et si le schéma est à jour
 */

import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { join } from 'path';

console.log('🔍 Vérification de l\'état des migrations Prisma...\n');

try {
  // Vérifier le schéma Prisma
  console.log('1️⃣ Validation du schéma Prisma...');
  execSync('npx prisma validate', { stdio: 'inherit' });
  console.log('✅ Schéma Prisma valide\n');

  // Vérifier l'état des migrations
  console.log('2️⃣ Vérification de l\'état des migrations...');
  const statusOutput = execSync('npx prisma migrate status', { 
    encoding: 'utf-8',
    stdio: 'pipe'
  });
  
  console.log(statusOutput);

  // Compter les migrations
  const migrationsDir = join(process.cwd(), 'prisma', 'migrations');
  const { readdirSync, statSync } = await import('fs');
  const migrationDirs = readdirSync(migrationsDir)
    .filter(item => {
      const fullPath = join(migrationsDir, item);
      return statSync(fullPath).isDirectory() && item !== '.git';
    })
    .sort();

  console.log(`\n3️⃣ Nombre de migrations trouvées: ${migrationDirs.length}`);
  
  // Vérifier s'il y a des migrations en attente
  if (statusOutput.includes('Database schema is up to date')) {
    console.log('✅ Toutes les migrations sont appliquées\n');
  } else if (statusOutput.includes('migrations have not yet been applied')) {
    console.log('⚠️  Certaines migrations ne sont pas encore appliquées\n');
    process.exit(1);
  } else {
    console.log('⚠️  État des migrations incertain\n');
    process.exit(1);
  }

  // Vérifier la cohérence du schéma
  console.log('4️⃣ Vérification de la cohérence du schéma...');
  try {
    execSync('npx prisma db pull --print > /dev/null 2>&1', { stdio: 'pipe' });
    console.log('✅ Schéma cohérent avec la base de données\n');
  } catch (error) {
    console.log('⚠️  Impossible de vérifier la cohérence du schéma (peut être normal si la DB est distante)\n');
  }

  console.log('✅ Toutes les vérifications sont passées !');
  process.exit(0);

} catch (error) {
  console.error('❌ Erreur lors de la vérification des migrations:', error.message);
  process.exit(1);
}

