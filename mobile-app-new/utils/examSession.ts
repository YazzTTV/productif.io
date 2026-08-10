import AsyncStorage from '@react-native-async-storage/async-storage';
import { stopBlocking } from '@/utils/appBlocking';
import { stopSessionLiveActivity } from '@/utils/liveActivity';

export interface ExamSession {
  sessionId: string;
  startedAt: number;
  plannedDuration: number; // in minutes
  hardMode: boolean;
  breaks: boolean;
  currentTaskIndex: number;
  plannedTaskIds: string[];
  completedTaskIds: string[];
  pausedAt?: number;
  totalPausedTime?: number; // in seconds
  /**
   * Session de démonstration ouverte à un utilisateur gratuit depuis le paywall.
   * Explicite, au lieu de déduire le type depuis le préfixe du sessionId.
   */
  isDemo?: boolean;
  /**
   * Date de création, jamais réinitialisée. `startedAt` est remis à zéro à
   * chaque entrée dans une démo (pour caler le timer), donc il ne peut pas
   * servir de base à une expiration : sans ce champ, une démo abandonnée
   * survivait indéfiniment et servait de jeton d'accès permanent.
   */
  createdAt?: number;
  /**
   * Identifiant de la Live Activity du compte à rebours. Persisté avec la
   * session pour la même raison que côté focus : sans lui, une app tuée en
   * cours de session laisserait un compte à rebours fantôme dans la Dynamic
   * Island, sans plus aucun moyen de l'arrêter.
   */
  liveActivityId?: string | null;
  /**
   * La session a été démarrée AVEC blocage demandé.
   *
   * Nécessaire pour distinguer deux situations que l'écran de session
   * confondait : « tu n'as jamais demandé le blocage » et « tu l'as demandé et
   * il est tombé ». Le second cas arrive dès que l'autorisation Temps d'écran est
   * retirée depuis les Réglages iOS, ce qu'iOS applique immédiatement et qu'aucune
   * app ne peut empêcher. Sans ce champ, la session continuait d'afficher son
   * compte à rebours comme si les applications étaient bloquées.
   */
  blockApps?: boolean;
}

const SESSION_KEY = 'exam_session_active';

/** Une démo dure 5 min. Au-delà de cette marge, la session est périmée. */
const DEMO_MAX_LIFETIME_MS = 15 * 60 * 1000;
/** Marge pour les pauses d'une vraie session, au-delà elle est périmée. */
const SESSION_SLACK_MS = 24 * 60 * 60 * 1000;

export function isDemoSession(session: ExamSession): boolean {
  // Le préfixe reste géré pour les sessions déjà persistées avant l'ajout du flag.
  return session.isDemo === true || session.sessionId.startsWith('exam_demo_');
}

export function isExamSessionExpired(session: ExamSession): boolean {
  const createdAt = session.createdAt ?? session.startedAt;
  if (!createdAt) return true;
  const age = Date.now() - createdAt;
  if (age < 0) return true; // horloge incohérente, on ne fait pas confiance
  const budget = isDemoSession(session)
    ? DEMO_MAX_LIFETIME_MS
    : session.plannedDuration * 60 * 1000 + SESSION_SLACK_MS;
  return age > budget;
}

export async function saveExamSession(session: ExamSession): Promise<void> {
  try {
    // createdAt est posé une seule fois et jamais écrasé par les mises à jour.
    const toPersist: ExamSession = {
      ...session,
      createdAt: session.createdAt ?? Date.now(),
    };
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(toPersist));
  } catch (error) {
    console.error('Error saving exam session:', error);
  }
}

/**
 * Retourne la session active, ou null. Une session périmée est effacée au
 * passage : plusieurs appelants (paywall, limites focus, écran de session)
 * traitent la présence d'une session comme un droit d'accès, donc elle ne doit
 * jamais survivre à sa durée de vie.
 */
export async function getActiveExamSession(): Promise<ExamSession | null> {
  try {
    const data = await AsyncStorage.getItem(SESSION_KEY);
    if (!data) return null;
    const session: ExamSession = JSON.parse(data);
    if (!session || typeof session.sessionId !== 'string') {
      await clearExamSession();
      return null;
    }
    if (isExamSessionExpired(session)) {
      console.log('[ExamSession] Session périmée, suppression:', session.sessionId);
      await clearExamSession();
      return null;
    }
    return session;
  } catch (error) {
    console.error('Error getting exam session:', error);
    return null;
  }
}

/**
 * Une vraie session examen (non démo, non périmée) est en cours.
 *
 * C'est la seule condition qui autorise à relâcher les limites du plan gratuit,
 * pour ne pas couper une session premium en plein milieu. Une démo n'y donne
 * pas droit : elle dure 5 minutes et reste sous le plafond gratuit.
 */
export async function hasActiveRealExamSession(): Promise<boolean> {
  const session = await getActiveExamSession();
  return !!session && !isDemoSession(session);
}

/**
 * Point de sortie unique d'une session. Le bouclier est levé ici plutôt que
 * dans chaque écran : `clearExamSession` est appelé depuis cinq endroits
 * (fin normale, abandon, session périmée, accès refusé, démo terminée), et
 * oublier la levée dans un seul suffirait à laisser un utilisateur avec ses
 * apps bloquées.
 *
 * La levée est tentée avant l'effacement : si elle échoue, on efface quand
 * même, la réconciliation au premier plan rattrapera.
 */
export async function clearExamSession(): Promise<void> {
  // Lu directement depuis le stockage, et surtout PAS via getActiveExamSession :
  // celui-ci appelle clearExamSession sur une session périmée, ce qui partirait
  // en récursion infinie.
  let liveActivityId: string | null = null;
  try {
    const data = await AsyncStorage.getItem(SESSION_KEY);
    if (data) {
      const session: ExamSession = JSON.parse(data);
      liveActivityId = session?.liveActivityId ?? null;
    }
  } catch (error) {
    console.error('Error reading exam session before clearing:', error);
  }

  try {
    stopSessionLiveActivity('exam', liveActivityId);
  } catch (error) {
    console.error('Error stopping live activity:', error);
  }
  try {
    await stopBlocking('exam_session_cleared');
  } catch (error) {
    console.error('Error stopping app blocking:', error);
  }
  try {
    await AsyncStorage.removeItem(SESSION_KEY);
  } catch (error) {
    console.error('Error clearing exam session:', error);
  }
}

export function calculateTimeRemaining(session: ExamSession): number {
  const now = Date.now();
  const elapsed = (now - session.startedAt) / 1000; // in seconds
  const pausedTime = session.totalPausedTime || 0;
  const actualElapsed = elapsed - pausedTime;
  const remaining = (session.plannedDuration * 60) - actualElapsed;
  return Math.max(0, Math.floor(remaining));
}

