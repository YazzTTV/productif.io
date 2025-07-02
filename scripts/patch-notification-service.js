#!/usr/bin/env node

/**
 * 🧪 PATCH DE DIAGNOSTIC POUR TRAQUER LES DUPLICATAS WHATSAPP
 * 
 * Ce script ajoute des logs ultra-précis dans tous les services pour identifier
 * la source exacte des duplicatas lors des changements de préférences.
 */

import fs from 'fs';
import path from 'path';

console.log('🧪 DÉMARRAGE DU PATCH DE DIAGNOSTIC POUR DUPLICATAS WHATSAPP');
console.log('=' .repeat(70));

const PATCHES = [
    {
        file: 'src/services/NotificationScheduler.js',
        patches: [
            {
                // Patch 1: Logs extrêmes dans stopUserTasks
                search: `    async stopUserTasks(userId) {
        console.log(\`   🔍 Recherche des tâches pour l'utilisateur \${userId}...\`);
        
        const userJobs = Array.from(this.jobs.keys()).filter(jobId => jobId.startsWith(\`\${userId}-\`));`,
                replace: `    async stopUserTasks(userId) {
        const stopId = \`STOP_\${Date.now()}_\${Math.random().toString(36).substr(2, 9)}\`;
        console.log(\`\\n🚨🚨🚨 STOP_TASKS_\${stopId}: ARRÊT DES TÂCHES DÉTECTÉ 🚨🚨🚨\`);
        console.log(\`⏰ Timestamp précis: \${new Date().toISOString()}\`);
        console.log(\`👤 UserId: \${userId}\`);
        console.log(\`📊 Jobs actuels AVANT arrêt: \${this.jobs.size}\`);
        console.log(\`📋 Clés actuelles: \${Array.from(this.jobs.keys()).join(', ')}\`);
        console.log(\`🔍 Stack trace: \${new Error().stack.split('\\n').slice(1, 4).join(' -> ')}\`);
        
        const userJobs = Array.from(this.jobs.keys()).filter(jobId => jobId.startsWith(\`\${userId}-\`));
        console.log(\`📊 Jobs utilisateur trouvés: \${userJobs.length} [\${userJobs.join(', ')}]\`);`
            }
        ]
    }
];

async function applyPatches() {
    console.log('🔧 Application des patches de diagnostic...');
    
    for (const patchGroup of PATCHES) {
        const filePath = patchGroup.file;
        console.log(`\n📝 Patching ${filePath}...`);
        
        try {
            let fileContent = fs.readFileSync(filePath, 'utf8');
            let patchesApplied = 0;
            
            for (const patch of patchGroup.patches) {
                if (fileContent.includes(patch.search)) {
                    fileContent = fileContent.replace(patch.search, patch.replace);
                    patchesApplied++;
                } else {
                    console.log(`   ⚠️ Patch non trouvé dans ${filePath}`);
                }
            }
            
            if (patchesApplied > 0) {
                // Backup du fichier original
                const backupPath = `${filePath}.backup.${Date.now()}`;
                fs.copyFileSync(filePath, backupPath);
                console.log(`   💾 Backup créé: ${backupPath}`);
                
                // Appliquer les patches
                fs.writeFileSync(filePath, fileContent);
                console.log(`   ✅ ${patchesApplied} patches appliqués à ${filePath}`);
            } else {
                console.log(`   ❌ Aucun patch appliqué à ${filePath}`);
            }
            
        } catch (error) {
            console.log(`   ❌ Erreur lors du patching de ${filePath}: ${error.message}`);
        }
    }
    
    console.log('\n✅ Patches appliqués avec succès !');
    console.log('\n🎯 INSTRUCTIONS:');
    console.log('1. Redémarrez le scheduler: pkill -f scheduler-service && PORT=3002 npm run start:scheduler');
    console.log('2. Changez vos préférences de notification');
    console.log('3. Observez les logs EXTRÊMES pour identifier les duplicatas');
}

applyPatches().catch(console.error); 