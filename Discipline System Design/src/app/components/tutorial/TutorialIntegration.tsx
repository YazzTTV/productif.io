import { useState, useEffect } from 'react';
import { Tutorial } from './Tutorial';
import { TutorialPrompt } from './TutorialPrompt';
import { useTutorial } from '../../hooks/useTutorial';

/**
 * Complete integration example showing how to connect:
 * Onboarding → Tutorial Prompt → Tutorial → Main App
 * 
 * USAGE IN YOUR APP:
 * 
 * ```tsx
 * import { TutorialIntegration } from './components/tutorial/TutorialIntegration';
 * 
 * function App() {
 *   const [onboardingComplete, setOnboardingComplete] = useState(false);
 * 
 *   return (
 *     <TutorialIntegration
 *       onboardingComplete={onboardingComplete}
 *       onTutorialComplete={() => {
 *         // User has completed tutorial
 *         // Show main app
 *       }}
 *     >
 *       <YourMainApp />
 *     </TutorialIntegration>
 *   );
 * }
 * ```
 */

interface TutorialIntegrationProps {
  onboardingComplete: boolean;
  onTutorialComplete?: () => void;
  children: React.ReactNode;
}

export function TutorialIntegration({
  onboardingComplete,
  onTutorialComplete,
  children,
}: TutorialIntegrationProps) {
  const {
    shouldShowTutorial,
    completeTutorial,
    skipTutorial,
  } = useTutorial();

  const [showPrompt, setShowPrompt] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  // Show prompt when onboarding completes and tutorial hasn't been done
  useEffect(() => {
    if (onboardingComplete && shouldShowTutorial()) {
      // Small delay for smooth transition
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [onboardingComplete, shouldShowTutorial]);

  const handleStartTutorial = () => {
    setShowPrompt(false);
    setTimeout(() => {
      setShowTutorial(true);
    }, 300);
  };

  const handleDismissPrompt = () => {
    setShowPrompt(false);
    skipTutorial();
  };

  const handleCompleteTutorial = () => {
    completeTutorial();
    setShowTutorial(false);
    onTutorialComplete?.();
  };

  const handleSkipTutorial = () => {
    skipTutorial();
    setShowTutorial(false);
  };

  // Show tutorial
  if (showTutorial) {
    return (
      <Tutorial
        onComplete={handleCompleteTutorial}
        onSkip={handleSkipTutorial}
      />
    );
  }

  // Show main app with prompt overlay
  return (
    <>
      {children}
      
      {/* Tutorial Prompt */}
      <TutorialPrompt
        isOpen={showPrompt}
        onStart={handleStartTutorial}
        onDismiss={handleDismissPrompt}
      />
    </>
  );
}

/**
 * STEP-BY-STEP INTEGRATION GUIDE:
 * 
 * 1. In your main App.tsx or routing component:
 * 
 * ```tsx
 * import { useState } from 'react';
 * import { OnboardingFlow } from './components/onboarding/OnboardingFlow';
 * import { TutorialIntegration } from './components/tutorial/TutorialIntegration';
 * import { Dashboard } from './components/Dashboard';
 * 
 * function App() {
 *   const [onboardingComplete, setOnboardingComplete] = useState(false);
 *   const [tutorialComplete, setTutorialComplete] = useState(false);
 * 
 *   // Show onboarding first
 *   if (!onboardingComplete) {
 *     return (
 *       <OnboardingFlow
 *         onComplete={() => setOnboardingComplete(true)}
 *       />
 *     );
 *   }
 * 
 *   // After onboarding, show tutorial prompt and main app
 *   return (
 *     <TutorialIntegration
 *       onboardingComplete={onboardingComplete}
 *       onTutorialComplete={() => setTutorialComplete(true)}
 *     >
 *       <Dashboard />
 *     </TutorialIntegration>
 *   );
 * }
 * ```
 * 
 * 2. The flow will be:
 *    Onboarding → Tutorial Prompt (modal) → Tutorial (if user clicks "Start") → Main App
 * 
 * 3. Tutorial state is persisted, so:
 *    - If user dismisses prompt, they won't see it again
 *    - User can restart tutorial from Settings
 *    - Tutorial progress is saved if interrupted
 */
