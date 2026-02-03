import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const SYSTEM_PROMPT = `Tu es un assistant qui extrait un emploi du temps depuis une capture d'écran.
Retourne UNIQUEMENT du JSON valide avec ce schéma:
{
  "subjects": [
    { "name": "Nom matière", "coefficient": 1, "ue": "UE si mentionné" }
  ],
  "schedule": [
    { "day": "Lundi", "start": "08:30", "end": "10:00", "subject": "Nom matière", "location": "Salle", "teacher": "Prof (optionnel)" }
  ],
  "summary": "Résumé court"
}
Règles:
- \\"coefficient\\" doit être un nombre (ou 1 si inconnu).
- \\"start\\" et \\"end\\" au format HH:MM.
- Retourne JSON uniquement, sans markdown.`;

function parseJson(content: string) {
  let trimmed = content.trim();
  if (trimmed.startsWith('```')) {
    trimmed = trimmed
      .replace(/^```json\n?/, '')
      .replace(/^```\n?/, '')
      .replace(/\n?```$/, '');
  }
  return JSON.parse(trimmed);
}

export async function POST(req: NextRequest) {
  try {
    if (!OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key non configurée' }, { status: 500 });
    }

    const formData = await req.formData();
    const imageFile = formData.get('image') as File | null;
    const email = (formData.get('email') as string | null) || undefined;
    const sessionId = (formData.get('sessionId') as string | null) || undefined;
    const query = (formData.get('query') as string | null) || undefined;
    const sourceUrl = (formData.get('sourceUrl') as string | null) || undefined;
    const attributionRaw = (formData.get('attribution') as string | null) || undefined;

    if (!imageFile) {
      return NextResponse.json({ error: 'Aucune image fournie' }, { status: 400 });
    }

    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = imageFile.type || 'image/jpeg';
    const base64Image = buffer.toString('base64');

    const attribution = attributionRaw ? JSON.parse(attributionRaw) : undefined;

    const pendingRecord = await prisma.scanCapture.create({
      data: {
        email,
        sessionId,
        query,
        sourceUrl,
        status: 'processing',
        attribution,
        imageMime: mimeType,
        imageData: buffer,
      },
    });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analyse cette capture et retourne le JSON demandé.',
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`,
                  detail: 'low',
                },
              },
            ],
          },
        ],
        max_tokens: 1800,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      await prisma.scanCapture.update({
        where: { id: pendingRecord.id },
        data: { status: 'error', error: JSON.stringify(error) },
      });
      return NextResponse.json({ error: 'Erreur lors de l\'analyse IA', details: error }, { status: 500 });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      await prisma.scanCapture.update({
        where: { id: pendingRecord.id },
        data: { status: 'error', error: 'Aucune réponse IA' },
      });
      return NextResponse.json({ error: 'Aucune réponse IA' }, { status: 500 });
    }

    let parsed;
    try {
      parsed = parseJson(content);
    } catch (error) {
      await prisma.scanCapture.update({
        where: { id: pendingRecord.id },
        data: { status: 'error', error: `Parsing JSON: ${String(error)}`, ocrText: content },
      });
      return NextResponse.json({ error: 'Erreur parsing JSON', raw: content }, { status: 500 });
    }

    await prisma.scanCapture.update({
      where: { id: pendingRecord.id },
      data: {
        status: 'done',
        ocrText: content,
        aiJson: parsed,
      },
    });

    return NextResponse.json({
      id: pendingRecord.id,
      result: parsed,
    });
  } catch (error) {
    console.error('Scan API error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
