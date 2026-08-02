import { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { isAppBlockingSupported, reconcileBlockingState } from '@/utils/appBlocking';

/**
 * Deuxième filet de sécurité du blocage d'applications.
 *
 * Le premier vit dans l'extension DeviceActivity et lève le bouclier à la fin
 * de l'intervalle, même app tuée. Celui-ci tourne au lancement et à chaque
 * retour au premier plan, et rattrape ce que l'extension ne couvre pas : une
 * session terminée sans que la levée soit passée, une trace orpheline, ou un
 * bouclier survivant à une réinstallation.
 *
 * Monté à la racine et non dans l'écran de session : si l'utilisateur ne
 * rouvre jamais le Mode Examen, c'est justement le cas où le bouclier resterait
 * coincé le plus longtemps.
 */
export function useBlockingReconciliation() {
  useEffect(() => {
    if (!isAppBlockingSupported()) return;

    const reconcile = async () => {
      try {
        await reconcileBlockingState();
      } catch (error) {
        console.error('[useBlockingReconciliation] Echec:', error);
      }
    };

    reconcile();

    const subscription = AppState.addEventListener(
      'change',
      (state: AppStateStatus) => {
        if (state === 'active') reconcile();
      }
    );

    return () => {
      subscription.remove();
    };
  }, []);
}
