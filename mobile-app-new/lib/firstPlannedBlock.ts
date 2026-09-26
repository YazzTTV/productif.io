/**
 * `first_planned_block_started` : le premier passage du planning a la revision
 * reelle, une seule fois par compte sur cet appareil.
 *
 * Deux portes y menent depuis la carte du planning (StudyPlanCard) : le Mode
 * Examen quand le compte y a acces, Focus sinon (gratuit sans seance offerte).
 * Les deux appellent cette fonction au DEMARRAGE effectif de la seance, jamais
 * au tap sur le bloc : un tap suivi d'un retour arriere n'est pas une seance.
 * Avant, seul le Mode Examen l'envoyait, donc les gratuits a quota epuise, qui
 * sont justement ceux qu'on veut suivre, n'apparaissaient jamais.
 *
 * La cle AsyncStorage est posee AVANT l'envoi : un double tap sur « Demarrer »
 * ne doit pas compter deux « premiers » blocs.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '@/lib/api';
import { trackEvent } from '@/lib/analytics';
import { trackBackendProductEvent } from '@/lib/productEvents';

type Params = Record<string, string | number | boolean | null>;

export async function trackFirstPlannedBlockStarted(params: Params): Promise<void> {
  try {
    const user = await authService.checkAuth();
    const key = `first_planned_block_started:${user?.id ?? 'anonymous'}`;
    if (await AsyncStorage.getItem(key)) return;
    await AsyncStorage.setItem(key, String(Date.now()));
    void trackEvent('first_planned_block_started', params);
    void trackBackendProductEvent('first_planned_block_started', params);
  } catch (error) {
    console.warn('[ProductEvents] first_planned_block_started non envoyé', error);
  }
}
