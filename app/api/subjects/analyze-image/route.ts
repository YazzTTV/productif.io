/**
 * API pour analyser une image et extraire les matières avec leurs coefficients (ECTS)
 * POST /api/subjects/analyze-image
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Augmenter le timeout pour l'analyse d'image (60 secondes)
export const maxDuration = 60
export const dynamic = 'force-dynamic'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(req)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    if (!OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key non configurée' },
        { status: 500 }
      )
    }

    // Récupérer l'image depuis le FormData
    const formData = await req.formData()
    const imageFile = formData.get('image') as File

    if (!imageFile) {
      return NextResponse.json(
        { error: 'Aucune image fournie' },
        { status: 400 }
      )
    }

    // Convertir l'image en base64
    const arrayBuffer = await imageFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64Image = buffer.toString('base64')
    const mimeType = imageFile.type || 'image/jpeg'

    // Appeler OpenAI Vision API pour analyser l'image
    const prompt = `Analyse cette image qui contient une liste de matières universitaires avec leurs Unités d'Enseignement (UE) et leurs crédits ECTS.

Extrais toutes les matières avec leurs coefficients (ECTS). Pour chaque UE, extrais:
- Le nom de l'UE (ex: "UE6", "UE7", etc.)
- Les matières/cours dans cette UE avec leurs ECTS individuels
- Le total ECTS de l'UE

Retourne les données au format JSON suivant:
{
  "subjects": [
    {
      "name": "Nom de la matière",
      "coefficient": nombre_ECTS,
      "ue": "Nom de l'UE (optionnel)"
    }
  ]
}

Important:
- Le coefficient correspond aux ECTS de la matière
- Si une matière apparaît plusieurs fois, ne la liste qu'une seule fois avec le coefficient le plus élevé
- Retourne uniquement du JSON valide, sans texte avant ou après`

    // Optimiser le prompt pour être plus concis et rapide
    const optimizedPrompt = `Extrais les matières universitaires et leurs ECTS depuis cette image. Retourne UNIQUEMENT du JSON:
{
  "subjects": [
    {"name": "Nom matière", "coefficient": nombre_ECTS, "ue": "UE si mentionné"}
  ]
}
Règles: coefficient = ECTS, ignorer les doublons, JSON valide uniquement.`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: optimizedPrompt,
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`,
                  detail: 'low', // Utiliser 'low' pour accélérer le traitement
                },
              },
            ],
          },
        ],
        max_tokens: 1500, // Réduire pour accélérer
        temperature: 0.1, // Réduire la température pour des réponses plus rapides et déterministes
      }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      console.error('Erreur OpenAI API:', error)
      return NextResponse.json(
        { error: 'Erreur lors de l\'analyse de l\'image', details: error },
        { status: 500 }
      )
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      return NextResponse.json(
        { error: 'Aucune réponse de l\'IA' },
        { status: 500 }
      )
    }

    // Extraire le JSON de la réponse (peut contenir du markdown)
    let jsonContent = content.trim()
    // Enlever les markdown code blocks si présents
    if (jsonContent.startsWith('```')) {
      jsonContent = jsonContent.replace(/^```json\n?/, '').replace(/^```\n?/, '').replace(/\n?```$/, '')
    }

    let parsedData
    try {
      parsedData = JSON.parse(jsonContent)
    } catch (parseError) {
      console.error('Erreur parsing JSON:', parseError)
      console.error('Contenu reçu:', content)
      return NextResponse.json(
        { error: 'Erreur lors du parsing de la réponse de l\'IA', rawContent: content },
        { status: 500 }
      )
    }

    const subjects = parsedData.subjects || []

    if (!Array.isArray(subjects) || subjects.length === 0) {
      return NextResponse.json(
        { error: 'Aucune matière trouvée dans l\'image', rawContent: content },
        { status: 400 }
      )
    }

    // Vérifier les matières existantes pour éviter les doublons
    const existingSubjects = await prisma.subject.findMany({
      where: { userId: user.id },
      select: { name: true },
    })

    const existingNames = new Set(
      existingSubjects.map(s => s.name.toLowerCase().trim())
    )

    // Filtrer et valider les matières
    const validSubjects = subjects
      .filter((s: any) => {
        if (!s.name || typeof s.name !== 'string') return false
        if (!s.coefficient || typeof s.coefficient !== 'number' || s.coefficient < 1) return false
        // Vérifier si la matière existe déjà
        const normalizedName = s.name.trim().toLowerCase()
        return !existingNames.has(normalizedName)
      })
      .map((s: any) => ({
        name: s.name.trim(),
        coefficient: Math.round(s.coefficient),
        ue: s.ue || null,
      }))

    if (validSubjects.length === 0) {
      return NextResponse.json(
        { 
          error: 'Toutes les matières trouvées existent déjà ou sont invalides',
          foundSubjects: subjects.length,
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      subjects: validSubjects,
      totalFound: subjects.length,
      validCount: validSubjects.length,
      skippedCount: subjects.length - validSubjects.length,
    })

  } catch (error: any) {
    console.error('Erreur POST /api/subjects/analyze-image:', error)
    return NextResponse.json(
      { error: 'Erreur serveur', details: error.message },
      { status: 500 }
    )
  }
}

