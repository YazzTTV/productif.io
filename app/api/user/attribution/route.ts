import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const REFERRED_BY_MAX_LENGTH = 128;
const REFERRED_BY_REGEX = /^[a-zA-Z0-9_\-.:@]+$/;
const ALLOWED_PROVIDERS = new Set(['appsflyer', 'branch', 'adjust']);
const INSTALL_ID_ABUSE_THRESHOLD = 3;

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 heure

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  entry.count++;
  return entry.count <= RATE_LIMIT_MAX;
}

export async function POST(req: NextRequest) {
  try {
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    if (!checkRateLimit(clientIp)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const user = await getAuthUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await req.json();
    const {
      referredBy,
      deepLinkReferredBy,
      attributionSource,
      attributionData,
      installId,
    } = body;

    const rawProvider = typeof body.attributionProvider === 'string' ? body.attributionProvider : '';
    const provider = ALLOWED_PROVIDERS.has(rawProvider) ? rawProvider : 'appsflyer';

    const resolvedReferredBy = (referredBy || deepLinkReferredBy || '').trim();

    if (!resolvedReferredBy && !attributionSource) {
      return NextResponse.json(
        { error: 'referredBy ou attributionSource requis' },
        { status: 400 }
      );
    }

    // Anti-fraude : bloquer auto-référencement
    if (resolvedReferredBy && resolvedReferredBy === user.id) {
      console.warn(`[Attribution] Auto-référencement bloqué: user ${user.id}`);
      return NextResponse.json({ success: true });
    }

    if (resolvedReferredBy) {
      if (resolvedReferredBy.length > REFERRED_BY_MAX_LENGTH) {
        return NextResponse.json(
          { error: `referredBy trop long (max ${REFERRED_BY_MAX_LENGTH})` },
          { status: 400 }
        );
      }
      if (!REFERRED_BY_REGEX.test(resolvedReferredBy)) {
        return NextResponse.json(
          { error: 'referredBy contient des caractères non autorisés' },
          { status: 400 }
        );
      }
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { attributedAt: true },
    });

    if (existingUser?.attributedAt) {
      return NextResponse.json({ success: true, alreadyAttributed: true });
    }

    // Anti-fraude : détecter abuse par installId (même device, même affilié, N comptes)
    if (installId && resolvedReferredBy) {
      const sameDeviceSameAffiliate = await prisma.user.count({
        where: {
          installId,
          referredBy: resolvedReferredBy,
          id: { not: user.id },
        },
      });
      if (sameDeviceSameAffiliate >= INSTALL_ID_ABUSE_THRESHOLD) {
        console.warn(
          `[Attribution] Abus détecté: installId=${installId} déjà utilisé ` +
          `${sameDeviceSameAffiliate}x pour affilié ${resolvedReferredBy}`
        );
        return NextResponse.json({ success: true });
      }
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        referredBy: resolvedReferredBy || null,
        attributionSource: attributionSource || null,
        attributionProvider: provider,
        attributionData: attributionData ?? undefined,
        attributedAt: new Date(),
        installId: installId || null,
      },
    });

    console.log(`[Attribution] User ${user.id} → affilié: ${resolvedReferredBy || '(organic)'}, provider: ${provider}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Attribution] Erreur:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
