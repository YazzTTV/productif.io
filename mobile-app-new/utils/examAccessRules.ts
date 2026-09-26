/**
 * Regles PURES du Mode Examen offert : aucun import d'execution, aucun appel
 * reseau, aucun module natif. Tout ce qui decide qui peut lancer une seance,
 * quand une annulation rend la seance et quel chapitre part en tete est ici,
 * pour etre teste sans telephone :
 *   npx tsx scripts/test-exam-access-rules.ts   (depuis la racine du depot)
 *
 * Les ecrans et `utils/premium.ts` lisent le serveur et StoreKit, puis passent
 * le resultat a ces fonctions.
 */
import type { TaskForExam } from '@/utils/taskSelection';

/**
 * Seuil d'annulation qui rend une seance offerte, en secondes.
 *
 * Copie de la regle serveur, pour l'AFFICHAGE seulement (quand montrer le
 * bouton d'annulation, quoi ecrire). C'est `POST /api/exam/cancel` qui decide
 * du remboursement : si la regle change cote serveur, l'app ne rembourse ni
 * plus ni moins, seul le texte retarde.
 */
export const FREE_SESSION_CANCEL_GRACE_SECONDS = 120;

export interface ExamAccess {
  /**
   * Premium, lu sur le serveur, ou en repli sur le statut d'abonnement que
   * Superwall tient de StoreKit.
   */
  premium: boolean;
  /**
   * `store` quand seul StoreKit le dit : achat pas encore ecrit par le webhook,
   * ou restauration, qui ne produit aucun webhook. Le serveur traite alors ce
   * compte en gratuit (blocage automatique, `/api/exam/start`).
   */
  premiumSource: 'server' | 'store' | null;
  /**
   * Seances offertes restantes. null pour un premium, et null si le serveur ne
   * renvoie pas le champ (serveur anterieur a la 1.5) : on ne suppose alors
   * AUCUNE seance, ce qui redonne le comportement d'avant.
   */
  freeRemaining: number | null;
  /** Peut lancer une vraie seance Mode Examen maintenant. */
  canStart: boolean;
}

export const NO_EXAM_ACCESS: ExamAccess = {
  premium: false,
  premiumSource: null,
  freeRemaining: null,
  canStart: false,
};

/** La part de GET /api/auth/me qui compte pour le Mode Examen. */
export interface ExamAccessUser {
  isPremium?: boolean;
  planLimits?: { examModeEnabled?: boolean } | null;
  examFreeRemaining?: number | null;
}

/**
 * Premium selon le serveur. `planLimits.examModeEnabled` fait foi quand il est
 * la ; sinon (reponse degradee) on retombe sur `isPremium`.
 *
 * Rappel : `examModeEnabled` vaut faux pour TOUT gratuit, seances offertes
 * comprises, parce que le blocage automatique le lit pour decider du premium.
 * Il ne dit donc jamais a lui seul si une seance peut etre lancee.
 */
export function isServerPremium(user: ExamAccessUser | null): boolean {
  if (!user) return false;
  if (user.planLimits) return user.planLimits.examModeEnabled === true;
  return user.isPremium === true;
}

/**
 * Decision d'acces, fail-closed.
 *
 * - Sans jeton, personne n'est connecte : aucun acces, meme si l'identifiant
 *   Apple de l'iPhone porte un abonnement.
 * - Premium serveur, puis abonnement StoreKit : acces illimite. StoreKit est
 *   accepte meme quand /auth/me a echoue (reseau HS), c'est une preuve d'achat
 *   et non une supposition.
 * - Sinon, seances offertes : seulement si le serveur a renvoye un nombre.
 */
export function decideExamAccess(input: {
  hasToken: boolean;
  user: ExamAccessUser | null;
  storeActive: boolean;
}): ExamAccess {
  const { hasToken, user, storeActive } = input;
  if (!hasToken) return NO_EXAM_ACCESS;
  if (isServerPremium(user)) {
    return { premium: true, premiumSource: 'server', freeRemaining: null, canStart: true };
  }
  if (storeActive) {
    return { premium: true, premiumSource: 'store', freeRemaining: null, canStart: true };
  }
  if (!user) return NO_EXAM_ACCESS;
  const raw = user.examFreeRemaining;
  const freeRemaining =
    typeof raw === 'number' && Number.isFinite(raw) ? Math.max(0, Math.floor(raw)) : null;
  return {
    premium: false,
    premiumSource: null,
    freeRemaining,
    canStart: (freeRemaining ?? 0) > 0,
  };
}

/** Secondes ecoulees depuis le lancement, pauses comprises (horloge reelle). */
export function wallClockElapsedSeconds(startedAt: number, now: number = Date.now()): number {
  return Math.max(0, Math.floor((now - startedAt) / 1000));
}

/** Secondes restantes dans la fenetre d'annulation d'une seance offerte. */
export function freeCancelSecondsLeft(
  session: { freeSession?: boolean; startedAt: number },
  now: number = Date.now(),
): number {
  if (!session.freeSession) return 0;
  return Math.max(0, FREE_SESSION_CANCEL_GRACE_SECONDS - wallClockElapsedSeconds(session.startedAt, now));
}

/**
 * Peut-on quitter la session maintenant ?
 *
 * Le hard mode n'a pas de sortie, avec deux exceptions : toutes les taches sont
 * faites (la sortie normale d'une session reussie), et la fenetre d'annulation
 * d'une seance offerte, qui ne sert qu'a rattraper un lancement par erreur.
 */
export function canLeaveExamSession(
  session: { hardMode: boolean; freeSession?: boolean; startedAt: number },
  options: { allTasksDone: boolean; now?: number },
): boolean {
  if (options.allTasksDone || !session.hardMode) return true;
  return freeCancelSecondsLeft(session, options.now) > 0;
}

/** Duree d'une seance, bornee comme l'ecran de reglage ; null si inexploitable. */
export function clampExamDuration(minutes: number, min: number, max: number): number | null {
  if (!Number.isFinite(minutes) || minutes <= 0) return null;
  return Math.min(max, Math.max(min, Math.round(minutes)));
}

/** Parametres poses par la carte du planning quand on touche un bloc. */
export type PlannedBlockParams = {
  taskId?: string;
  title?: string;
  subjectId?: string;
  subjectName?: string;
  minutes?: string;
  fromPlan?: string;
};

/**
 * Met le chapitre touche dans le planning en tete de seance.
 *
 * `selectExamTasks` ne rend que 4 taches : un bloc plus lointain que les 4
 * premiers du planning n'y figure pas. On le reconstruit alors depuis les
 * parametres du bloc, sans coefficient (inconnu du planning, 0 = a ne pas
 * afficher), plutot que de lancer la seance sur un autre chapitre que celui que
 * l'etudiant a touche.
 */
export function withPlannedTaskFirst(
  primary: TaskForExam | null,
  next: TaskForExam[],
  planned: PlannedBlockParams,
): { primary: TaskForExam | null; next: TaskForExam[] } {
  if (!planned.taskId) return { primary, next };
  const all = [primary, ...next].filter(Boolean) as TaskForExam[];
  const chosen: TaskForExam = all.find((task) => task.id === planned.taskId) ?? {
    id: planned.taskId,
    title: planned.title ?? '',
    subjectId: planned.subjectId ?? '',
    subjectName: planned.subjectName ?? '',
    subjectCoefficient: 0,
    estimatedTime: Number(planned.minutes) || 30,
    priority: 'medium',
    completed: false,
    priorityScore: 0,
  };
  return { primary: chosen, next: all.filter((task) => task.id !== chosen.id).slice(0, 3) };
}
