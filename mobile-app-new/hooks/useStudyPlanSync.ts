import { useEffect, useMemo, useRef } from 'react';
import { AppState } from 'react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { syncStudyPlan, type StudyPlanCopy } from '@/lib/studyPlanSync';

/** Textes des rappels et des evenements, dans la langue de l'app. */
export function useStudyPlanCopy(): StudyPlanCopy {
  const { t } = useLanguage();
  return useMemo<StudyPlanCopy>(
    () => ({
      reminderTitle: (subject) =>
        subject ? t('studyReminderTitle', { subject }) : t('studyReminderTitleNoSubject'),
      reminderBody: (title, minutes) => t('studyReminderBody', { title, minutes }),
      recapTitle: t('studyRecapTitle'),
      recapBody: (count, time) =>
        count === 1 ? t('studyRecapBodyOne', { time }) : t('studyRecapBodyMany', { count, time }),
      eventTitle: (subject, title) => (subject ? t('studyEventTitle', { subject, title }) : title),
    }),
    [t]
  );
}

/**
 * Synchronise le planning au lancement et a chaque retour au premier plan :
 * creneaux Apple vers le serveur, blocs vers le calendrier "Productif", rappels
 * locaux. Meme motif que useBlockingReconciliation. Sans compte connecte, la
 * synchronisation s'arrete tout de suite (et retire d'eventuels rappels).
 */
export function useStudyPlanSync() {
  const copy = useStudyPlanCopy();
  const copyRef = useRef(copy);
  copyRef.current = copy;

  useEffect(() => {
    syncStudyPlan(copyRef.current).catch(() => {});
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') syncStudyPlan(copyRef.current).catch(() => {});
    });
    return () => subscription.remove();
  }, []);
}
