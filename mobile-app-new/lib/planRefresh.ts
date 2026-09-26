/**
 * Previent la carte du planning qu'un chapitre ou une matiere a change.
 *
 * La carte ne se rechargeait qu'au retour sur l'onglet : cocher un chapitre
 * depuis une feuille ou une modale ouverte PAR-DESSUS l'accueil ne relancait
 * rien, et il fallait recharger l'accueil a la main (test du 26 septembre sur
 * 1.4 (22)). Les services de lib/api.ts appellent notifyPlanChanged apres chaque
 * ecriture qui peut deplacer un bloc.
 */
type Listener = () => void;
const listeners = new Set<Listener>();

export function onPlanChanged(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function notifyPlanChanged() {
  for (const listener of listeners) {
    try {
      listener();
    } catch (error) {
      console.error('[planRefresh] abonne en echec', error);
    }
  }
}
