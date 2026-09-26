/**
 * Logique pure de l'onboarding 1.5 (examens, matieres, chapitres, cours).
 *
 * Aucun import React Native ici, volontairement : ce fichier se teste avec
 * `npx tsx` sans simulateur, et c'est lui qui decide de ce qui part au serveur
 * (POST /api/onboarding/plan). Le stockage vit dans lib/onboardingDraft.ts,
 * la lecture de l'agenda dans lib/onboardingCalendar.ts.
 */

// ---------------------------------------------------------------------------
// Types partages par les ecrans, le brouillon et la requete
// ---------------------------------------------------------------------------

/** Filiere, demandee en un tap sur l'ecran examens. Sert aux pastilles de matieres. */
export type StudyTrack =
  | 'sante'
  | 'droit'
  | 'prepa'
  | 'ingenieur'
  | 'commerce'
  | 'licence_sciences'
  | 'licence_lettres'
  | 'licence_eco'
  | 'lycee'
  | 'autre';

export const STUDY_TRACKS: StudyTrack[] = [
  'sante',
  'droit',
  'prepa',
  'ingenieur',
  'commerce',
  'licence_sciences',
  'licence_lettres',
  'licence_eco',
  'lycee',
  'autre',
];

/** Heure de fin des cours, question de secours quand l'agenda ne dit rien. */
export type ClassesEndHour = 12 | 14 | 16 | 18;
export const CLASSES_END_HOURS: ClassesEndHour[] = [12, 14, 16, 18];

export type TriedBeforeOption = 'screen_time' | 'airplane_mode' | 'other_room' | 'nothing';
export const TRIED_BEFORE_OPTIONS: TriedBeforeOption[] = ['screen_time', 'airplane_mode', 'other_room', 'nothing'];

export type CalendarChoice = 'apple' | 'google' | 'none';

/**
 * Ce que l'etudiant a dit des chapitres d'une matiere. `later` = « pas encore » :
 * on n'envoie rien et le serveur cree 6 seances generiques (Task.generated),
 * sans quoi la matiere ne produirait aucun bloc.
 */
export type DraftChapters =
  | { mode: 'list'; titles: string[] }
  | { mode: 'count'; count: number }
  | { mode: 'later' };

export interface DraftSubject {
  /** Identifiant local, seulement pour les listes React. Jamais envoye. */
  id: string;
  name: string;
  /** Grosse matiere : coefficient 5 cote serveur, 2 sinon. */
  big: boolean;
  chapters: DraftChapters | null;
}

/** Corps de POST /api/onboarding/plan (contrat commun aux lots serveur et mobile). */
export interface OnboardingPlanRequest {
  idempotencyKey: string;
  examDate: string | null;
  subjects: Array<{
    name: string;
    big: boolean;
    chapters?: { titles?: string[]; count?: number };
  }>;
  classesEndHour: ClassesEndHour | null;
  answers?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Bornes
// ---------------------------------------------------------------------------

export const MAX_SUBJECTS = 12;
export const MAX_SUBJECT_NAME = 60;
export const MAX_CHAPTERS_PER_SUBJECT = 120;
export const MAX_CHAPTER_TITLE = 200;
export const MIN_CHAPTER_COUNT = 1;
export const MAX_CHAPTER_COUNT = 80;
export const DEFAULT_CHAPTER_COUNT = 10;

// ---------------------------------------------------------------------------
// Dates : toujours le jour LOCAL de l'appareil, en YYYY-MM-DD
// ---------------------------------------------------------------------------

const pad = (n: number) => String(n).padStart(2, '0');

export function toLocalYmd(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Minuit local du jour donne en YYYY-MM-DD, ou null si la chaine est invalide. */
export function parseLocalYmd(ymd: string | null | undefined): Date | null {
  if (typeof ymd !== 'string') return null;
  const match = ymd.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  // new Date(2026, 1, 31) glisse au 3 mars : on refuse plutot que de deviner.
  if (toLocalYmd(date) !== ymd) return null;
  return date;
}

export function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addDays(date: Date, days: number): Date {
  const out = new Date(date);
  out.setDate(out.getDate() + days);
  return out;
}

/** Au plus tot demain : un examen aujourd'hui ne laisse rien a planifier. */
export function minimumExamDate(now: Date = new Date()): Date {
  return addDays(startOfLocalDay(now), 1);
}

/**
 * Vrai de septembre a decembre : c'est la seule periode ou « premier semestre »
 * a un sens. Le reste de l'annee, l'ecran parle de « tes prochains examens »
 * (le S2 n'est jamais demande en tant que tel, decision du 25 septembre).
 */
export function isFirstSemesterSeason(now: Date = new Date()): boolean {
  return now.getMonth() >= 8;
}

/**
 * Date proposee par defaut dans le selecteur. Ce n'est qu'une position de
 * depart : le bouton affiche la date en toutes lettres, l'etudiant valide donc
 * un jour qu'il voit. Le 15 decembre couvre la plupart des sessions de S1 en
 * France ; hors saison, six semaines plus tard.
 */
export function defaultExamDate(now: Date = new Date()): Date {
  const min = minimumExamDate(now);
  if (isFirstSemesterSeason(now)) {
    const december = new Date(now.getFullYear(), 11, 15);
    if (december.getTime() >= addDays(min, 7).getTime()) return december;
  }
  return addDays(startOfLocalDay(now), 45);
}

/** Une date d'examen deja passee au moment de l'envoi part en null (« je ne sais pas »). */
export function sanitizeExamDate(ymd: string | null | undefined, now: Date = new Date()): string | null {
  const date = parseLocalYmd(ymd);
  if (!date) return null;
  if (date.getTime() < startOfLocalDay(now).getTime()) return null;
  return toLocalYmd(date);
}

// ---------------------------------------------------------------------------
// Matieres
// ---------------------------------------------------------------------------

/**
 * Pastilles proposees par filiere. Ce sont des noms de matiere, donc des
 * DONNEES qui partent au serveur tels quels, pas des libelles d'interface.
 * L'etudiant peut toujours saisir les siennes.
 */
export const SUBJECT_SUGGESTIONS: Record<StudyTrack, string[]> = {
  sante: ['Anatomie', 'Biologie cellulaire', 'Biochimie', 'Physiologie', 'Chimie', 'Biophysique', 'Histologie', 'Embryologie', 'Biostatistiques', 'SHS'],
  droit: ['Droit civil', 'Droit constitutionnel', 'Introduction au droit', 'Histoire du droit', 'Droit administratif', 'Droit pénal', 'Relations internationales', 'Économie'],
  prepa: ['Mathématiques', 'Physique', 'Chimie', 'SI', 'Informatique', 'Français-Philosophie', 'Anglais', 'Histoire-Géographie', 'Économie'],
  ingenieur: ['Mathématiques', 'Physique', 'Mécanique', 'Électronique', 'Informatique', 'Thermodynamique', 'Anglais'],
  commerce: ['Finance', 'Comptabilité', 'Marketing', 'Stratégie', 'Économie', 'Statistiques', 'Droit des affaires', 'Anglais'],
  licence_sciences: ['Analyse', 'Algèbre', 'Physique', 'Chimie', 'Biologie', 'Informatique', 'Statistiques'],
  licence_lettres: ['Histoire', 'Géographie', 'Sociologie', 'Psychologie', 'Philosophie', 'Lettres', 'Anglais'],
  licence_eco: ['Microéconomie', 'Macroéconomie', 'Mathématiques', 'Statistiques', 'Comptabilité', 'Gestion', 'Droit'],
  lycee: ['Mathématiques', 'Physique-Chimie', 'SVT', 'SES', 'Histoire-Géographie', 'Philosophie', 'Français', 'Anglais'],
  autre: [],
};

/**
 * Filiere devinee depuis la reponse « type d'etudiant » de l'ecran identity.
 * Seulement quand c'est sans ambiguite : « Medecine / Droit / Prepa » et
 * « Ecole d'ingenieurs / Commerce » regroupent plusieurs filieres, on ne
 * preselectionne rien plutot que de proposer les mauvaises matieres.
 */
export function trackFromStudentType(studentType: unknown): StudyTrack | null {
  if (studentType === 'highschool') return 'lycee';
  return null;
}

export function normalizeSubjectName(raw: string): string {
  return raw.replace(/\s+/g, ' ').trim().slice(0, MAX_SUBJECT_NAME);
}

/** Comparaison insensible a la casse et aux accents, pour ne pas ajouter deux fois « Economie ». */
export function subjectKey(name: string): string {
  return normalizeSubjectName(name)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

// ---------------------------------------------------------------------------
// Chapitres
// ---------------------------------------------------------------------------

// Puces et numerotations qu'un copier-coller depuis un plan de cours, un PDF ou
// Notes laisse en tete de ligne. Les tirets longs sont ecrits en echappement.
const LEADING_BULLET = /^[\-\u2013\u2014\u2022\u2023\u25E6\u2043\u2219\u00B7*>+]+\s*/;
// « 1. », « 2) », « (3) », « 4 - », « 5: ». L'espace APRES est exige : « 1.2 Les
// contrats » garde sa numerotation, « 3-D » reste intact.
const LEADING_DIGITS = /^\(?\d{1,3}\s*[\.\)\]:\-]\s+/;
// « a) », « B. », « IV. ». Pas de deux-points ici : « Civil: les obligations »
// n'est pas un numero romain.
const LEADING_LETTER = /^\(?(?:[ivx]{1,5}|[a-z])[\.\)\]]\s+/i;

/**
 * Transforme un texte colle en titres de chapitres : une ligne = un chapitre.
 * Le point-virgule separe aussi, pour « Ch1 ; Ch2 ; Ch3 » ecrit sur une ligne.
 * On garde « Chapitre 3 : Les contrats » tel quel, on retire seulement les
 * puces et les numeros nus (« 1. », « 2) », « a) »), qui n'apportent rien et
 * encombreraient chaque bloc du planning.
 */
export function parseChapterList(text: string): string[] {
  if (typeof text !== 'string') return [];
  const titles: string[] = [];
  for (const rawLine of text.split(/\r?\n|;/)) {
    let line = rawLine.replace(/\s+/g, ' ').trim();
    line = line.replace(LEADING_BULLET, '');
    line = line.replace(LEADING_DIGITS, '');
    line = line.replace(LEADING_LETTER, '');
    line = line.trim();
    // Une ligne faite seulement de chiffres est un numero de page ou un reste de sommaire.
    if (!line || /^[\d\s.,]+$/.test(line)) continue;
    titles.push(line.slice(0, MAX_CHAPTER_TITLE));
    if (titles.length >= MAX_CHAPTERS_PER_SUBJECT) break;
  }
  return titles;
}

export function clampChapterCount(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_CHAPTER_COUNT;
  return Math.min(MAX_CHAPTER_COUNT, Math.max(MIN_CHAPTER_COUNT, Math.round(value)));
}

function toApiChapters(chapters: DraftChapters | null): { titles?: string[]; count?: number } | undefined {
  if (!chapters) return undefined;
  if (chapters.mode === 'list') {
    const titles = chapters.titles
      .map((t) => t.replace(/\s+/g, ' ').trim().slice(0, MAX_CHAPTER_TITLE))
      .filter(Boolean)
      .slice(0, MAX_CHAPTERS_PER_SUBJECT);
    return titles.length > 0 ? { titles } : undefined;
  }
  if (chapters.mode === 'count') return { count: clampChapterCount(chapters.count) };
  // « pas encore » : rien, le serveur cree les seances generiques.
  return undefined;
}

// ---------------------------------------------------------------------------
// Cours : deduire l'heure de fin depuis l'agenda
// ---------------------------------------------------------------------------

export interface TimeSlot {
  start: Date | string;
  end: Date | string;
}

const toDate = (value: Date | string) => (value instanceof Date ? value : new Date(value));

/**
 * Heure de fin des cours deduite des creneaux occupes de l'agenda, ou null.
 *
 * Pourquoi on la deduit au lieu de la demander a tous : l'instantane de
 * l'agenda Apple est ignore par le serveur au bout de 3 jours (autoPlan.ts),
 * et `User.weeklyBusy` sert alors de filet (critique point 7). Le deduire
 * donne ce filet sans ajouter de question ; l'ecran l'affiche preselectionne
 * et l'etudiant corrige d'un tap.
 *
 * Regle : jours de semaine seulement, creneaux commencant entre 7h et 19h (un
 * evenement du soir n'est pas un cours) et de moins de 12 h (un evenement de
 * plusieurs jours non marque « toute la journee » fausserait la fin du jour) ;
 * une journee de TP ou de stage de 8 h, elle, compte : l'etudiant n'est pas
 * disponible non plus. Pour chaque jour, la fin la plus tardive ; puis la
 * mediane des jours.
 * Il faut au moins 2 jours, un seul rendez-vous ne dit rien d'un emploi du temps.
 * On arrondit VERS LE HAUT avec 15 min de tolerance : finir a 13h donne 14h,
 * parce qu'il vaut mieux perdre une heure de revision que d'en poser une sur un cours.
 */
export function inferClassesEndHour(slots: TimeSlot[]): ClassesEndHour | null {
  const latestByDay = new Map<string, number>();
  for (const slot of slots) {
    const start = toDate(slot.start);
    const end = toDate(slot.end);
    if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || end <= start) continue;
    const weekday = start.getDay();
    if (weekday === 0 || weekday === 6) continue;
    const startHour = start.getHours() + start.getMinutes() / 60;
    if (startHour < 7 || startHour >= 19) continue;
    if (end.getTime() - start.getTime() > 12 * 60 * 60 * 1000) continue;
    const sameDay = toLocalYmd(end) === toLocalYmd(start);
    const endHour = sameDay ? end.getHours() + end.getMinutes() / 60 : 24;
    const day = toLocalYmd(start);
    latestByDay.set(day, Math.max(latestByDay.get(day) ?? 0, Math.min(endHour, 21)));
  }
  const values = [...latestByDay.values()].sort((a, b) => a - b);
  if (values.length < 2) return null;
  const mid = Math.floor(values.length / 2);
  const median = values.length % 2 === 1 ? values[mid] : (values[mid - 1] + values[mid]) / 2;
  for (const hour of CLASSES_END_HOURS) {
    if (median <= hour + 0.25) return hour;
  }
  return 18;
}

// ---------------------------------------------------------------------------
// Reponses du questionnaire envoyees au serveur (User.onboardingAnswers)
// ---------------------------------------------------------------------------

/**
 * Cles du questionnaire qui partent au serveur. Liste blanche : le stockage
 * local d'onboarding porte aussi le prenom, d'anciennes taches en texte libre
 * et des metadonnees qui n'ont rien a faire dans ce champ.
 */
export const ANSWER_KEYS = [
  'studentType',
  'goals',
  'pressureLevel',
  'currentSituation',
  'dailyStruggles',
  'mentalLoad',
  'focusQuality',
  'satisfaction',
  'overthinkTasks',
  'shouldDoMore',
  'wantToChange',
  'timeHorizon',
] as const;

export function pickAnswers(
  responses: Record<string, unknown> | null | undefined,
  extra: {
    triedBefore?: TriedBeforeOption[] | null;
    track?: StudyTrack | null;
    calendarChoice?: CalendarChoice | null;
  } = {}
): Record<string, unknown> {
  const answers: Record<string, unknown> = {};
  for (const key of ANSWER_KEYS) {
    const value = responses?.[key];
    if (value !== undefined && value !== null && value !== '') answers[key] = value;
  }
  if (extra.triedBefore && extra.triedBefore.length > 0) answers.triedBefore = extra.triedBefore;
  if (extra.track) answers.track = extra.track;
  if (extra.calendarChoice) answers.calendarChoice = extra.calendarChoice;
  return answers;
}

// ---------------------------------------------------------------------------
// Requete finale
// ---------------------------------------------------------------------------

export interface PlanInput {
  idempotencyKey: string;
  examDate: string | null;
  examDateUnknown: boolean;
  subjects: DraftSubject[];
  classesEndHour: ClassesEndHour | null;
}

export function buildPlanRequest(
  input: PlanInput,
  answers: Record<string, unknown>,
  now: Date = new Date()
): OnboardingPlanRequest {
  const seen = new Set<string>();
  const subjects: OnboardingPlanRequest['subjects'] = [];
  for (const subject of input.subjects) {
    const name = normalizeSubjectName(subject.name);
    const key = subjectKey(name);
    if (!name || seen.has(key)) continue;
    seen.add(key);
    const chapters = toApiChapters(subject.chapters);
    subjects.push(chapters ? { name, big: !!subject.big, chapters } : { name, big: !!subject.big });
    if (subjects.length >= MAX_SUBJECTS) break;
  }

  const classesEndHour =
    input.classesEndHour !== null && CLASSES_END_HOURS.includes(input.classesEndHour) ? input.classesEndHour : null;

  return {
    idempotencyKey: input.idempotencyKey,
    examDate: input.examDateUnknown ? null : sanitizeExamDate(input.examDate, now),
    subjects,
    classesEndHour,
    answers,
  };
}
