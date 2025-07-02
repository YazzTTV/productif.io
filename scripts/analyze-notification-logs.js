import { execSync } from 'child_process';
import fs from 'fs';

class NotificationLogAnalyzer {
    constructor() {
        this.logs = [];
        this.sessions = new Map();
        this.notifications = new Map();
        this.whatsappMessages = new Map();
        this.duplicates = [];
        this.concurrencyIssues = [];
        this.timeline = [];
    }

    // Analyser les logs à partir de Railway ou local
    async analyzeLogs(source = 'railway', lastMinutes = 30) {
        console.log(`🔍 ANALYSE DES LOGS - Source: ${source.toUpperCase()}`);
        console.log('═'.repeat(70));

        try {
            let logData;
            
            if (source === 'railway') {
                console.log('📥 Récupération des logs Railway...');
                try {
                    logData = execSync(`railway logs`, { encoding: 'utf8' });
                } catch (railwayError) {
                    console.log('⚠️ Erreur Railway, tentative avec logs locaux...');
                    logData = this.readLocalLogs();
                }
            } else {
                console.log('📁 Lecture des logs locaux...');
                // Placeholder pour les logs locaux
                logData = this.readLocalLogs();
            }

            this.parseLogs(logData);
            this.analyzeForDuplicates();
            this.analyzeConcurrency();
            this.analyzeTimeline();
            this.generateReport();

        } catch (error) {
            console.error('❌ Erreur lors de l\'analyse:', error.message);
        }
    }

    parseLogs(logData) {
        console.log('🔄 Parsing des logs...');
        
        const lines = logData.split('\n');
        let parsedCount = 0;
        
        for (const line of lines) {
            if (this.isStructuredLog(line)) {
                try {
                    const logEntry = this.parseStructuredLog(line);
                    if (logEntry) {
                        this.logs.push(logEntry);
                        this.categorizeLog(logEntry);
                        parsedCount++;
                    }
                } catch (error) {
                    // Ignorer les lignes qui ne sont pas des logs structurés
                }
            }
        }
        
        console.log(`✅ ${parsedCount} logs structurés trouvés`);
    }

    isStructuredLog(line) {
        // Détecter les logs avec notre format : [timestamp] [level] [action] {...}
        return /^\[[\d\-T:.Z]+\] \[(INFO|DEBUG|WARN|ERROR|SUCCESS|METRICS)\] \[[\w_]+\]/.test(line);
    }

    parseStructuredLog(line) {
        const match = line.match(/^\[([\d\-T:.Z]+)\] \[(\w+)\] \[(\w+)\] (.+)$/);
        if (!match) return null;

        const [, timestamp, level, action, jsonData] = match;
        
        try {
            const data = JSON.parse(jsonData);
            return {
                timestamp: new Date(timestamp),
                level,
                action,
                data,
                rawLine: line
            };
        } catch (error) {
            return null;
        }
    }

    categorizeLog(logEntry) {
        const { action, data } = logEntry;
        
        // Classer par session
        if (data.session || data.schedulerId || data.serviceId) {
            const sessionId = data.session || data.schedulerId || data.serviceId;
            if (!this.sessions.has(sessionId)) {
                this.sessions.set(sessionId, []);
            }
            this.sessions.get(sessionId).push(logEntry);
        }

        // Classer par notification
        if (data.notificationId) {
            if (!this.notifications.has(data.notificationId)) {
                this.notifications.set(data.notificationId, []);
            }
            this.notifications.get(data.notificationId).push(logEntry);
        }

        // Classer par message WhatsApp
        if (data.sendId || data.whatsappMessageId) {
            const key = data.sendId || data.whatsappMessageId;
            if (!this.whatsappMessages.has(key)) {
                this.whatsappMessages.set(key, []);
            }
            this.whatsappMessages.get(key).push(logEntry);
        }

        // Ajouter à la timeline
        this.timeline.push({
            ...logEntry,
            userId: data.userId,
            notificationId: data.notificationId,
            sendId: data.sendId
        });
    }

    analyzeForDuplicates() {
        console.log('🔍 Analyse des duplicatas...');
        
        // Grouper par utilisateur et type de notification
        const notificationGroups = new Map();
        
        for (const [notificationId, logs] of this.notifications) {
            const creationLog = logs.find(log => log.action === 'NOTIFICATION_CREATION_START');
            if (!creationLog) continue;

            const key = `${creationLog.data.userId}-${creationLog.data.type}`;
            if (!notificationGroups.has(key)) {
                notificationGroups.set(key, []);
            }
            notificationGroups.get(key).push({
                notificationId,
                logs,
                creationTime: creationLog.timestamp,
                userId: creationLog.data.userId,
                type: creationLog.data.type
            });
        }

        // Détecter les duplicatas temporels
        for (const [key, notifications] of notificationGroups) {
            if (notifications.length > 1) {
                // Trier par heure de création
                notifications.sort((a, b) => a.creationTime - b.creationTime);
                
                for (let i = 1; i < notifications.length; i++) {
                    const timeDiff = notifications[i].creationTime - notifications[i-1].creationTime;
                    
                    if (timeDiff < 60000) { // Moins de 1 minute
                        this.duplicates.push({
                            type: 'TEMPORAL_DUPLICATE',
                            userType: key,
                            notifications: [notifications[i-1], notifications[i]],
                            timeDifference: timeDiff,
                            severity: timeDiff < 5000 ? 'HIGH' : 'MEDIUM'
                        });
                    }
                }
            }
        }

        console.log(`⚠️ ${this.duplicates.length} duplicatas détectés`);
    }

    analyzeConcurrency() {
        console.log('🔍 Analyse de la concurrence...');
        
        // Rechercher les événements de concurrence spécifiques
        const concurrencyEvents = this.logs.filter(log => 
            log.action === 'CONCURRENCY_EVENT' || 
            log.action === 'CONCURRENT_PROCESSING_DETECTED' ||
            log.action === 'CONCURRENT_WHATSAPP_REQUEST'
        );

        this.concurrencyIssues = concurrencyEvents.map(event => ({
            timestamp: event.timestamp,
            type: event.data.event || event.action,
            userId: event.data.userId,
            details: event.data
        }));

        console.log(`⚠️ ${this.concurrencyIssues.length} problèmes de concurrence détectés`);
    }

    analyzeTimeline() {
        console.log('📊 Construction de la timeline...');
        
        // Trier par timestamp
        this.timeline.sort((a, b) => a.timestamp - b.timestamp);
        
        // Analyser les patterns suspects
        const suspiciousPatterns = [];
        
        for (let i = 1; i < this.timeline.length; i++) {
            const prev = this.timeline[i-1];
            const curr = this.timeline[i];
            
            // Même notification traitée plusieurs fois rapidement
            if (prev.notificationId && 
                prev.notificationId === curr.notificationId && 
                curr.timestamp - prev.timestamp < 1000) {
                
                suspiciousPatterns.push({
                    type: 'RAPID_REPROCESSING',
                    notificationId: curr.notificationId,
                    timeDiff: curr.timestamp - prev.timestamp,
                    events: [prev, curr]
                });
            }
            
            // Même message WhatsApp envoyé plusieurs fois
            if (prev.data.phoneNumber && 
                prev.data.phoneNumber === curr.data.phoneNumber &&
                prev.action === 'WHATSAPP_SEND_START' &&
                curr.action === 'WHATSAPP_SEND_START' &&
                curr.timestamp - prev.timestamp < 5000) {
                
                suspiciousPatterns.push({
                    type: 'RAPID_WHATSAPP_SENDS',
                    phoneNumber: curr.data.phoneNumber,
                    timeDiff: curr.timestamp - prev.timestamp,
                    events: [prev, curr]
                });
            }
        }
        
        this.suspiciousPatterns = suspiciousPatterns;
        console.log(`🚨 ${suspiciousPatterns.length} patterns suspects détectés`);
    }

    generateReport() {
        console.log('\n📋 RAPPORT D\'ANALYSE');
        console.log('═'.repeat(70));
        
        // Statistiques générales
        console.log('📊 STATISTIQUES GÉNÉRALES:');
        console.log(`   Total logs analysés: ${this.logs.length}`);
        console.log(`   Sessions uniques: ${this.sessions.size}`);
        console.log(`   Notifications uniques: ${this.notifications.size}`);
        console.log(`   Messages WhatsApp uniques: ${this.whatsappMessages.size}`);
        
        // Duplicatas
        if (this.duplicates.length > 0) {
            console.log('\n🚨 DUPLICATAS DÉTECTÉS:');
            this.duplicates.forEach((dup, index) => {
                console.log(`   ${index + 1}. ${dup.type} - ${dup.userType}`);
                console.log(`      Écart temporel: ${dup.timeDifference}ms`);
                console.log(`      Sévérité: ${dup.severity}`);
                console.log(`      Notifications: ${dup.notifications.map(n => n.notificationId).join(', ')}`);
            });
        }
        
        // Problèmes de concurrence
        if (this.concurrencyIssues.length > 0) {
            console.log('\n⚡ PROBLÈMES DE CONCURRENCE:');
            this.concurrencyIssues.forEach((issue, index) => {
                console.log(`   ${index + 1}. ${issue.type} - User: ${issue.userId}`);
                console.log(`      Timestamp: ${issue.timestamp.toISOString()}`);
            });
        }
        
        // Patterns suspects
        if (this.suspiciousPatterns?.length > 0) {
            console.log('\n🔍 PATTERNS SUSPECTS:');
            this.suspiciousPatterns.forEach((pattern, index) => {
                console.log(`   ${index + 1}. ${pattern.type}`);
                console.log(`      Écart: ${pattern.timeDiff}ms`);
                if (pattern.notificationId) {
                    console.log(`      Notification: ${pattern.notificationId}`);
                }
                if (pattern.phoneNumber) {
                    console.log(`      Téléphone: ${pattern.phoneNumber}`);
                }
            });
        }
        
        // Recommandations
        console.log('\n💡 RECOMMANDATIONS:');
        if (this.duplicates.length > 0) {
            console.log('   - Vérifier le système anti-duplicate');
            console.log('   - Analyser les conditions de race dans le scheduler');
        }
        if (this.concurrencyIssues.length > 0) {
            console.log('   - Implémenter des verrous plus stricts');
            console.log('   - Vérifier la synchronisation entre processus');
        }
        if (this.suspiciousPatterns?.length > 0) {
            console.log('   - Investiguer les patterns de retraitement rapide');
            console.log('   - Vérifier la configuration du retry automatique');
        }
        
        console.log('\n✅ Analyse terminée');
    }

    readLocalLogs() {
        // Placeholder pour la lecture de logs locaux
        return '';
    }

    // Analyser une période spécifique
    async analyzeTimeRange(startTime, endTime) {
        console.log(`🕐 Analyse de la période: ${startTime} → ${endTime}`);
        
        const filteredLogs = this.timeline.filter(log => 
            log.timestamp >= new Date(startTime) && 
            log.timestamp <= new Date(endTime)
        );
        
        console.log(`📊 ${filteredLogs.length} logs dans cette période`);
        
        // Analyser uniquement cette période
        this.logs = filteredLogs;
        this.generateReport();
    }
}

// Script principal
async function main() {
    const analyzer = new NotificationLogAnalyzer();
    
    const args = process.argv.slice(2);
    const source = args[0] || 'railway';
    const minutes = parseInt(args[1]) || 30;
    
    await analyzer.analyzeLogs(source, minutes);
}

// Exporter pour utilisation programmatique
export default NotificationLogAnalyzer;

// Exécuter si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(console.error);
} 