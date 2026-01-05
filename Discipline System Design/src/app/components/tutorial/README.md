# Productif.io Tutorial System

A complete in-app guided tutorial system designed to help users master the app step by step.

## 🎯 Goals

- Reduce friction and confusion
- Build confidence and momentum
- Encourage immediate action, not passive reading
- Guide users through core features visually

## 📦 Components

### Core Components

- **`Tutorial.tsx`** - Main tutorial orchestrator
- **`TutorialIntro.tsx`** - Entry screen with progress visualization
- **`TutorialStep.tsx`** - Reusable step container
- **`TutorialCompletion.tsx`** - Success screen
- **`TutorialPrompt.tsx`** - Post-onboarding notification modal ⭐ NEW
- **`TutorialOverlay.tsx`** - Spotlight highlights with tooltips
- **`TutorialBadge.tsx`** - Visual indicators for new features
- **`TutorialProgress.tsx`** - Progress visualization component
- **`TutorialIntegration.tsx`** - Complete integration helper
- **`TutorialDemo.tsx`** - Demo/testing component

### Hook

- **`useTutorial()`** - State management and localStorage persistence

## 🚀 Quick Start

### 1. Post-Onboarding Notification (Recommended)

```tsx
import { TutorialIntegration } from './components/tutorial/TutorialIntegration';

function App() {
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  return (
    <TutorialIntegration
      onboardingComplete={onboardingComplete}
      onTutorialComplete={() => console.log('Tutorial done!')}
    >
      <YourMainApp />
    </TutorialIntegration>
  );
}
```

This automatically shows a beautiful notification modal after onboarding completes.

### 2. Manual Notification Control

```tsx
import { TutorialPrompt } from './components/tutorial';

function Dashboard() {
  const [showPrompt, setShowPrompt] = useState(true);

  return (
    <>
      <YourDashboard />
      
      <TutorialPrompt
        isOpen={showPrompt}
        onStart={() => {
          setShowPrompt(false);
          // Start tutorial
        }}
        onDismiss={() => setShowPrompt(false)}
        language="fr" // or 'en', 'es'
      />
    </>
  );
}
```

### 3. Add Restart Option in Settings

```tsx
import { useTutorial } from './hooks/useTutorial';

function Settings() {
  const { canRestartTutorial, resetTutorial } = useTutorial();

  return (
    <div>
      {canRestartTutorial() && (
        <button onClick={resetTutorial}>
          Restart Tutorial
        </button>
      )}
    </div>
  );
}
```

## 📋 Tutorial Flow

### Step 1: Intro Screen
- Shows 7-step progress path
- Clear value proposition: "Takes 5 minutes, saves hours"
- Primary CTA: "Start guided setup"
- Secondary: "Skip for now"

### Step 2: Your Tasks (Subjects)
- Guide user to create first subject
- Example placeholders: "Maths", "Law", "Biology"
- Microcopy: "You can adjust coefficients later"

### Step 3: Create Task
- Guide user to add first task
- Simple form: task name + difficulty
- Microcopy: "Start simple. One task is enough."

### Step 4: Plan My Day
- Navigate to Plan My Day feature
- Show input for tomorrow's plan
- CTA: "Generate my day"

### Step 5: Daily Journal
- Navigate to Journal section
- Show stress slider + mood selector
- Microcopy: "No judgment. Just awareness."

### Step 6: Habits
- Navigate to Habits section
- Add one simple habit
- Example: "Review plan in the morning"

### Step 7: Focus Session
- Navigate to Focus section
- Select task + duration
- CTA: "Start focus"

### Step 8: Exam Mode
- Show Exam Mode preview
- Explain distraction-free features
- Microcopy: "Only enter when you're ready"

### Step 9: Completion
- Success animation with checkmark
- Message: "You're set. You now have a system."
- CTA: "Go to my dashboard"

## 🎨 Design System

### Colors
- **Primary Green**: `#16A34A` (progress, highlights, confirmations)
- **Background**: White `#FFFFFF`
- **Text**: Black with opacity variants

### Animations
- Slide transitions between steps
- Fade in/out for overlays
- Pulse effect for highlights
- Spring animations for success states

### Typography
- Clean, minimal
- Letter spacing: `-0.04em` for headings
- Clear hierarchy with size and opacity

## 🔧 Customization

### Adding New Steps

1. Add step ID to `TutorialStepId` type
2. Add step to the `steps` array
3. Create step component with guide UI
4. Add to AnimatePresence in Tutorial.tsx

```tsx
// Example
{currentStep === 'new-feature' && (
  <TutorialStep
    key="new-feature"
    stepNumber={8}
    totalSteps={8}
    title="New Feature Title"
    description="Description here"
    action="Call to action"
    onNext={nextStep}
    onSkip={skipTutorial}
  >
    <NewFeatureGuide onComplete={nextStep} />
  </TutorialStep>
)}
```

### Custom Overlays

Use `TutorialOverlay` to highlight specific UI elements:

```tsx
<TutorialOverlay
  isActive={true}
  highlightArea={{
    x: 100,
    y: 200,
    width: 300,
    height: 60,
  }}
  tooltipPosition="bottom"
  tooltipContent={
    <TutorialTooltip
      title="This is important"
      description="Click here to..."
      actionLabel="Got it"
      onAction={() => {}}
    />
  }
/>
```

## 💾 State Management

Tutorial state is automatically saved to localStorage:

```ts
{
  status: 'not-started' | 'in-progress' | 'completed' | 'skipped',
  currentStep: number,
  completedSteps: string[],
  lastCompletedAt?: string
}
```

### Available Methods

- `startTutorial()` - Begin tutorial
- `completeTutorial()` - Mark as completed
- `skipTutorial()` - Mark as skipped
- `resetTutorial()` - Clear state and restart
- `shouldShowTutorial()` - Check if should display
- `canRestartTutorial()` - Check if restart available

## 🎯 Best Practices

### 1. Progressive Disclosure
- Show one action per screen
- Don't overload with features
- Focus on "what" and "why", not "how"

### 2. Encourage Action
- Make steps interactive
- Require actual task completion
- Avoid passive reading

### 3. Respect User Time
- Keep explanations short (1-2 sentences max)
- Allow skipping at any point
- Save progress automatically

### 4. Visual Guidance
- Use highlights and arrows
- Pulse animations for attention
- Clear visual hierarchy

### 5. Emotional Design
- Celebrate completion
- Use reassuring language
- No judgment or pressure

## 📱 Responsive Design

All components are mobile-first and responsive:
- Touch-friendly buttons (min 44px)
- Readable text sizes
- Proper spacing for small screens

## 🔍 Testing

Before deployment, test:
- [ ] All 7 steps complete successfully
- [ ] Skip functionality works
- [ ] State persists in localStorage
- [ ] Restart from settings works
- [ ] Mobile responsiveness
- [ ] Animations perform smoothly
- [ ] Accessibility (keyboard navigation)

## 🚢 Deployment Checklist

- [ ] Tutorial triggers after onboarding
- [ ] Can be dismissed and resumed
- [ ] Completion tracked in analytics
- [ ] Settings page has restart option
- [ ] No console errors
- [ ] Performance optimized
- [ ] Translations added (if multi-language)

## 📊 Success Metrics

Track these metrics to measure tutorial effectiveness:
- Tutorial completion rate
- Step drop-off points
- Time to complete
- Feature adoption after tutorial
- User retention (tutorialized vs non-tutorialized)

## 🎓 User Flow

```
Onboarding Complete
    ↓
Tutorial Intro (optional but encouraged)
    ↓
[User chooses: Start or Skip]
    ↓
Step 1: Subjects → Step 2: Tasks → Step 3: Plan
    ↓
Step 4: Journal → Step 5: Habits → Step 6: Focus
    ↓
Step 7: Exam Mode
    ↓
Completion Screen
    ↓
Dashboard (with tutorial restart available in Settings)
```

## 🆘 Support

For issues or questions:
1. Check console for errors
2. Verify localStorage is enabled
3. Clear tutorial state: `localStorage.removeItem('productif_tutorial_state')`
4. Review component props and types

---

**Final Emotion Goal**: "I know exactly what to do now."