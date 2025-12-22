import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserFromRequest } from '@/lib/auth';

// POST /api/notifications/push-token
// Enregistre ou met à jour un token push pour l'utilisateur authentifié
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(req);
    if (!user) {
      console.log('❌ [push-token] Utilisateur non authentifié');
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }
    
    console.log(`✅ [push-token] Utilisateur authentifié: ${user.id} (${user.email})`);

    const body = await req.json();
    const { token, platform, deviceId } = body;

    console.log(`📥 [push-token] Requête reçue:`, {
      userId: user.id,
      platform,
      tokenLength: token?.length,
      hasDeviceId: !!deviceId
    });

    // Validation
    if (!token || !platform) {
      console.log('❌ [push-token] Validation échouée:', { hasToken: !!token, hasPlatform: !!platform });
      return NextResponse.json(
        { error: 'Token et plateforme sont requis' },
        { status: 400 }
      );
    }

    if (!['ios', 'android', 'web'].includes(platform)) {
      return NextResponse.json(
        { error: 'Plateforme invalide. Doit être ios, android ou web' },
        { status: 400 }
      );
    }

    // Vérifier si un token existe déjà pour cet utilisateur et cette plateforme
    const existingToken = await prisma.pushToken.findFirst({
      where: {
        userId: user.id,
        platform: platform,
        ...(deviceId && { deviceId: deviceId })
      }
    });

    let pushToken;
    if (existingToken) {
      // Mettre à jour le token existant
      pushToken = await prisma.pushToken.update({
        where: { id: existingToken.id },
        data: {
          token,
          deviceId: deviceId || existingToken.deviceId,
          updatedAt: new Date()
        }
      });
      console.log(`🔄 Token push mis à jour pour l'utilisateur ${user.id} (${platform})`);
    } else {
      // Créer un nouveau token
      pushToken = await prisma.pushToken.create({
        data: {
          userId: user.id,
          token,
          platform,
          deviceId: deviceId || null
        }
      });
      console.log(`✅ Nouveau token push enregistré pour l'utilisateur ${user.id} (${platform})`);
    }

    return NextResponse.json({
      success: true,
      id: pushToken.id,
      platform: pushToken.platform
    });
  } catch (error: any) {
    console.error('Erreur lors de l\'enregistrement du token push:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de l\'enregistrement du token' },
      { status: 500 }
    );
  }
}

// DELETE /api/notifications/push-token
// Supprime le token push de l'utilisateur authentifié
export async function DELETE(req: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');
    const platform = searchParams.get('platform');

    if (token) {
      // Supprimer un token spécifique
      await prisma.pushToken.deleteMany({
        where: {
          userId: user.id,
          token: token
        }
      });
      console.log(`🗑️ Token push supprimé pour l'utilisateur ${user.id}`);
    } else if (platform) {
      // Supprimer tous les tokens d'une plateforme
      await prisma.pushToken.deleteMany({
        where: {
          userId: user.id,
          platform: platform
        }
      });
      console.log(`🗑️ Tous les tokens ${platform} supprimés pour l'utilisateur ${user.id}`);
    } else {
      // Supprimer tous les tokens de l'utilisateur
      await prisma.pushToken.deleteMany({
        where: {
          userId: user.id
        }
      });
      console.log(`🗑️ Tous les tokens push supprimés pour l'utilisateur ${user.id}`);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erreur lors de la suppression du token push:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la suppression du token' },
      { status: 500 }
    );
  }
}

// GET /api/notifications/push-token
// Récupère les tokens push de l'utilisateur authentifié
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const tokens = await prisma.pushToken.findMany({
      where: {
        userId: user.id
      },
      select: {
        id: true,
        platform: true,
        deviceId: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return NextResponse.json({ tokens });
  } catch (error: any) {
    console.error('Erreur lors de la récupération des tokens push:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la récupération des tokens' },
      { status: 500 }
    );
  }
}

