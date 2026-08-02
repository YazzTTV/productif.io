import { Platform } from 'react-native';
import * as LiveActivity from 'expo-live-activity';

/**
 * Compte à rebours de session visible hors de l'app.
 *
 * Sur iOS, aucune application ne peut dessiner par-dessus une autre : les
 * overlays flottants sont une capacité Android. L'équivalent système est la
 * Live Activity, affichée dans la Dynamic Island et sur l'écran verrouillé.
 *
 * Le compte à rebours est rendu par iOS à partir d'une date de fin : l'app n'a
 * rien à rafraîchir en arrière-plan, et l'affichage reste juste même app tuée.
 * C'est aussi ce qui le rend compatible avec le blocage, dont le bouclier
 * survit à la mort de l'app.
 *
 * Nécessite iOS 16.2 et une cible widget dédiée. Sur les versions antérieures
 * et sur Android, tout est no-op silencieux.
 */

const BRAND_GREEN = '#16A34A';

export function isLiveActivitySupported(): boolean {
  return Platform.OS === 'ios';
}

function buildState(taskTitle: string | undefined, endsAt: number) {
  return {
    title: 'Bloc de révision',
    // Le titre de la tâche donne le contexte au coup d'oeil, mais il peut être
    // absent : la session peut démarrer sans tâche sélectionnée.
    subtitle: taskTitle?.trim() || 'Concentration en cours',
    progressBar: { date: endsAt },
  };
}

/**
 * Démarre le compte à rebours. Retourne l'identifiant à conserver pour pouvoir
 * l'arrêter, y compris après un redémarrage de l'app.
 */
export function startFocusLiveActivity(
  endsAt: number,
  taskTitle?: string
): string | null {
  if (!isLiveActivitySupported()) return null;

  try {
    const id = LiveActivity.startActivity(buildState(taskTitle, endsAt), {
      backgroundColor: '#0A0A0A',
      titleColor: '#FFFFFF',
      subtitleColor: '#FFFFFFB3',
      progressViewTint: BRAND_GREEN,
      progressViewLabelColor: '#FFFFFF',
      timerType: 'digital',
    });
    return typeof id === 'string' ? id : null;
  } catch (error) {
    // Une Live Activity qui échoue ne doit jamais empêcher une session de
    // démarrer : c'est un affichage, pas une fonctionnalité.
    console.error('[liveActivity] Démarrage impossible:', error);
    return null;
  }
}

export function updateFocusLiveActivity(
  id: string,
  endsAt: number,
  taskTitle?: string
): void {
  if (!isLiveActivitySupported()) return;
  try {
    LiveActivity.updateActivity(id, buildState(taskTitle, endsAt));
  } catch (error) {
    console.error('[liveActivity] Mise à jour impossible:', error);
  }
}

/** Arrête le compte à rebours. Idempotent et sans effet si l'id est absent. */
export function stopFocusLiveActivity(id: string | null | undefined): void {
  if (!isLiveActivitySupported() || !id) return;
  try {
    LiveActivity.stopActivity(id, {
      title: 'Bloc terminé',
      subtitle: 'Tes applications sont débloquées',
      progressBar: { date: Date.now() },
    });
  } catch (error) {
    console.error('[liveActivity] Arrêt impossible:', error);
  }
}
