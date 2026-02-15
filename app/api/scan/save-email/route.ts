import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { sendSessionEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

const SPREADSHEET_ID = '1mjkGK0q4asD_egLeaCmNP3VH3rE9D5-5WtcX1WU-cZQ'
const SHEET_NAME = 'Feuille 1'

// En-têtes du Google Sheet
const HEADERS = [
  'Date',
  'Email',
  'Texte brut saisi',
  'Nb tâches',
  'Temps total (h)',
  'Heures dispo',
  'Ratio de charge',
  'Diagnostic',
  'Tâches détaillées',
  'Planning complet',
  'Session ID',
]

/**
 * Initialise le client Google Sheets avec le service account
 */
async function getSheetsClient() {
  const saB64 = process.env.GOOGLE_SERVICE_ACCOUNT_JSON_B64
  if (!saB64) throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON_B64 manquant')

  const sa = JSON.parse(Buffer.from(saB64, 'base64').toString('utf8'))

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: sa.client_email,
      private_key: sa.private_key,
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })

  return google.sheets({ version: 'v4', auth })
}

/**
 * Met à jour les en-têtes en ligne 1 pour qu'ils correspondent aux 11 colonnes
 */
async function ensureHeaders(sheets: any) {
  // Toujours écrire les en-têtes corrects pour aligner les colonnes
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A1:K1`,
    valueInputOption: 'RAW',
    requestBody: {
      values: [HEADERS],
    },
  })
}

/**
 * Renvoie le label du diagnostic selon le ratio
 */
function getDiagnosticLabel(ratio: number): string {
  if (ratio > 1.5) return 'Zone de crash intense'
  if (ratio > 1.2) return 'Journée sous tension'
  if (ratio > 1) return 'Objectif ambitieux'
  return 'Objectif atteignable'
}

/**
 * API pour sauvegarder l'email + toute la data dans Google Sheets
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      email,
      sessionId,
      rawInput,
      clarifiedTasks,
      timelineTasks,
      priorities,
      diagnostic,
    } = body

    if (!email || !email.trim()) {
      return NextResponse.json({ error: 'Email requis' }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Email invalide' }, { status: 400 })
    }

    const cleanEmail = email.trim().toLowerCase()

    // --- Préparer les données ---
    const tasks = (timelineTasks || clarifiedTasks || []) as Array<{
      id: string
      title: string
      time?: string
      duration: number
      energyLevel?: number
      category?: string
    }>

    const now = new Date()
    const dateStr = now.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

    const nbTasks = tasks.length
    const totalMinutes = tasks.reduce((sum, t) => sum + (t.duration || 0), 0)
    const totalHours = (totalMinutes / 60).toFixed(1)

    const availableHours = diagnostic?.availableHours ?? ''
    const crashRatio = diagnostic?.crashRatio ?? ''
    const diagnosticLabel = crashRatio
      ? getDiagnosticLabel(Number(crashRatio))
      : ''

    // Texte brut saisi par l'utilisateur
    const rawText = (rawInput || '').toString().substring(0, 2000)

    // Tâches détaillées : titre + durée + catégorie + énergie
    const tasksDetailed = tasks
      .filter((t) => t.category !== 'Récupération')
      .map((t) => {
        const energy = t.energyLevel !== undefined ? ` [E:${t.energyLevel}]` : ''
        const cat = t.category ? ` (${t.category})` : ''
        return `${t.title} — ${t.duration}min${cat}${energy}`
      })
      .join('\n')

    // Planning complet avec heures
    const planningDetailed = tasks
      .map((t) => {
        const timeStr = t.time || '??:??'
        return `${timeStr} → ${t.title} [${t.duration}min]`
      })
      .join('\n')

    // --- Écrire dans Google Sheets ---
    try {
      const sheets = await getSheetsClient()
      await ensureHeaders(sheets)

      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A:K`,
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
          values: [[
            dateStr,
            cleanEmail,
            rawText,
            nbTasks,
            totalHours,
            availableHours,
            crashRatio,
            diagnosticLabel,
            tasksDetailed,
            planningDetailed,
            sessionId || '',
          ]],
        },
      })

      console.log('📊 Données complètes ajoutées au Google Sheet:', cleanEmail)
    } catch (sheetError) {
      console.error('❌ Erreur Google Sheets (non bloquante):', sheetError)
    }

    // --- Envoyer l'email avec le planning (via lib/email) ---
    try {
      const planningHtml = `
        <p>Voici ton planning tel que généré par productif.io :</p>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #f5f5f5;">
              <th style="padding: 8px 12px; text-align: left;">Heure</th>
              <th style="padding: 8px 12px; text-align: left;">Activité</th>
              <th style="padding: 8px 12px; text-align: left;">Durée</th>
            </tr>
          </thead>
          <tbody>
            ${tasks
              .map(
                (t) => `
              <tr>
                <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">${t.time || '??:??'}</td>
                <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">${t.title}</td>
                <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">${t.duration} min</td>
              </tr>`
              )
              .join('')}
          </tbody>
        </table>`

      await sendSessionEmail({
        email: cleanEmail,
        nbTasks,
        totalTime: totalHours,
        tasks: tasksDetailed,
        sessionId: sessionId || '',
        priorities: priorities || [],
        planningHtml,
      })

      console.log('📧 Email envoyé à:', cleanEmail)
    } catch (emailError) {
      console.error('❌ Erreur envoi email (non bloquante):', emailError)
    }

    console.log('📧 Lead scan capturé:', {
      email: cleanEmail,
      sessionId,
      tasksCount: nbTasks,
      totalHours,
      diagnostic: diagnosticLabel,
    })

    return NextResponse.json({
      success: true,
      message: 'Planning envoyé par email',
    })

  } catch (error) {
    console.error('❌ Erreur save-email:', error)
    return NextResponse.json({
      error: 'Erreur serveur',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}
