import React, { useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeIn, FadeOut, SlideInRight, SlideOutLeft } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useLanguage, Language } from '@/contexts/LanguageContext';
import { onboardingService } from '@/lib/api';

import {
  LanguageSelection,
  Welcome,
  Auth,
  ValueAwareness,
  Identity,
  GoalsPressure,
  AcademicContext,
  DailyStruggles,
  CalendarSync,
  Success,
} from '@/components/onboarding';

// Types pour les données d'onboarding
interface OnboardingData {
  language: Language;
  firstName: string;
  studentType: string;
  goals: string[];
  pressureLevel: number;
  currentSituation: string;
  dailyStruggles: string[];
}

type OnboardingStep = 
  | 'language'
  | 'welcome'
  | 'auth'
  | 'value'
  | 'identity'
  | 'goals'
  | 'academic'
  | 'struggles'
  | 'calendar'
  | 'success';

const STEP_ORDER: OnboardingStep[] = [
  'language',
  'welcome',
  'auth',
  'value',
  'identity',
  'goals',
  'academic',
  'struggles',
  'calendar',
  'success',
];

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { language, setLanguage, t } = useLanguage();
  
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('language');
  const [isNewUser, setIsNewUser] = useState(true);
  const [data, setData] = useState<OnboardingData>({
    language: language,
    firstName: '',
    studentType: '',
    goals: [],
    pressureLevel: 3,
    currentSituation: '',
    dailyStruggles: [],
  });

  const updateData = useCallback((updates: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...updates }));
  }, []);

  const goToStep = useCallback((step: OnboardingStep) => {
    setCurrentStep(step);
  }, []);

  const nextStep = useCallback(() => {
    const currentIndex = STEP_ORDER.indexOf(currentStep);
    if (currentIndex < STEP_ORDER.length - 1) {
      setCurrentStep(STEP_ORDER[currentIndex + 1]);
    }
  }, [currentStep]);

  // Sauvegarder les données d'onboarding sur le backend
  const saveOnboardingData = useCallback(async () => {
    try {
      await onboardingService.saveOnboardingData({
        language: data.language,
        firstName: data.firstName,
        studentType: data.studentType,
        goals: data.goals,
        pressureLevel: data.pressureLevel,
        currentSituation: data.currentSituation,
        dailyStruggles: data.dailyStruggles,
        completed: true,
      });
    } catch (error) {
      console.error('Erreur sauvegarde onboarding:', error);
    }
  }, [data]);

  const handleComplete = useCallback(async () => {
    await saveOnboardingData();
    router.replace('/(tabs)');
  }, [saveOnboardingData, router]);

  // Calcul de la progression
  const progress = (STEP_ORDER.indexOf(currentStep) / (STEP_ORDER.length - 1)) * 100;

  const renderStep = () => {
    switch (currentStep) {
      case 'language':
        return (
          <LanguageSelection
            onSelect={(lang) => {
              setLanguage(lang);
              updateData({ language: lang });
              nextStep();
            }}
          />
        );

      case 'welcome':
        return (
          <Welcome
            onStart={nextStep}
            onLogin={() => goToStep('auth')}
          />
        );

      case 'auth':
        return (
          <Auth
            onAuth={(newUser) => {
              setIsNewUser(newUser);
              if (newUser) {
                nextStep();
              } else {
                // Utilisateur existant → aller au dashboard
                router.replace('/(tabs)');
              }
            }}
          />
        );

      case 'value':
        return <ValueAwareness onContinue={nextStep} />;

      case 'identity':
        return (
          <Identity
            firstName={data.firstName}
            studentType={data.studentType}
            onContinue={(firstName, studentType) => {
              updateData({ firstName, studentType });
              nextStep();
            }}
          />
        );

      case 'goals':
        return (
          <GoalsPressure
            goals={data.goals}
            pressureLevel={data.pressureLevel}
            onContinue={(goals, pressureLevel) => {
              updateData({ goals, pressureLevel });
              nextStep();
            }}
          />
        );

      case 'academic':
        return (
          <AcademicContext
            currentSituation={data.currentSituation}
            onContinue={(currentSituation) => {
              updateData({ currentSituation });
              nextStep();
            }}
          />
        );

      case 'struggles':
        return (
          <DailyStruggles
            dailyStruggles={data.dailyStruggles}
            onContinue={(dailyStruggles) => {
              updateData({ dailyStruggles });
              nextStep();
            }}
          />
        );

      case 'calendar':
        return (
          <CalendarSync
            onConnect={nextStep}
            onSkip={nextStep}
          />
        );

      case 'success':
        return (
          <Success
            firstName={data.firstName}
            onStartFocus={handleComplete}
          />
        );

      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Progress Bar */}
      {currentStep !== 'language' && currentStep !== 'success' && (
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <Animated.View 
              style={[styles.progressFill, { width: `${progress}%` }]}
            />
          </View>
        </View>
      )}

      {/* Screen Content */}
      <Animated.View 
        key={currentStep}
        entering={SlideInRight.duration(300)}
        exiting={SlideOutLeft.duration(200)}
        style={styles.screenContainer}
      >
        {renderStep()}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  progressContainer: {
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#16A34A',
    borderRadius: 2,
  },
  screenContainer: {
    flex: 1,
  },
});

