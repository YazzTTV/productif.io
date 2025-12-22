# Dopamine Loops Design - Productif.io

## Core Principle

**Replace cheap dopamine (scrolling, novelty, comparison) with earned dopamine (progress, consistency, identity).**

---

## Rules

### ✅ Dopamine is ONLY triggered after meaningful action
- No dopamine for browsing, exploring, or configuring
- No dopamine for opening the app
- No random rewards
- No dopamine for passive consumption

### ✅ Allowed Dopamine Triggers

1. **Completing a priority task**
   - Task must be marked as priority
   - Task must be completed (checked off)
   - One-time trigger per task

2. **Completing a deep work session**
   - Session must reach completion (not cancelled)
   - Minimum duration: 15 minutes
   - Triggered once at session end

3. **Habit Streaks (Identity Continuity)**
   - **Core Principle**: Streaks represent identity continuity, not performance
   - Streaks grow slowly (one day at a time)
   - Breaking a streak is felt (acknowledged, not punished)
   - Streaks are visible only after daily actions (not before)
   - Messaging: Calm, matter-of-fact, no guilt, no shame
   - Examples: "Streak preserved." or "Streak reset."

4. **Showing up consistently (day count)**
   - Daily consistency milestones (7, 14, 30, 60, 90 days)
   - Based on completing at least one meaningful action per day
   - Only on milestone days

---

## Dopamine Format

### Visual Feedback
- **Duration**: 1-2 seconds maximum
- **Style**: Subtle, calm, satisfying
- **Animation**: Smooth fade-in/fade-out, gentle scale, soft glow
- **Colors**: Muted greens (#00C27A), soft gradients
- **No**: Confetti, explosions, bouncing, excessive movement

### Text
- **Length**: Maximum 3-5 words
- **Tone**: Calm, matter-of-fact, understated
- **Examples**: 
  - "Task completed"
  - "Session finished"
  - "Streak preserved."
  - "Streak reset."
  - "30 days consistent"
- **No**: "Amazing!", "Incredible!", "You're a rockstar!", excessive emojis
- **No**: Guilt, shame, judgment, pressure

### Haptic Feedback
- **Type**: Subtle vibration (light tap)
- **Duration**: 50-100ms
- **When**: Only for major milestones (30+ day streaks, deep work completion)
- **No**: Multiple vibrations, strong vibrations, constant feedback

### Sound
- **Type**: Optional, very subtle
- **Style**: Soft chime, gentle tone
- **Volume**: Low, can be disabled
- **No**: Loud sounds, multiple sounds, celebratory music

---

## Implementation Details

### 1. Task Completion

**Trigger**: User checks off a priority task

**Feedback**:
- Subtle green glow around task item (1 second)
- Light haptic (optional)
- Task fades to completed state
- No popup, no modal, no celebration

**Code Location**: `mobile-app-new/app/(tabs)/tasks.tsx` or `index.tsx`

**Implementation**:
```typescript
// Subtle animation on task completion
const handleTaskComplete = (taskId: string) => {
  // Complete task logic
  // Trigger subtle animation
  Animated.sequence([
    Animated.timing(glowOpacity, {
      toValue: 1,
      duration: 300,
    }),
    Animated.timing(glowOpacity, {
      toValue: 0,
      duration: 700,
    }),
  ]).start();
  
  // Optional: Light haptic for priority tasks only
  if (task.priority) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
};
```

---

### 2. Deep Work Session Completion

**Trigger**: Deep work session reaches completion (not cancelled)

**Feedback**:
- Brief progress bar completion animation
- Subtle green pulse on timer
- Minimal text: "Session completed" (fades after 2 seconds)
- Light haptic
- XP gain shown subtly (if applicable)

**Code Location**: `mobile-app-new/app/(tabs)/assistant.tsx`

**Implementation**:
```typescript
const handleSessionComplete = () => {
  // Session completion logic
  
  // Subtle completion animation
  Animated.parallel([
    // Progress bar fill
    Animated.timing(progressFill, {
      toValue: 100,
      duration: 500,
    }),
    // Subtle pulse
    Animated.sequence([
      Animated.timing(pulseScale, {
        toValue: 1.05,
        duration: 200,
      }),
      Animated.timing(pulseScale, {
        toValue: 1,
        duration: 300,
      }),
    ]),
  ]).start();
  
  // Light haptic
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  
  // Show minimal completion message (auto-dismiss after 2s)
  setCompletionMessage("Session completed");
  setTimeout(() => setCompletionMessage(null), 2000);
};
```

---

### 3. Habit Streaks (Identity Continuity)

**Core Principle**: Streaks represent identity continuity, not performance.

**Rules**:
- Streaks grow slowly (one day at a time)
- Breaking a streak is felt (acknowledged, not punished)
- Streaks are visible only after daily actions (not before)
- No celebration of streaks, only acknowledgment

**Trigger**: After completing a daily habit action

**Feedback**:
- **Streak Preserved**: 
  - Minimal text: "Streak preserved." (fades after 1.5 seconds)
  - Subtle green checkmark (1 second)
  - No animation, no haptic, no celebration
  - Streak counter updates quietly

- **Streak Reset**:
  - Minimal text: "Streak reset." (fades after 1.5 seconds)
  - Neutral tone, no red, no warning
  - No guilt, no shame, no judgment
  - Matter-of-fact acknowledgment

- **Streak Visibility**:
  - Streak counter only appears after action is completed
  - Not shown before action (no pressure)
  - Simple number display, no badges or icons
  - Visible in habit list, but not emphasized

**Code Location**: `mobile-app-new/app/(tabs)/habits.tsx` or `index.tsx`

**Implementation**:
```typescript
const handleHabitComplete = (habit: Habit) => {
  // Complete habit logic
  const previousStreak = habit.currentStreak;
  const newStreak = previousStreak + 1;
  
  // Update streak
  updateHabitStreak(habit.id, newStreak);
  
  // Show minimal acknowledgment (only after action)
  if (newStreak > 1) {
    // Streak preserved
    setStreakMessage("Streak preserved.");
    setTimeout(() => setStreakMessage(null), 1500);
  } else {
    // New streak started
    setStreakMessage("Streak started.");
    setTimeout(() => setStreakMessage(null), 1500);
  }
};

const handleHabitMissed = (habit: Habit) => {
  // Streak broken
  const previousStreak = habit.currentStreak;
  
  // Reset streak
  updateHabitStreak(habit.id, 0);
  
  // Show matter-of-fact message (no guilt, no shame)
  if (previousStreak > 0) {
    setStreakMessage("Streak reset.");
    setTimeout(() => setStreakMessage(null), 1500);
  }
  
  // No negative feedback, no warnings, no judgment
};
```

**Messaging Guidelines**:
- ✅ "Streak preserved."
- ✅ "Streak reset."
- ✅ "Streak started."
- ❌ "Don't break your streak!"
- ❌ "You're doing great!"
- ❌ "Keep it up!"
- ❌ "Don't give up!"
- ❌ "You've lost your streak 😢"
- ❌ "Try again tomorrow!"

---

### 4. Consistency Milestones

**Trigger**: Reaching daily consistency milestones (7, 14, 30, 60, 90 days)

**Feedback**:
- Subtle indicator in XP/progress section
- Soft pulse on progress bar
- Minimal text: "30 days consistent" (fades after 2 seconds)
- Light haptic (only for 30+ day milestones)

**Code Location**: `mobile-app-new/app/(tabs)/assistant.tsx` (XP section)

**Implementation**:
```typescript
const checkConsistencyMilestone = (daysConsistent: number) => {
  const milestones = [7, 14, 30, 60, 90];
  
  if (milestones.includes(daysConsistent)) {
    // Subtle pulse on progress indicator
    Animated.sequence([
      Animated.timing(progressPulse, {
        toValue: 1.1,
        duration: 200,
      }),
      Animated.timing(progressPulse, {
        toValue: 1,
        duration: 300,
      }),
    ]).start();
    
    // Haptic for significant milestones
    if (daysConsistent >= 30) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    // Show minimal message
    setConsistencyMessage(`${daysConsistent} days consistent`);
    setTimeout(() => setConsistencyMessage(null), 2000);
  }
};
```

---

## Forbidden Patterns

### ❌ Never Implement

1. **Confetti explosions**
   - No particle effects
   - No celebration animations
   - No excessive visual effects

2. **Excessive sounds**
   - No fanfares
   - No celebration music
   - No multiple sound effects

3. **Emojis everywhere**
   - Minimal use of emojis
   - Only in context (not for celebration)
   - No emoji spam

4. **Rewards without effort**
   - No daily login bonuses
   - No random rewards
   - No "surprise" rewards for browsing

5. **Infinite scrolling**
   - No endless feeds
   - No discovery sections
   - No "explore" tabs

6. **Comparison-based dopamine**
   - No leaderboards as primary feature
   - No "you're better than X%" messages
   - No social comparison triggers

7. **Novelty-based dopamine**
   - No "new feature" celebrations
   - No "first time" rewards
   - No exploration rewards

---

## Visual Design Guidelines

### Colors
- **Primary**: #00C27A (calm green)
- **Secondary**: #00D68F (lighter green for gradients)
- **Background**: White/light gray
- **Text**: Dark gray (#1F2937), muted
- **No**: Bright colors, high contrast, attention-grabbing

### Animations
- **Easing**: Ease-in-out, smooth curves
- **Duration**: 200-500ms for most, max 1000ms
- **Scale**: Subtle (1.0 to 1.05 max)
- **Opacity**: Fade in/out (0 to 1)
- **No**: Bouncing, elastic, spring effects, rapid movements

### Typography
- **Size**: Regular (14-16px)
- **Weight**: Medium (500-600)
- **Style**: Clean, minimal
- **No**: Bold headlines, large text, decorative fonts

---

## Testing Checklist

- [ ] Dopamine only triggers after meaningful action
- [ ] No dopamine on app open
- [ ] No dopamine for browsing/exploring
- [ ] Animations are subtle and calm
- [ ] Text is minimal and factual
- [ ] Haptics are light and infrequent
- [ ] No confetti or explosions
- [ ] No excessive emojis
- [ ] No comparison-based triggers
- [ ] User feels satisfaction, not hype

---

## Goal

**User associates dopamine with effort and alignment, not with novelty or distraction.**

The user should feel:
- ✅ Calm satisfaction after completing work
- ✅ Identity continuity through streaks (not performance pressure)
- ✅ Motivation from progress, not from rewards
- ✅ Focus on the work, not on the app
- ✅ Acceptance when streaks reset (no guilt, no shame)

The user should NOT feel:
- ❌ Excited about opening the app
- ❌ Addicted to checking notifications
- ❌ Motivated by random rewards
- ❌ Distracted by endless content
- ❌ Guilty or ashamed when breaking a streak
- ❌ Pressure to maintain streaks (they're identity markers, not goals)

---

## Implementation Priority

1. **Phase 1**: Task completion feedback (subtle)
2. **Phase 2**: Deep work session completion
3. **Phase 3**: Habit streak milestones
4. **Phase 4**: Consistency milestones
5. **Phase 5**: Refinement and testing

---

## Notes

- All dopamine triggers must be tied to actual work completion
- Feedback should feel earned, not given
- Less is more: subtle feedback is more powerful than excessive celebration
- User should focus on their work, not on the app's feedback
- Dopamine should reinforce the behavior, not become the goal
- **Streaks are identity markers, not performance metrics**
- Breaking a streak is a fact, not a failure
- Streaks grow slowly and are felt when broken, but without judgment
- Messaging must be calm, matter-of-fact, and free of guilt or shame

