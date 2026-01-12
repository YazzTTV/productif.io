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
import { WorkStyleDiagnostic } from '@/components/onboarding-new/WorkStyleDiagnostic';
import { GoalsIntent } from '@/components/onboarding-new/GoalsIntent';
import { TasksAwareness } from '@/components/onboarding-new/TasksAwareness';
import { TaskClarification } from '@/components/onboarding-new/TaskClarification';
import { AIProcessing } from '@/components/onboarding-new/AIProcessing';
import { IdealDay } from '@/components/onboarding-new/IdealDay';
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
  mentalLoad: number;
  focusQuality: number;
  satisfaction: number;
  overthinkTasks: boolean;
  shouldDoMore: boolean;
  wantToChange: string[];
  timeHorizon: string;
  tasks: string;
  clarifiedTasks: Array<{
    id: string;
    title: string;
    category: string;
    priority: boolean;
  }>;
  idealDay: any;
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
    mentalLoad: 3,
    focusQuality: 3,
    satisfaction: 3,
    overthinkTasks: false,
    shouldDoMore: false,
    wantToChange: [],
    timeHorizon: '',
    tasks: '',
    clarifiedTasks: [],
    idealDay: null,
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

  const handleComplete = () => {
    // Save onboarding data and redirect to dashboard
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
    <WorkStyleDiagnostic
      key="workstyle"
      mentalLoad={data.mentalLoad}
      focusQuality={data.focusQuality}
      satisfaction={data.satisfaction}
      overthinkTasks={data.overthinkTasks}
      shouldDoMore={data.shouldDoMore}
      onContinue={(workStyleData) => {
        updateData(workStyleData);
        nextScreen();
      }}
      t={t}
    />,
    <GoalsIntent
      key="intent"
      wantToChange={data.wantToChange}
      timeHorizon={data.timeHorizon}
      onContinue={(wantToChange, timeHorizon) => {
        updateData({ wantToChange, timeHorizon });
        nextScreen();
      }}
      t={t}
    />,
    <TasksAwareness
      key="tasks"
      tasks={data.tasks}
      onContinue={(tasks) => {
        updateData({ tasks });
        nextScreen();
      }}
      t={t}
    />,
    <TaskClarification
      key="clarification"
      rawTasks={data.tasks}
      onContinue={(clarifiedTasks) => {
        updateData({ clarifiedTasks });
        nextScreen();
      }}
      t={t}
    />,
    <AIProcessing
      key="processing"
      onComplete={(idealDay) => {
        updateData({ idealDay });
        nextScreen();
      }}
      t={t}
    />,
    <IdealDay
      key="idealday"
      idealDay={data.idealDay}
      onSyncCalendar={() => nextScreen()}
      onStartFocus={handleComplete}
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

  return (
    <div className="min-h-screen bg-white">
      {/* Progress indicator */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-black/5 z-50">
        <motion.div
          className="h-full bg-[#16A34A]"
          initial={{ width: 0 }}
          animate={{ width: `${(currentScreen / (screens.length - 1)) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

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


