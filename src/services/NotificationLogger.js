import { v4 as uuidv4 } from 'uuid';

class NotificationLogger {
    constructor() {
        this.sessionId = uuidv4();
        this.logCount = 0;
    }

    // Logger avec timestamp ultra-précis
    log(level, action, data = {}) {
        this.logCount++;
        const now = new Date();
        const timestamp = now.toISOString();
        const nanoseconds = (now.getTime() % 1000).toString().padStart(3, '0');
        
        const logEntry = {
            timestamp: `${timestamp}.${nanoseconds}`,
            session: this.sessionId,
            sequence: this.logCount,
            level,
            action,
            pid: process.pid,
            memory: process.memoryUsage(),
            ...data
        };

        console.log(`[${logEntry.timestamp}] [${level}] [${action}] ${JSON.stringify(logEntry)}`);
        return logEntry;
    }

    // === CRÉATION DE NOTIFICATION ===
    logNotificationCreation(data) {
        // Gérer le format legacy où on passe directement l'objet notification
        if (data && data.id && data.type && data.userId) {
            // Format legacy: data est un objet notification complet
            return this.log('INFO', 'NOTIFICATION_CREATION_LEGACY', {
                notificationId: data.id,
                type: data.type,
                userId: data.userId,
                scheduledFor: data.scheduledFor,
                status: data.status,
                content: data.content?.substring(0, 100) + (data.content?.length > 100 ? '...' : ''),
                currentTime: new Date().toISOString()
            });
        } else {
            // Nouveau format: data contient les propriétés structurées
            return this.log('INFO', 'NOTIFICATION_CREATION_START', {
                notificationId: data.notificationId,
                userId: data.userId,
                type: data.type,
                scheduledFor: data.scheduledFor,
                currentTime: new Date().toISOString()
            });
        }
    }



    logNotificationTransactionStart(data) {
        return this.log('DEBUG', 'DB_TRANSACTION_START', {
            notificationId: data.notificationId,
            userId: data.userId,
            type: data.type,
            transactionStart: Date.now()
        });
    }

    logNotificationCreated(data) {
        return this.log('SUCCESS', 'NOTIFICATION_CREATED', {
            notificationId: data.notificationId,
            dbId: data.dbId,
            transactionDuration: data.transactionDuration,
            totalDuration: data.totalDuration,
            status: data.status
        });
    }

    logNotificationError(data) {
        return this.log('ERROR', 'NOTIFICATION_ERROR', {
            notificationId: data.notificationId,
            error: data.error,
            stack: data.stack,
            totalDuration: data.totalDuration
        });
    }

    // === TRAITEMENT DES NOTIFICATIONS ===
    logNotificationProcessingStart(notification) {
        return this.log('INFO', 'NOTIFICATION_PROCESSING_START', {
            notificationId: notification.id,
            type: notification.type,
            userId: notification.userId,
            scheduledFor: notification.scheduledFor,
            status: notification.status,
            processingStart: Date.now()
        });
    }

    logNotificationContentGeneration(data) {
        return this.log('DEBUG', 'CONTENT_GENERATION', {
            notificationId: data.notificationId,
            contentLength: data.contentLength,
            generationDuration: data.generationDuration,
            hasHabits: data.hasHabits,
            habitCount: data.habitCount
        });
    }

    // === ENVOI WHATSAPP ===
    logWhatsAppSendStart(data) {
        return this.log('INFO', 'WHATSAPP_SEND_START', {
            sendId: data.sendId,
            notificationId: data.notificationId,
            phoneNumber: data.phoneNumber,
            messageLength: data.messageLength,
            sendStart: Date.now()
        });
    }

    logWhatsAppRequestStart(data) {
        return this.log('DEBUG', 'WHATSAPP_REQUEST_START', {
            sendId: data.sendId,
            notificationId: data.notificationId,
            url: data.url,
            payloadSize: JSON.stringify(data.payload).length,
            requestStart: Date.now()
        });
    }

    logWhatsAppResponse(status, response) {
        // Si appelé avec le nouveau format (un seul paramètre objet)
        if (typeof status === 'object' && status.sendId) {
            return this.log('DEBUG', 'WHATSAPP_RESPONSE_RECEIVED', {
                sendId: status.sendId,
                notificationId: status.notificationId,
                status: status.status,
                statusText: status.statusText,
                requestDuration: status.requestDuration,
                responseLength: status.responseLength,
                headers: status.headers
            });
        } else {
            // Format legacy: deux paramètres séparés
            return this.log('INFO', 'WHATSAPP_RESPONSE_LEGACY', {
                status,
                responseType: typeof response,
                responseLength: typeof response === 'string' ? response.length : JSON.stringify(response).length,
                success: status >= 200 && status < 300
            });
        }
    }

    logWhatsAppSuccess(data) {
        return this.log('SUCCESS', 'WHATSAPP_MESSAGE_SENT', {
            sendId: data.sendId,
            notificationId: data.notificationId,
            whatsappMessageId: data.whatsappMessageId,
            whatsappWaId: data.whatsappWaId,
            requestDuration: data.requestDuration,
            totalDuration: data.totalDuration
        });
    }

    logWhatsAppError(data) {
        return this.log('ERROR', 'WHATSAPP_SEND_ERROR', {
            sendId: data.sendId,
            notificationId: data.notificationId,
            error: data.error,
            stack: data.stack,
            totalDuration: data.totalDuration
        });
    }

    // === SCHEDULER EVENTS ===
    logSchedulerJobStart(data) {
        return this.log('INFO', 'SCHEDULER_JOB_START', {
            jobId: data.jobId,
            jobType: data.jobType,
            userId: data.userId,
            scheduledTime: data.scheduledTime,
            actualTime: new Date().toISOString(),
            delay: data.delay
        });
    }

    logSchedulerJobEnd(data) {
        return this.log('INFO', 'SCHEDULER_JOB_END', {
            jobId: data.jobId,
            success: data.success,
            duration: data.duration,
            notificationsProcessed: data.notificationsProcessed
        });
    }

    // === SYSTÈME RÉACTIF ===
    logReactiveEvent(data) {
        return this.log('INFO', 'REACTIVE_EVENT', {
            eventType: data.eventType,
            userId: data.userId,
            changes: data.changes,
            priority: data.priority,
            timestamp: new Date().toISOString()
        });
    }

    logDatabaseWatcherScan(data) {
        // Log DEBUG supprimé - ne génère plus de logs
        // return this.log('DEBUG', 'DATABASE_WATCHER_SCAN', {
        //     scanId: data.scanId,
        //     usersChecked: data.usersChecked,
        //     changesDetected: data.changesDetected,
        //     scanDuration: data.scanDuration
        // });
    }

    // === MÉTRIQUES PERFORMANCE ===
    logPerformanceMetrics(data) {
        return this.log('METRICS', 'PERFORMANCE_METRICS', {
            action: data.action,
            duration: data.duration,
            memoryBefore: data.memoryBefore,
            memoryAfter: data.memoryAfter,
            cpuUsage: process.cpuUsage()
        });
    }

    // === CONCURRENCE ET RACE CONDITIONS ===
    logConcurrencyEvent(data) {
        return this.log('WARN', 'CONCURRENCY_EVENT', {
            event: data.event,
            threadId: process.pid,
            userId: data.userId,
            conflictType: data.conflictType,
            timestamp: new Date().toISOString()
        });
    }

    // === RETRY ET RECOVERY ===
    logRetryAttempt(data) {
        return this.log('WARN', 'RETRY_ATTEMPT', {
            operation: data.operation,
            attempt: data.attempt,
            maxAttempts: data.maxAttempts,
            error: data.error,
            nextRetryIn: data.nextRetryIn
        });
    }

    // === MÉTHODES LEGACY (pour compatibilité) ===
    logNotificationStart(notification) {
        return this.logNotificationProcessingStart(notification);
    }

    logNotificationProcessing(notification) {
        return this.logNotificationProcessingStart(notification);
    }

    logNotificationSent(data) {
        return this.log('SUCCESS', 'NOTIFICATION_SENT_LEGACY', data);
    }

    logNotificationSettings(settings) {
        return this.log('INFO', 'NOTIFICATION_SETTINGS', {
            isEnabled: settings?.isEnabled,
            whatsappEnabled: settings?.whatsappEnabled,
            whatsappNumber: !!settings?.whatsappNumber,
            morningTime: settings?.morningTime,
            noonTime: settings?.noonTime,
            afternoonTime: settings?.afternoonTime,
            eveningTime: settings?.eveningTime,
            nightTime: settings?.nightTime,
            startHour: settings?.startHour,
            endHour: settings?.endHour
        });
    }

    logWhatsAppSending(phoneNumber, message) {
        return this.log('INFO', 'WHATSAPP_SENDING_LEGACY', {
            phoneNumber,
            messageLength: message?.length || 0,
            messagePreview: message?.substring(0, 100) + (message?.length > 100 ? '...' : '')
        });
    }

    logError(operation, error) {
        return this.log('ERROR', 'OPERATION_ERROR', {
            operation,
            error: error.message,
            stack: error.stack
        });
    }

    // === MONITORING SYSTÈME ===
    logSystemHealth() {
        const memUsage = process.memoryUsage();
        const cpuUsage = process.cpuUsage();
        
        return this.log('METRICS', 'SYSTEM_HEALTH', {
            memory: {
                rss: memUsage.rss,
                heapTotal: memUsage.heapTotal,
                heapUsed: memUsage.heapUsed,
                external: memUsage.external
            },
            cpu: {
                user: cpuUsage.user,
                system: cpuUsage.system
            },
            uptime: process.uptime(),
            pid: process.pid
        });
    }
}

export default new NotificationLogger();
