#!/usr/bin/env node
/**
 * Script pour extraire le nombre de visiteurs depuis TokyoTreat (1).csv
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const csvPath = path.join(__dirname, '..', 'TokyoTreat (1).csv');

try {
  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.trim().split('\n');

  if (lines.length < 2) {
    console.log('Aucune donnée de visiteurs trouvée.');
    process.exit(0);
  }

  const headers = lines[0].split(',');
  const visitorsIndex = headers.indexOf('visitors');
  const typeIndex = headers.indexOf('type');
  const valueIndex = headers.indexOf('value');

  let totalVisitors = 0;
  const details = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    const type = values[typeIndex];
    const value = values[valueIndex];
    const visitors = parseInt(values[visitorsIndex], 10);

    if (!isNaN(visitors)) {
      totalVisitors = Math.max(totalVisitors, visitors);
      details.push({ type, value, visitors });
    }
  }

  // Le nombre total de visiteurs = le max (souvent la page d'accueil "/")
  const mainEntry = details.find(d => d.type === 'url' && d.value === '/');

  console.log('\n📊 Statistiques de visiteurs - TokyoTreat\n');
  console.log('━'.repeat(40));

  if (mainEntry) {
    console.log(`Visiteurs sur le site (page d'accueil /) : ${mainEntry.visitors.toLocaleString('fr-FR')}`);
  }

  console.log(`\nTotal visiteurs (max) : ${totalVisitors.toLocaleString('fr-FR')}`);

  if (details.length > 1) {
    console.log('\nDétail par type :');
    details.forEach(d => {
      console.log(`  - ${d.type} "${d.value}" : ${d.visitors.toLocaleString('fr-FR')} visiteurs`);
    });
  }

  console.log('━'.repeat(40));
  console.log('\n');

} catch (err) {
  console.error('Erreur:', err.message);
  process.exit(1);
}
