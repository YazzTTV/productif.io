import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

// POST /api/notifications/sync
export async function POST(request: Request) {
    try {
        // Récupérer le token depuis les headers
        const authHeader = request.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Token manquant' }, { status: 401 });
        }

        const user = await getAuthUser();
        if (!user) {
            return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
        }

        // Récupérer les préférences depuis PostgreSQL
        const preferences = await prisma.notificationSettings.findUnique({
            where: { userId: user.id }
        });

        if (!preferences) {
            return NextResponse.json({ error: 'Préférences non trouvées' }, { status: 404 });
        }

        // Se connecter à MongoDB
        const client = new MongoClient('mongodb://mongo:BNWcsOVckHnMvSQtljpUYzaLqlSgbZSa@tramway.proxy.rlwy.net:42059/plannificateur?authSource=admin');
        await client.connect();

        try {
            const db = client.db('plannificateur');
            
            // Mapper les préférences pour MongoDB
            const mongoPreferences = {
                userId: user.id,
                whatsappEnabled: preferences.whatsappEnabled,
                whatsappNumber: preferences.whatsappNumber,
                morningReminder: preferences.morningReminder,
                taskReminder: preferences.taskReminder,
                habitReminder: preferences.habitReminder,
                motivation: preferences.motivation,
                dailySummary: preferences.dailySummary,
                allowedDays: preferences.allowedDays
            };

            // Mettre à jour ou créer les préférences dans MongoDB
            await db.collection('UserNotificationPreference').updateOne(
                { userId: user.id },
                { $set: mongoPreferences },
                { upsert: true }
            );

            return NextResponse.json({ success: true });
        } finally {
            await client.close();
        }
    } catch (error) {
        console.error('Erreur lors de la synchronisation des préférences:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
} 