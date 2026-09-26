/**
 * Le planning de l'onboarding 1.5, en un seul appel.
 *
 * POST /api/onboarding/plan
 *   { idempotencyKey, examDate: 'YYYY-MM-DD' | null, classesEndHour: 12|14|16|18|null,
 *     subjects: [{ name, big, chapters?: { titles?: string[], count?: number } }],
 *     answers?: {...} }
 * -> { success: true, timeZone, partial, blocks }   (blocs : meme forme que GET /api/planning/blocks)
 *
 * Trois temps, et l'ordre est tout le sujet de cette route :
 *   1. une transaction COURTE qui ne fait que creer : matieres, chapitres,
 *      reponses du questionnaire, emploi du temps de secours. Rien d'autre
 *      dedans : une transaction interactive expire a quelques secondes, et
 *      replanUser ecrit avec le client global, hors de toute transaction ;
 *   2. un calcul SANS Google, borne a QUICK_PLAN_MS (3 s) : c'est ce que l'ecran de
 *      calcul affiche. Avec Google, un calcul peut prendre 16 s (deux appels de
 *      8 s), l'ecran ne l'attend pas ;
 *   3. le calcul complet, avec Google, APRES la reponse, par after(). Jamais une
 *      promesse non attendue : le gel de la fonction Vercel la tuerait des la
 *      reponse renvoyee (panne des notifications du 15 septembre).
 *
 * partial = true quand le calcul rapide n'a pas fini a temps, ou a echoue : les
 * blocs renvoyes sont ceux qui existent deja, parfois aucun. L'app relit alors
 * GET /api/planning/blocks, que le calcul du temps 3 aura rempli.
 *
 * Idempotence : la cle est enregistree sur User.onboardingPlanKey DANS la
 * transaction, par un UPDATE conditionnel qui est la premiere ecriture. Une
 * requete rejouee (reseau lent, app tuee puis relancee) voit sa cle deja
 * posee et ne recree rien ; deux requetes simultanees se serialisent sur le
 * verrou de la ligne User, et la seconde trouve la cle posee par la premiere.
 * Si la transaction echoue, la cle n'est pas posee et un nouvel essai recree.
 * Une requete rejouee pour un compte JAMAIS planifie relance le calcul (la
 * premiere a pu mourir entre la transaction et le calcul) ; pour un compte
 * deja planifie, elle renvoie les blocs tels quels.
 *
 * Date d'examen inconnue (examDate null, « je ne sais pas ») : les matieres
 * sont creees SANS date. On n'invente pas de date : elle s'afficherait comme
 * vraie (examDate de chaque bloc), et le planificateur sait deja repartir sans
 * echeance (partage au coefficient, voir StudyPlanner). Une date du jour ou
 * passee est traitee de meme : elle ne laisserait rien a planifier.
 *
 * Utilisateur qui a deja des matieres (mergeSubject dans
 * lib/planning/onboardingPlan.ts) : une matiere de meme nom, a la casse, aux
 * accents et aux espaces pres, est REUTILISEE et jamais dupliquee. Son
 * coefficient reste celui que l'etudiant a regle dans l'app ; sa date n'est
 * posee que si elle n'en avait pas ; seuls les chapitres qu'elle n'a pas sont
 * ajoutes. Les matieres existantes absentes de la requete ne sont pas touchees.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { resolveTimezone, syncUserTimezone } from '@/lib/timezone'
import { daysBetweenKeys, localDateKey } from '@/lib/planning/StudyPlanner'
import { readPlanningBlocks } from '@/lib/planning/planningBlocks'
import {
  BadRequest,
  TIMED_OUT,
  createFromRequest,
  parseRequest,
  planAndSchedule,
  type PlanRequest,
} from '@/lib/planning/onboardingPlan'

export const dynamic = 'force-dynamic'
// Le calcul complet du temps 3 tourne apres la reponse, dans la meme fonction :
// after() compte dans la duree maximale.
export const maxDuration = 60

/** Jours de blocs renvoyes : l'horizon du planificateur. */
const BLOCK_DAYS = 14

// La lecture de la requete, les creations (temps 1) et l'enchainement des deux
// calculs (temps 2 et 3) vivent dans lib/planning/onboardingPlan.ts, testables
// sans base ni requete (scripts/test-onboarding-plan.ts).

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    let request: PlanRequest
    try {
      request = parseRequest(await req.json().catch(() => null))
    } catch (error) {
      if (error instanceof BadRequest) return NextResponse.json({ error: error.message }, { status: 400 })
      throw error
    }

    const record = await prisma.user.findUnique({
      where: { id: user.id },
      select: { timezone: true, onboardingPlanKey: true, autoPlanRunAt: true },
    })
    if (!record) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })

    // Le fuseau de l'appareil d'abord : la date d'examen et le planning sont
    // calcules dans le jour LOCAL, et un compte neuf n'a peut-etre pas encore
    // appele /api/auth/me, qui l'enregistre d'habitude.
    const timeZone = resolveTimezone({
      timezone: await syncUserTimezone(
        user.id,
        req.headers.get('x-timezone'),
        record.timezone,
        req.headers.get('x-vercel-ip-timezone')
      ),
    })

    // Une date du jour ou passee ne laisserait rien a planifier (voir en tete).
    if (request.examDate && daysBetweenKeys(localDateKey(new Date(), timeZone), request.examDate) <= 0) {
      request = { ...request, examDate: null }
    }

    const summary = record.onboardingPlanKey === request.idempotencyKey ? null : await createFromRequest(user.id, request, timeZone)

    let partial = false
    let ms = 0
    let quickLabel = 'none'
    if (summary || record.autoPlanRunAt === null) {
      // Requete neuve, ou requete rejouee pour un compte jamais planifie : la
      // premiere a pu mourir entre la transaction et le calcul, on recalcule.
      // Un compte deja planifie qui rejoue recoit ses blocs tels quels : un
      // calcul sans Google ecraserait celui, avec Google, du temps 3.
      const planned = await planAndSchedule(user.id)
      partial = planned.partial
      ms = planned.ms
      quickLabel = planned.quick === TIMED_OUT ? 'timeout' : planned.quick === null ? 'error' : `${planned.quick.blocksWritten} blocs`
    }

    const blocks = await readPlanningBlocks(user.id, timeZone, BLOCK_DAYS)

    console.log(
      `[onboarding/plan] ${user.id} ${summary ? JSON.stringify(summary) : 'rejoue'} calcul=${quickLabel} ${ms}ms blocs=${blocks.length}`
    )

    return NextResponse.json({ success: true, timeZone, partial, blocks })
  } catch (error) {
    console.error('[onboarding/plan] Erreur:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
