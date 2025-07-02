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
        return this.log('INFO', 'NOTIFICATION_CREATION_START', {
            notificationId: data.notificationId,
            userId: data.userId,
            type: data.type,
            scheduledFor: data.scheduledFor,
            currentTime: new Date().toISOString()
        });
    }

    logNotificationDuplicateCheckStart(data) {
        return this.log('DEBUG', 'DUPLICATE_CHECK_START', {
            notificationId: data.notificationId,
            userId: data.userId,
            type: data.type,
            checkStart: Date.now()
        });
    }

    logNotificationDuplicateDetected(data) {
        return this.log('WARN', 'DUPLICATE_DETECTED', {
            notificationId: data.notificationId,
            existingId: data.existingId,
            existingScheduledFor: data.existingScheduledFor,
            newScheduledFor: data.newScheduledFor,
            duplicateCheckDuration: data.duplicateCheckDuration,
            timeDifference: data.timeDifference
        });
    }

    logNotificationDuplicatePassed(data) {
        return this.log('SUCCESS', 'DUPLICATE_CHECK_PASSED', {
            notificationId: data.notificationId,
            duplicateCheckDuration: data.duplicateCheckDuration
        });
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

    logWhatsAppResponse(data) {
        return this.log('DEBUG', 'WHATSAPP_RESPONSE_RECEIVED', {
            sendId: data.sendId,
            notificationId: data.notificationId,
            status: data.status,
            statusText: data.statusText,
            requestDuration: data.requestDuration,
            responseLength: data.responseLength,
            headers: data.headers
        });
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
        return this.log('DEBUG', 'DATABASE_WATCHER_SCAN', {
            scanId: data.scanId,
            usersChecked: data.usersChecked,
            changesDetected: data.changesDetected,
            scanDuration: data.scanDuration
        });
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

    logNotificationSent(data) {
        return this.log('SUCCESS', 'NOTIFICATION_SENT_LEGACY', data);
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
