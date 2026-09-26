/**
 * Brouillon de l'onboarding 1.5, partage entre les ecrans.
 *
 * Les ecrans examens, matieres, chapitres et cours accumulent ici ce qui sert
 * au calcul du planning ; l'ecran de calcul (building-plan) en tire le corps de
 * POST /api/onboarding/plan avec `buildOnboardingPlanRequest()`.
 *
 * Deux couches, comme lib/dataCache.ts : un miroir en memoire pour que l'ecran
 * suivant lise sans attendre, et AsyncStorage pour survivre a l'app tuee. Le
 * brouillon est cloisonne par utilisateur : deux comptes sur le meme telephone
 * ne se melangent pas.
 *
 * Les reponses du questionnaire (identity ... goals-intent) ne sont PAS
 * recopiees ici : elles restent dans le stockage de hooks/useOnboardingData.ts,
 * ou les ecrans existants les ecrivent deja, et sont lues au moment de
 * construire la requete. Une copie serait perimee des que l'etudiant revient en
 * arriere corriger une reponse. Seul « Tu as deja essaye quoi ? », nouvel
 * ecran, ecrit dans le brouillon.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { useCallback, useEffect, useState } from 'react';
import { TokenStorage } from '@/lib/api';
import { readOnboardingResponses } from '@/hooks/useOnboardingData';
import {
  buildPlanRequest,
  pickAnswers,
  type CalendarChoice,
  type ClassesEndHour,
  type DraftSubject,
  type OnboardingPlanRequest,
  type StudyTrack,
  type TriedBeforeOption,
} from '@/lib/onboardingLogic';

export interface OnboardingDraft {
  version: 1;
  /**
   * Cle d'idempotence de POST /api/onboarding/plan. Tiree UNE fois par
   * brouillon et jamais renouvelee : si la requete part, que le serveur cree les
   * matieres mais que la reponse se perd, le second envoi doit retrouver les
   * memes blocs au lieu de creer les matieres en double.
   */
  idempotencyKey: string;
  triedBefore: TriedBeforeOption[] | null;
  track: StudyTrack | null;
  /** YYYY-MM-DD, jour local. null avec examDateUnknown=false : pas encore repondu. */
  examDate: string | null;
  examDateUnknown: boolean;
  subjects: DraftSubject[];
  classesEndHour: ClassesEndHour | null;
  /** Vrai quand l'heure vient de l'agenda et non d'un tap de l'etudiant. */
  classesEndHourInferred: boolean;
  calendarChoice: CalendarChoice | null;
  /** Nombre de creneaux occupes envoyes depuis l'agenda de l'iPhone, null si rien n'est parti. */
  calendarBusySlots: number | null;
  /** Dernier ecran affiche, pour reprendre la ou l'etudiant s'etait arrete. */
  lastStep: string | null;
  updatedAt: number;
}

export type OnboardingDraftPatch = Partial<Omit<OnboardingDraft, 'version' | 'idempotencyKey' | 'updatedAt'>>;

const DRAFT_PREFIX = 'onboarding_draft_v1';
/**
 * Drapeau pose a la creation du compte, retire a la fin de l'onboarding. Sa
 * valeur est l'identifiant du compte : la reprise ne s'applique qu'a lui.
 * Il existe parce que app/index.tsx pose `onboarding_completed` des qu'un jeton
 * existe, donc une app tuee au milieu de l'onboarding ne revoyait jamais la
 * suite (spec 1.5, cas limites). La LECTURE de ce drapeau au demarrage reste a
 * brancher dans app/index.tsx.
 */
export const ONBOARDING_IN_PROGRESS_KEY = 'onboarding_in_progress';

const memory = new Map<string, OnboardingDraft>();
const writeQueues = new Map<string, Promise<OnboardingDraft>>();
const listeners = new Set<(draft: OnboardingDraft) => void>();

function decodeJWT(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

async function currentUserId(): Promise<string | null> {
  try {
    const token = await TokenStorage.getInstance().getToken();
    if (!token) return null;
    const decoded = decodeJWT(token);
    return decoded?.userId || decoded?.sub || null;
  } catch {
    return null;
  }
}

async function storageKey(): Promise<string> {
  const userId = await currentUserId();
  return `${DRAFT_PREFIX}:${userId ?? 'anon'}`;
}

function emptyDraft(): OnboardingDraft {
  return {
    version: 1,
    idempotencyKey: Crypto.randomUUID(),
    triedBefore: null,
    track: null,
    examDate: null,
    examDateUnknown: false,
    subjects: [],
    classesEndHour: null,
    classesEndHourInferred: false,
    calendarChoice: null,
    calendarBusySlots: null,
    lastStep: null,
    updatedAt: Date.now(),
  };
}

/** Relecture tolerante : un brouillon d'une version anterieure garde ce qui est encore valable. */
function revive(raw: string | null): OnboardingDraft | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || typeof parsed.idempotencyKey !== 'string') return null;
    return { ...emptyDraft(), ...parsed, version: 1, idempotencyKey: parsed.idempotencyKey };
  } catch {
    return null;
  }
}

// Lectures en cours : deux ecrans qui montent en meme temps ne doivent pas
// tirer chacun un brouillon vide, donc deux cles d'idempotence differentes.
const pendingReads = new Map<string, Promise<OnboardingDraft>>();

async function readDraft(key: string): Promise<OnboardingDraft> {
  const cached = memory.get(key);
  if (cached) return cached;
  const pending = pendingReads.get(key);
  if (pending) return pending;

  const read = (async () => {
    let stored: OnboardingDraft | null = null;
    try {
      stored = revive(await AsyncStorage.getItem(key));
    } catch {
      stored = null;
    }
    const draft = memory.get(key) ?? stored ?? emptyDraft();
    memory.set(key, draft);
    if (!stored) {
      // Persister tout de suite la cle d'idempotence : si l'app est tuee apres
      // un envoi, la relance doit reprendre la MEME cle.
      await AsyncStorage.setItem(key, JSON.stringify(draft)).catch(() => {});
    }
    return draft;
  })();
  pendingReads.set(key, read);
  try {
    return await read;
  } finally {
    pendingReads.delete(key);
  }
}

function notify(draft: OnboardingDraft) {
  for (const listener of listeners) {
    try {
      listener(draft);
    } catch (error) {
      console.warn('[onboardingDraft] abonne en echec', error);
    }
  }
}

/** Le brouillon courant, cree vide au premier appel. Ne leve jamais. */
export async function loadOnboardingDraft(): Promise<OnboardingDraft> {
  const key = await storageKey();
  await writeQueues.get(key)?.catch(() => {});
  return readDraft(key);
}

/**
 * Ecrit une modification. Les ecritures sont mises en file et relisent l'etat
 * courant, comme dans useOnboardingData : deux mises a jour rapprochees (un tap
 * puis la navigation) ne repartent pas du meme ancien objet.
 */
export async function updateOnboardingDraft(
  patch: OnboardingDraftPatch | ((draft: OnboardingDraft) => OnboardingDraftPatch)
): Promise<OnboardingDraft> {
  const key = await storageKey();
  const previous = writeQueues.get(key) ?? Promise.resolve(null as unknown as OnboardingDraft);
  const write = previous
    .catch(() => null)
    .then(async () => {
      const current = await readDraft(key);
      const changes = typeof patch === 'function' ? patch(current) : patch;
      const next: OnboardingDraft = {
        ...current,
        ...changes,
        version: 1,
        idempotencyKey: current.idempotencyKey,
        updatedAt: Date.now(),
      };
      memory.set(key, next);
      try {
        await AsyncStorage.setItem(key, JSON.stringify(next));
      } catch (error) {
        // Le miroir memoire suffit pour finir la session ; seule la reprise
        // apres une app tuee est perdue.
        console.warn('[onboardingDraft] ecriture locale en echec', error);
      }
      notify(next);
      return next;
    });
  writeQueues.set(key, write);
  void write
    .finally(() => {
      if (writeQueues.get(key) === write) writeQueues.delete(key);
    })
    .catch(() => {});
  return write;
}

/** A la creation du compte : ouvre le brouillon et pose le drapeau de reprise. */
export async function startOnboardingDraft(): Promise<OnboardingDraft> {
  const draft = await loadOnboardingDraft();
  const userId = await currentUserId();
  if (userId) {
    await AsyncStorage.setItem(ONBOARDING_IN_PROGRESS_KEY, userId).catch(() => {});
  }
  return draft;
}

/** Vrai si le compte connecte a un onboarding commence et jamais termine. */
export async function isOnboardingInProgress(): Promise<boolean> {
  const [flag, userId] = await Promise.all([
    AsyncStorage.getItem(ONBOARDING_IN_PROGRESS_KEY).catch(() => null),
    currentUserId(),
  ]);
  return !!flag && !!userId && flag === userId;
}

/** Retient le dernier ecran affiche. Appele par useOnboardingStep (lib/onboardingTracking.ts). */
export async function rememberOnboardingStep(step: string): Promise<void> {
  try {
    await updateOnboardingDraft({ lastStep: step });
  } catch {
    // La reprise est un confort : ne jamais bloquer un ecran pour elle.
  }
}

/**
 * Route ou reprendre un onboarding interrompu, ou null. A brancher dans
 * app/index.tsx AVANT la ligne qui pose `onboarding_completed`.
 */
export async function getOnboardingResumeRoute(): Promise<string | null> {
  if (!(await isOnboardingInProgress())) return null;
  const draft = await loadOnboardingDraft();
  if (!draft.lastStep || !/^[a-z-]+$/.test(draft.lastStep)) return null;
  return `/(onboarding-new)/${draft.lastStep}`;
}

/** Fin de l'onboarding : retire le brouillon et le drapeau de reprise. */
export async function clearOnboardingDraft(): Promise<void> {
  const key = await storageKey();
  await writeQueues.get(key)?.catch(() => {});
  memory.delete(key);
  await AsyncStorage.multiRemove([key, ONBOARDING_IN_PROGRESS_KEY]).catch(() => {});
}

/**
 * Reponses du questionnaire au format de `answers` (User.onboardingAnswers) :
 * le stockage des ecrans existants, plus ce que le brouillon a recueilli.
 * C'est aussi la source des phrases qui « ressortent » sur l'ecran du planning
 * et l'ecran avant le paywall.
 */
export async function getOnboardingAnswers(draft?: OnboardingDraft): Promise<Record<string, unknown>> {
  const [responses, current] = await Promise.all([
    readOnboardingResponses(),
    draft ? Promise.resolve(draft) : loadOnboardingDraft(),
  ]);
  return pickAnswers(responses as Record<string, unknown>, {
    triedBefore: current.triedBefore,
    track: current.track,
    calendarChoice: current.calendarChoice,
  });
}

/** Corps pret a envoyer a POST /api/onboarding/plan. */
export async function buildOnboardingPlanRequest(): Promise<OnboardingPlanRequest> {
  const draft = await loadOnboardingDraft();
  const answers = await getOnboardingAnswers(draft);
  return buildPlanRequest(draft, answers);
}

/** Le brouillon dans un composant, tenu a jour quand un autre ecran l'ecrit. */
export function useOnboardingDraft(): {
  draft: OnboardingDraft | null;
  ready: boolean;
  update: typeof updateOnboardingDraft;
} {
  const [draft, setDraft] = useState<OnboardingDraft | null>(null);

  useEffect(() => {
    let alive = true;
    loadOnboardingDraft()
      .then((loaded) => {
        if (alive) setDraft(loaded);
      })
      .catch(() => {});
    const listener = (next: OnboardingDraft) => {
      if (alive) setDraft(next);
    };
    listeners.add(listener);
    return () => {
      alive = false;
      listeners.delete(listener);
    };
  }, []);

  const update = useCallback(updateOnboardingDraft, []);
  return { draft, ready: draft !== null, update };
}
