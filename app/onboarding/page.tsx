"use client"

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useLocale } from '@/lib/i18n';

import { LanguageSelection } from '@/components/onboarding-new/LanguageSelection';
import { Welcome } from '@/components/onboarding-new/Welcome';
import { Auth } from '@/components/onboarding-new/Auth';
import { ValueAwareness } from '@/components/onboarding-new/ValueAwareness';
import { Identity } from '@/components/onboarding-new/Identity';
import { GoalsPressure } from '@/components/onboarding-new/GoalsPressure';
import { AcademicContext } from '@/components/onboarding-new/AcademicContext';
import { DailyStruggles } from '@/components/onboarding-new/DailyStruggles';
import { CalendarSync } from '@/components/onboarding-new/CalendarSync';
import { Success } from '@/components/onboarding-new/Success';

export interface OnboardingData {
  language: 'fr' | 'en';
  firstName: string;
  studentType: string;
  goals: string[];
  pressureLevel: number;
  currentSituation: string;
  dailyStruggles: string[];
}

export default function OnboardingPage() {
  const router = useRouter();
  const { locale, setLocale, t } = useLocale();
  const [currentScreen, setCurrentScreen] = useState(0);
  const [data, setData] = useState<OnboardingData>({
    language: locale,
    firstName: '',
    studentType: '',
    goals: [],
    pressureLevel: 3,
    currentSituation: '',
    dailyStruggles: [],
  });

  const updateData = (updates: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...updates }));
  };

  const nextScreen = () => {
    setCurrentScreen(prev => prev + 1);
  };

  const goToScreen = (screen: number) => {
    setCurrentScreen(screen);
  };

  const saveOnboardingData = async () => {
    try {
      const response = await fetch('/api/onboarding/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...data,
          completed: true,
        }),
      });

      if (!response.ok) {
        console.error('Erreur sauvegarde onboarding:', response.status);
      } else {
        console.log('✅ Données d\'onboarding sauvegardées');
      }
    } catch (error) {
      console.error('Erreur sauvegarde onboarding:', error);
    }
  };

  const handleComplete = async () => {
    // Save onboarding data and redirect to dashboard
    await saveOnboardingData();
    router.push('/dashboard');
  };

  const screens = [
    <LanguageSelection
      key="language"
      onSelect={(language) => {
        setLocale(language);
        updateData({ language });
        nextScreen();
      }}
      t={t}
    />,
    <Welcome
      key="welcome"
      onStart={nextScreen}
      onLogin={() => goToScreen(2)}
      t={t}
    />,
    <Auth
      key="auth"
      onAuth={(isNewUser) => {
        if (isNewUser) {
          nextScreen();
        } else {
          handleComplete();
        }
      }}
      t={t}
    />,
    <ValueAwareness
      key="value"
      onContinue={nextScreen}
      t={t}
    />,
    <Identity
      key="identity"
      firstName={data.firstName}
      studentType={data.studentType}
      onContinue={(firstName, studentType) => {
        updateData({ firstName, studentType });
        nextScreen();
      }}
      t={t}
    />,
    <GoalsPressure
      key="goals"
      goals={data.goals}
      pressureLevel={data.pressureLevel}
      onContinue={(goals, pressureLevel) => {
        updateData({ goals, pressureLevel });
        nextScreen();
      }}
      t={t}
    />,
    <AcademicContext
      key="academic"
      currentSituation={data.currentSituation}
      onContinue={(currentSituation) => {
        updateData({ currentSituation });
        nextScreen();
      }}
      t={t}
    />,
    <DailyStruggles
      key="struggles"
      dailyStruggles={data.dailyStruggles}
      onContinue={(dailyStruggles) => {
        updateData({ dailyStruggles });
        nextScreen();
      }}
      t={t}
    />,
    <CalendarSync
      key="calendar"
      onConnect={() => nextScreen()}
      onSkip={() => nextScreen()}
      t={t}
    />,
    <Success
      key="success"
      firstName={data.firstName}
      onStartFocus={handleComplete}
      t={t}
    />,
  ];

  // Calcul de la progression
  const progress = (currentScreen / (screens.length - 1)) * 100;
  const showProgress = currentScreen !== 0 && currentScreen !== screens.length - 1;

  return (
    <div className="min-h-screen bg-white">
      {/* Progress indicator */}
      {showProgress && (
        <div className="fixed top-0 left-0 right-0 h-1 bg-black/5 z-50">
          <motion.div
            className="h-full bg-[#16A34A]"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      )}

      {/* Screen transition */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentScreen}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="min-h-screen"
        >
          {screens[currentScreen]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
