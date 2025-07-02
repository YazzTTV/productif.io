import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import EventManager from '@/lib/EventManager';

// GET /api/notifications/scheduler - Obtenir le statut du planificateur
export async function GET(request: Request) {
    try {
        const user = await getAuthUser();
        if (!user) {
            return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
        }

        // Pour l'instant, on retourne un statut basique
        // TODO: Intégrer avec une instance partagée du planificateur
        const status = {
            isRunning: true, // À implémenter avec l'instance réelle
            eventListeners: true,
            timestamp: new Date().toISOString()
        };

        return NextResponse.json(status);
    } catch (error) {
        console.error('Erreur lors de la récupération du statut:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}

// POST /api/notifications/scheduler - Actions sur le planificateur
export async function POST(request: Request) {
    try {
        const user = await getAuthUser();
        if (!user) {
            return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
        }

        const body = await request.json();
        const { action, userId } = body;

        const eventManager = EventManager.getInstance();

        switch (action) {
            case 'restart':
                // Redémarrer le planificateur
                eventManager.emitSchedulerRestart();
                console.log('🔄 Redémarrage du planificateur demandé');
                return NextResponse.json({ 
                    message: 'Redémarrage du planificateur en cours',
                    action: 'restart'
                });

            case 'update_user':
                if (!userId) {
                    return NextResponse.json({ error: 'userId requis pour update_user' }, { status: 400 });
                }
                
                // Déclencher une mise à jour manuelle pour un utilisateur
                // On émet un événement de mise à jour fictif pour forcer la reprogrammation
                eventManager.emitPreferencesUpdate({
                    userId,
                    oldPreferences: null,
                    newPreferences: null, // Le planificateur ira chercher les vraies préférences
                    timestamp: new Date()
                });
                
                console.log(`🔄 Mise à jour forcée demandée pour l'utilisateur ${userId}`);
                return NextResponse.json({ 
                    message: `Mise à jour forcée pour l'utilisateur ${userId}`,
                    action: 'update_user',
                    userId
                });

            case 'status':
                // Retourner le statut du planificateur
                return NextResponse.json({
                    isRunning: true, // À implémenter avec l'instance réelle
                    eventListeners: true,
                    action: 'status'
                });

            default:
                return NextResponse.json({ 
                    error: 'Action non reconnue. Actions disponibles: restart, update_user, status' 
                }, { status: 400 });
        }

    } catch (error) {
        console.error('Erreur lors de l\'action sur le planificateur:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
} 