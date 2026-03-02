import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { firstName, email, country, platform, handle, followers, motivation } = body;

    if (!firstName || !email || !country || !platform || !handle || !followers || !motivation) {
      return NextResponse.json(
        { error: 'Tous les champs sont requis' },
        { status: 400 }
      );
    }

    if (motivation.length < 10) {
      return NextResponse.json(
        { error: 'Dis-nous en un peu plus sur ta motivation (10 caractères min.)' },
        { status: 400 }
      );
    }

    const existing = await prisma.creatorApplication.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Une candidature avec cet email existe déjà', alreadyApplied: true },
        { status: 409 }
      );
    }

    const application = await prisma.creatorApplication.create({
      data: {
        firstName: firstName.trim(),
        email: email.toLowerCase().trim(),
        country,
        platform,
        handle: handle.trim(),
        followers,
        motivation: motivation.trim(),
        status: 'pending',
      },
    });

    console.log(`[Creator] Nouvelle candidature: ${firstName} (${email}) - ${platform} @${handle}`);

    return NextResponse.json({
      success: true,
      applicationId: application.id,
    });
  } catch (error) {
    console.error('[Creator] Erreur apply:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
