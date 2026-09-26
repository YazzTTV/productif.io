import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useLanguage } from '@/contexts/LanguageContext';
import { useOnboardingDraft } from '@/lib/onboardingDraft';
import { trackStepCompleted, useOnboardingStep } from '@/lib/onboardingTracking';
import {
  DEFAULT_SUBJECT_COEFFICIENT,
  MAX_SUBJECT_COEFFICIENT,
  MAX_SUBJECTS,
  MAX_SUBJECT_NAME,
  MIN_SUBJECT_COEFFICIENT,
  SUBJECT_SUGGESTIONS,
  normalizeSubjectName,
  subjectCoefficient,
  subjectKey,
  type DraftSubject,
} from '@/lib/onboardingLogic';
import {
  Chip,
  ONBOARDING_GREEN,
  OnboardingScreen,
  PrimaryButton,
  SecondaryButton,
  onboardingText,
} from '@/components/onboarding/OnboardingUI';

/**
 * Ecran matieres (spec 1.5, ecran 5). Pastilles proposees selon la filiere de
 * l'ecran examens, plus une saisie libre. L'interrupteur « grosse matiere »
 * donne le coefficient 5 cote serveur (2 sinon) : c'est lui qui fait passer
 * l'Anatomie avant la SHS dans le planning, pas l'ordre de saisie.
 */

let localIdCounter = 0;
const newLocalId = () => `s_${Date.now().toString(36)}_${(localIdCounter++).toString(36)}`;

export default function SubjectsScreen() {
  const { t } = useLanguage();
  const { draft, update } = useOnboardingDraft();
  const [subjects, setSubjects] = useState<DraftSubject[]>([]);
  const [input, setInput] = useState('');
  const [hydrated, setHydrated] = useState(false);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useOnboardingStep('subjects');

  useEffect(() => {
    if (!draft || hydrated) return;
    setSubjects(draft.subjects);
    setHydrated(true);
  }, [draft, hydrated]);

  const suggestions = useMemo(() => (draft?.track ? SUBJECT_SUGGESTIONS[draft.track] : []), [draft?.track]);
  const selectedKeys = useMemo(() => new Set(subjects.map((s) => subjectKey(s.name))), [subjects]);
  const full = subjects.length >= MAX_SUBJECTS;

  const addSubject = (rawName: string) => {
    const name = normalizeSubjectName(rawName);
    if (!name) return;
    setSubjects((current) => {
      if (current.length >= MAX_SUBJECTS) return current;
      if (current.some((s) => subjectKey(s.name) === subjectKey(name))) return current;
      return [...current, { id: newLocalId(), name, big: false, coefficient: DEFAULT_SUBJECT_COEFFICIENT, chapters: null }];
    });
  };

  const removeSubject = (key: string) => {
    setSubjects((current) => current.filter((s) => subjectKey(s.name) !== key));
  };

  const toggleSuggestion = (name: string) => {
    const key = subjectKey(name);
    if (selectedKeys.has(key)) removeSubject(key);
    else addSubject(name);
  };

  const submitInput = () => {
    addSubject(input);
    setInput('');
    // Le clavier reste ouvert : on saisit souvent plusieurs matieres a la suite.
    inputRef.current?.focus();
  };

  // Le coefficient remplace l'interrupteur « grosse matiere » (demande de Noah,
  // 26 septembre) : l'etudiant connait ses coefficients, le planificateur les
  // utilise tels quels pour repartir le temps.
  const changeCoefficient = (id: string, delta: number) => {
    setSubjects((current) =>
      current.map((s) => {
        if (s.id !== id) return s;
        const next = Math.min(MAX_SUBJECT_COEFFICIENT, Math.max(MIN_SUBJECT_COEFFICIENT, subjectCoefficient(s) + delta));
        return { ...s, coefficient: next, big: next >= 5 };
      })
    );
  };

  const finish = async (skip: boolean) => {
    if (saving) return;
    setSaving(true);
    try {
      // Une saisie tapee mais pas encore ajoutee compte : l'etudiant qui tape
      // « Anatomie » puis « Suivant » s'attend a la retrouver.
      let final = skip ? [] : subjects;
      const pending = normalizeSubjectName(input);
      if (!skip && pending && !final.some((s) => subjectKey(s.name) === subjectKey(pending)) && final.length < MAX_SUBJECTS) {
        final = [...final, { id: newLocalId(), name: pending, big: false, coefficient: DEFAULT_SUBJECT_COEFFICIENT, chapters: null }];
      }
      await update({ subjects: final });
      trackStepCompleted('subjects', {
        count: final.length,
        big_count: final.filter((s) => subjectCoefficient(s) >= 5).length,
        coefficients: final.map((s) => subjectCoefficient(s)).join(','),
        skipped: skip,
      });
      // Sans matiere, il n'y a aucun chapitre a demander.
      router.push(final.length > 0 ? '/(onboarding-new)/chapters' : '/(onboarding-new)/courses');
    } finally {
      setSaving(false);
    }
  };

  const canContinue = subjects.length > 0 || normalizeSubjectName(input).length > 0;

  return (
    <OnboardingScreen
      footer={
        <>
          <PrimaryButton
            label={t('next') || 'Suivant'}
            onPress={() => finish(false)}
            disabled={!canContinue}
            loading={saving}
          />
          <SecondaryButton
            label={t('onbSubjectsLater', undefined, 'Je les ajouterai plus tard')}
            onPress={() => finish(true)}
            disabled={saving}
          />
        </>
      }
    >
      <Animated.View entering={FadeIn.delay(100).duration(400)}>
        <Text style={onboardingText.title}>{t('onbSubjectsTitle', undefined, 'Tes matières de ce semestre')}</Text>
        <Text style={onboardingText.subtitle}>
          {t(
            'onbSubjectsSubtitle',
            undefined,
            'Touche celles que tu as, ajoute les autres, puis règle leur coefficient : les plus gros passent en priorité.'
          )}
        </Text>
      </Animated.View>

      {suggestions.length > 0 ? (
        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.section}>
          <View style={styles.chips}>
            {suggestions.map((name) => (
              <Chip
                key={name}
                label={name}
                selected={selectedKeys.has(subjectKey(name))}
                onPress={() => toggleSuggestion(name)}
              />
            ))}
          </View>
        </Animated.View>
      ) : null}

      <Animated.View entering={FadeInDown.delay(250).duration(400)} style={styles.section}>
        <View style={styles.inputRow}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder={t('onbSubjectsPlaceholder', undefined, 'Ajouter une matière')}
            placeholderTextColor="rgba(0, 0, 0, 0.4)"
            maxLength={MAX_SUBJECT_NAME}
            autoCapitalize="sentences"
            returnKeyType="done"
            submitBehavior="submit"
            onSubmitEditing={submitInput}
            editable={!full}
          />
          <TouchableOpacity
            style={[styles.addButton, (!normalizeSubjectName(input) || full) && styles.addButtonDisabled]}
            onPress={submitInput}
            disabled={!normalizeSubjectName(input) || full}
            activeOpacity={0.8}
            accessibilityLabel={t('onbSubjectsAdd', undefined, 'Ajouter')}
          >
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        {full ? (
          <Text style={[onboardingText.help, styles.help]}>
            {t('onbSubjectsMax', { max: MAX_SUBJECTS }, '{max} matières au maximum pour commencer.')}
          </Text>
        ) : null}
      </Animated.View>

      {subjects.length > 0 ? (
        <View style={styles.list}>
          {subjects.map((subject) => (
            <View key={subject.id} style={styles.row}>
              <View style={styles.rowTexts}>
                <Text style={styles.rowName} numberOfLines={2}>
                  {subject.name}
                </Text>
                <Text style={styles.rowHint}>{t('onbSubjectsCoefLabel', undefined, 'Coefficient')}</Text>
              </View>
              <View style={styles.stepper}>
                <TouchableOpacity
                  onPress={() => changeCoefficient(subject.id, -1)}
                  disabled={subjectCoefficient(subject) <= MIN_SUBJECT_COEFFICIENT}
                  style={[styles.stepButton, subjectCoefficient(subject) <= MIN_SUBJECT_COEFFICIENT && styles.stepButtonDisabled]}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 4 }}
                  accessibilityLabel={t('onbSubjectsCoefLess', { name: subject.name }, 'Baisser le coefficient de {name}')}
                >
                  <Ionicons name="remove" size={18} color={ONBOARDING_GREEN} />
                </TouchableOpacity>
                <Text style={styles.stepValue} accessibilityLabel={t('onbSubjectsCoefA11y', { name: subject.name, value: subjectCoefficient(subject) }, 'Coefficient de {name} : {value}')}>
                  {subjectCoefficient(subject)}
                </Text>
                <TouchableOpacity
                  onPress={() => changeCoefficient(subject.id, 1)}
                  disabled={subjectCoefficient(subject) >= MAX_SUBJECT_COEFFICIENT}
                  style={[styles.stepButton, subjectCoefficient(subject) >= MAX_SUBJECT_COEFFICIENT && styles.stepButtonDisabled]}
                  hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
                  accessibilityLabel={t('onbSubjectsCoefMore', { name: subject.name }, 'Monter le coefficient de {name}')}
                >
                  <Ionicons name="add" size={18} color={ONBOARDING_GREEN} />
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                onPress={() => removeSubject(subjectKey(subject.name))}
                style={styles.remove}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityLabel={t('onbSubjectsRemove', { name: subject.name }, 'Retirer {name}')}
              >
                <Ionicons name="close" size={20} color="rgba(0, 0, 0, 0.45)" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      ) : null}
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 20,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    fontSize: 16,
    color: '#000000',
  },
  addButton: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: ONBOARDING_GREEN,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonDisabled: {
    opacity: 0.35,
  },
  help: {
    marginTop: 8,
    paddingLeft: 4,
  },
  list: {
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  rowTexts: {
    flex: 1,
  },
  rowName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
  rowHint: {
    fontSize: 13,
    color: 'rgba(0, 0, 0, 0.45)',
    marginTop: 2,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(22, 163, 74, 0.10)',
  },
  stepButtonDisabled: {
    opacity: 0.35,
  },
  stepValue: {
    minWidth: 22,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    color: '#000000',
  },
  remove: {
    padding: 2,
  },
});
