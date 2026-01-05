# Tutorial Notification Options

After onboarding completion, you can choose between two notification styles to invite users to start the tutorial.

## Option 1: Modal Prompt (Recommended) ✨

**Component:** `TutorialPrompt`

**Style:** Full-screen modal with backdrop
**Best for:** First-time users, high priority
**Visual impact:** High
**Dismissibility:** Easy (click backdrop or X button)

### Features:
- ✅ Centered modal with backdrop blur
- ✅ Large icon with pulse animation
- ✅ Detailed benefits list (4 bullet points)
- ✅ Two clear CTAs: "Start" and "Later"
- ✅ Close button (X) in top-right
- ✅ Spring animation entrance
- ✅ Multi-language support (EN/FR/ES)

### Usage:
```tsx
<TutorialPrompt
  isOpen={showPrompt}
  onStart={handleStart}
  onDismiss={handleDismiss}
  language="fr"
/>
```

### Visual Preview:
```
┌─────────────────────────────────────┐
│  [Backdrop blur with 40% opacity]   │
│                                      │
│    ┌──────────────────────┐    [X]  │
│    │                      │         │
│    │    [✨ Sparkles]     │         │
│    │                      │         │
│    │  Prêt à maîtriser    │         │
│    │  Productif.io ?      │         │
│    │                      │         │
│    │  Un didacticiel...   │         │
│    │                      │         │
│    │  • Organiser vos...  │         │
│    │  • Planifier votre...│         │
│    │  • Maîtriser les...  │         │
│    │  • Découvrir le...   │         │
│    │                      │         │
│    │ [Commencer le tuto]  │         │
│    │    [Plus tard]       │         │
│    └──────────────────────┘         │
│                                      │
└─────────────────────────────────────┘
```

---

## Option 2: Toast Notification 🎯

**Component:** `TutorialToast`

**Style:** Bottom-right toast (mobile: bottom-full-width)
**Best for:** Returning users, low friction
**Visual impact:** Medium
**Dismissibility:** Very easy (non-blocking)

### Features:
- ✅ Non-intrusive bottom placement
- ✅ Green accent bar on top
- ✅ Compact design with icon
- ✅ Slide-up animation
- ✅ Auto-positions on mobile
- ✅ Doesn't block main app interaction
- ✅ Multi-language support (EN/FR/ES)

### Usage:
```tsx
<TutorialToast
  isOpen={showToast}
  onStart={handleStart}
  onDismiss={handleDismiss}
  language="fr"
/>
```

### Visual Preview:
```
Desktop:
┌──────────────────────────────────────┐
│  [Your Main App]                     │
│                                      │
│                                      │
│                                      │
│                  ┌─────────────┐ [X]│
│                  │━━━━━━━━━━━━━│    │
│                  │ ✨ Faire un │    │
│                  │ tour rapide?│    │
│                  │             │    │
│                  │ 5 minutes   │    │
│                  │ pour...     │    │
│                  │             │    │
│                  │[Commencer]  │    │
│                  │  [Plus tard]│    │
│                  └─────────────┘    │
└──────────────────────────────────────┘

Mobile:
┌────────────────────┐
│  [Your Main App]   │
│                    │
│                    │
│                    │
│┌──────────────────┐│
││━━━━━━━━━━━━━━━━━━││
││ ✨ Faire un   [X]││
││ tour rapide?     ││
││                  ││
││ 5 minutes pour...││
││                  ││
││[Commencer] [+tard]│
│└──────────────────┘│
└────────────────────┘
```

---

## Comparison Table

| Feature | Modal | Toast |
|---------|-------|-------|
| **Attention** | High | Medium |
| **Intrusive** | Yes | No |
| **Blocking** | Yes | No |
| **Details** | Full | Brief |
| **Mobile-friendly** | Good | Excellent |
| **Recommended for** | First-time | All users |

---

## Integration Examples

### 1. Modal (Default)

```tsx
import { TutorialPrompt } from './components/tutorial';

function App() {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (onboardingComplete && shouldShowTutorial()) {
      setTimeout(() => setShowPrompt(true), 500);
    }
  }, [onboardingComplete]);

  return (
    <>
      <MainApp />
      <TutorialPrompt
        isOpen={showPrompt}
        onStart={() => {
          setShowPrompt(false);
          startTutorial();
        }}
        onDismiss={() => {
          setShowPrompt(false);
          skipTutorial();
        }}
        language="fr"
      />
    </>
  );
}
```

### 2. Toast (Alternative)

```tsx
import { TutorialToast } from './components/tutorial';

function App() {
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (onboardingComplete && shouldShowTutorial()) {
      setTimeout(() => setShowToast(true), 500);
    }
  }, [onboardingComplete]);

  return (
    <>
      <MainApp />
      <TutorialToast
        isOpen={showToast}
        onStart={() => {
          setShowToast(false);
          startTutorial();
        }}
        onDismiss={() => {
          setShowToast(false);
          skipTutorial();
        }}
        language="fr"
      />
    </>
  );
}
```

### 3. Progressive (Smart)

Start with toast, escalate to modal if ignored:

```tsx
function App() {
  const [notificationType, setNotificationType] = useState<'toast' | 'modal' | null>('toast');
  
  useEffect(() => {
    if (onboardingComplete && shouldShowTutorial()) {
      // Show toast first
      setTimeout(() => setNotificationType('toast'), 500);
      
      // Escalate to modal after 10 seconds if still visible
      const escalateTimer = setTimeout(() => {
        if (notificationType === 'toast') {
          setNotificationType('modal');
        }
      }, 10000);
      
      return () => clearTimeout(escalateTimer);
    }
  }, [onboardingComplete]);

  return (
    <>
      <MainApp />
      
      {notificationType === 'toast' && (
        <TutorialToast
          isOpen={true}
          onStart={handleStart}
          onDismiss={handleDismiss}
          language="fr"
        />
      )}
      
      {notificationType === 'modal' && (
        <TutorialPrompt
          isOpen={true}
          onStart={handleStart}
          onDismiss={handleDismiss}
          language="fr"
        />
      )}
    </>
  );
}
```

---

## Recommendation

**For Productif.io:** Use **TutorialPrompt (Modal)** 

**Why:**
- ✅ Aligns with calm, intentional design
- ✅ Ensures users see the invitation
- ✅ Clear commitment moment
- ✅ Better for first-time setup
- ✅ More professional feel

The modal creates a clear "moment" between onboarding and app usage, which fits Productif.io's philosophy of intentional, structured productivity.

---

## Testing Both

Use the `TutorialDemo` component to test both styles:

```tsx
import { TutorialDemo } from './components/tutorial';

// In your dev environment
<TutorialDemo />
```

This gives you a playground to test:
- Modal vs Toast
- Language switching
- Animation timing
- Dismissal behavior
- Mobile responsiveness
