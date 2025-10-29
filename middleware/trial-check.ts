import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { TrialService } from '@/lib/trial/TrialService';

export async function trialCheckMiddleware(req: NextRequest) {
  // Vérifier l'authentification avec NextAuth
  const token = await getToken({ 
    req, 
    secret: process.env.NEXTAUTH_SECRET 
  });

  if (!token?.sub) {
    // Pas authentifié, rediriger vers login
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Vérifier l'accès avec le TrialService
  const accessCheck = await TrialService.hasAccess(token.sub);

  if (!accessCheck.hasAccess) {
    // Accès refusé, rediriger vers la page d'upgrade
    return NextResponse.redirect(new URL('/upgrade', req.url));
  }

  // Accès autorisé, ajouter les infos de trial dans les headers pour l'UI
  const response = NextResponse.next();
  response.headers.set('X-Trial-Status', accessCheck.status);
  
  if (accessCheck.trialDaysLeft !== undefined) {
    response.headers.set('X-Trial-Days-Left', accessCheck.trialDaysLeft.toString());
  }

  return response;
}

