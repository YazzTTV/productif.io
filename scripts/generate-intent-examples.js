/**
 * Script pour générer automatiquement 100 exemples pour chaque catégorie d'intention
 * Usage: node scripts/generate-intent-examples.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Fonction pour générer des variations avec fautes
function withFaults(text) {
  const faults = {
    'é': 'e', 'è': 'e', 'ê': 'e', 'ë': 'e',
    'à': 'a', 'â': 'a', 'ä': 'a',
    'ç': 'c',
    'ù': 'u', 'û': 'u', 'ü': 'u',
    'î': 'i', 'ï': 'i',
    'ô': 'o', 'ö': 'o'
  };
  
  let result = text;
  for (const [accent, replacement] of Object.entries(faults)) {
    result = result.replace(new RegExp(accent, 'g'), replacement);
  }
  
  // Quelques fautes courantes
  result = result.replace(/tion/g, 'sion');
  result = result.replace(/mm/g, 'm');
  result = result.replace(/ss/g, 's');
  
  return result;
}

// Fonction pour générer des variations SMS
function withSMS(text) {
  const sms = {
    'c\'est': 'c',
    'c\'': 'c',
    'j\'': 'j\'',
    'qu\'': 'q\'',
    'maintenant': 'mnt',
    'demain': 'dem1n',
    'aujourd\'hui': 'auj',
    'travail': 'travaiil',
    'journée': 'journee',
    'tâche': 'tache',
    'être': 'etre',
    'être': 'etre'
  };
  
  let result = text;
  for (const [full, abbrev] of Object.entries(sms)) {
    result = result.replace(new RegExp(full, 'gi'), abbrev);
  }
  
  // Supprimer quelques espaces
  result = result.replace(/\s+/g, ' ');
  
  return result;
}

// Générer 100 exemples pour PLAN_TOMORROW
function generatePlanTomorrowExamples() {
  const baseExamples = [
    "planifie demain",
    "organise ma journée de demain",
    "mes tâches de demain",
    "qu'est-ce que j'ai à faire demain",
    "aide-moi à organiser demain",
    "prépare ma journée de demain",
    "organise demain pour moi",
    "qu'est-ce que je dois faire demain",
    "planifie ma journée de demain",
    "aide-moi à planifier demain",
    "organise mes tâches de demain",
    "prépare demain",
    "planifie ma journée demain",
    "organise tout pour demain",
    "quelles sont mes tâches demain",
    "aide-moi pour demain",
    "planifie mes activités de demain",
    "organise ma journée demain",
    "prépare mes tâches de demain",
    "planifie demain s'il te plaît",
    "organise demain pour moi s'il te plaît",
    "aide-moi à organiser ma journée de demain",
    "qu'est-ce que j'ai prévu demain",
    "planifie ma journée de demain s'il te plaît",
    "organise tout ce que j'ai à faire demain",
    "prépare un planning pour demain",
    "aide-moi à préparer demain",
    "planifie mes rendez-vous de demain",
    "organise ma semaine demain",
    "qu'est-ce que je dois prévoir demain",
    "planifie demain matin",
    "organise ma matinée de demain",
    "aide-moi à planifier ma journée de demain",
    "prépare ma liste pour demain",
    "planifie tout pour demain",
    "organise mes priorités de demain",
    "qu'est-ce que j'ai à faire demain matin",
    "planifie ma journée de demain matin",
    "aide-moi à organiser demain",
    "prépare un plan pour demain",
    "organise ma journée de demain s'il te plaît",
    "planifie mes tâches de demain",
    "aide-moi pour demain s'il te plaît",
    "organise tout demain",
    "qu'est-ce que je dois faire demain matin",
    "planifie ma semaine demain",
    "prépare ma journée de demain",
    "aide-moi à planifier demain",
    "organise mes activités de demain",
    "planifie demain après-midi",
    "organise ma journée de demain après-midi",
    "aide-moi à préparer demain",
    "qu'est-ce que j'ai à faire demain après-midi",
    "planifie ma journée complète de demain",
    "organise tout ce que j'ai demain",
    "prépare un planning détaillé pour demain",
    "aide-moi à organiser ma journée de demain",
    "planifie mes rendez-vous demain",
    "organise ma journée de demain matin",
    "qu'est-ce que je dois prévoir demain matin",
    "planifie demain s'il te plaît",
    "aide-moi à planifier demain",
    "organise ma journée de demain",
    "prépare ma liste de tâches pour demain",
    "planifie tout ce que j'ai à faire demain",
    "organise mes priorités demain",
    "aide-moi pour demain",
    "qu'est-ce que j'ai prévu demain",
    "planifie ma journée de demain",
    "organise demain pour moi",
    "prépare un plan détaillé pour demain",
    "aide-moi à préparer ma journée de demain",
    "planifie mes activités demain",
    "organise ma semaine de demain",
    "qu'est-ce que je dois faire demain",
    "planifie demain matin",
    "aide-moi à organiser demain",
    "organise ma matinée demain",
    "prépare ma journée de demain",
    "planifie tout pour demain",
    "organise mes tâches de demain",
    "aide-moi à planifier ma journée de demain",
    "qu'est-ce que j'ai à faire demain",
    "planifie ma journée demain",
    "organise tout ce que j'ai à faire demain",
    "prépare un planning pour demain",
    "aide-moi pour demain s'il te plaît",
    "planifie mes rendez-vous de demain",
    "organise ma journée de demain",
    "qu'est-ce que je dois prévoir demain",
    "planifie demain",
    "aide-moi à organiser ma journée de demain",
    "organise mes priorités de demain",
    "prépare ma liste pour demain",
    "planifie tout demain",
    "organise ma journée de demain s'il te plaît",
    "aide-moi à préparer demain",
    "qu'est-ce que j'ai prévu demain",
    "planifie ma journée de demain",
    "organise demain pour moi",
    "prépare un plan pour demain",
    "aide-moi à planifier demain",
    "organise mes activités de demain",
    "planifie demain matin",
    "aide-moi à organiser demain",
    "organise ma journée de demain",
    "prépare ma journée de demain"
  ];
  
  const examples = [];
  
  for (let i = 0; i < 100 && i < baseExamples.length; i++) {
    const normal = baseExamples[i];
    const withFault = withFaults(normal);
    const withSms = withSMS(normal);
    const withBoth = withSMS(withFaults(normal));
    
    // Ajouter différentes variations
    examples.push(`"${normal}" / "${withFault}" (faute)`);
    if (withSms !== normal) {
      examples.push(`"${normal}" / "${withSms}" (sms)`);
    }
    if (withBoth !== normal && withBoth !== withFault && withBoth !== withSms) {
      examples.push(`"${normal}" / "${withBoth}" (sms + faute)`);
    }
  }
  
  // Compléter jusqu'à 100 exemples uniques
  while (examples.length < 100) {
    const base = baseExamples[examples.length % baseExamples.length];
    const variation = Math.random() > 0.5 ? withFaults(base) : withSMS(base);
    const example = `"${base}" / "${variation}" (${Math.random() > 0.5 ? 'faute' : 'sms'})`;
    if (!examples.includes(example)) {
      examples.push(example);
    }
  }
  
  return examples.slice(0, 100);
}

// Générer 100 exemples pour JOURNAL
function generateJournalExamples() {
  const baseExamples = [
    "note de ma journée",
    "raconter ma journée",
    "journal",
    "récap de ma journée",
    "note ma journée",
    "écris ma journée",
    "enregistre ma journée",
    "note ce qui s'est passé aujourd'hui",
    "raconte ma journée",
    "journal de ma journée",
    "note tout ce qui s'est passé",
    "écris mon journal",
    "enregistre mon journal",
    "note ma journée d'aujourd'hui",
    "raconte ce qui s'est passé",
    "journal d'aujourd'hui",
    "note de la journée",
    "écris ma journée d'aujourd'hui",
    "enregistre ma journée",
    "note ce qui s'est passé",
    "raconte ma journée d'aujourd'hui",
    "journal de la journée",
    "note tout ce qui s'est passé aujourd'hui",
    "écris mon journal d'aujourd'hui",
    "enregistre mon journal",
    "note ma journée",
    "raconte ce qui s'est passé aujourd'hui",
    "journal aujourd'hui",
    "note de la journée d'aujourd'hui",
    "écris ma journée",
    "enregistre ma journée d'aujourd'hui",
    "note ce qui s'est passé",
    "raconte ma journée",
    "journal de ma journée d'aujourd'hui",
    "note tout ce qui s'est passé",
    "écris mon journal",
    "enregistre mon journal d'aujourd'hui",
    "note ma journée",
    "raconte ce qui s'est passé",
    "journal d'aujourd'hui",
    "note de la journée",
    "écris ma journée",
    "enregistre ma journée",
    "note ce qui s'est passé aujourd'hui",
    "raconte ma journée d'aujourd'hui",
    "journal de la journée",
    "note tout ce qui s'est passé",
    "écris mon journal d'aujourd'hui",
    "enregistre mon journal",
    "note ma journée d'aujourd'hui",
    "raconte ce qui s'est passé",
    "journal aujourd'hui",
    "note de la journée d'aujourd'hui",
    "écris ma journée",
    "enregistre ma journée",
    "note ce qui s'est passé aujourd'hui",
    "raconte ma journée",
    "journal de ma journée",
    "note tout ce qui s'est passé",
    "écris mon journal",
    "enregistre mon journal d'aujourd'hui",
    "note ma journée",
    "raconte ce qui s'est passé aujourd'hui",
    "journal d'aujourd'hui",
    "note de la journée",
    "écris ma journée d'aujourd'hui",
    "enregistre ma journée",
    "note ce qui s'est passé",
    "raconte ma journée d'aujourd'hui",
    "journal de la journée",
    "note tout ce qui s'est passé aujourd'hui",
    "écris mon journal",
    "enregistre mon journal",
    "note ma journée",
    "raconte ce qui s'est passé",
    "journal aujourd'hui",
    "note de la journée d'aujourd'hui",
    "écris ma journée",
    "enregistre ma journée d'aujourd'hui",
    "note ce qui s'est passé aujourd'hui",
    "raconte ma journée",
    "journal de ma journée d'aujourd'hui",
    "note tout ce qui s'est passé",
    "écris mon journal d'aujourd'hui",
    "enregistre mon journal",
    "note ma journée d'aujourd'hui",
    "raconte ce qui s'est passé",
    "journal d'aujourd'hui",
    "note de la journée",
    "écris ma journée",
    "enregistre ma journée",
    "note ce qui s'est passé aujourd'hui",
    "raconte ma journée d'aujourd'hui",
    "journal de la journée",
    "note tout ce qui s'est passé",
    "écris mon journal",
    "enregistre mon journal d'aujourd'hui",
    "note ma journée",
    "raconte ce qui s'est passé aujourd'hui",
    "journal aujourd'hui",
    "note de la journée d'aujourd'hui",
    "écris ma journée",
    "enregistre ma journée"
  ];
  
  const examples = [];
  
  for (let i = 0; i < 100 && i < baseExamples.length; i++) {
    const normal = baseExamples[i];
    const withFault = withFaults(normal);
    const withSms = withSMS(normal);
    
    examples.push(`"${normal}" / "${withFault}" (faute)`);
    if (withSms !== normal) {
      examples.push(`"${normal}" / "${withSms}" (sms)`);
    }
  }
  
  return examples.slice(0, 100);
}

// Générer 100 exemples pour COMPLETE_TASK
function generateCompleteTaskExamples() {
  const baseExamples = [
    "j'ai fini",
    "c'est fait",
    "terminé",
    "validé",
    "ok c'est fait",
    "c'est terminé",
    "j'ai terminé",
    "fini",
    "c'est bon",
    "fait",
    "terminé la tâche",
    "j'ai fini la tâche",
    "c'est fait la tâche",
    "tâche terminée",
    "tâche finie",
    "tâche validée",
    "j'ai terminé la tâche",
    "c'est terminé la tâche",
    "fini la tâche",
    "validé la tâche",
    "ok terminé",
    "c'est bon terminé",
    "fait maintenant",
    "terminé maintenant",
    "j'ai fini maintenant",
    "c'est fait maintenant",
    "validé maintenant",
    "fini maintenant",
    "c'est terminé maintenant",
    "j'ai terminé maintenant",
    "tâche terminée maintenant",
    "tâche finie maintenant",
    "tâche validée maintenant",
    "j'ai fini la tâche maintenant",
    "c'est fait la tâche maintenant",
    "terminé la tâche maintenant",
    "validé la tâche maintenant",
    "ok c'est fait maintenant",
    "c'est bon terminé maintenant",
    "fait maintenant",
    "terminé maintenant",
    "j'ai fini maintenant",
    "c'est fait maintenant",
    "validé maintenant",
    "fini maintenant",
    "c'est terminé maintenant",
    "j'ai terminé maintenant",
    "tâche terminée maintenant",
    "tâche finie maintenant",
    "tâche validée maintenant",
    "j'ai fini la tâche maintenant",
    "c'est fait la tâche maintenant",
    "terminé la tâche maintenant",
    "validé la tâche maintenant",
    "ok terminé",
    "c'est bon fini",
    "fait",
    "terminé",
    "j'ai fini",
    "c'est fait",
    "validé",
    "fini",
    "c'est terminé",
    "j'ai terminé",
    "tâche terminée",
    "tâche finie",
    "tâche validée",
    "j'ai fini la tâche",
    "c'est fait la tâche",
    "terminé la tâche",
    "validé la tâche",
    "ok c'est fait",
    "c'est bon terminé",
    "fait maintenant",
    "terminé maintenant",
    "j'ai fini maintenant",
    "c'est fait maintenant",
    "validé maintenant",
    "fini maintenant",
    "c'est terminé maintenant",
    "j'ai terminé maintenant",
    "tâche terminée maintenant",
    "tâche finie maintenant",
    "tâche validée maintenant",
    "j'ai fini la tâche maintenant",
    "c'est fait la tâche maintenant",
    "terminé la tâche maintenant",
    "validé la tâche maintenant",
    "ok terminé maintenant",
    "c'est bon fini maintenant",
    "fait maintenant",
    "terminé maintenant",
    "j'ai fini maintenant",
    "c'est fait maintenant",
    "validé maintenant",
    "fini maintenant",
    "c'est terminé maintenant",
    "j'ai terminé maintenant",
    "tâche terminée maintenant",
    "tâche finie maintenant",
    "tâche validée maintenant",
    "j'ai fini la tâche maintenant",
    "c'est fait la tâche maintenant",
    "terminé la tâche maintenant",
    "validé la tâche maintenant"
  ];
  
  const examples = [];
  
  for (let i = 0; i < 100 && i < baseExamples.length; i++) {
    const normal = baseExamples[i];
    const withFault = withFaults(normal);
    const withSms = withSMS(normal);
    
    examples.push(`"${normal}" / "${withFault}" (faute)`);
    if (withSms !== normal) {
      examples.push(`"${normal}" / "${withSms}" (sms)`);
    }
  }
  
  return examples.slice(0, 100);
}

// Générer 100 exemples pour LIST_TASKS
function generateListTasksExamples() {
  const baseExamples = [
    "mes tâches",
    "quoi faire",
    "ma todo",
    "qu'est-ce que j'ai à faire",
    "liste mes tâches",
    "montre mes tâches",
    "affiche mes tâches",
    "quelles sont mes tâches",
    "mes tâches à faire",
    "liste de mes tâches",
    "qu'est-ce que je dois faire",
    "mes tâches du jour",
    "quelles tâches j'ai",
    "montre ma todo",
    "affiche ma todo",
    "liste ma todo",
    "qu'est-ce que j'ai à faire aujourd'hui",
    "mes tâches aujourd'hui",
    "liste mes tâches du jour",
    "montre mes tâches à faire",
    "affiche mes tâches du jour",
    "quelles sont mes tâches à faire",
    "mes tâches en cours",
    "liste de mes tâches du jour",
    "qu'est-ce que je dois faire aujourd'hui",
    "mes tâches d'aujourd'hui",
    "quelles tâches j'ai aujourd'hui",
    "montre ma todo du jour",
    "affiche ma todo d'aujourd'hui",
    "liste ma todo du jour",
    "qu'est-ce que j'ai à faire maintenant",
    "mes tâches maintenant",
    "liste mes tâches maintenant",
    "montre mes tâches maintenant",
    "affiche mes tâches maintenant",
    "quelles sont mes tâches maintenant",
    "mes tâches à faire maintenant",
    "liste de mes tâches maintenant",
    "qu'est-ce que je dois faire maintenant",
    "mes tâches du jour maintenant",
    "quelles tâches j'ai maintenant",
    "montre ma todo maintenant",
    "affiche ma todo maintenant",
    "liste ma todo maintenant",
    "qu'est-ce que j'ai à faire",
    "mes tâches",
    "liste mes tâches",
    "montre mes tâches",
    "affiche mes tâches",
    "quelles sont mes tâches",
    "mes tâches à faire",
    "liste de mes tâches",
    "qu'est-ce que je dois faire",
    "mes tâches du jour",
    "quelles tâches j'ai",
    "montre ma todo",
    "affiche ma todo",
    "liste ma todo",
    "qu'est-ce que j'ai à faire aujourd'hui",
    "mes tâches aujourd'hui",
    "liste mes tâches du jour",
    "montre mes tâches à faire",
    "affiche mes tâches du jour",
    "quelles sont mes tâches à faire",
    "mes tâches en cours",
    "liste de mes tâches du jour",
    "qu'est-ce que je dois faire aujourd'hui",
    "mes tâches d'aujourd'hui",
    "quelles tâches j'ai aujourd'hui",
    "montre ma todo du jour",
    "affiche ma todo d'aujourd'hui",
    "liste ma todo du jour",
    "qu'est-ce que j'ai à faire maintenant",
    "mes tâches maintenant",
    "liste mes tâches maintenant",
    "montre mes tâches maintenant",
    "affiche mes tâches maintenant",
    "quelles sont mes tâches maintenant",
    "mes tâches à faire maintenant",
    "liste de mes tâches maintenant",
    "qu'est-ce que je dois faire maintenant",
    "mes tâches du jour maintenant",
    "quelles tâches j'ai maintenant",
    "montre ma todo maintenant",
    "affiche ma todo maintenant",
    "liste ma todo maintenant",
    "qu'est-ce que j'ai à faire",
    "mes tâches",
    "liste mes tâches",
    "montre mes tâches",
    "affiche mes tâches",
    "quelles sont mes tâches",
    "mes tâches à faire",
    "liste de mes tâches",
    "qu'est-ce que je dois faire",
    "mes tâches du jour",
    "quelles tâches j'ai",
    "montre ma todo",
    "affiche ma todo",
    "liste ma todo"
  ];
  
  const examples = [];
  
  for (let i = 0; i < 100 && i < baseExamples.length; i++) {
    const normal = baseExamples[i];
    const withFault = withFaults(normal);
    const withSms = withSMS(normal);
    
    examples.push(`"${normal}" / "${withFault}" (faute)`);
    if (withSms !== normal) {
      examples.push(`"${normal}" / "${withSms}" (sms)`);
    }
  }
  
  return examples.slice(0, 100);
}

// Générer 100 exemples pour HELP_REQUEST / HOW_TO
function generateHelpRequestExamples() {
  const baseExamples = [
    "comment faire",
    "aide-moi",
    "peux-tu m'aider",
    "explique-moi le processus",
    "comment procéder",
    "je ne sais pas comment",
    "guide-moi",
    "comment réaliser",
    "étapes pour",
    "processus pour",
    "tutoriel",
    "je comprends pas",
    "comment puis-je faire",
    "aide-moi à faire",
    "peux-tu m'expliquer",
    "explique-moi comment",
    "comment faire pour",
    "je ne comprends pas",
    "guide-moi pour",
    "comment faire ça",
    "aide-moi à comprendre",
    "peux-tu me guider",
    "explique-moi les étapes",
    "comment procéder pour",
    "je ne sais pas",
    "guide-moi dans",
    "comment réaliser ça",
    "étapes pour faire",
    "processus pour faire",
    "tutoriel pour",
    "je comprends pas comment",
    "comment puis-je procéder",
    "aide-moi à faire ça",
    "peux-tu m'aider à",
    "explique-moi comment faire",
    "comment faire pour faire",
    "je ne comprends pas comment",
    "guide-moi pour faire",
    "comment faire ça pour",
    "aide-moi à comprendre comment",
    "peux-tu me guider pour",
    "explique-moi les étapes pour",
    "comment procéder pour faire",
    "je ne sais pas comment faire",
    "guide-moi dans la réalisation",
    "comment réaliser ça pour",
    "étapes pour faire ça",
    "processus pour faire ça",
    "tutoriel pour faire",
    "je comprends pas comment faire",
    "comment puis-je faire pour",
    "aide-moi à faire pour",
    "peux-tu m'aider à faire",
    "explique-moi comment faire pour",
    "comment faire pour faire ça",
    "je ne comprends pas comment faire",
    "guide-moi pour faire ça",
    "comment faire ça pour faire",
    "aide-moi à comprendre comment faire",
    "peux-tu me guider pour faire",
    "explique-moi les étapes pour faire",
    "comment procéder pour faire ça",
    "je ne sais pas comment faire ça",
    "guide-moi dans la réalisation de",
    "comment réaliser ça pour faire",
    "étapes pour faire ça pour",
    "processus pour faire ça pour",
    "tutoriel pour faire ça",
    "je comprends pas comment faire ça",
    "comment puis-je faire pour faire",
    "aide-moi à faire pour faire",
    "peux-tu m'aider à faire pour",
    "explique-moi comment faire pour faire",
    "comment faire pour faire ça pour",
    "je ne comprends pas comment faire ça",
    "guide-moi pour faire ça pour",
    "comment faire ça pour faire pour",
    "aide-moi à comprendre comment faire pour",
    "peux-tu me guider pour faire pour",
    "explique-moi les étapes pour faire pour",
    "comment procéder pour faire ça pour",
    "je ne sais pas comment faire ça pour",
    "guide-moi dans la réalisation de ça",
    "comment réaliser ça pour faire pour",
    "étapes pour faire ça pour faire",
    "processus pour faire ça pour faire",
    "tutoriel pour faire ça pour",
    "je comprends pas comment faire ça pour",
    "comment puis-je faire pour faire pour",
    "aide-moi à faire pour faire pour",
    "peux-tu m'aider à faire pour faire",
    "explique-moi comment faire pour faire pour",
    "comment faire pour faire ça pour faire",
    "je ne comprends pas comment faire ça pour",
    "guide-moi pour faire ça pour faire",
    "comment faire ça pour faire pour faire",
    "aide-moi à comprendre comment faire pour faire",
    "peux-tu me guider pour faire pour faire",
    "explique-moi les étapes pour faire pour faire",
    "comment procéder pour faire ça pour faire",
    "je ne sais pas comment faire ça pour faire",
    "guide-moi dans la réalisation de ça pour",
    "comment réaliser ça pour faire pour faire",
    "étapes pour faire ça pour faire pour",
    "processus pour faire ça pour faire pour",
    "tutoriel pour faire ça pour faire",
    "je comprends pas comment faire ça pour faire"
  ];
  
  const examples = [];
  
  for (let i = 0; i < 100 && i < baseExamples.length; i++) {
    const normal = baseExamples[i];
    const withFault = withFaults(normal);
    const withSms = withSMS(normal);
    
    examples.push(`"${normal}" / "${withFault}" (faute)`);
    if (withSms !== normal) {
      examples.push(`"${normal}" / "${withSms}" (sms)`);
    }
  }
  
  return examples.slice(0, 100);
}

// Fonction principale
function main() {
  console.log('🚀 Génération des exemples d\'intentions...\n');
  
  const categories = {
    'PLAN_TOMORROW': generatePlanTomorrowExamples(),
    'JOURNAL': generateJournalExamples(),
    'COMPLETE_TASK': generateCompleteTaskExamples(),
    'LIST_TASKS': generateListTasksExamples(),
    'HELP_REQUEST / HOW_TO': generateHelpRequestExamples()
  };
  
  // Afficher le résumé
  console.log('✅ Exemples générés :\n');
  for (const [category, examples] of Object.entries(categories)) {
    console.log(`  ${category}: ${examples.length} exemples`);
  }
  
  // Générer le contenu à ajouter au fichier
  let output = '\n';
  for (const [category, examples] of Object.entries(categories)) {
    output += `=== ${category} ===\n`;
    examples.forEach(example => {
      output += `${example}\n`;
    });
    output += '\n';
  }
  
  // Écrire dans un fichier temporaire
  const outputPath = path.join(__dirname, '..', 'temp', 'intent-examples-generated.txt');
  const tempDir = path.dirname(outputPath);
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  fs.writeFileSync(outputPath, output, 'utf-8');
  
  console.log(`\n📝 Exemples générés sauvegardés dans: ${outputPath}`);
  console.log('\n💡 Pour intégrer ces exemples dans IntentDetectionService.ts,');
  console.log('   remplacez les sections correspondantes avec le contenu du fichier généré.\n');
}

// Exécuter le script
main();

export {
  generatePlanTomorrowExamples,
  generateJournalExamples,
  generateCompleteTaskExamples,
  generateListTasksExamples,
  generateHelpRequestExamples
};

