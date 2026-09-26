import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { router } from 'expo-router';
import { useLanguage } from '@/contexts/LanguageContext';
import { useOnboardingDraft } from '@/lib/onboardingDraft';
import { trackStepCompleted, useOnboardingStep } from '@/lib/onboardingTracking';
import { TRIED_BEFORE_OPTIONS, type TriedBeforeOption } from '@/lib/onboardingLogic';
import { OnboardingScreen, OptionRow, PrimaryButton, onboardingText } from '@/components/onboarding/OnboardingUI';

/**
 * Derniere question du questionnaire (decision du 25 septembre). Elle prepare
 * l'argument central du produit : ce que l'etudiant a deja essaye se contourne
 * en un tap, le blocage de Productif non. D'ou la phrase sur « Ignorer la
 * limite », le bouton que le Temps d'ecran d'iOS affiche et que notre ecran de
 * blocage n'a pas.
 */

const OPTION_LABELS: Record<TriedBeforeOption, { key: string; fallback: string }> = {
  screen_time: { key: 'onbTriedScreenTime', fallback: "Le Temps d'écran de l'iPhone" },
  airplane_mode: { key: 'onbTriedAirplane', fallback: 'Le mode avion' },
  other_room: { key: 'onbTriedOtherRoom', fallback: 'Le téléphone dans une autre pièce' },
  nothing: { key: 'onbTriedNothing', fallback: "Rien pour l'instant" },
};

export default function TriedBeforeScreen() {
  const { t } = useLanguage();
  const { draft, update } = useOnboardingDraft();
  const [selected, setSelected] = useState<TriedBeforeOption[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useOnboardingStep('tried-before');

  // Retour arriere ou app relancee : on remet ce qui avait ete coche.
  useEffect(() => {
    if (!draft || hydrated) return;
    if (draft.triedBefore) setSelected(draft.triedBefore);
    setHydrated(true);
  }, [draft, hydrated]);

  const toggle = (option: TriedBeforeOption) => {
    setSelected((current) => {
      // « Rien » exclut le reste, et inversement : les deux ensemble ne veulent rien dire.
      if (option === 'nothing') return current.includes('nothing') ? [] : ['nothing'];
      const withoutNothing = current.filter((o) => o !== 'nothing');
      return withoutNothing.includes(option)
        ? withoutNothing.filter((o) => o !== option)
        : [...withoutNothing, option];
    });
  };

  const insight = (() => {
    if (selected.length === 0) return null;
    if (selected.includes('screen_time')) {
      return t(
        'onbTriedInsightScreenTime',
        undefined,
        "Le Temps d'écran se lève en un tap avec « Ignorer la limite ». Sur Productif, ce bouton n'existe pas."
      );
    }
    if (selected.includes('nothing')) {
      return t(
        'onbTriedInsightNothing',
        undefined,
        "Normal : presque tout se contourne en un tap. Le Temps d'écran se lève avec « Ignorer la limite ». Sur Productif, ce bouton n'existe pas."
      );
    }
    return t(
      'onbTriedInsightOther',
      undefined,
      "Le mode avion se coupe en deux secondes, et le téléphone finit toujours par revenir. Le Temps d'écran, lui, se lève avec « Ignorer la limite ». Sur Productif, ce bouton n'existe pas."
    );
  })();

  const handleContinue = async () => {
    if (selected.length === 0) return;
    await update({ triedBefore: selected });
    trackStepCompleted('tried-before', { choices: selected.join(',') });
    router.push('/(onboarding-new)/exams');
  };

  return (
    <OnboardingScreen
      centered
      footer={
        <PrimaryButton
          label={t('next') || 'Suivant'}
          onPress={handleContinue}
          disabled={selected.length === 0}
        />
      }
    >
      <Animated.View entering={FadeIn.delay(100).duration(400)}>
        <Text style={onboardingText.title}>
          {t('onbTriedTitle', undefined, 'Tu as déjà essayé quoi pour lâcher ton téléphone ?')}
        </Text>
        <Text style={onboardingText.subtitle}>
          {t('onbSeveralAnswers', undefined, 'Plusieurs réponses possibles')}
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.options}>
        {TRIED_BEFORE_OPTIONS.map((option) => (
          <OptionRow
            key={option}
            multi
            label={t(OPTION_LABELS[option].key, undefined, OPTION_LABELS[option].fallback)}
            selected={selected.includes(option)}
            onPress={() => toggle(option)}
          />
        ))}
      </Animated.View>

      {insight ? (
        <Animated.View entering={FadeInDown.duration(300)} style={styles.insight}>
          <Text style={styles.insightText}>{insight}</Text>
        </Animated.View>
      ) : null}
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  options: {
    gap: 12,
  },
  insight: {
    marginTop: 24,
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(22, 163, 74, 0.08)',
  },
  insightText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#0F5132',
  },
});
