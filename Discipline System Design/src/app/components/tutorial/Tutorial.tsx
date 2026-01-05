import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TutorialIntro } from './TutorialIntro';
import { TutorialStep } from './TutorialStep';
import { TutorialCompletion } from './TutorialCompletion';
import { TutorialOverlay } from './TutorialOverlay';

interface TutorialProps {
  onComplete: () => void;
  onSkip: () => void;
}

export type TutorialStepId = 
  | 'intro'
  | 'subjects'
  | 'create-task'
  | 'plan-day'
  | 'journal'
  | 'habits'
  | 'focus'
  | 'exam-mode'
  | 'completion';

export function Tutorial({ onComplete, onSkip }: TutorialProps) {
  const [currentStep, setCurrentStep] = useState<TutorialStepId>('intro');
  const [completedSteps, setCompletedSteps] = useState<TutorialStepId[]>([]);

  const steps: TutorialStepId[] = [
    'subjects',
    'create-task',
    'plan-day',
    'journal',
    'habits',
    'focus',
    'exam-mode',
  ];

  const getCurrentStepIndex = () => {
    return steps.indexOf(currentStep as any);
  };

  const totalSteps = steps.length;
  const currentStepNumber = getCurrentStepIndex() + 1;

  const nextStep = () => {
    const currentIndex = getCurrentStepIndex();
    
    // Mark current step as completed
    if (currentStep !== 'intro' && currentStep !== 'completion') {
      setCompletedSteps([...completedSteps, currentStep]);
    }

    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    } else {
      setCurrentStep('completion');
    }
  };

  const startTutorial = () => {
    setCurrentStep('subjects');
  };

  const skipTutorial = () => {
    onSkip();
  };

  const completeTutorial = () => {
    onComplete();
  };

  // Intro screen
  if (currentStep === 'intro') {
    return (
      <TutorialIntro
        onStart={startTutorial}
        onSkip={skipTutorial}
      />
    );
  }

  // Completion screen
  if (currentStep === 'completion') {
    return (
      <TutorialCompletion
        onComplete={completeTutorial}
      />
    );
  }

  // Tutorial steps
  return (
    <div className="relative min-h-screen bg-white">
      <AnimatePresence mode="wait">
        {/* Step 1: Subjects */}
        {currentStep === 'subjects' && (
          <TutorialStep
            key="subjects"
            stepNumber={1}
            totalSteps={totalSteps}
            title="Your work is organized by subjects."
            description="This keeps things clear."
            action="Add your first subject"
            microcopy="You can adjust coefficients later."
            highlightArea="subjects"
            onNext={nextStep}
            onSkip={skipTutorial}
          >
            {/* Subject creation form will be rendered here */}
            <SubjectCreationGuide onComplete={nextStep} />
          </TutorialStep>
        )}

        {/* Step 2: Create Task */}
        {currentStep === 'create-task' && (
          <TutorialStep
            key="create-task"
            stepNumber={2}
            totalSteps={totalSteps}
            title="Tasks are what you actually work on."
            description="Start simple. One task is enough."
            action="Create your first task"
            microcopy="Add a name and difficulty level."
            highlightArea="add-task"
            onNext={nextStep}
            onSkip={skipTutorial}
          >
            <TaskCreationGuide onComplete={nextStep} />
          </TutorialStep>
        )}

        {/* Step 3: Plan My Day */}
        {currentStep === 'plan-day' && (
          <TutorialStep
            key="plan-day"
            stepNumber={3}
            totalSteps={totalSteps}
            title="This is where your day becomes clear."
            description="Describe your day freely. We'll organize it."
            action="Generate your day"
            microcopy="Speak or type — whatever feels easier."
            highlightArea="plan-day"
            onNext={nextStep}
            onSkip={skipTutorial}
          >
            <PlanDayGuide onComplete={nextStep} />
          </TutorialStep>
        )}

        {/* Step 4: Journal */}
        {currentStep === 'journal' && (
          <TutorialStep
            key="journal"
            stepNumber={4}
            totalSteps={totalSteps}
            title="This helps you unload stress and track how you feel."
            description="No judgment. Just awareness."
            action="Complete one check-in"
            microcopy="Takes less than 30 seconds."
            highlightArea="journal"
            onNext={nextStep}
            onSkip={skipTutorial}
          >
            <JournalGuide onComplete={nextStep} />
          </TutorialStep>
        )}

        {/* Step 5: Habits */}
        {currentStep === 'habits' && (
          <TutorialStep
            key="habits"
            stepNumber={5}
            totalSteps={totalSteps}
            title="Habits are small actions that protect your energy."
            description="Small habits, big impact."
            action="Add one simple habit"
            microcopy="Example: Review plan in the morning."
            highlightArea="habits"
            onNext={nextStep}
            onSkip={skipTutorial}
          >
            <HabitsGuide onComplete={nextStep} />
          </TutorialStep>
        )}

        {/* Step 6: Focus Session */}
        {currentStep === 'focus' && (
          <TutorialStep
            key="focus"
            stepNumber={6}
            totalSteps={totalSteps}
            title="This is where real work happens."
            description="Select a task and duration."
            action="Start your first focus session"
            microcopy="You can stop anytime."
            highlightArea="focus"
            onNext={nextStep}
            onSkip={skipTutorial}
          >
            <FocusGuide onComplete={nextStep} />
          </TutorialStep>
        )}

        {/* Step 7: Exam Mode */}
        {currentStep === 'exam-mode' && (
          <TutorialStep
            key="exam-mode"
            stepNumber={7}
            totalSteps={totalSteps}
            title="Exam Mode removes all distractions and locks you in."
            description="Only enter when you're ready."
            action="Preview Exam Mode"
            microcopy="Pressure-proof timer for deep work."
            highlightArea="exam-mode"
            onNext={nextStep}
            onSkip={skipTutorial}
          >
            <ExamModeGuide onComplete={nextStep} />
          </TutorialStep>
        )}
      </AnimatePresence>
    </div>
  );
}

// Placeholder guide components (to be implemented)
function SubjectCreationGuide({ onComplete }: { onComplete: () => void }) {
  const [subjectName, setSubjectName] = useState('');
  
  const handleCreate = () => {
    if (subjectName.trim()) {
      // Save subject logic here
      onComplete();
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <label className="text-sm text-black/60">Subject name</label>
        <input
          type="text"
          value={subjectName}
          onChange={(e) => setSubjectName(e.target.value)}
          placeholder="e.g., Mathematics, Biology, Law..."
          className="w-full px-4 py-3 border border-black/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A]"
        />
      </div>
      
      <div className="flex gap-3">
        <button
          onClick={handleCreate}
          disabled={!subjectName.trim()}
          className="flex-1 bg-[#16A34A] hover:bg-[#16A34A]/90 text-white py-3 rounded-2xl disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          Add subject
        </button>
      </div>
    </div>
  );
}

function TaskCreationGuide({ onComplete }: { onComplete: () => void }) {
  const [taskName, setTaskName] = useState('');
  const [difficulty, setDifficulty] = useState(2);

  const handleCreate = () => {
    if (taskName.trim()) {
      onComplete();
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <label className="text-sm text-black/60">Task name</label>
        <input
          type="text"
          value={taskName}
          onChange={(e) => setTaskName(e.target.value)}
          placeholder="e.g., Review chapter 3, Write essay..."
          className="w-full px-4 py-3 border border-black/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A]"
        />
      </div>

      <div className="space-y-3">
        <label className="text-sm text-black/60">Difficulty</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((level) => (
            <button
              key={level}
              onClick={() => setDifficulty(level)}
              className={`flex-1 py-2 rounded-xl border transition-all ${
                difficulty >= level
                  ? 'border-[#16A34A] bg-[#16A34A]/10'
                  : 'border-black/10 hover:border-black/20'
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleCreate}
        disabled={!taskName.trim()}
        className="w-full bg-[#16A34A] hover:bg-[#16A34A]/90 text-white py-3 rounded-2xl disabled:opacity-40 disabled:cursor-not-allowed transition-all"
      >
        Create task
      </button>
    </div>
  );
}

function PlanDayGuide({ onComplete }: { onComplete: () => void }) {
  return (
    <div className="space-y-6">
      <textarea
        placeholder="Tomorrow I have calculus class at 9am, then I need to work on my biology lab report..."
        className="w-full px-4 py-3 border border-black/10 rounded-2xl min-h-[120px] focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] resize-none"
      />
      <button
        onClick={onComplete}
        className="w-full bg-[#16A34A] hover:bg-[#16A34A]/90 text-white py-3 rounded-2xl transition-all"
      >
        Generate my day
      </button>
    </div>
  );
}

function JournalGuide({ onComplete }: { onComplete: () => void }) {
  const [stress, setStress] = useState(3);

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <label className="text-sm text-black/60">How stressed do you feel?</label>
        <input
          type="range"
          min="1"
          max="5"
          value={stress}
          onChange={(e) => setStress(Number(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-black/40">
          <span>Calm</span>
          <span>Overwhelmed</span>
        </div>
      </div>
      <button
        onClick={onComplete}
        className="w-full bg-[#16A34A] hover:bg-[#16A34A]/90 text-white py-3 rounded-2xl transition-all"
      >
        Save journal
      </button>
    </div>
  );
}

function HabitsGuide({ onComplete }: { onComplete: () => void }) {
  const [habit, setHabit] = useState('');

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <label className="text-sm text-black/60">Habit description</label>
        <input
          type="text"
          value={habit}
          onChange={(e) => setHabit(e.target.value)}
          placeholder="e.g., Review plan in the morning"
          className="w-full px-4 py-3 border border-black/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A]"
        />
      </div>
      <button
        onClick={onComplete}
        disabled={!habit.trim()}
        className="w-full bg-[#16A34A] hover:bg-[#16A34A]/90 text-white py-3 rounded-2xl disabled:opacity-40 disabled:cursor-not-allowed transition-all"
      >
        Add habit
      </button>
    </div>
  );
}

function FocusGuide({ onComplete }: { onComplete: () => void }) {
  const [duration, setDuration] = useState(25);

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <label className="text-sm text-black/60">Focus duration (minutes)</label>
        <input
          type="range"
          min="15"
          max="90"
          step="5"
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
          className="w-full"
        />
        <div className="text-center text-2xl font-medium">{duration} min</div>
      </div>
      <button
        onClick={onComplete}
        className="w-full bg-[#16A34A] hover:bg-[#16A34A]/90 text-white py-3 rounded-2xl transition-all"
      >
        Start focus
      </button>
    </div>
  );
}

function ExamModeGuide({ onComplete }: { onComplete: () => void }) {
  return (
    <div className="space-y-6">
      <div className="p-6 border-2 border-[#16A34A]/20 bg-[#16A34A]/5 rounded-2xl">
        <h3 className="font-medium mb-2">Exam Mode features:</h3>
        <ul className="space-y-2 text-sm text-black/60">
          <li>• Distraction-free interface</li>
          <li>• Pressure-proof timer</li>
          <li>• Single-task focus</li>
          <li>• No notifications</li>
        </ul>
      </div>
      <button
        onClick={onComplete}
        className="w-full bg-[#16A34A] hover:bg-[#16A34A]/90 text-white py-3 rounded-2xl transition-all"
      >
        Got it
      </button>
    </div>
  );
}
