import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Persistance d'une session focus en cours.
 *
 * L'état de la session ne vivait que dans le state React de l'écran focus, donc
 * il disparaissait dès que l'app était tuée, par l'utilisateur ou par iOS. Tant
 * que la session n'était qu'un minuteur, la perte était bénigne. Depuis que le
 * bouclier survit à la mort de l'app en vivant dans l'extension, elle ne l'est
 * plus : l'utilisateur revient avec ses applications bloquées et aucune session
 * à l'écran.
 */

const FOCUS_SESSION_KEY = '@productif_focus_session';

/** Au-delà, on considère que la session a été abandonnée. */
const MAX_OVERRUN_MS = 12 * 60 * 60 * 1000;

export interface PersistedFocusSession {
  /** Identifiant de la session deep work côté serveur, si elle a été créée. */
  sessionId: string | null;
  startedAt: number;
  durationMinutes: number;
  taskIndex: number;
  /**
   * Identifiant de la Live Activity associée. Persisté parce que iOS la
   * maintient affichée même après la mort de l'app : sans cet identifiant, on
   * ne pourrait plus l'arrêter et l'utilisateur garderait un compte à rebours
   * fantôme dans sa Dynamic Island.
   */
  liveActivityId?: string | null;
}

export async function saveFocusSession(session: PersistedFocusSession): Promise<void> {
  try {
    await AsyncStorage.setItem(FOCUS_SESSION_KEY, JSON.stringify(session));
  } catch (error) {
    console.error('[focusSession] Sauvegarde impossible:', error);
  }
}

export async function clearFocusSession(): Promise<void> {
  try {
    await AsyncStorage.removeItem(FOCUS_SESSION_KEY);
  } catch (error) {
    console.error('[focusSession] Effacement impossible:', error);
  }
}

/**
 * Session restaurable, avec le temps restant recalculé, ou null.
 *
 * Le temps restant se dérive de l'horloge et non d'un compteur sauvegardé :
 * l'app peut être restée fermée longtemps, un compteur figé donnerait une
 * session qui reprend là où elle s'était arrêtée alors que le temps réel, lui,
 * s'est écoulé.
 */
export async function getRestorableFocusSession(): Promise<
  (PersistedFocusSession & { remainingSeconds: number }) | null
> {
  try {
    const raw = await AsyncStorage.getItem(FOCUS_SESSION_KEY);
    if (!raw) return null;

    const session: PersistedFocusSession = JSON.parse(raw);
    if (!session?.startedAt || !session?.durationMinutes) {
      await clearFocusSession();
      return null;
    }

    const elapsedMs = Date.now() - session.startedAt;
    // Horloge incohérente : on ne fait pas confiance à la trace.
    if (elapsedMs < 0 || elapsedMs > MAX_OVERRUN_MS) {
      await clearFocusSession();
      return null;
    }

    const remainingSeconds = Math.floor(
      session.durationMinutes * 60 - elapsedMs / 1000
    );
    if (remainingSeconds <= 0) {
      await clearFocusSession();
      return null;
    }

    return { ...session, remainingSeconds };
  } catch (error) {
    console.error('[focusSession] Lecture impossible:', error);
    return null;
  }
}
