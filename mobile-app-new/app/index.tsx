import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { getAuthToken } from '@/lib/api';
import { getRestorableFocusSession } from '@/utils/focusSession';
import { getActiveExamSession } from '@/utils/examSession';
import { resolveOnboardingResumeRoute } from '@/lib/onboardingFlow';

export default function Entry() {
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [token, onboardingFlag] = await Promise.all([
          getAuthToken(),
          AsyncStorage.getItem('onboarding_completed'),
        ]);

        if (token) {
          // Une session focus encore en cours reprend la main sur le dashboard.
          // C'est indispensable depuis que le bouclier survit à la mort de
          // l'app : sans ça, l'utilisateur relance l'app, voit son écran
          // d'accueil habituel, et n'a aucun moyen de comprendre pourquoi ses
          // applications sont bloquées ni d'y mettre fin.
          // Même raison pour une session EXAMEN, et elle passe en premier :
          // depuis le 7 août c'est le Mode Examen qui pose le bouclier, donc
          // c'est cette session-là qu'il faut d'abord pouvoir terminer. Le test
          // sur device du 10 août l'a confirmé : tuer l'app pendant une session
          // examen renvoyait sur le dashboard, apps bloquées et compte à rebours
          // en cours, sans aucun chemin de retour vers l'écran de session.
          const runningExam = await getActiveExamSession();

          // Onboarding 1.5 commencé et jamais terminé (app tuée au milieu) : on
          // reprend au dernier écran, AVANT de poser `onboarding_completed`.
          // Avant, ce drapeau était posé dès qu'un jeton existait, donc un
          // étudiant qui quittait l'app pendant le questionnaire ne revoyait
          // jamais ni son planning ni le paywall (spec 1.5, cas limites). Le
          // drapeau `onboarding_in_progress`, posé à l'inscription et retiré en
          // fin de parcours, porte l'identifiant du compte : un autre compte
          // connecté sur ce téléphone n'est pas concerné. Une séance d'examen
          // en cours passe quand même devant : ses applis sont bloquées.
          if (!runningExam) {
            const resumeRoute = await resolveOnboardingResumeRoute();
            if (resumeRoute) {
              // Un `onboarding_completed` resté d'avant ferait renvoyer les
              // écrans du questionnaire sur les onglets par
              // (onboarding-new)/_layout.tsx. La fin du parcours le repose.
              await AsyncStorage.removeItem('onboarding_completed').catch(() => {});
              router.replace(resumeRoute as any);
              return;
            }
          }

          // Préserver la session : si token présent, on considère l'onboarding comme fait
          await AsyncStorage.setItem('onboarding_completed', 'true');

          if (runningExam) {
            router.replace({
              pathname: '/exam/session',
              params: { sessionId: runningExam.sessionId },
            });
            return;
          }

          const runningFocus = await getRestorableFocusSession();
          if (runningFocus) {
            router.replace('/focus');
            return;
          }

          router.replace('/(tabs)');
          return;
        }

        if (onboardingFlag === 'true') {
          router.replace('/(tabs)');
        } else {
          // Si pas de token et pas d'onboarding, rediriger vers la page de connexion
          router.replace('/(onboarding-new)/connection');
        }
      } catch {
        router.replace('/(onboarding-new)/connection');
      } finally {
        setBooting(false);
      }
    })();
  }, []);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" color="#10B981" />
    </View>
  );
} 