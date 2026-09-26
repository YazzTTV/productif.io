import React, { useEffect, useMemo, useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import { useLanguage } from '@/contexts/LanguageContext';
import { readOnboardingResponses } from '@/hooks/useOnboardingData';
import { useOnboardingDraft } from '@/lib/onboardingDraft';
import { trackStepCompleted, useOnboardingStep } from '@/lib/onboardingTracking';
import {
  STUDY_TRACKS,
  defaultExamDate,
  isFirstSemesterSeason,
  minimumExamDate,
  parseLocalYmd,
  toLocalYmd,
  trackFromStudentType,
  type StudyTrack,
} from '@/lib/onboardingLogic';
import {
  Chip,
  OnboardingScreen,
  PrimaryButton,
  SecondaryButton,
  onboardingText,
} from '@/components/onboarding/OnboardingUI';

/**
 * Ecran examens (spec 1.5, ecran 3) : la filiere en un tap, puis le premier
 * jour d'examens. La date est la seule donnee qui donne une echeance au
 * planificateur ; sans elle, le serveur applique sa regle par defaut, d'ou le
 * « je ne sais pas encore » assume plutot qu'une date inventee.
 *
 * La filiere n'est donnee par aucun ecran du questionnaire : academic-context
 * demande une SITUATION (« je bosse beaucoup mais... »), et identity un type
 * d'etudiant trop large (« Medecine / Droit / Prepa » d'un seul bloc). Elle ne
 * sert qu'a proposer les bonnes matieres a l'ecran suivant.
 */

const TRACK_LABELS: Record<StudyTrack, { key: string; fallback: string }> = {
  sante: { key: 'onbTrackSante', fallback: 'PASS / LAS' },
  droit: { key: 'onbTrackDroit', fallback: 'Droit' },
  prepa: { key: 'onbTrackPrepa', fallback: 'Prépa' },
  ingenieur: { key: 'onbTrackIngenieur', fallback: "École d'ingé" },
  commerce: { key: 'onbTrackCommerce', fallback: 'École de commerce' },
  licence_sciences: { key: 'onbTrackLicenceSciences', fallback: 'Licence sciences' },
  licence_lettres: { key: 'onbTrackLicenceLettres', fallback: 'Licence lettres, SHS' },
  licence_eco: { key: 'onbTrackLicenceEco', fallback: 'Licence éco-gestion' },
  lycee: { key: 'onbTrackLycee', fallback: 'Lycée' },
  autre: { key: 'onbTrackAutre', fallback: 'Autre' },
};

export default function ExamsScreen() {
  const { t, language } = useLanguage();
  const { draft, update } = useOnboardingDraft();
  const [track, setTrack] = useState<StudyTrack | null>(null);
  const [examDate, setExamDate] = useState<Date>(() => defaultExamDate());
  const [showAndroidPicker, setShowAndroidPicker] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [saving, setSaving] = useState(false);

  useOnboardingStep('exams');

  const minDate = useMemo(() => minimumExamDate(), []);
  const firstSemester = isFirstSemesterSeason();

  // Reprise : ce qui avait ete choisi, sinon la filiere devinee quand le type
  // d'etudiant ne laisse aucun doute (lycee).
  useEffect(() => {
    if (!draft || hydrated) return;
    setHydrated(true);
    const saved = parseLocalYmd(draft.examDate);
    if (saved && saved.getTime() >= minDate.getTime()) setExamDate(saved);
    if (draft.track) {
      setTrack(draft.track);
      return;
    }
    readOnboardingResponses()
      .then((responses) => {
        const guessed = trackFromStudentType(responses.studentType);
        if (guessed) setTrack((current) => current ?? guessed);
      })
      .catch(() => {});
  }, [draft, hydrated, minDate]);

  const locale = language === 'en' ? 'en-US' : language === 'es' ? 'es-ES' : 'fr-FR';
  const formattedDate = useMemo(() => {
    try {
      // L'annee seulement si elle change : « vendredi 15 janvier 2027 » en septembre.
      const otherYear = examDate.getFullYear() !== new Date().getFullYear();
      return examDate.toLocaleDateString(locale, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        ...(otherYear ? { year: 'numeric' as const } : {}),
      });
    } catch {
      return toLocalYmd(examDate);
    }
  }, [examDate, locale]);

  const finish = async (unknown: boolean) => {
    if (saving) return;
    setSaving(true);
    try {
      await update({
        track,
        examDate: unknown ? null : toLocalYmd(examDate),
        examDateUnknown: unknown,
      });
      trackStepCompleted('exams', { exam_date_known: !unknown, track: track ?? null });
      router.push('/(onboarding-new)/subjects');
    } finally {
      setSaving(false);
    }
  };

  const onPickDate = (date: Date | undefined) => {
    if (!date) return;
    // Le selecteur respecte minimumDate, mais une date saisie au clavier
    // Android peut passer : on la ramene a demain plutot que de la refuser.
    setExamDate(date.getTime() < minDate.getTime() ? minDate : date);
  };

  return (
    <OnboardingScreen
      footer={
        <>
          <PrimaryButton
            label={t('onbExamsConfirmDate', { date: formattedDate }, 'Valider : {date}')}
            onPress={() => finish(false)}
            loading={saving}
          />
          <SecondaryButton
            label={t('onbExamsUnknown', undefined, 'Je ne sais pas encore')}
            onPress={() => finish(true)}
            disabled={saving}
          />
        </>
      }
    >
      <Animated.View entering={FadeIn.delay(100).duration(400)}>
        <Text style={onboardingText.title}>
          {firstSemester
            ? t('onbExamsTitleS1', undefined, 'Quand commencent tes examens du premier semestre ?')
            : t('onbExamsTitleNext', undefined, 'Quand commencent tes prochains examens ?')}
        </Text>
        <Text style={onboardingText.subtitle}>
          {t('onbExamsSubtitle', undefined, 'Ton planning se construit à rebours depuis cette date.')}
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.section}>
        <Text style={onboardingText.sectionLabel}>{t('onbExamsTrackLabel', undefined, 'Tu es en')}</Text>
        <View style={styles.chips}>
          {STUDY_TRACKS.map((value) => (
            <Chip
              key={value}
              label={t(TRACK_LABELS[value].key, undefined, TRACK_LABELS[value].fallback)}
              selected={track === value}
              onPress={() => setTrack((current) => (current === value ? null : value))}
            />
          ))}
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.section}>
        <Text style={onboardingText.sectionLabel}>
          {t('onbExamsDateLabel', undefined, "Premier jour d'examens")}
        </Text>
        {Platform.OS === 'ios' ? (
          <View style={styles.pickerCard}>
            <DateTimePicker
              value={examDate}
              mode="date"
              display="spinner"
              locale={locale}
              themeVariant="light"
              minimumDate={minDate}
              onChange={(_event, date) => onPickDate(date)}
              style={styles.spinner}
            />
          </View>
        ) : (
          <>
            <TouchableOpacity
              style={styles.androidDate}
              onPress={() => setShowAndroidPicker(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.androidDateText}>{formattedDate}</Text>
            </TouchableOpacity>
            {showAndroidPicker ? (
              <DateTimePicker
                value={examDate}
                mode="date"
                display="default"
                minimumDate={minDate}
                onChange={(event, date) => {
                  setShowAndroidPicker(false);
                  if (event.type === 'set') onPickDate(date);
                }}
              />
            ) : null}
          </>
        )}
        <Text style={[onboardingText.help, styles.help]}>
          {t(
            'onbExamsHelp',
            undefined,
            'Une date approximative suffit, tu pourras la changer matière par matière.'
          )}
        </Text>
      </Animated.View>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pickerCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
  },
  spinner: {
    height: 200,
  },
  androidDate: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  androidDateText: {
    fontSize: 17,
    color: '#000000',
  },
  help: {
    marginTop: 10,
    paddingLeft: 4,
  },
});
