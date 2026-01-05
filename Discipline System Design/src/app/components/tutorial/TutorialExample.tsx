import { useState } from 'react';
import { Tutorial } from './Tutorial';
import { useTutorial } from '../../hooks/useTutorial';
import { TutorialBadge } from './TutorialBadge';

/**
 * Example component showing how to integrate the tutorial into your app
 * 
 * INTEGRATION GUIDE:
 * 
 * 1. After onboarding completes, show tutorial prompt
 * 2. User can start tutorial or skip
 * 3. Tutorial state is persisted in localStorage
 * 4. User can restart tutorial from Settings
 * 
 * USAGE IN APP.TSX:
 * 
 * ```tsx
 * const { shouldShowTutorial, completeTutorial, skipTutorial } = useTutorial();
 * const [showTutorial, setShowTutorial] = useState(false);
 * 
 * // After onboarding
 * if (shouldShowTutorial() && !showTutorial) {
 *   setShowTutorial(true);
 * }
 * 
 * if (showTutorial) {
 *   return (
 *     <Tutorial
 *       onComplete={() => {
 *         completeTutorial();
 *         setShowTutorial(false);
 *       }}
 *       onSkip={() => {
 *         skipTutorial();
 *         setShowTutorial(false);
 *       }}
 *     />
 *   );
 * }
 * ```
 */

export function TutorialExample() {
  const {
    shouldShowTutorial,
    completeTutorial,
    skipTutorial,
    resetTutorial,
    canRestartTutorial,
  } = useTutorial();

  const [showTutorial, setShowTutorial] = useState(shouldShowTutorial());

  const handleComplete = () => {
    completeTutorial();
    setShowTutorial(false);
  };

  const handleSkip = () => {
    skipTutorial();
    setShowTutorial(false);
  };

  const handleRestart = () => {
    resetTutorial();
    setShowTutorial(true);
  };

  if (showTutorial) {
    return (
      <Tutorial
        onComplete={handleComplete}
        onSkip={handleSkip}
      />
    );
  }

  // Your main app UI
  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          
          {/* Restart tutorial button (only if completed or skipped) */}
          {canRestartTutorial() && (
            <button
              onClick={handleRestart}
              className="px-4 py-2 text-sm text-[#16A34A] border border-[#16A34A]/20 rounded-2xl hover:bg-[#16A34A]/5 transition-all"
            >
              Restart tutorial
            </button>
          )}
        </div>

        {/* Example sections with tutorial badges */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tasks section */}
          <div className="relative p-6 border border-black/10 rounded-3xl">
            <TutorialBadge position="top-right" />
            <h2 className="text-lg font-medium mb-4">Your Tasks</h2>
            <p className="text-black/60 text-sm">
              Organize your work by subjects and tasks.
            </p>
          </div>

          {/* Plan section */}
          <div className="relative p-6 border border-black/10 rounded-3xl">
            <TutorialBadge position="top-right" />
            <h2 className="text-lg font-medium mb-4">Plan My Day</h2>
            <p className="text-black/60 text-sm">
              Let AI structure your ideal day.
            </p>
          </div>

          {/* Focus section */}
          <div className="relative p-6 border border-black/10 rounded-3xl">
            <TutorialBadge position="top-right" />
            <h2 className="text-lg font-medium mb-4">Focus Sessions</h2>
            <p className="text-black/60 text-sm">
              Deep work without distractions.
            </p>
          </div>

          {/* Journal section */}
          <div className="relative p-6 border border-black/10 rounded-3xl">
            <TutorialBadge position="top-right" />
            <h2 className="text-lg font-medium mb-4">Daily Journal</h2>
            <p className="text-black/60 text-sm">
              Track your stress and progress.
            </p>
          </div>
        </div>

        {/* Tutorial prompt card (if not started) */}
        {!canRestartTutorial() && shouldShowTutorial() && (
          <div className="p-6 border-2 border-[#16A34A]/20 bg-[#16A34A]/5 rounded-3xl">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <h3 className="font-medium">Ready to master Productif.io?</h3>
                <p className="text-sm text-black/60">
                  Take a 5-minute guided tour to learn all the features.
                </p>
              </div>
              <button
                onClick={() => setShowTutorial(true)}
                className="px-4 py-2 bg-[#16A34A] text-white rounded-2xl hover:bg-[#16A34A]/90 transition-all text-sm whitespace-nowrap"
              >
                Start tutorial
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
