#!/usr/bin/env node

/**
 * 🧪 ANALYSEUR DE LOGS EN TEMPS RÉEL POUR DUPLICATAS WHATSAPP
 * 
 * Ce script surveille tous les logs en temps réel et détecte :
 * - Les arrêts/créations de tâches cron
 * - Les exécutions multiples de tâches
 * - Les appels WhatsApp duplicatas
 * - Les changements de préférences
 */

import { spawn } from 'child_process';
import fs from 'fs';

console.log('🔍 DÉMARRAGE DE L\'ANALYSEUR DE LOGS EN TEMPS RÉEL');
console.log('=' .repeat(70));

// État du système
const systemState = {
    activeTasks: new Map(),
    whatsappCalls: new Map(),
    userPreferences: new Map(),
    duplicateAlerts: []
};

// Patterns de logs à surveiller
const LOG_PATTERNS = {
    STOP_TASKS: /🚨🚨🚨 STOP_TASKS_([^:]+): ARRÊT DES TÂCHES DÉTECTÉ/,
    SCHEDULE_TASK: /🚨🚨🚨 SCHEDULE_TASK_([^:]+): CRÉATION DE TÂCHE DÉTECTÉE/,
    CRON_EXECUTION: /🔥🔥🔥 CRON_EXECUTION_([^:]+): TÂCHE CRON DÉCLENCHÉE/,
    WHATSAPP_CALL: /🚨🚨🚨 EXTREME_LOG_([^:]+): APPEL sendMessage DÉTECTÉ/,
    PREFERENCE_CHANGE: /🔄 Mise à jour du planning pour l'utilisateur ([^\\s]+)/,
    JOB_ID: /🆔 JobId: ([^\\s]+)/,
    USER_ID: /👤 UserId: ([^\\s]+)/,
    TIMESTAMP: /⏰ Timestamp précis: ([^\\s]+)/
};

function parseLogLine(line) {
    const data = {
        raw: line,
        timestamp: new Date().toISOString(),
        type: null,
        id: null,
        userId: null,
        jobId: null,
        data: {}
    };

    // Extraire le timestamp si présent
    const timestampMatch = line.match(LOG_PATTERNS.TIMESTAMP);
    if (timestampMatch) {
        data.timestamp = timestampMatch[1];
    }

    // Identifier le type de log
    if (LOG_PATTERNS.STOP_TASKS.test(line)) {
        data.type = 'STOP_TASKS';
        data.id = line.match(LOG_PATTERNS.STOP_TASKS)[1];
    } else if (LOG_PATTERNS.SCHEDULE_TASK.test(line)) {
        data.type = 'SCHEDULE_TASK';
        data.id = line.match(LOG_PATTERNS.SCHEDULE_TASK)[1];
    } else if (LOG_PATTERNS.CRON_EXECUTION.test(line)) {
        data.type = 'CRON_EXECUTION';
        data.id = line.match(LOG_PATTERNS.CRON_EXECUTION)[1];
    } else if (LOG_PATTERNS.WHATSAPP_CALL.test(line)) {
        data.type = 'WHATSAPP_CALL';
        data.id = line.match(LOG_PATTERNS.WHATSAPP_CALL)[1];
    } else if (LOG_PATTERNS.PREFERENCE_CHANGE.test(line)) {
        data.type = 'PREFERENCE_CHANGE';
        data.userId = line.match(LOG_PATTERNS.PREFERENCE_CHANGE)[1];
    }

    // Extraire userId et jobId si présents
    const userIdMatch = line.match(LOG_PATTERNS.USER_ID);
    if (userIdMatch) {
        data.userId = userIdMatch[1];
    }

    const jobIdMatch = line.match(LOG_PATTERNS.JOB_ID);
    if (jobIdMatch) {
        data.jobId = jobIdMatch[1];
    }

    return data;
}

function analyzeEvent(event) {
    const now = Date.now();
    
    switch (event.type) {
        case 'STOP_TASKS':
            console.log(`\n📊 ANALYSE: Arrêt des tâches détecté`);
            console.log(`   🕐 ${event.timestamp}`);
            console.log(`   👤 User: ${event.userId}`);
            console.log(`   🆔 Stop ID: ${event.id}`);
            
            if (event.userId) {
                systemState.activeTasks.delete(event.userId);
                console.log(`   🗑️ Tâches supprimées pour ${event.userId}`);
            }
            break;

        case 'SCHEDULE_TASK':
            console.log(`\n📊 ANALYSE: Création de tâche détectée`);
            console.log(`   🕐 ${event.timestamp}`);
            console.log(`   👤 User: ${event.userId}`);
            console.log(`   🆔 Schedule ID: ${event.id}`);
            console.log(`   🔧 Job: ${event.jobId}`);
            
            if (event.userId && event.jobId) {
                const userTasks = systemState.activeTasks.get(event.userId) || new Set();
                
                if (userTasks.has(event.jobId)) {
                    console.log(`\n🚨🚨🚨 DUPLICATA POTENTIEL DÉTECTÉ! 🚨🚨🚨`);
                    console.log(`   📋 Tâche déjà existante: ${event.jobId}`);
                    console.log(`   👤 Utilisateur: ${event.userId}`);
                    console.log(`   🕐 Timestamp: ${event.timestamp}`);
                    
                    systemState.duplicateAlerts.push({
                        type: 'DUPLICATE_TASK_CREATION',
                        userId: event.userId,
                        jobId: event.jobId,
                        timestamp: event.timestamp
                    });
                } else {
                    userTasks.add(event.jobId);
                    systemState.activeTasks.set(event.userId, userTasks);
                    console.log(`   ✅ Nouvelle tâche ajoutée: ${event.jobId}`);
                }
            }
            break;

        case 'CRON_EXECUTION':
            console.log(`\n📊 ANALYSE: Exécution cron détectée`);
            console.log(`   🕐 ${event.timestamp}`);
            console.log(`   👤 User: ${event.userId}`);
            console.log(`   🔧 Job: ${event.jobId}`);
            
            // Vérifier les exécutions simultanées
            const executionKey = `${event.userId}-${event.jobId}`;
            const lastExecution = systemState.whatsappCalls.get(executionKey);
            
            if (lastExecution && (now - lastExecution.timestamp) < 10000) { // 10 secondes
                console.log(`\n🚨🚨🚨 EXÉCUTION SIMULTANÉE DÉTECTÉE! 🚨🚨🚨`);
                console.log(`   📋 Job: ${event.jobId}`);
                console.log(`   👤 User: ${event.userId}`);
                console.log(`   ⏰ Écart: ${now - lastExecution.timestamp}ms`);
                
                systemState.duplicateAlerts.push({
                    type: 'SIMULTANEOUS_EXECUTION',
                    userId: event.userId,
                    jobId: event.jobId,
                    timeDiff: now - lastExecution.timestamp
                });
            }
            
            systemState.whatsappCalls.set(executionKey, {
                timestamp: now,
                event
            });
            break;

        case 'WHATSAPP_CALL':
            console.log(`\n📊 ANALYSE: Appel WhatsApp détecté`);
            console.log(`   🕐 ${event.timestamp}`);
            console.log(`   🆔 Call ID: ${event.id}`);
            
            // Surveiller les appels WhatsApp rapprochés
            const recentCalls = Array.from(systemState.whatsappCalls.values())
                .filter(call => (now - call.timestamp) < 30000); // 30 secondes
            
            if (recentCalls.length > 1) {
                console.log(`\n🚨🚨🚨 APPELS WHATSAPP MULTIPLES DÉTECTÉS! 🚨🚨🚨`);
                console.log(`   📊 Nombre d'appels récents: ${recentCalls.length + 1}`);
                console.log(`   ⏰ Dans les 30 dernières secondes`);
                
                systemState.duplicateAlerts.push({
                    type: 'MULTIPLE_WHATSAPP_CALLS',
                    callCount: recentCalls.length + 1,
                    timeWindow: 30000
                });
            }
            break;

        case 'PREFERENCE_CHANGE':
            console.log(`\n📊 ANALYSE: Changement de préférences`);
            console.log(`   🕐 ${event.timestamp}`);
            console.log(`   👤 User: ${event.userId}`);
            
            systemState.userPreferences.set(event.userId, {
                timestamp: now,
                event
            });
            break;
    }
}

function printSystemStatus() {
    console.log(`\n📈 ÉTAT DU SYSTÈME (${new Date().toISOString()})`);
    console.log('=' .repeat(50));
    console.log(`📊 Utilisateurs avec tâches actives: ${systemState.activeTasks.size}`);
    console.log(`📞 Appels WhatsApp récents: ${systemState.whatsappCalls.size}`);
    console.log(`🚨 Alertes duplicatas: ${systemState.duplicateAlerts.length}`);
    
    if (systemState.duplicateAlerts.length > 0) {
        console.log(`\n🚨 ALERTES RÉCENTES:`);
        systemState.duplicateAlerts.slice(-3).forEach((alert, index) => {
            console.log(`   ${index + 1}. ${alert.type} - ${alert.userId || 'N/A'}`);
        });
    }
    
    systemState.activeTasks.forEach((tasks, userId) => {
        console.log(`   👤 ${userId}: ${tasks.size} tâches`);
    });
}

// Démarrer la surveillance des logs
console.log('🚀 Démarrage de la surveillance des logs...');
console.log('📋 Patterns surveillés:');
console.log('   🚨 STOP_TASKS - Arrêt des tâches');
console.log('   🚨 SCHEDULE_TASK - Création de tâches');
console.log('   🔥 CRON_EXECUTION - Exécution des tâches');
console.log('   🚨 EXTREME_LOG - Appels WhatsApp');
console.log('   🔄 PREFERENCE_CHANGE - Changements de préférences');
console.log('');

// Surveillance des logs en temps réel (simulé)
setInterval(() => {
    printSystemStatus();
}, 30000); // Status toutes les 30 secondes

// Écouter les logs du scheduler s'il existe un fichier de log
const logFile = '/tmp/scheduler.log';
if (fs.existsSync(logFile)) {
    console.log(`📖 Surveillance du fichier de log: ${logFile}`);
    
    const tail = spawn('tail', ['-f', logFile]);
    
    tail.stdout.on('data', (data) => {
        const lines = data.toString().split('\n').filter(line => line.trim());
        
        lines.forEach(line => {
            const event = parseLogLine(line);
            if (event.type) {
                analyzeEvent(event);
            }
        });
    });
    
    tail.stderr.on('data', (data) => {
        console.error(`Erreur tail: ${data}`);
    });
} else {
    console.log('⚠️ Fichier de log non trouvé, surveillance en mode manuel');
    console.log('💡 Démarrez le scheduler avec: PORT=3002 npm run start:scheduler > /tmp/scheduler.log 2>&1 &');
}

console.log('🎯 Analyseur en cours d\'exécution...');
console.log('📊 Changez vos préférences de notification pour voir l\'analyse en temps réel');
console.log('🛑 Appuyez sur Ctrl+C pour arrêter'); 