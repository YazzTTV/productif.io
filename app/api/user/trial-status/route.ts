import { NextRequest, NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';
import { TrialService } from '@/lib/trial/TrialService';

export async function GET(req: NextRequest) {
  try {
    // Récupérer le token depuis les cookies
    const token = req.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    let userId: string;
    try {
      const decoded = verify(token, process.env.JWT_SECRET || 'fallback_secret') as { userId: string };
      userId = decoded.userId;
    } catch (error) {
      return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
    }

    const accessCheck = await TrialService.hasAccess(userId);

    return NextResponse.json({
      status: accessCheck.status,
      daysLeft: accessCheck.trialDaysLeft,
      hasAccess: accessCheck.hasAccess
    });
  } catch (error) {
    console.error('Erreur récupération statut trial:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

