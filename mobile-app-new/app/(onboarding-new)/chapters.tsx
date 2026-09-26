import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useLanguage } from '@/contexts/LanguageContext';
import { useOnboardingDraft } from '@/lib/onboardingDraft';
import { trackStepCompleted, useOnboardingStep } from '@/lib/onboardingTracking';
import {
  DEFAULT_CHAPTER_COUNT,
  MAX_CHAPTER_COUNT,
  MIN_CHAPTER_COUNT,
  clampChapterCount,
  parseChapterList,
  type DraftChapters,
  type DraftSubject,
} from '@/lib/onboardingLogic';
import {
  Chip,
  ONBOARDING_GREEN,
  OnboardingScreen,
  OptionRow,
  PrimaryButton,
  SecondaryButton,
  onboardingText,
} from '@/components/onboarding/OnboardingUI';

/**
 * Ecran chapitres (spec 1.5, ecran 6), une matiere a la fois. Trois reponses
 * possibles, parce que la plupart des etudiants n'ont pas leur plan de cours
 * sous la main au moment de l'inscription :
 *   - coller la liste (plan de cours, sommaire du poly, liste Notes) ;
 *   - un nombre approximatif, le serveur cree N chapitres numerotes ;
 *   - « pas encore » : le serveur cree 6 seances generiques. Sans elles, une
 *     matiere sans chapitre ne produit AUCUN bloc (StudyPlanner.ts).
 * Chaque matiere est enregistree dans le brouillon des qu'on passe a la
 * suivante : une app tuee a la 4e matiere ne fait pas tout recommencer.
 */

type Mode = DraftChapters['mode'];

const QUICK_COUNTS = [5, 10, 15, 20, 30];

function modeOf(chapters: DraftChapters | null): Mode | null {
  return chapters ? chapters.mode : null;
}

export default function ChaptersScreen() {
  const { t } = useLanguage();
  const { draft, update } = useOnboardingDraft();
  const [subjects, setSubjects] = useState<DraftSubject[]>([]);
  const [index, setIndex] = useState(0);
  const [mode, setMode] = useState<Mode | null>(null);
  const [listText, setListText] = useState('');
  const [count, setCount] = useState(DEFAULT_CHAPTER_COUNT);
  const [hydrated, setHydrated] = useState(false);
  const [saving, setSaving] = useState(false);

  useOnboardingStep('chapters');

  useEffect(() => {
    if (!draft || hydrated) return;
    setHydrated(true);
    setSubjects(draft.subjects);
    // Reprise : on repart de la premiere matiere sans reponse.
    const firstOpen = draft.subjects.findIndex((s) => !s.chapters);
    setIndex(firstOpen === -1 ? 0 : firstOpen);
  }, [draft, hydrated]);

  const subject = subjects[index] ?? null;
  const isLast = index >= subjects.length - 1;

  // A chaque changement de matiere, le formulaire reprend sa reponse enregistree.
  useEffect(() => {
    if (!subject) return;
    const saved = subject.chapters;
    setMode(modeOf(saved));
    setListText(saved?.mode === 'list' ? saved.titles.join('\n') : '');
    setCount(saved?.mode === 'count' ? saved.count : DEFAULT_CHAPTER_COUNT);
    // subject.id seulement : relire l'objet a chaque frappe effacerait la saisie.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject?.id]);

  const parsedTitles = useMemo(() => parseChapterList(listText), [listText]);

  const answer: DraftChapters | null = (() => {
    if (mode === 'list') return parsedTitles.length > 0 ? { mode: 'list', titles: parsedTitles } : null;
    if (mode === 'count') return { mode: 'count', count: clampChapterCount(count) };
    if (mode === 'later') return { mode: 'later' };
    return null;
  })();

  // Pas de matiere (arrivee directe ou brouillon vide) : rien a demander ici.
  useEffect(() => {
    if (hydrated && subjects.length === 0) {
      // La vue est deja partie (useOnboardingStep) : sans sortie, ce passage
      // automatique se lirait comme un abandon sur cet ecran.
      trackStepCompleted('chapters', { subjects: 0, skipped: true });
      router.replace('/(onboarding-new)/courses');
    }
  }, [hydrated, subjects.length]);

  const goNext = async () => {
    if (!subject || !answer || saving) return;
    setSaving(true);
    try {
      const next = subjects.map((s) => (s.id === subject.id ? { ...s, chapters: answer } : s));
      setSubjects(next);
      // On reecrit la matiere dans le brouillon courant plutot que la liste
      // entiere : la liste locale a pu etre chargee avant une autre ecriture.
      await update((current) => ({
        subjects: current.subjects.map((s) => (s.id === subject.id ? { ...s, chapters: answer } : s)),
      }));
      if (!isLast) {
        setIndex(index + 1);
        return;
      }
      const summary = next.reduce(
        (acc, s) => {
          if (s.chapters?.mode === 'list') {
            acc.list += 1;
            acc.titles += s.chapters.titles.length;
          } else if (s.chapters?.mode === 'count') acc.count += 1;
          else acc.later += 1;
          return acc;
        },
        { list: 0, count: 0, later: 0, titles: 0 }
      );
      trackStepCompleted('chapters', { subjects: next.length, ...summary });
      router.push('/(onboarding-new)/courses');
    } finally {
      setSaving(false);
    }
  };

  if (!subject) {
    return <OnboardingScreen>{null}</OnboardingScreen>;
  }

  return (
    <OnboardingScreen
      footer={
        <>
          <PrimaryButton
            label={isLast ? t('continue') || 'Continuer' : t('onbChaptersNextSubject', undefined, 'Matière suivante')}
            onPress={goNext}
            disabled={!answer}
            loading={saving}
          />
          {index > 0 ? (
            <SecondaryButton
              label={t('onbChaptersPrevious', undefined, 'Matière précédente')}
              onPress={() => setIndex(index - 1)}
              disabled={saving}
            />
          ) : null}
        </>
      }
    >
      <Animated.View key={subject.id} entering={FadeIn.duration(300)}>
        {subjects.length > 1 ? (
          <Text style={styles.progress}>
            {t('onbChaptersProgress', { current: index + 1, total: subjects.length }, 'Matière {current} sur {total}')}
          </Text>
        ) : null}
        <Text style={onboardingText.title}>
          {t('onbChaptersTitle', { name: subject.name }, 'Les chapitres de {name}')}
        </Text>
        <Text style={onboardingText.subtitle}>
          {t(
            'onbChaptersSubtitle',
            undefined,
            'Chaque chapitre devient une séance de 30 min dans ton planning.'
          )}
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(150).duration(400)} style={styles.options}>
        <OptionRow
          icon="clipboard-outline"
          label={t('onbChaptersPaste', undefined, 'Coller la liste')}
          description={t('onbChaptersPasteHint', undefined, 'Depuis ton plan de cours ou le sommaire du poly')}
          selected={mode === 'list'}
          onPress={() => setMode('list')}
        />
        {mode === 'list' ? (
          <View style={styles.reveal}>
            <TextInput
              style={styles.textarea}
              value={listText}
              onChangeText={setListText}
              multiline
              autoFocus={listText.length === 0}
              placeholder={t(
                'onbChaptersPastePlaceholder',
                undefined,
                'Un chapitre par ligne\nIntroduction\nLes contrats\nLa responsabilité'
              )}
              placeholderTextColor="rgba(0, 0, 0, 0.35)"
              textAlignVertical="top"
            />
            <Text style={[onboardingText.help, styles.detected]}>
              {parsedTitles.length === 0
                ? t('onbChaptersNoneDetected', undefined, "Aucun chapitre détecté pour l'instant.")
                : parsedTitles.length === 1
                  ? t('onbChaptersDetectedOne', undefined, '1 chapitre détecté')
                  : t('onbChaptersDetected', { count: parsedTitles.length }, '{count} chapitres détectés')}
            </Text>
          </View>
        ) : null}

        <OptionRow
          icon="calculator-outline"
          label={t('onbChaptersCount', undefined, 'À peu près combien ?')}
          description={t('onbChaptersCountHint', undefined, 'Tu pourras renommer les chapitres plus tard')}
          selected={mode === 'count'}
          onPress={() => setMode('count')}
        />
        {mode === 'count' ? (
          <View style={styles.reveal}>
            <View style={styles.stepper}>
              <TouchableOpacity
                style={styles.stepperButton}
                onPress={() => setCount((c) => clampChapterCount(c - 1))}
                disabled={count <= MIN_CHAPTER_COUNT}
                accessibilityLabel={t('onbChaptersLess', undefined, 'Un de moins')}
              >
                <Ionicons name="remove" size={22} color="#000000" />
              </TouchableOpacity>
              <Text style={styles.stepperValue}>{count}</Text>
              <TouchableOpacity
                style={styles.stepperButton}
                onPress={() => setCount((c) => clampChapterCount(c + 1))}
                disabled={count >= MAX_CHAPTER_COUNT}
                accessibilityLabel={t('onbChaptersMore', undefined, 'Un de plus')}
              >
                <Ionicons name="add" size={22} color="#000000" />
              </TouchableOpacity>
            </View>
            <View style={styles.quickCounts}>
              {QUICK_COUNTS.map((value) => (
                <Chip key={value} label={String(value)} selected={count === value} onPress={() => setCount(value)} />
              ))}
            </View>
          </View>
        ) : null}

        <OptionRow
          icon="time-outline"
          label={t('onbChaptersLater', undefined, 'Pas encore')}
          description={t(
            'onbChaptersLaterHint',
            undefined,
            'On prévoit 6 séances de révision générales en attendant tes chapitres'
          )}
          selected={mode === 'later'}
          onPress={() => setMode('later')}
        />
      </Animated.View>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  progress: {
    fontSize: 13,
    fontWeight: '600',
    color: ONBOARDING_GREEN,
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  options: {
    gap: 12,
  },
  reveal: {
    marginTop: -4,
    marginBottom: 4,
  },
  textarea: {
    minHeight: 150,
    maxHeight: 260,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    fontSize: 15,
    lineHeight: 21,
    color: '#000000',
  },
  detected: {
    marginTop: 8,
    paddingLeft: 4,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    paddingVertical: 8,
  },
  stepperButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: {
    fontSize: 32,
    fontWeight: '600',
    color: '#000000',
    minWidth: 56,
    textAlign: 'center',
  },
  quickCounts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
});
