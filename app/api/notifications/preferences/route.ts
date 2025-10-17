import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { NotificationSettings, Prisma } from '@prisma/client';
import EventManager from '@/lib/EventManager';

interface NotificationPreferences {
    isEnabled: boolean;
    emailEnabled: boolean;
    pushEnabled: boolean;
    whatsappEnabled: boolean;
    whatsappNumber?: string;
    startHour: number;
    endHour: number;
    allowedDays: number[];
    notificationTypes: string[];
    morningReminder: boolean;
    taskReminder: boolean;
    habitReminder: boolean;
    motivation: boolean;
    dailySummary: boolean;
    morningTime: string;
  improvementReminder: boolean;
  improvementTime: string;
    noonTime: string;
    afternoonTime: string;
    eveningTime: string;
    nightTime: string;
}

// GET /api/notifications/preferences
export async function GET(request: Request) {
    try {
        const user = await getAuthUser();
        if (!user) {
            return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: 'userId requis' }, { status: 400 });
        }

        // Vérifier que l'utilisateur demande ses propres préférences
        if (userId !== user.id) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
        }

        const preferences = await prisma.notificationSettings.findUnique({
            where: { userId }
        });

        // Construire la liste des types de notifications activés
        const notificationTypes = [];
        if (preferences?.taskReminder) notificationTypes.push('TASK_DUE');
        if (preferences?.habitReminder) notificationTypes.push('HABIT_REMINDER');
        if (preferences?.motivation) notificationTypes.push('MOTIVATION');
        if (preferences?.dailySummary) notificationTypes.push('DAILY_SUMMARY');

        // Mapper les données du schéma vers le format attendu par le frontend
        const mappedPreferences: NotificationPreferences = preferences ? {
            isEnabled: preferences.isEnabled,
            emailEnabled: preferences.emailEnabled,
            pushEnabled: preferences.pushEnabled,
            whatsappEnabled: preferences.whatsappEnabled,
            whatsappNumber: preferences.whatsappNumber || '',
            startHour: preferences.startHour,
            endHour: preferences.endHour,
            allowedDays: preferences.allowedDays,
            notificationTypes: notificationTypes,
            morningReminder: preferences.morningReminder,
            taskReminder: preferences.taskReminder,
            habitReminder: preferences.habitReminder,
            motivation: preferences.motivation,
            dailySummary: preferences.dailySummary,
            morningTime: preferences.morningTime,
            improvementReminder: preferences.improvementReminder,
            improvementTime: preferences.improvementTime,
            noonTime: preferences.noonTime,
            afternoonTime: preferences.afternoonTime,
            eveningTime: preferences.eveningTime,
            nightTime: preferences.nightTime
        } : {
            isEnabled: true,
            emailEnabled: true,
            pushEnabled: true,
            whatsappEnabled: false,
            whatsappNumber: '',
            startHour: 9,
            endHour: 18,
            allowedDays: [1, 2, 3, 4, 5],
            notificationTypes: ['TASK_DUE', 'HABIT_REMINDER', 'DAILY_SUMMARY'],
            morningReminder: true,
            taskReminder: true,
            habitReminder: true,
            motivation: true,
            dailySummary: true,
            morningTime: '08:00',
            improvementReminder: false,
            improvementTime: '08:30',
            noonTime: '12:00',
            afternoonTime: '14:00',
            eveningTime: '18:00',
            nightTime: '22:00'
        };

        return NextResponse.json(mappedPreferences);
    } catch (error) {
        console.error('Erreur lors de la récupération des préférences:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}

// POST /api/notifications/preferences
export async function POST(request: Request) {
    try {
        const user = await getAuthUser();
        if (!user) {
            return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
        }

        const body = await request.json();
        const { userId, ...incomingPreferences } = body as { userId: string } & NotificationPreferences;

        if (!userId) {
            return NextResponse.json({ error: 'userId requis' }, { status: 400 });
        }

        // Vérifier que l'utilisateur modifie ses propres préférences
        if (userId !== user.id) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
        }

        // Récupérer les anciennes préférences pour comparaison
        const oldPreferences = await prisma.notificationSettings.findUnique({
            where: { userId }
        });

        // Normalisation des bornes horaires
        // - Interpréter endHour=0 comme fin de journée (24)
        // - Contraindre les valeurs dans [0,24] pour end et [0,23] pour start
        const normalizedStart = Math.max(0, Math.min(23, Number(incomingPreferences.startHour ?? 0)));
        let normalizedEnd = Number(incomingPreferences.endHour ?? 24);
        if (normalizedEnd === 0) normalizedEnd = 24;
        normalizedEnd = Math.max(1, Math.min(24, normalizedEnd));

        // Synchroniser les types de notifications avec les champs booléens
        const notificationTypes = incomingPreferences.notificationTypes || [];
        const prismaData = {
            isEnabled: incomingPreferences.isEnabled,
            emailEnabled: incomingPreferences.emailEnabled,
            pushEnabled: incomingPreferences.pushEnabled,
            whatsappEnabled: incomingPreferences.whatsappEnabled,
            whatsappNumber: incomingPreferences.whatsappNumber,
            startHour: normalizedStart,
            endHour: normalizedEnd,
            allowedDays: incomingPreferences.allowedDays,
            notificationTypes: notificationTypes,
            morningReminder: incomingPreferences.morningReminder,
            taskReminder: incomingPreferences.taskReminder,
            habitReminder: incomingPreferences.habitReminder,
            motivation: incomingPreferences.motivation,
            dailySummary: incomingPreferences.dailySummary,
            morningTime: incomingPreferences.morningTime,
            improvementReminder: incomingPreferences.improvementReminder,
            improvementTime: incomingPreferences.improvementTime,
            noonTime: incomingPreferences.noonTime,
            afternoonTime: incomingPreferences.afternoonTime,
            eveningTime: incomingPreferences.eveningTime,
            nightTime: incomingPreferences.nightTime
        } as const;

        // Mettre à jour ou créer les préférences dans PostgreSQL
        const updatedPreferences = await prisma.notificationSettings.upsert({
            where: { userId },
            update: prismaData,
            create: {
                userId,
                ...prismaData
            }
        });

        // Émettre un événement de mise à jour des préférences
        const eventManager = EventManager.getInstance();
        eventManager.emitPreferencesUpdate({
            userId,
            oldPreferences: oldPreferences || null,
            newPreferences: updatedPreferences,
            timestamp: new Date()
        });

        console.log(`📡 Événement de mise à jour émis pour l'utilisateur ${userId}`);

        // NOUVEAU : Notifier le scheduler par HTTP (communication inter-processus)
        try {
            console.log(`🔄 Notification du scheduler pour l'utilisateur ${userId}...`);

            const bases = [
                process.env.SCHEDULER_URL || 'http://localhost:3002',
                'http://localhost:3002',
                'http://127.0.0.1:3002'
            ].filter((v, i, a) => a.indexOf(v) === i);

            let notified = false;
            for (const base of bases) {
                const schedulerUrl = `${base.replace(/\/$/, '')}/api/update-user`;
                try {
                    const resp = await fetch(schedulerUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            userId,
                            oldPreferences: oldPreferences || null,
                            newPreferences: updatedPreferences,
                            timestamp: new Date()
                        })
                    });
                    if (resp.ok) {
                        console.log(`✅ Scheduler notifié avec succès via ${base}`);
                        notified = true;
                        break;
                    }
                    console.log(`⚠️ Notification via ${base} échouée: ${resp.status}`);
                } catch (err) {
                    console.log(`⚠️ Erreur de connexion scheduler via ${base}:`, err);
                }
            }
            if (!notified) console.log('⚠️ Aucune URL de scheduler n\'a répondu.');
        } catch (error) {
            console.log(`❌ Erreur lors de la notification du scheduler:`, error);
            // On continue même si le scheduler n'est pas accessible
        }

        return NextResponse.json(updatedPreferences);
    } catch (error) {
        console.error('Erreur lors de la mise à jour des préférences:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
} 