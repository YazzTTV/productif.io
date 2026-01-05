/**
 * TUTORIAL INTEGRATION GUIDE FOR APP.TSX
 * ======================================
 * 
 * This file contains the complete code to integrate the tutorial system
 * into your main App.tsx after onboarding completes.
 * 
 * STEP 1: Import the required components
 * ----------------------------------------
 */

import { useState, useEffect } from 'react';
import { TutorialPrompt } from './components/tutorial/TutorialPrompt';
import { Tutorial } from './components/tutorial/Tutorial';
import { useTutorial } from './hooks/useTutorial';

/**
 * STEP 2: Add state management in your App component
 * ----------------------------------------------------
 */

function App() {
  // Assuming you already have onboarding state
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  
  // Tutorial hooks
  const { shouldShowTutorial, completeTutorial, skipTutorial } = useTutorial();
  const [showPrompt, setShowPrompt] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  
  // Get selected language from onboarding (if you have it)
  const [language, setLanguage] = useState<'en' | 'fr' | 'es'>('fr');

  /**
   * STEP 3: Show prompt after onboarding
   * -------------------------------------
   */
  useEffect(() => {
    if (onboardingComplete && shouldShowTutorial()) {
      // Small delay for smooth transition
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [onboardingComplete, shouldShowTutorial]);

  /**
   * STEP 4: Handle tutorial actions
   * ---------------------------------
   */
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
  };

  const handleSkipTutorial = () => {
    skipTutorial();
    setShowTutorial(false);
  };

  /**
   * STEP 5: Render logic
   * ---------------------
   */

  // Show onboarding first
  if (!onboardingComplete) {
    return (
      <OnboardingFlow
        onComplete={(selectedLanguage) => {
          setLanguage(selectedLanguage);
          setOnboardingComplete(true);
        }}
      />
    );
  }

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
      <YourMainApp />
      
      {/* Tutorial Prompt Modal */}
      <TutorialPrompt
        isOpen={showPrompt}
        onStart={handleStartTutorial}
        onDismiss={handleDismissPrompt}
        language={language}
      />
    </>
  );
}

/**
 * ALTERNATIVE: Using TutorialIntegration Component
 * =================================================
 * 
 * If you want a simpler integration, use the TutorialIntegration wrapper:
 */

import { TutorialIntegration } from './components/tutorial/TutorialIntegration';

function AppSimplified() {
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  if (!onboardingComplete) {
    return (
      <OnboardingFlow
        onComplete={() => setOnboardingComplete(true)}
      />
    );
  }

  return (
    <TutorialIntegration
      onboardingComplete={onboardingComplete}
      onTutorialComplete={() => {
        console.log('Tutorial completed!');
        // Track analytics, etc.
      }}
    >
      <YourMainApp />
    </TutorialIntegration>
  );
}

/**
 * STEP 6: Add restart option in Settings
 * ----------------------------------------
 */

function SettingsPage() {
  const { canRestartTutorial, resetTutorial } = useTutorial();

  return (
    <div>
      {/* Other settings */}
      
      {canRestartTutorial() && (
        <button
          onClick={resetTutorial}
          className="px-4 py-2 text-sm text-[#16A34A] border border-[#16A34A]/20 rounded-2xl hover:bg-[#16A34A]/5"
        >
          Redémarrer le didacticiel
        </button>
      )}
    </div>
  );
}

/**
 * TESTING THE TUTORIAL
 * =====================
 * 
 * To test the tutorial flow:
 * 
 * 1. Clear localStorage:
 *    localStorage.removeItem('productif_tutorial_state');
 * 
 * 2. Complete onboarding
 * 
 * 3. Tutorial prompt should appear automatically
 * 
 * 4. Test both "Start" and "Later" flows
 * 
 * 5. Check that state persists on page refresh
 */

/**
 * FLOW DIAGRAM
 * ============
 * 
 * User Journey:
 * 
 * 1. [Onboarding] → User completes all onboarding steps
 *                   setOnboardingComplete(true)
 *                   
 * 2. [Main App]   → App renders with useEffect watching onboardingComplete
 *                   
 * 3. [Delay 500ms] → Smooth transition
 *                   
 * 4. [Prompt]     → TutorialPrompt modal appears
 *                   "Prêt à maîtriser Productif.io ?"
 *                   
 * 5a. [Start]     → User clicks "Commencer le didacticiel"
 *                   setShowPrompt(false)
 *                   setShowTutorial(true)
 *                   → Tutorial begins
 *                   
 * 5b. [Later]     → User clicks "Plus tard"
 *                   setShowPrompt(false)
 *                   skipTutorial()
 *                   → Returns to main app
 *                   
 * 6. [Complete]   → User finishes tutorial
 *                   completeTutorial()
 *                   → Returns to main app
 *                   → Can restart from Settings
 */

export { App, AppSimplified, SettingsPage };
