/**
 * Script pour intégrer automatiquement les exemples générés dans IntentDetectionService.ts
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const examplesFile = path.join(__dirname, '..', 'temp', 'intent-examples-generated.txt');
const targetFile = path.join(__dirname, '..', 'lib', 'ai', 'IntentDetectionService.ts');

// Lire les exemples générés
const examplesContent = fs.readFileSync(examplesFile, 'utf-8');

// Extraire chaque section
const sections = {
  'PLAN_TOMORROW': examplesContent.match(/=== PLAN_TOMORROW ===([\s\S]*?)(?=== |$)/)?.[1]?.trim(),
  'JOURNAL': examplesContent.match(/=== JOURNAL ===([\s\S]*?)(?=== |$)/)?.[1]?.trim(),
  'COMPLETE_TASK': examplesContent.match(/=== COMPLETE_TASK ===([\s\S]*?)(?=== |$)/)?.[1]?.trim(),
  'LIST_TASKS': examplesContent.match(/=== LIST_TASKS ===([\s\S]*?)(?=== |$)/)?.[1]?.trim(),
  'HELP_REQUEST / HOW_TO': examplesContent.match(/=== HELP_REQUEST \/ HOW_TO ===([\s\S]*?)(?=== |$)/)?.[1]?.trim()
};

// Lire le fichier cible
let targetContent = fs.readFileSync(targetFile, 'utf-8');

// Remplacer chaque section
for (const [sectionName, sectionContent] of Object.entries(sections)) {
  if (!sectionContent) {
    console.log(`⚠️  Section ${sectionName} non trouvée dans les exemples générés`);
    continue;
  }
  
  // Créer le pattern de recherche pour la section
  const sectionHeader = `=== ${sectionName} ===`;
  const regex = new RegExp(`${sectionHeader.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?(?=== |\\*\\*Extraction)`, 'm');
  
  // Remplacer la section
  const newSection = `${sectionHeader}\n${sectionContent}`;
  targetContent = targetContent.replace(regex, newSection + '\n\n');
  
  console.log(`✅ Section ${sectionName} intégrée (${sectionContent.split('\n').length} lignes)`);
}

// Sauvegarder le fichier mis à jour
fs.writeFileSync(targetFile, targetContent, 'utf-8');

console.log(`\n✅ Fichier ${targetFile} mis à jour avec succès !`);

