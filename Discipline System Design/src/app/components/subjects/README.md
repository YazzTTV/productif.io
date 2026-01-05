# Subject Setup Flow - Productif.io

A calm, reassuring flow for students to structure their academic work by subjects and coefficients.

## 🎯 Purpose

Help high-performance students (16-30) organize their work without mental overload by:
- Adding subjects (courses, classes)
- Assigning coefficients (importance/weight)
- Understanding automatic prioritization

## 🎨 Design Principles

### Visual Identity
- **Background:** White (#FFFFFF)
- **Accent:** Green (#16A34A) for progress & confirmation
- **Typography:** Clean, slightly condensed (letter-spacing: -0.04em)
- **Cards:** Rounded corners (rounded-2xl), soft shadows
- **Animations:** Subtle scale, fade, slide transitions

### Emotional Design
- **Calm, not gamified**
- **Reassuring, not pressuring**
- **Serious, not childish**
- **Clear, not overwhelming**

Target feeling: *"I finally see what actually matters. I'm not guessing anymore."*

---

## 📦 Components

### 1. `SubjectSetupFlow`
Main orchestrator component that manages the 4-step flow.

**Props:**
```tsx
interface SubjectSetupFlowProps {
  onComplete: (subjects: Subject[]) => void;
  onSkip?: () => void;
  initialSubjects?: Subject[];
}
```

**Flow:**
1. Intro → 2. Add Subject → 3. Subject List → 4. Education

---

### 2. `SubjectIntro`
**Page 1:** Introduction to subject structure

**Features:**
- Title: "Let's structure your work."
- Subtitle: "Everything you do is organized by subject."
- Visual preview of example subjects
- CTA: "Add my subjects"

**Example subjects shown:**
- Mathematics (High priority)
- Law (Medium priority)
- Biology (Medium priority)
- Economics (Low priority)

---

### 3. `AddSubjectForm`
**Page 2:** Form to add a new subject

**Fields:**
- **Subject name** (text input)
  - Smart placeholders: Mathematics, Law, Biology, Economics, etc.
  - Duplicate detection
  - Required field

- **Coefficient selector** (1-3)
  - 1 = Low impact (less important)
  - 2 = Medium impact (standard priority)
  - 3 = High impact (critical for results)
  - Visual feedback: dots, color intensity, labels

**Microcopy:**
- "This reflects how much this subject matters for your results."
- "You can edit this later"

**Modes:**
- Full page (initial add)
- Modal (adding more subjects)

---

### 4. `SubjectList`
**Page 3:** Overview of added subjects

**Display:**
- Vertical list of subject cards
- Each card shows:
  - Subject name
  - Coefficient badge (Low/Medium/High)
  - Priority dots (visual indicator)
  - Progress bar (empty initially)
  - Edit/Delete buttons (on hover)

**Actions:**
- Add another subject (dashed border button)
- Edit coefficient inline
- Delete subject
- Continue to next step

**Microcopy:**
- "Higher coefficients will be prioritized automatically."
- "Add at least one subject to continue"

---

### 5. `SubjectEducation`
**Page 4:** Light education about prioritization

**Content:**
- Title: "How Productif prioritizes your work"
- 3 key points:
  1. Subjects with higher coefficients matter more
  2. Harder tasks are planned earlier
  3. Exam proximity increases priority automatically

**Reassurance box:**
"You don't need to think about what to work on next. The system handles complexity. You just execute."

**CTA:** "Got it"

---

## 🪝 Hooks

### `useSubjects()`

Manages subject state with localStorage persistence.

**Usage:**
```tsx
const {
  subjects,              // Subject[]
  addSubject,            // (subject) => Subject
  updateSubject,         // (id, updates) => void
  deleteSubject,         // (id) => void
  getSubjectById,        // (id) => Subject | undefined
  getSubjectsByCoefficient, // (coef) => Subject[]
  getSortedSubjects,     // () => Subject[] (sorted by coef)
  clearAllSubjects,      // () => void
  hasSubjects,           // boolean
} = useSubjects();
```

**Storage key:** `productif_subjects`

---

## 🚀 Integration

### Basic Usage

```tsx
import { SubjectSetupFlow } from './components/subjects';
import { useSubjects } from './hooks/useSubjects';

function App() {
  const { subjects } = useSubjects();
  const [showSetup, setShowSetup] = useState(!subjects.length);

  if (showSetup) {
    return (
      <SubjectSetupFlow
        onComplete={(newSubjects) => {
          console.log('Setup complete:', newSubjects);
          setShowSetup(false);
        }}
        onSkip={() => setShowSetup(false)}
      />
    );
  }

  return <Dashboard subjects={subjects} />;
}
```

### In Tutorial Flow

```tsx
// Step 1 of tutorial: Add subjects
import { AddSubjectForm } from './components/subjects';

function TutorialStep1() {
  const { addSubject, subjects } = useSubjects();

  return (
    <TutorialStep
      title="Your work is organized by subjects."
      description="This keeps things clear."
    >
      <AddSubjectForm
        onAdd={(subject) => {
          addSubject(subject);
          nextStep();
        }}
        existingSubjects={subjects}
      />
    </TutorialStep>
  );
}
```

### Standalone Subject Manager

```tsx
import { SubjectList } from './components/subjects';

function SubjectsPage() {
  const { 
    subjects, 
    updateSubject, 
    deleteSubject 
  } = useSubjects();

  return (
    <SubjectList
      subjects={subjects}
      onAddSubject={() => setShowAddModal(true)}
      onEditSubject={updateSubject}
      onDeleteSubject={deleteSubject}
      onContinue={() => navigate('/tasks')}
    />
  );
}
```

---

## 📊 Data Structure

### Subject Interface

```tsx
interface Subject {
  id: string;              // "subject_1234567890_0.123"
  name: string;            // "Mathematics"
  coefficient: 1 | 2 | 3;  // Priority level
  color?: string;          // Optional custom color
  createdAt: string;       // ISO date string
}
```

### Coefficient Labels

```tsx
const COEF_LABELS = {
  1: { label: 'Low', color: 'bg-black/5 text-black/60' },
  2: { label: 'Medium', color: 'bg-[#16A34A]/10 text-[#16A34A]/80' },
  3: { label: 'High', color: 'bg-[#16A34A]/15 text-[#16A34A]' },
};
```

---

## 🎬 Animations

### Entry Animations
```tsx
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
exit={{ opacity: 0, y: -20 }}
```

### List Item Stagger
```tsx
transition={{ delay: index * 0.05 }}
```

### Button Hover
```css
hover:shadow-xl hover:shadow-[#16A34A]/30
```

### Scale on Interaction
```css
hover:scale-105 transition-all
```

---

## ✅ User Experience Guidelines

### 1. No Pressure Language
❌ "You MUST add subjects"
✅ "Let's structure your work"

❌ "Set your priorities correctly"
✅ "This reflects how much this subject matters"

### 2. Forgiving Design
- Everything can be edited later
- No minimum/maximum subjects enforced
- Duplicate detection is helpful, not blocking
- Delete is available but not prominent

### 3. Clear Feedback
- Green accent confirms positive actions
- Visual dots show priority at a glance
- Inline editing reduces navigation
- Microcopy explains without lecturing

### 4. Progressive Disclosure
- Start simple (name + coefficient)
- Add complexity later (tasks, deadlines)
- Education comes after action
- Optional skip at intro only

---

## 🧪 Testing

### Test the Demo

```tsx
import { SubjectSetupDemo } from './components/subjects/SubjectSetupDemo';

// Render demo
<SubjectSetupDemo />
```

### Clear State

```js
localStorage.removeItem('productif_subjects');
window.location.reload();
```

### Test Cases

1. **Empty state:**
   - Should show intro screen
   - Should require at least one subject to continue

2. **Adding subjects:**
   - Duplicate names should show error
   - All 3 coefficients should be selectable
   - Form should reset after adding

3. **Subject list:**
   - Should show all added subjects
   - Edit should work inline
   - Delete should remove immediately
   - "Add another" should open modal

4. **Education:**
   - Should show 3 priority rules
   - "Got it" should complete flow

5. **Persistence:**
   - Subjects should survive page reload
   - Changes should save immediately

---

## 📱 Responsive Design

### Mobile
- Full-width cards
- Stacked layout
- Touch-friendly buttons (min 44px)
- Modal overlays for adding

### Desktop
- Max-width constraints (2xl)
- Hover states visible
- Grid layouts for lists
- Inline editing

---

## 🎨 Styling Guide

### Colors

```css
/* Primary green - use sparingly */
bg-[#16A34A]
text-[#16A34A]
border-[#16A34A]

/* Green tints for backgrounds */
bg-[#16A34A]/5   /* Very light */
bg-[#16A34A]/10  /* Light */
bg-[#16A34A]/15  /* Medium */

/* Shadows with green tint */
shadow-[#16A34A]/20
shadow-[#16A34A]/30
```

### Typography

```css
/* Headings */
tracking-tight
letter-spacing: -0.04em (h1)
letter-spacing: -0.03em (h2)

/* Body */
text-black/60 (secondary text)
text-black/40 (tertiary text)
```

### Spacing

```css
/* Cards */
p-5, p-6, p-8 (progressive)
space-y-3, space-y-4, space-y-8

/* Rounded corners */
rounded-2xl (standard)
rounded-3xl (large cards)
rounded-xl (small elements)
```

---

## 🔗 Related Components

- **Tutorial** → Uses `AddSubjectForm` in Step 1
- **Tasks** → Displays subjects with task counts
- **Plan My Day** → Prioritizes based on coefficients
- **Dashboard** → Shows subject overview

---

## 📝 Best Practices

### DO
✅ Show coefficient as dots + label
✅ Use green only for confirmation/progress
✅ Keep microcopy short and reassuring
✅ Allow editing after creation
✅ Sort by coefficient (high to low)

### DON'T
❌ Use red for importance (use green shades)
❌ Force users to add many subjects
❌ Make coefficient too "academic" (no decimals)
❌ Block users with validation
❌ Use emojis or playful language

---

## 🚢 Production Checklist

- [ ] Subjects persist in localStorage
- [ ] Form validation works
- [ ] Duplicate detection functional
- [ ] Edit/delete work correctly
- [ ] Animations smooth on mobile
- [ ] Education screen clear
- [ ] No console errors
- [ ] Accessible (keyboard navigation)
- [ ] Screen reader friendly
- [ ] Works offline

---

## 🎯 Success Metrics

Track these to measure effectiveness:
- Completion rate (intro → education)
- Average subjects added (target: 4-6)
- Coefficient distribution
- Time to complete flow
- Drop-off points

---

**Target Emotion:** "I finally see what actually matters. I'm not guessing anymore."
