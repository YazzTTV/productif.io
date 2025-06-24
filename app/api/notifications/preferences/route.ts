import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { NotificationSettings } from '@prisma/client';
import { MongoClient } from 'mongodb';

const MONGODB_URI = 'mongodb://mongo:BNWcsOVckHnMvSQtljpUYzaLqlSgbZSa@tramway.proxy.rlwy.net:42059/plannificateur?authSource=admin';

interface NotificationPreferences {
    isEnabled: boolean;
    whatsappEnabled: boolean;
    whatsappNumber?: string;
    startHour: number;
    endHour: number;
    allowedDays: number[];
    notificationTypes: string[];
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

        // Mapper les données du schéma vers le format attendu par le frontend
        const mappedPreferences: NotificationPreferences = preferences ? {
            isEnabled: preferences.isEnabled,
            whatsappEnabled: preferences.whatsappEnabled,
            whatsappNumber: preferences.whatsappNumber || '',
            startHour: preferences.startHour,
            endHour: preferences.endHour,
            allowedDays: preferences.allowedDays,
            notificationTypes: preferences.notificationTypes
        } : {
            isEnabled: true,
            whatsappEnabled: false,
            whatsappNumber: '',
            startHour: 9,
            endHour: 18,
            allowedDays: [1, 2, 3, 4, 5],
            notificationTypes: ['TASK_DUE', 'HABIT_REMINDER', 'DAILY_SUMMARY']
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

        // Mapper les données du frontend vers le schéma Prisma
        const prismaData: Partial<NotificationSettings> = {
            isEnabled: incomingPreferences.isEnabled,
            emailEnabled: incomingPreferences.isEnabled,
            pushEnabled: incomingPreferences.isEnabled,
            whatsappEnabled: incomingPreferences.whatsappEnabled,
            whatsappNumber: incomingPreferences.whatsappNumber,
            startHour: incomingPreferences.startHour,
            endHour: incomingPreferences.endHour,
            allowedDays: incomingPreferences.allowedDays,
            notificationTypes: incomingPreferences.notificationTypes,
            morningReminder: true,
            taskReminder: true,
            habitReminder: true,
            motivation: true,
            dailySummary: true,
            reminderTime: "09:00"
        };

        // Mettre à jour ou créer les préférences dans PostgreSQL
        const updatedPreferences = await prisma.notificationSettings.upsert({
            where: { userId },
            update: prismaData,
            create: {
                userId,
                ...prismaData
            }
        });

        // Synchroniser directement avec MongoDB
        try {
            const mongoClient = new MongoClient(MONGODB_URI);
            await mongoClient.connect();

            const db = mongoClient.db('plannificateur');
            
            // Mapper les préférences pour MongoDB
            const mongoPreferences = {
                userId: user.id,
                whatsappEnabled: updatedPreferences.whatsappEnabled,
                whatsappNumber: updatedPreferences.whatsappNumber,
                morningReminder: updatedPreferences.morningReminder,
                taskReminder: updatedPreferences.taskReminder,
                habitReminder: updatedPreferences.habitReminder,
                motivation: updatedPreferences.motivation,
                dailySummary: updatedPreferences.dailySummary,
                allowedDays: updatedPreferences.allowedDays
            };

            // Mettre à jour ou créer les préférences dans MongoDB
            await db.collection('UserNotificationPreference').updateOne(
                { userId: user.id },
                { $set: mongoPreferences },
                { upsert: true }
            );

            await mongoClient.close();
        } catch (error) {
            console.error('Erreur lors de la synchronisation avec MongoDB:', error);
            // On continue même si la synchronisation échoue
        }

        return NextResponse.json(updatedPreferences);
    } catch (error) {
        console.error('Erreur lors de la mise à jour des préférences:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
} 