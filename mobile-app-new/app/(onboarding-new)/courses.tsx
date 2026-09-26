import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { router } from 'expo-router';
import { useLanguage } from '@/contexts/LanguageContext';
import { connectAppleCalendar, connectGoogleCalendar } from '@/lib/calendarAuth';
import { readAndSendAppleBusySlots } from '@/lib/onboardingCalendar';
import { useOnboardingDraft } from '@/lib/onboardingDraft';
import { trackCalendarChoice, trackStepCompleted, useOnboardingStep } from '@/lib/onboardingTracking';
import { CLASSES_END_HOURS, type CalendarChoice, type ClassesEndHour } from '@/lib/onboardingLogic';
import {
  Chip,
  OnboardingScreen,
  OptionRow,
  PrimaryButton,
  SecondaryButton,
  onboardingText,
} from '@/components/onboarding/OnboardingUI';

/**
 * Ecran cours (spec 1.5, ecran 7) : ou sont les cours, pour ne jamais poser une
 * revision dessus. Il remplace calendar-sync DANS LE PARCOURS seulement :
 * calendar-sync reste l'ecran du didacticiel et de PlanMyDay, et il cree des
 * evenements pour les anciennes taches de l'onboarding, ce qui n'a plus de sens ici.
 *
 * Trois chemins, jamais « va remplir ton Google Agenda » (decision du 25
 * septembre : l'etudiant sortirait de l'app avant d'avoir vu la moindre valeur) :
 *   - l'agenda de l'iPhone, ENT abonne compris : lu sur l'appareil et envoye au
 *     serveur AVANT le calcul du planning (lib/onboardingCalendar.ts) ;
 *   - Google, que le serveur lit lui-meme (agenda principal seulement) ;
 *   - rien, et la question de secours « tu finis vers 12h, 14h, 16h, 18h ? ».
 * La question s'affiche aussi apres un agenda, preremplie quand l'agenda permet
 * de la deduire : l'instantane Apple expire au bout de 3 jours cote serveur, et
 * `User.weeklyBusy` doit alors prendre le relais (critique, point 7).
 */

// Le scope Calendar de Google est « sensible » : si Google ne l'a pas valide, la
// connexion affiche un ecran d'avertissement qui fait fuir. Passer a false masque
// l'option sans toucher au reste de l'ecran (spec 1.5, cas limites).
const GOOGLE_CALENDAR_OPTION = true;

type Outcome = 'granted' | 'denied' | 'error' | 'skipped';
type Busy = 'apple' | 'google' | null;

export default function CoursesScreen() {
  const { t } = useLanguage();
  const { draft, update } = useOnboardingDraft();
  const [choice, setChoice] = useState<CalendarChoice | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [busy, setBusy] = useState<Busy>(null);
  const [appleSlots, setAppleSlots] = useState<number | null>(null);
  const [endHour, setEndHour] = useState<ClassesEndHour | null>(null);
  const [endHourInferred, setEndHourInferred] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [saving, setSaving] = useState(false);

  useOnboardingStep('courses');

  useEffect(() => {
    if (!draft || hydrated) return;
    setHydrated(true);
    if (draft.calendarChoice) {
      setChoice(draft.calendarChoice);
      setOutcome(draft.calendarChoice === 'none' ? 'skipped' : 'granted');
    }
    setAppleSlots(draft.calendarBusySlots);
    setEndHour(draft.classesEndHour);
    setEndHourInferred(draft.classesEndHourInferred);
  }, [draft, hydrated]);

  const locked = busy !== null || saving;

  const chooseApple = async () => {
    if (locked) return;
    setBusy('apple');
    try {
      // connectAppleCalendar affiche lui-meme l'alerte en cas de refus et
      // renvoie false : on passe alors a la question de secours.
      const granted = await connectAppleCalendar();
      if (!granted) {
        setChoice('none');
        setOutcome('denied');
        return;
      }
      const reading = await readAndSendAppleBusySlots();
      setChoice('apple');
      setOutcome('granted');
      setAppleSlots(reading.slots);
      if (reading.inferredEndHour) {
        setEndHour(reading.inferredEndHour);
        setEndHourInferred(true);
      }
    } catch (error) {
      console.warn('[Onboarding] agenda iPhone indisponible', error);
      setChoice('none');
      setOutcome('error');
    } finally {
      setBusy(null);
    }
  };

  const chooseGoogle = async () => {
    if (locked) return;
    setBusy('google');
    try {
      const connected = await connectGoogleCalendar();
      // Annule par l'etudiant : on reste sur l'ecran, il choisit autre chose.
      if (!connected) return;
      setChoice('google');
      setOutcome('granted');
      setAppleSlots(null);
      if (endHourInferred) {
        setEndHour(null);
        setEndHourInferred(false);
      }
    } catch (error: any) {
      // Pas d'alerte : la ligne de resultat le dit, et la question de secours
      // apparait juste en dessous. Une alerte bloquerait l'ecran pour rien.
      console.warn('[Onboarding] Google Agenda indisponible', error);
      setChoice('none');
      setOutcome('error');
    } finally {
      setBusy(null);
    }
  };

  const chooseNone = () => {
    if (locked) return;
    setChoice('none');
    setOutcome('skipped');
    setAppleSlots(null);
    if (endHourInferred) {
      setEndHour(null);
      setEndHourInferred(false);
    }
  };

  const pickHour = (hour: ClassesEndHour) => {
    setEndHour((current) => (current === hour && !endHourInferred ? null : hour));
    setEndHourInferred(false);
  };

  const finish = async (skip: boolean) => {
    if (locked) return;
    setSaving(true);
    try {
      const finalChoice: CalendarChoice = skip ? 'none' : choice ?? 'none';
      const finalOutcome: Outcome = skip ? 'skipped' : outcome ?? 'skipped';
      const finalHour = skip ? null : endHour;
      await update({
        calendarChoice: finalChoice,
        classesEndHour: finalHour,
        classesEndHourInferred: !skip && endHourInferred,
        calendarBusySlots: finalChoice === 'apple' ? appleSlots : null,
      });
      trackCalendarChoice(finalChoice, finalOutcome);
      trackStepCompleted('courses', {
        choice: finalChoice,
        end_hour: finalHour,
        end_hour_inferred: !skip && endHourInferred,
        skipped: skip,
      });
      router.push('/(onboarding-new)/building-plan');
    } finally {
      setSaving(false);
    }
  };

  const showQuestion = choice !== null;

  const resultLine = (() => {
    if (choice === 'apple') {
      if (appleSlots === 1) {
        return t(
          'onbCoursesAppleFoundOne',
          undefined,
          '1 créneau occupé sur les 2 prochaines semaines. Tes révisions passeront autour.'
        );
      }
      if (appleSlots && appleSlots > 1) {
        return t(
          'onbCoursesAppleFound',
          { count: appleSlots },
          '{count} créneaux occupés sur les 2 prochaines semaines. Tes révisions passeront autour.'
        );
      }
      return t(
        'onbCoursesAppleEmpty',
        undefined,
        "Ton agenda est vide sur les 2 prochaines semaines : tes cours n'y sont peut-être pas."
      );
    }
    if (choice === 'google') {
      return t(
        'onbCoursesGoogleDone',
        undefined,
        'Google Agenda connecté. Tes révisions éviteront les créneaux de ton agenda principal.'
      );
    }
    if (outcome === 'denied') {
      return t('onbCoursesDenied', undefined, "Pas d'accès à l'agenda, pas de souci : une seule question suffit.");
    }
    if (outcome === 'error') {
      return t('onbCoursesError', undefined, "L'agenda n'a pas pu être lu : réponds simplement à la question.");
    }
    return null;
  })();

  const questionTitle =
    choice === 'none'
      ? t('onbCoursesQuestion', undefined, 'Tu finis les cours vers quelle heure, en général ?')
      : t('onbCoursesQuestionAfter', undefined, 'Et en général, tu finis les cours vers quelle heure ?');

  return (
    <OnboardingScreen
      footer={
        <>
          <PrimaryButton
            label={t('continue') || 'Continuer'}
            onPress={() => finish(false)}
            disabled={!showQuestion || busy !== null}
            loading={saving}
          />
          {!showQuestion ? (
            <SecondaryButton
              label={t('onbCoursesSkip', undefined, 'Passer cette étape')}
              onPress={() => finish(true)}
              disabled={locked}
            />
          ) : null}
        </>
      }
    >
      <Animated.View entering={FadeIn.delay(100).duration(400)}>
        <Text style={onboardingText.title}>{t('onbCoursesTitle', undefined, 'Où sont tes cours ?')}</Text>
        <Text style={onboardingText.subtitle}>
          {t(
            'onbCoursesSubtitle',
            undefined,
            'Pour ne jamais placer une révision pendant un cours. Seuls les horaires partent sur nos serveurs, jamais les titres.'
          )}
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.options}>
        {Platform.OS === 'ios' ? (
          <OptionRow
            icon="phone-portrait-outline"
            label={t('onbCoursesApple', undefined, "L'agenda de mon iPhone")}
            description={
              busy === 'apple'
                ? t('onbCoursesAppleReading', undefined, 'Lecture de ton agenda...')
                : t('onbCoursesAppleHint', undefined, "Emploi du temps de l'ENT compris, s'il y est abonné")
            }
            selected={choice === 'apple'}
            loading={busy === 'apple'}
            disabled={locked && busy !== 'apple'}
            onPress={chooseApple}
          />
        ) : null}
        {GOOGLE_CALENDAR_OPTION ? (
          <OptionRow
            icon="logo-google"
            label={t('onbCoursesGoogle', undefined, 'Google Agenda')}
            description={
              busy === 'google'
                ? t('onbCoursesGoogleConnecting', undefined, 'Connexion...')
                : t('onbCoursesGoogleHint', undefined, 'Ton agenda Google principal')
            }
            selected={choice === 'google'}
            loading={busy === 'google'}
            disabled={locked && busy !== 'google'}
            onPress={chooseGoogle}
          />
        ) : null}
        <OptionRow
          icon="close-circle-outline"
          label={t('onbCoursesNone', undefined, "Je n'ai pas d'agenda")}
          description={t('onbCoursesNoneHint', undefined, 'Une seule question à la place')}
          selected={choice === 'none' && outcome === 'skipped'}
          disabled={locked}
          onPress={chooseNone}
        />
      </Animated.View>

      {resultLine ? (
        <Animated.View entering={FadeInDown.duration(300)} style={styles.result}>
          <Text style={styles.resultText}>{resultLine}</Text>
        </Animated.View>
      ) : null}

      {showQuestion ? (
        <Animated.View entering={FadeInDown.duration(300)} style={styles.question}>
          <Text style={onboardingText.sectionLabel}>{questionTitle}</Text>
          <View style={styles.hours}>
            {CLASSES_END_HOURS.map((hour) => (
              <Chip
                key={hour}
                label={t('onbCoursesHour', { hour }, '{hour}h')}
                selected={endHour === hour}
                onPress={() => pickHour(hour)}
                style={styles.hourChip}
              />
            ))}
          </View>
          <Text style={[onboardingText.help, styles.help]}>
            {endHourInferred
              ? t('onbCoursesInferred', undefined, "Déduit de ton agenda. Touche une autre heure s'il se trompe.")
              : t('onbCoursesHourHint', undefined, 'On placera tes révisions de semaine après cette heure.')}
          </Text>
        </Animated.View>
      ) : null}
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  options: {
    gap: 12,
  },
  result: {
    marginTop: 20,
    padding: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(22, 163, 74, 0.08)',
  },
  resultText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#0F5132',
  },
  question: {
    marginTop: 24,
  },
  hours: {
    flexDirection: 'row',
    gap: 8,
  },
  hourChip: {
    flex: 1,
    alignItems: 'center',
  },
  help: {
    marginTop: 10,
    paddingLeft: 4,
  },
});
