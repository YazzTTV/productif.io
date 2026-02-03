import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }
    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const scan = await prisma.scanCapture.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        email: true,
        sessionId: true,
        query: true,
        sourceUrl: true,
        status: true,
        error: true,
        createdAt: true,
        updatedAt: true,
        aiJson: true,
        ocrText: true,
        imageMime: true,
        imageData: true,
        attribution: true,
      },
    });

    if (!scan) {
      return NextResponse.json({ error: 'Introuvable' }, { status: 404 });
    }

    const imageBase64 = scan.imageData
      ? Buffer.from(scan.imageData).toString('base64')
      : null;

    return NextResponse.json({
      scan: {
        ...scan,
        imageData: imageBase64,
      },
    });
  } catch (error) {
    console.error('Admin scan detail error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
