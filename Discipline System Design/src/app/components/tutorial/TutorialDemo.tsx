import { useState } from 'react';
import { TutorialPrompt } from './TutorialPrompt';
import { Tutorial } from './Tutorial';
import { Button } from '../ui/button';

/**
 * Demo component to test the tutorial flow
 * Shows the complete journey: Main App → Prompt → Tutorial → Back to App
 */

export function TutorialDemo() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [language, setLanguage] = useState<'en' | 'fr' | 'es'>('fr');

  const handleStartTutorial = () => {
    setShowPrompt(false);
    setTimeout(() => {
      setShowTutorial(true);
    }, 300);
  };

  const handleDismissPrompt = () => {
    setShowPrompt(false);
  };

  const handleCompleteTutorial = () => {
    setShowTutorial(false);
    alert('Tutorial completed! 🎉');
  };

  const handleSkipTutorial = () => {
    setShowTutorial(false);
    alert('Tutorial skipped');
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

  // Main app with controls
  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-semibold tracking-tight">
            Tutorial System Demo
          </h1>
          <p className="text-black/60">
            Test the tutorial prompt and flow
          </p>
        </div>

        {/* Language selector */}
        <div className="flex justify-center gap-2">
          {(['en', 'fr', 'es'] as const).map((lang) => (
            <button
              key={lang}
              onClick={() => setLanguage(lang)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                language === lang
                  ? 'bg-[#16A34A] text-white'
                  : 'bg-black/5 text-black/60 hover:bg-black/10'
              }`}
            >
              {lang.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Controls */}
        <div className="space-y-4">
          <div className="p-6 border-2 border-black/10 rounded-3xl space-y-4">
            <h2 className="font-medium">Demo Controls</h2>
            
            <div className="space-y-3">
              <Button
                onClick={() => setShowPrompt(true)}
                className="w-full bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-2xl h-12"
              >
                Show Tutorial Prompt
              </Button>

              <Button
                onClick={() => setShowTutorial(true)}
                className="w-full bg-black hover:bg-black/90 text-white rounded-2xl h-12"
              >
                Go Directly to Tutorial
              </Button>
            </div>
          </div>

          {/* Flow explanation */}
          <div className="p-6 bg-black/5 rounded-3xl space-y-4">
            <h3 className="font-medium">Expected Flow</h3>
            <div className="space-y-3 text-sm text-black/70">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white border border-black/10 flex items-center justify-center text-xs font-medium">
                  1
                </div>
                <p>User completes onboarding</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white border border-black/10 flex items-center justify-center text-xs font-medium">
                  2
                </div>
                <p>Tutorial prompt appears (modal)</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white border border-black/10 flex items-center justify-center text-xs font-medium">
                  3
                </div>
                <p>User chooses: Start or Later</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white border border-black/10 flex items-center justify-center text-xs font-medium">
                  4
                </div>
                <p>If Start: Tutorial begins</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white border border-black/10 flex items-center justify-center text-xs font-medium">
                  5
                </div>
                <p>After completion: Main app</p>
              </div>
            </div>
          </div>

          {/* Integration code */}
          <div className="p-6 bg-black text-white rounded-3xl overflow-x-auto">
            <pre className="text-xs">
{`// In your OnboardingFlow.tsx
const handleOnboardingComplete = () => {
  setOnboardingComplete(true);
  // Prompt will show automatically
};

// In your App.tsx
import { TutorialIntegration } from './tutorial';

<TutorialIntegration
  onboardingComplete={onboardingComplete}
>
  <MainApp />
</TutorialIntegration>`}
            </pre>
          </div>
        </div>
      </div>

      {/* Tutorial Prompt */}
      <TutorialPrompt
        isOpen={showPrompt}
        onStart={handleStartTutorial}
        onDismiss={handleDismissPrompt}
        language={language}
      />
    </div>
  );
}
