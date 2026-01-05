import { useState, useEffect } from 'react';

export type TutorialStatus = 'not-started' | 'in-progress' | 'completed' | 'skipped';

interface TutorialState {
  status: TutorialStatus;
  currentStep: number;
  completedSteps: string[];
  lastCompletedAt?: string;
}

const TUTORIAL_STORAGE_KEY = 'productif_tutorial_state';

export function useTutorial() {
  const [tutorialState, setTutorialState] = useState<TutorialState>(() => {
    // Load from localStorage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(TUTORIAL_STORAGE_KEY);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (e) {
          console.error('Failed to parse tutorial state:', e);
        }
      }
    }
    
    return {
      status: 'not-started',
      currentStep: 0,
      completedSteps: [],
    };
  });

  // Save to localStorage whenever state changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(TUTORIAL_STORAGE_KEY, JSON.stringify(tutorialState));
    }
  }, [tutorialState]);

  const startTutorial = () => {
    setTutorialState({
      status: 'in-progress',
      currentStep: 1,
      completedSteps: [],
    });
  };

  const completeTutorial = () => {
    setTutorialState({
      ...tutorialState,
      status: 'completed',
      lastCompletedAt: new Date().toISOString(),
    });
  };

  const skipTutorial = () => {
    setTutorialState({
      ...tutorialState,
      status: 'skipped',
    });
  };

  const resetTutorial = () => {
    setTutorialState({
      status: 'not-started',
      currentStep: 0,
      completedSteps: [],
    });
  };

  const updateStep = (step: number) => {
    setTutorialState({
      ...tutorialState,
      currentStep: step,
    });
  };

  const markStepCompleted = (stepId: string) => {
    setTutorialState({
      ...tutorialState,
      completedSteps: [...tutorialState.completedSteps, stepId],
    });
  };

  const shouldShowTutorial = () => {
    return tutorialState.status === 'not-started' || tutorialState.status === 'in-progress';
  };

  const canRestartTutorial = () => {
    return tutorialState.status === 'completed' || tutorialState.status === 'skipped';
  };

  return {
    tutorialState,
    startTutorial,
    completeTutorial,
    skipTutorial,
    resetTutorial,
    updateStep,
    markStepCompleted,
    shouldShowTutorial,
    canRestartTutorial,
  };
}
