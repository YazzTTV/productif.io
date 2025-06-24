import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { whatsappService } from '@/lib/whatsapp';

const prisma = new PrismaClient();

export async function POST(req: Request) {
    try {
        // Récupérer le token depuis les cookies de manière asynchrone
        const cookieStore = await cookies();
        const token = cookieStore.get("auth_token")?.value;

        if (!token) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        // Vérifier le token
        const payload = await verifyToken(token);
        if (!payload) {
            return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
        }

        // Récupérer l'ID utilisateur du corps de la requête
        const { userId } = await req.json();

        if (!userId) {
            return NextResponse.json({ error: 'userId est requis' }, { status: 400 });
        }

        // Vérifier que l'utilisateur envoie un test pour ses propres notifications
        if (userId !== payload.userId) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
        }

        console.log('🔍 Recherche des préférences pour l\'utilisateur:', userId);

        // Récupérer les préférences de l'utilisateur
        const preferences = await prisma.notificationSettings.findUnique({
            where: { userId }
        });

        if (!preferences) {
            console.log('❌ Aucune préférence trouvée pour l\'utilisateur:', userId);
            return NextResponse.json({ error: 'Préférences non trouvées' }, { status: 404 });
        }

        console.log('✅ Préférences trouvées:', {
            whatsappEnabled: preferences.whatsappEnabled,
            whatsappNumber: preferences.whatsappNumber,
        });

        if (!preferences.whatsappEnabled || !preferences.whatsappNumber) {
            console.log('❌ WhatsApp non configuré correctement:', {
                enabled: preferences.whatsappEnabled,
                number: preferences.whatsappNumber,
            });
            return NextResponse.json({ 
                error: 'WhatsApp n\'est pas activé ou aucun numéro n\'est configuré' 
            }, { status: 400 });
        }

        // Envoyer un message de test via WhatsApp
        const message = "🔔 Ceci est un message de test de Productif.io ! Si vous recevez ce message, vos notifications WhatsApp sont correctement configurées.";
        
        console.log('📱 Tentative d\'envoi du message WhatsApp à:', preferences.whatsappNumber);
        
        const result = await whatsappService.sendMessage(preferences.whatsappNumber, message);
        console.log('✅ Réponse de l\'API WhatsApp:', result);

        return NextResponse.json({ 
            success: true,
            message: 'Notification de test envoyée',
            whatsappResponse: result
        });
    } catch (error) {
        console.error('❌ Erreur lors de l\'envoi de la notification de test:', error);
        return NextResponse.json({ 
            error: 'Erreur lors de l\'envoi du test',
            details: error instanceof Error ? error.message : 'Erreur inconnue'
        }, { status: 500 });
    }
} 