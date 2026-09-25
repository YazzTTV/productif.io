/**
 * Synchronisation du planning de revisions avec le telephone.
 *
 * Le serveur place les chapitres (lib/planning/autoPlan.ts cote web). Ce module
 * fait ce que seul le telephone peut faire :
 *   1. lire les creneaux occupes du calendrier Apple (EventKit n'est lisible que
 *      sur l'appareil) et les envoyer au serveur, HEURES SEULEMENT, jamais un
 *      titre ni un lieu ; le serveur replanifie si l'agenda a change ;
 *   2. recuperer les blocs a venir ;
 *   3. les ecrire dans un calendrier dedie "Productif", en differentiel. On ne
 *      touche jamais aux autres calendriers : c'est ce qui permet d'effacer et de
 *      deplacer librement ;
 *   4. programmer un rappel local 10 min avant chaque bloc des 48 prochaines
 *      heures, plus un recapitulatif a 7h30 les jours qui ont des blocs.
 *      Local, donc il arrive meme sans reseau.
 *
 * Aucune permission n'est DEMANDEE ici : si le calendrier ou les notifications
 * ne sont pas accordes, l'etape correspondante est sautee sans bruit. Les
 * demandes vivent dans les parcours qui les expliquent (onboarding, reglages).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { studyPlanService, getAuthToken, type StudyBlock } from '@/lib/api';
import { trackBackendProductEvent } from '@/lib/productEvents';

let Notifications: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Notifications = require('expo-notifications');
} catch {
  Notifications = null;
}

let CalendarModule: typeof import('expo-calendar') | null = null;
async function getCalendar() {
  if (Platform.OS !== 'ios') return null;
  if (!CalendarModule) {
    try {
      CalendarModule = await import('expo-calendar');
    } catch {
      return null;
    }
  }
  return CalendarModule;
}

const KEY_CALENDAR_ID = 'productif_study_calendar_id_v1';
const KEY_LAST_EVENT_DAY = 'study_plan_synced_event_day_v1';
const CALENDAR_TITLE = 'Productif';
const CALENDAR_COLOR = '#16A34A';
const TASK_MARKER = 'productif-task:';
const HORIZON_DAYS = 14;
const REMINDER_LEAD_MIN = 10;
const REMINDER_WINDOW_MS = 48 * 60 * 60 * 1000;
const MAX_REMINDERS = 30;
const RECAP_HOUR = 7;
const RECAP_MINUTE = 30;
const MIN_INTERVAL_MS = 3 * 60 * 1000;

export const STUDY_NOTIFICATION_KINDS = ['study_block', 'study_recap'] as const;

export interface StudyPlanCopy {
  reminderTitle: (subject: string) => string;
  reminderBody: (title: string, minutes: number) => string;
  recapTitle: string;
  recapBody: (count: number, firstTime: string) => string;
  eventTitle: (subject: string, title: string) => string;
}

export interface StudyPlanSyncResult {
  ran: boolean;
  blocks: number;
  busySlotsSent: number | null;
  replanned: boolean;
  calendar: { created: number; updated: number; deleted: number } | null;
  reminders: number | null;
}

let inFlight: Promise<StudyPlanSyncResult> | null = null;
let lastRunAt = 0;

const hhmm = (date: Date) =>
  `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

async function calendarGranted(Calendar: typeof import('expo-calendar')): Promise<boolean> {
  try {
    const { status } = await Calendar.getCalendarPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

/** Le calendrier "Productif", cree au premier passage et retrouve ensuite. */
async function ensureStudyCalendar(Calendar: typeof import('expo-calendar')): Promise<string | null> {
  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  const stored = await AsyncStorage.getItem(KEY_CALENDAR_ID).catch(() => null);
  const byId = stored ? calendars.find((c) => c.id === stored && c.allowsModifications) : undefined;
  if (byId) return byId.id;

  const byTitle = calendars.find((c) => c.title === CALENDAR_TITLE && c.allowsModifications);
  if (byTitle) {
    await AsyncStorage.setItem(KEY_CALENDAR_ID, byTitle.id).catch(() => {});
    return byTitle.id;
  }

  // Meme source que le calendrier par defaut (iCloud si active, sinon local),
  // pour que le calendrier apparaisse la ou l'utilisateur regarde deja.
  const fallback = await Calendar.getDefaultCalendarAsync();
  const id = await Calendar.createCalendarAsync({
    title: CALENDAR_TITLE,
    color: CALENDAR_COLOR,
    entityType: Calendar.EntityTypes.EVENT,
    sourceId: fallback.source?.id,
    source: fallback.source,
    name: 'productif',
    ownerAccount: 'personal',
    accessLevel: Calendar.CalendarAccessLevel.OWNER,
  });
  await AsyncStorage.setItem(KEY_CALENDAR_ID, id).catch(() => {});
  return id;
}

/** Creneaux occupes de tous les calendriers sauf le notre : heures seulement. */
async function readBusySlots(
  Calendar: typeof import('expo-calendar'),
  studyCalendarId: string | null,
  from: Date,
  to: Date
): Promise<{ start: string; end: string }[]> {
  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  const ids = calendars.map((c) => c.id).filter((id) => id && id !== studyCalendarId);
  if (ids.length === 0) return [];
  const events = await Calendar.getEventsAsync(ids, from, to);
  return (events || [])
    // Un evenement "toute la journee" (anniversaire, jour ferie) ou marque libre
    // ne bloque pas un creneau de revision.
    .filter((ev) => !ev.allDay && ev.availability !== Calendar.Availability.FREE)
    .map((ev) => ({ start: new Date(ev.startDate).toISOString(), end: new Date(ev.endDate).toISOString() }))
    .filter((slot) => slot.end > slot.start)
    .slice(0, 500);
}

/** Ecrit les blocs dans le calendrier "Productif", en ne touchant que ce qui change. */
async function writeBlocksToCalendar(
  Calendar: typeof import('expo-calendar'),
  calendarId: string,
  blocks: StudyBlock[],
  copy: StudyPlanCopy,
  from: Date,
  to: Date
) {
  const existing = await Calendar.getEventsAsync([calendarId], from, to);
  const byTask = new Map<string, any>();
  const strays: any[] = [];
  for (const ev of existing || []) {
    const match = typeof ev.notes === 'string' ? ev.notes.match(new RegExp(`${TASK_MARKER}(\\S+)`)) : null;
    // Seuls NOS evenements (porteurs du marqueur) sont geres ici. Un evenement
    // ajoute a la main dans ce calendrier n'est jamais touche. Un doublon du
    // meme chapitre, lui, est a nous et part.
    if (!match) continue;
    if (!byTask.has(match[1])) byTask.set(match[1], ev);
    else strays.push(ev);
  }

  let created = 0;
  let updated = 0;
  let deleted = 0;
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  for (const block of blocks) {
    const title = copy.eventTitle(block.subjectName ?? '', block.title);
    const details = {
      title,
      startDate: new Date(block.start),
      endDate: new Date(block.end),
      notes: `${TASK_MARKER}${block.taskId}`,
      timeZone,
    };
    const current = byTask.get(block.taskId);
    if (!current) {
      await Calendar.createEventAsync(calendarId, details);
      created++;
      continue;
    }
    byTask.delete(block.taskId);
    const same =
      new Date(current.startDate).getTime() === details.startDate.getTime() &&
      new Date(current.endDate).getTime() === details.endDate.getTime() &&
      current.title === title;
    if (!same) {
      await Calendar.updateEventAsync(current.id, details);
      updated++;
    }
  }

  // Ce qui reste n'est plus au planning (fait, deplace hors horizon, supprime).
  for (const ev of [...byTask.values(), ...strays]) {
    await Calendar.deleteEventAsync(ev.id);
    deleted++;
  }

  return { created, updated, deleted };
}

async function scheduleReminders(blocks: StudyBlock[], copy: StudyPlanCopy): Promise<number | null> {
  if (!Notifications) return null;
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') return null;

    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const n of scheduled || []) {
      const kind = n?.content?.data?.kind;
      if (STUDY_NOTIFICATION_KINDS.includes(kind)) {
        await Notifications.cancelScheduledNotificationAsync(n.identifier);
      }
    }

    const now = Date.now();
    let count = 0;

    for (const block of blocks) {
      const fireAt = new Date(block.start).getTime() - REMINDER_LEAD_MIN * 60 * 1000;
      if (fireAt <= now + 30 * 1000 || fireAt > now + REMINDER_WINDOW_MS || count >= MAX_REMINDERS) continue;
      await Notifications.scheduleNotificationAsync({
        content: {
          title: copy.reminderTitle(block.subjectName ?? ''),
          body: copy.reminderBody(block.title, block.minutes),
          sound: 'default',
          data: { kind: 'study_block', action: 'open_study_block', taskId: block.taskId },
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(fireAt) },
      });
      count++;
    }

    // Recapitulatif du matin, aujourd'hui et demain, si la journee a des blocs.
    for (let offset = 0; offset < 2; offset++) {
      const day = new Date();
      day.setDate(day.getDate() + offset);
      day.setHours(RECAP_HOUR, RECAP_MINUTE, 0, 0);
      if (day.getTime() <= now + 30 * 1000) continue;
      const sameDay = blocks.filter((b) => {
        const start = new Date(b.start);
        return start.toDateString() === day.toDateString() && start.getTime() > day.getTime();
      });
      if (sameDay.length === 0) continue;
      await Notifications.scheduleNotificationAsync({
        content: {
          title: copy.recapTitle,
          body: copy.recapBody(sameDay.length, hhmm(new Date(sameDay[0].start))),
          sound: 'default',
          data: { kind: 'study_recap', action: 'open_study_block' },
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: day },
      });
      count++;
    }

    return count;
  } catch (error) {
    console.warn('[studyPlanSync] rappels non programmes', error);
    return null;
  }
}

async function run(copy: StudyPlanCopy): Promise<StudyPlanSyncResult> {
  const result: StudyPlanSyncResult = {
    ran: false,
    blocks: 0,
    busySlotsSent: null,
    replanned: false,
    calendar: null,
    reminders: null,
  };

  const token = await getAuthToken();
  if (!token) {
    // Deconnecte : les rappels du compte precedent ne doivent pas sonner.
    await clearStudyReminders();
    return result;
  }
  result.ran = true;

  const from = new Date();
  const to = new Date(from.getTime() + HORIZON_DAYS * 24 * 60 * 60 * 1000);

  const Calendar = await getCalendar();
  const canUseCalendar = Calendar ? await calendarGranted(Calendar) : false;
  let studyCalendarId: string | null = null;

  if (Calendar && canUseCalendar) {
    try {
      studyCalendarId = await ensureStudyCalendar(Calendar);
      const slots = await readBusySlots(Calendar, studyCalendarId, from, to);
      const sent = await studyPlanService.sendBusySlots({
        source: 'apple',
        rangeStart: from.toISOString(),
        rangeEnd: to.toISOString(),
        slots,
      });
      result.busySlotsSent = slots.length;
      result.replanned = !!sent?.replanned;
    } catch (error) {
      console.warn('[studyPlanSync] creneaux Apple non envoyes', error);
    }
  }

  const { blocks } = await studyPlanService.getBlocks(HORIZON_DAYS);
  result.blocks = blocks.length;

  if (Calendar && canUseCalendar && studyCalendarId) {
    try {
      result.calendar = await writeBlocksToCalendar(Calendar, studyCalendarId, blocks, copy, from, to);
    } catch (error) {
      console.warn('[studyPlanSync] calendrier Productif non mis a jour', error);
    }
  }

  result.reminders = await scheduleReminders(blocks, copy);

  // Un seul evenement par jour : de quoi savoir que la chaine tourne, sans
  // remplir la table a chaque retour au premier plan.
  const today = new Date().toDateString();
  const lastDay = await AsyncStorage.getItem(KEY_LAST_EVENT_DAY).catch(() => null);
  if (lastDay !== today) {
    await trackBackendProductEvent('study_plan_synced', {
      blocks: result.blocks,
      busy_slots: result.busySlotsSent,
      calendar_created: result.calendar?.created ?? null,
      reminders: result.reminders,
    });
    await AsyncStorage.setItem(KEY_LAST_EVENT_DAY, today).catch(() => {});
  }

  return result;
}

/**
 * Point d'entree. Au plus une synchronisation a la fois, et au plus une toutes
 * les 3 minutes sauf `force` (apres une modification faite dans l'app).
 */
export async function syncStudyPlan(copy: StudyPlanCopy, options: { force?: boolean } = {}): Promise<StudyPlanSyncResult | null> {
  if (inFlight) return inFlight;
  if (!options.force && Date.now() - lastRunAt < MIN_INTERVAL_MS) return null;
  lastRunAt = Date.now();
  inFlight = run(copy)
    .catch((error) => {
      console.warn('[studyPlanSync] echec', error);
      return { ran: false, blocks: 0, busySlotsSent: null, replanned: false, calendar: null, reminders: null };
    })
    .finally(() => {
      inFlight = null;
    });
  return inFlight;
}

/** A la deconnexion : on retire les rappels du compte qui s'en va. */
export async function clearStudyReminders(): Promise<void> {
  if (!Notifications) return;
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const n of scheduled || []) {
      if (STUDY_NOTIFICATION_KINDS.includes(n?.content?.data?.kind)) {
        await Notifications.cancelScheduledNotificationAsync(n.identifier);
      }
    }
  } catch {
    // rien a faire
  }
}

/** Identifiant du calendrier "Productif", pour que l'accueil reconnaisse nos evenements. */
export async function getStudyCalendarId(): Promise<string | null> {
  return AsyncStorage.getItem(KEY_CALENDAR_ID).catch(() => null);
}
