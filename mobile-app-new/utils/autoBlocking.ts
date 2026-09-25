import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DeviceActivity from 'react-native-device-activity';
import {
  BLOCKED_APPS_SELECTION_ID,
  AUTO_BLOCKS_KEY,
  AUTO_BLOCK_PREFIX,
  hasBlockedAppsConfigured,
  isAppBlockingSupported,
  prepareShield,
  resolveAuthorizationStatus,
  toDateComponents,
  type ScheduledAutoBlock,
} from '@/utils/appBlocking';

/**
 * Blocage automatique a l'heure des blocs planifies.
 *
 * Meme mecanisme que le filet de securite de appBlocking.ts : on programme dans
 * l'extension DeviceActivity une action `blockSelection` au debut de
 * l'intervalle et `resetBlocks` a la fin. L'extension les execute APP FERMEE,
 * c'est tout l'interet : l'etudiant n'a rien a lancer.
 *
 * Regles :
 *  - option desactivee par defaut, stockee par appareil (le blocage est une
 *    affaire d'appareil, pas de compte) ;
 *  - seulement les blocs des 24 prochaines heures, 8 au plus : iOS plafonne le
 *    nombre d'activites surveillees en meme temps (erreur excessiveActivities),
 *    on reprogramme a chaque ouverture de l'app ;
 *  - jamais un bloc de moins de 16 min (DeviceActivity refuse sous 15 min,
 *    voir MIN_MONITORING_MINUTES dans appBlocking.ts) ;
 *  - jamais un bloc deja commence : on ne bloque pas au milieu d'un creneau ;
 *  - on ne touche JAMAIS une activite en cours : l'arreter perdrait le
 *    `resetBlocks` de fin et laisserait le bouclier coince ;
 *  - un bloc qui chevauche une session manuelle en cours n'est pas programme,
 *    sinon sa fin leverait le bouclier de la session manuelle.
 *
 * La notification "bloc demarre" est envoyee PAR L'EXTENSION, au moment ou elle
 * pose le bouclier. Une notification programmee a l'avance serait arrivee meme
 * si le blocage avait echoue, c'est exactement le defaut du 6 aout (un blocage
 * qui echoue en silence pendant que l'utilisateur croit ses apps bloquees).
 */

const KEY_ENABLED = 'auto_block_enabled_v1';
const WINDOW_MS = 24 * 60 * 60 * 1000;
const MAX_SCHEDULED = 8;
const MIN_BLOCK_MINUTES = 16;
const START_MARGIN_MS = 60 * 1000;
const KEY_LAST_REPORT = 'auto_block_last_report_v1';

export interface AutoBlockReport {
  at: number;
  status: AutoBlockStatus;
  candidates: number;
  scheduled: number;
  failed: number;
  error: string | null;
}

export async function getLastAutoBlockReport(): Promise<AutoBlockReport | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY_LAST_REPORT);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function saveReport(report: AutoBlockReport) {
  await AsyncStorage.setItem(KEY_LAST_REPORT, JSON.stringify(report)).catch(() => {});
}

export type AutoBlockStatus =
  | 'off'
  | 'active'
  | 'unsupported'
  | 'not_premium'
  | 'not_authorized'
  | 'no_selection'
  | 'error';

export interface AutoBlockInput {
  taskId: string;
  start: string;
  end: string;
  minutes: number;
  subjectName: string | null;
}

export interface AutoBlockCopy {
  startTitle: (subject: string) => string;
  startBody: (endTime: string) => string;
}

const hhmm = (ms: number) => {
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

export async function isAutoBlockEnabled(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(KEY_ENABLED)) === '1';
  } catch {
    return false;
  }
}

export async function setAutoBlockEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(KEY_ENABLED, enabled ? '1' : '0');
  if (!enabled) await cancelAutoBlocks();
}

async function readScheduled(): Promise<ScheduledAutoBlock[]> {
  try {
    const raw = await AsyncStorage.getItem(AUTO_BLOCKS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function stopActivity(name: string) {
  try {
    DeviceActivity.stopMonitoring([name]);
    DeviceActivity.cleanUpAfterActivity(name);
  } catch (error) {
    console.error('[autoBlocking] arret de', name, error);
  }
}

/**
 * Retire les blocages programmes a venir. Les blocages en cours sont gardes,
 * pour que leur fin leve bien le bouclier.
 */
export async function cancelAutoBlocks(): Promise<void> {
  if (Platform.OS !== 'ios' || !isAppBlockingSupported()) return;
  const now = Date.now();
  const scheduled = await readScheduled();
  const keep = scheduled.filter((b) => b.start <= now && now < b.end);
  for (const b of scheduled) {
    if (!keep.includes(b)) stopActivity(b.name);
  }
  await AsyncStorage.setItem(AUTO_BLOCKS_KEY, JSON.stringify(keep)).catch(() => {});
}

export async function getScheduledAutoBlocks(): Promise<ScheduledAutoBlock[]> {
  return readScheduled();
}

/**
 * Programme le blocage des blocs a venir. A appeler a chaque synchronisation
 * du planning : ce qui a change est reprogramme, le reste n'est pas touche.
 */
export async function scheduleAutoBlocks(
  blocks: AutoBlockInput[],
  copy: AutoBlockCopy,
  context: { premium: boolean | null; manualSessionUntil: number | null }
): Promise<{ status: AutoBlockStatus; scheduled: number; candidates?: number; failed?: number; error?: string | null }> {
  if (Platform.OS !== 'ios' || !isAppBlockingSupported()) return { status: 'unsupported', scheduled: 0 };
  if (!(await isAutoBlockEnabled())) {
    await cancelAutoBlocks();
    return { status: 'off', scheduled: 0 };
  }
  if (context.premium === null) {
    // Statut premium inconnu (reseau) : on ne touche a rien. Annuler ici
    // effacait des blocages valides sur un simple echec de requete.
    const kept = (await readScheduled()).filter((b) => b.end > Date.now()).length;
    await saveReport({ at: Date.now(), status: 'error', candidates: 0, scheduled: kept, failed: 0, error: 'premium_unknown' });
    return { status: 'error', scheduled: kept, error: 'premium_unknown' };
  }
  if (!context.premium) {
    await cancelAutoBlocks();
    return { status: 'not_premium', scheduled: 0 };
  }
  // Jamais la lecture instantanee ici : au demarrage a froid elle repond
  // `notDetermined` a tort, et annuler sur cette reponse effacait tous les
  // blocages a chaque ouverture de l'app (25 septembre, 1.4 (19)).
  if ((await resolveAuthorizationStatus()) !== 'approved') {
    await cancelAutoBlocks();
    return { status: 'not_authorized', scheduled: 0 };
  }
  if (!hasBlockedAppsConfigured()) {
    await cancelAutoBlocks();
    return { status: 'no_selection', scheduled: 0 };
  }

  try {
    const now = Date.now();
    const desired: ScheduledAutoBlock[] = blocks
      .map((b) => ({
        name: `${AUTO_BLOCK_PREFIX}${b.taskId}`,
        taskId: b.taskId,
        start: new Date(b.start).getTime(),
        end: new Date(b.end).getTime(),
        subjectName: b.subjectName,
      }))
      .filter((b) => b.start > now + START_MARGIN_MS && b.start < now + WINDOW_MS)
      .filter((b) => b.end - b.start >= MIN_BLOCK_MINUTES * 60 * 1000)
      .filter((b) => !(context.manualSessionUntil && b.start < context.manualSessionUntil))
      .sort((a, b) => a.start - b.start)
      .slice(0, MAX_SCHEDULED)
      .map(({ subjectName, ...rest }) => ({ ...rest, subjectName: subjectName ?? '' }));

    const scheduled = await readScheduled();
    const inProgress = scheduled.filter((b) => b.start <= now && now < b.end);
    const same = (a: ScheduledAutoBlock, b: ScheduledAutoBlock) =>
      a.name === b.name && a.start === b.start && a.end === b.end;

    // Retirer ce qui n'est plus voulu (jamais un bloc en cours).
    for (const b of scheduled) {
      if (inProgress.includes(b)) continue;
      if (!desired.some((d) => same(d, b))) stopActivity(b.name);
    }

    // Le bouclier affiche par l'extension reprend la configuration posee ici.
    prepareShield();

    const kept = desired.filter((d) => scheduled.some((b) => same(d, b)));
    const toStart = desired.filter((d) => !kept.includes(d) && !inProgress.some((b) => b.name === d.name));
    const started: ScheduledAutoBlock[] = [];
    let failed = 0;
    let lastError: string | null = null;

    for (const b of toStart) {
      try {
        DeviceActivity.configureActions({
          activityName: b.name,
          callbackName: 'intervalDidStart',
          actions: [
            { type: 'blockSelection', familyActivitySelectionId: BLOCKED_APPS_SELECTION_ID },
            {
              type: 'sendNotification',
              payload: {
                title: copy.startTitle(b.subjectName),
                body: copy.startBody(hhmm(b.end)),
                sound: 'default',
              },
            },
          ],
        });
        DeviceActivity.configureActions({
          activityName: b.name,
          callbackName: 'intervalDidEnd',
          actions: [{ type: 'resetBlocks' }],
        });
        await DeviceActivity.startMonitoring(
          b.name,
          {
            intervalStart: toDateComponents(new Date(b.start)),
            intervalEnd: toDateComponents(new Date(b.end)),
            repeats: false,
          },
          []
        );
        started.push(b);
      } catch (error) {
        // Un bloc refuse par iOS (trop d'activites, intervalle invalide) ne doit
        // pas empecher les autres ; il est simplement absent de la liste.
        console.error('[autoBlocking] programmation refusee pour', b.name, error);
        failed++;
        lastError = error instanceof Error ? error.message : String(error);
        stopActivity(b.name);
      }
    }

    const next = [...inProgress, ...kept, ...started];
    await AsyncStorage.setItem(AUTO_BLOCKS_KEY, JSON.stringify(next));
    await saveReport({
      at: Date.now(),
      status: 'active',
      candidates: desired.length,
      scheduled: kept.length + started.length,
      failed,
      error: lastError,
    });
    return { status: 'active', scheduled: kept.length + started.length, candidates: desired.length, failed, error: lastError };
  } catch (error) {
    console.error('[autoBlocking] programmation impossible', error);
    const message = error instanceof Error ? error.message : String(error);
    await saveReport({ at: Date.now(), status: 'error', candidates: 0, scheduled: 0, failed: 0, error: message });
    return { status: 'error', scheduled: 0, candidates: 0, failed: 0, error: message };
  }
}
