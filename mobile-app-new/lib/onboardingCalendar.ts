/**
 * Lecture de l'agenda de l'iPhone pendant l'onboarding (ecran cours).
 *
 * Pourquoi ici et pas seulement dans la synchronisation habituelle
 * (lib/studyPlanSync.ts) : le planning est calcule par POST
 * /api/onboarding/plan juste apres l'ecran cours. Si les creneaux occupes ne
 * sont pas deja chez le serveur a ce moment-la, le premier planning que voit
 * l'etudiant pose des revisions sur ses cours. On envoie donc l'instantane
 * AVANT de quitter l'ecran, avec les memes regles que studyPlanSync : heures
 * seulement, jamais un titre ni un lieu, ni les evenements « toute la journee »
 * ou marques libres, ni notre propre calendrier « Productif ».
 */

import { Platform } from 'react-native';
import { studyPlanService } from '@/lib/api';
import { getStudyCalendarId } from '@/lib/studyPlanSync';
import { inferClassesEndHour, type ClassesEndHour } from '@/lib/onboardingLogic';

const HORIZON_DAYS = 14;
const MAX_SLOTS = 500;
// Au-dela, on n'attend plus la reponse : l'envoi continue en arriere-plan et
// l'ecran avance. L'app n'est pas une fonction serverless, la requete n'est pas tuee.
const SEND_WAIT_MS = 8000;

/**
 * Derniere lecture, en memoire seulement : l'ecran du planning s'en sert pour
 * griser les heures de cours autour des seances. Jamais persistee (ce sont des
 * donnees d'agenda) ; apres une app tuee, l'ecran retombe sur l'heure de fin
 * des cours de la question de secours.
 */
let lastSlots: { start: string; end: string }[] | null = null;

export function getLastAppleBusySlots(): { start: string; end: string }[] | null {
  return lastSlots;
}

export interface AppleCalendarReading {
  /** Creneaux occupes lus sur les 14 prochains jours. */
  slots: number;
  /** Heure de fin des cours deduite des creneaux, ou null si l'agenda ne permet pas de conclure. */
  inferredEndHour: ClassesEndHour | null;
  /** Vrai si le serveur a confirme la reception dans le delai. */
  sent: boolean;
}

/**
 * Lit l'agenda (la permission doit deja etre accordee, par connectAppleCalendar
 * de lib/calendarAuth.ts) puis envoie les creneaux occupes au serveur.
 * Ne leve jamais : un agenda illisible vaut un agenda vide, et l'ecran pose
 * alors la question de secours.
 */
export async function readAndSendAppleBusySlots(): Promise<AppleCalendarReading> {
  const empty: AppleCalendarReading = { slots: 0, inferredEndHour: null, sent: false };
  if (Platform.OS !== 'ios') return empty;

  let Calendar: typeof import('expo-calendar');
  try {
    Calendar = await import('expo-calendar');
  } catch {
    return empty;
  }

  let slots: { start: string; end: string }[] = [];
  const from = new Date();
  const to = new Date(from.getTime() + HORIZON_DAYS * 24 * 60 * 60 * 1000);
  try {
    const { status } = await Calendar.getCalendarPermissionsAsync();
    if (status !== 'granted') return empty;
    const studyCalendarId = await getStudyCalendarId();
    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    const ids = calendars.map((c) => c.id).filter((id) => id && id !== studyCalendarId);
    if (ids.length === 0) return empty;
    const events = await Calendar.getEventsAsync(ids, from, to);
    slots = (events || [])
      .filter((ev) => !ev.allDay && ev.availability !== Calendar.Availability.FREE)
      .map((ev) => ({ start: new Date(ev.startDate).toISOString(), end: new Date(ev.endDate).toISOString() }))
      .filter((slot) => slot.end > slot.start)
      .slice(0, MAX_SLOTS);
  } catch (error) {
    console.warn('[onboardingCalendar] lecture de l agenda en echec', error);
    return empty;
  }

  const inferredEndHour = inferClassesEndHour(slots);
  lastSlots = slots;

  let sent = false;
  try {
    const request = studyPlanService.sendBusySlots({
      source: 'apple',
      rangeStart: from.toISOString(),
      rangeEnd: to.toISOString(),
      slots,
    });
    // Le rejet tardif d'une requete abandonnee ne doit pas remonter en erreur non geree.
    request.catch(() => {});
    const outcome = await Promise.race([
      request.then(() => true).catch(() => false),
      new Promise<boolean>((resolve) => setTimeout(() => resolve(false), SEND_WAIT_MS)),
    ]);
    sent = outcome;
  } catch {
    sent = false;
  }

  return { slots: slots.length, inferredEndHour, sent };
}
