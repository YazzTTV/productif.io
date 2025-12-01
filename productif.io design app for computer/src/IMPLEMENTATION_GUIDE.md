# Productif.io Implementation Guide

## Table of Contents
1. [Overview](#overview)
2. [Design System](#design-system)
3. [Project Structure](#project-structure)
4. [Step-by-Step Implementation](#step-by-step-implementation)
5. [Multi-Language Support](#multi-language-support)
6. [Mobile to Desktop Conversion](#mobile-to-desktop-conversion)
7. [Component Guidelines](#component-guidelines)
8. [Best Practices](#best-practices)

---

## Overview

**Productif.io** is a modern productivity app with a premium, data-driven aesthetic that helps users understand themselves, track habits, and boost focus. The app features a complete user journey including:

- Welcome screen
- Onboarding quiz
- AI processing
- Profile results
- Main dashboard with extensive analytics
- AI assistant chat interface
- Settings page
- Leaderboard
- Task management

---

## Design System

### Color Palette

**Primary Colors:**
- Primary Gradient: `from-[#00C27A] to-[#00D68F]`
- White Background: `#FFFFFF`
- Gray Backgrounds: `from-gray-50 via-white to-gray-100`

**Accent Colors:**
- Orange/Pink Gradient: `from-orange-400 to-pink-500` (Streak)
- Purple/Indigo Gradient: `from-purple-500 to-indigo-600` (Score)
- Amber/Orange Gradient: `from-amber-400 to-orange-500` (Achievements)
- Cyan/Blue Gradient: `from-cyan-400 to-blue-500` (Performance)

**Text Colors:**
- Primary Text: `text-gray-800`
- Secondary Text: `text-gray-600`
- Tertiary Text: `text-gray-500`
- Muted Text: `text-gray-400`

### Typography

**Important:** Do NOT use Tailwind font size, weight, or line-height classes unless specifically requested. The app uses default typography setup in `/styles/globals.css`.

**Heading Sizes (when needed):**
- Hero Title: `text-3xl` or `text-4xl`
- Section Title: `text-2xl`
- Card Title: `text-xl`
- Subsection: `text-lg`
- Body: `text-base`
- Small: `text-sm`
- Extra Small: `text-xs`

### Spacing & Layout

**Desktop (1920x1080):**
- Max Container Width: `max-w-[1400px]`
- Container Padding: `px-8`
- Section Spacing: `py-8`
- Card Gap: `gap-6`

**Mobile (390x844):**
- Container Padding: `px-6`
- Section Spacing: `py-6`
- Card Gap: `gap-4`

### Border Radius

- Extra Large: `rounded-3xl` (Cards, major sections)
- Large: `rounded-2xl` (Buttons, badges)
- Medium: `rounded-xl` (Interactive elements)
- Full: `rounded-full` (Avatars, pills)

### Shadows

- Card Shadow: `shadow-lg`
- Elevated Shadow: `shadow-xl`
- Subtle Shadow: `shadow-sm`
- Strong Shadow: `shadow-2xl`

### Animations

**Motion/React (Framer Motion) Presets:**

```typescript
// Page entrance
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
transition={{ delay: 0.1 }}

// Hover scale
whileHover={{ scale: 1.05 }}
whileTap={{ scale: 0.95 }}

// Shimmer effect
animate={{ x: ['-100%', '200%'] }}
transition={{ duration: 3, repeat: Infinity, ease: "linear" }}

// Progress bar
initial={{ width: 0 }}
animate={{ width: '87%' }}
transition={{ duration: 1 }}
```

---

## Project Structure

```
/
├── App.tsx                          # Main app component with routing
├── styles/
│   └── globals.css                  # Global styles and CSS variables
├── components/
│   ├── DashboardPage.tsx            # Main dashboard
│   ├── AssistantPage.tsx            # AI chat assistant
│   ├── SettingsPage.tsx             # User settings
│   ├── LeaderboardPage.tsx          # User rankings
│   ├── ProfileRevealScreen.tsx      # Onboarding results
│   ├── SocialProofPage.tsx          # Social features
│   ├── SymptomsAnalysisPage.tsx     # User analysis
│   ├── ui/                          # shadcn/ui components
│   └── figma/
│       └── ImageWithFallback.tsx    # Protected image component
└── imports/                          # Figma imported assets
```

---

## Step-by-Step Implementation

### Phase 1: Setup and Foundation

#### Step 1: Initialize Project Structure
1. Create the basic React + TypeScript project
2. Install required dependencies:
   ```bash
   npm install motion tailwindcss lucide-react recharts react-slick
   ```
3. Set up Tailwind CSS v4.0 (no config file needed)
4. Create `/styles/globals.css` with design tokens

#### Step 2: Create Global Styles
In `/styles/globals.css`:
```css
@import "tailwindcss";

:root {
  --primary-green: #00C27A;
  --primary-green-dark: #00D68F;
  /* Add other CSS variables */
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  -webkit-font-smoothing: antialiased;
}
```

#### Step 3: Create Main App Component
In `/App.tsx`:
```typescript
import { useState } from 'react';
import { DashboardPage } from './components/DashboardPage';

export type Screen = 
  | 'welcome'
  | 'dashboard'
  | 'assistant'
  | 'settings'
  | 'leaderboard'
  | 'tasks'
  | 'analytics';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('dashboard');
  
  return (
    <div className="min-h-screen">
      {currentScreen === 'dashboard' && (
        <DashboardPage onNavigate={setCurrentScreen} />
      )}
      {/* Add other screens */}
    </div>
  );
}
```

### Phase 2: Dashboard Implementation

#### Step 4: Create Navigation Bar
```typescript
// Top Navigation with logo and menu
<nav className="bg-white/80 backdrop-blur-lg border-b border-gray-200">
  <div className="max-w-[1400px] mx-auto px-8 py-4">
    <div className="flex items-center justify-between">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <ImageWithFallback src={logoIcon} alt="Productif.io" className="w-16 h-16" />
        <h1 className="text-2xl text-gray-900">Productif.io</h1>
      </div>
      
      {/* Navigation Links */}
      <div className="flex items-center gap-2">
        <button className="px-6 py-2.5 bg-gradient-to-r from-[#00C27A] to-[#00D68F] text-white rounded-2xl">
          Dashboard
        </button>
        {/* Add more nav buttons */}
      </div>
    </div>
  </div>
</nav>
```

#### Step 5: Create Stats Grid
```typescript
// 4-column grid for key metrics
<div className="grid grid-cols-4 gap-6">
  {/* Daily Progress Card */}
  <div className="bg-gradient-to-br from-[#00C27A] to-[#00D68F] rounded-3xl p-6 shadow-xl text-white">
    <Target size={28} />
    <p className="text-white/80 text-sm">Daily Progress</p>
    <p className="text-4xl">87%</p>
    {/* Progress bar */}
  </div>
  
  {/* Add Focus Time, Streak, Score cards */}
</div>
```

#### Step 6: Add Charts and Analytics
```typescript
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

<ResponsiveContainer width="100%" height={280}>
  <LineChart data={weeklyData}>
    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
    <XAxis dataKey="day" />
    <YAxis />
    <Tooltip />
    <Line 
      type="monotone" 
      dataKey="score" 
      stroke="#00C27A" 
      strokeWidth={3}
    />
  </LineChart>
</ResponsiveContainer>
```

#### Step 7: Implement Habits Tracker
```typescript
const [habitStates, setHabitStates] = useState(habits);

const toggleHabit = (habitName: string) => {
  setHabitStates(prev =>
    prev.map(h =>
      h.name === habitName ? { ...h, completed: true } : h
    )
  );
  // Add celebration animation
};

// Render habits with checkboxes and progress bars
```

### Phase 3: Additional Screens

#### Step 8: Create AI Assistant Page
```typescript
export function AssistantPage({ onNavigate }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  
  const sendMessage = () => {
    // Add user message
    setMessages([...messages, { role: 'user', content: input }]);
    // Simulate AI response
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'AI response here' 
      }]);
    }, 1000);
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Chat interface */}
    </div>
  );
}
```

#### Step 9: Create Settings Page
```typescript
export function SettingsPage({ onNavigate }: Props) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="max-w-[1000px] mx-auto px-8 py-8">
        {/* Back button */}
        <button onClick={() => onNavigate('dashboard')}>
          ← Back to Home
        </button>
        
        {/* Settings sections */}
        <div className="space-y-6">
          {/* Profile, Notifications, Language, etc. */}
        </div>
      </div>
    </div>
  );
}
```

#### Step 10: Create Leaderboard Page
```typescript
export function LeaderboardPage({ onNavigate }: Props) {
  return (
    <div className="min-h-screen">
      {/* Rankings table with user avatars */}
      {leaderboardData.map((user, index) => (
        <div key={user.id} className={user.isCurrentUser ? 'bg-green-50' : ''}>
          <div className="flex items-center gap-4">
            <span>#{index + 1}</span>
            <Avatar>{user.avatar}</Avatar>
            <span>{user.name}</span>
            <span>{user.score} pts</span>
          </div>
        </div>
      ))}
    </div>
  );
}
```

### Phase 4: Animations and Interactions

#### Step 11: Add Page Transitions
```typescript
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -20 }}
  transition={{ duration: 0.3 }}
>
  {/* Page content */}
</motion.div>
```

#### Step 12: Add Interactive Elements
```typescript
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  className="px-6 py-3 bg-gradient-to-r from-[#00C27A] to-[#00D68F]"
>
  Click me
</motion.button>
```

#### Step 13: Add Celebration Animations
```typescript
<AnimatePresence>
  {celebrating && (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      className="absolute inset-0 flex items-center justify-center"
    >
      <span className="text-3xl">🎉</span>
    </motion.div>
  )}
</AnimatePresence>
```

---

## Multi-Language Support

### Step 14: Create Translation System

#### Create translations file
```typescript
// translations.ts
export const translations = {
  en: {
    welcome: "Welcome",
    dashboard: "Dashboard",
    // ... more translations
  },
  es: {
    welcome: "Bienvenido",
    dashboard: "Panel",
  },
  // Add 12 languages: en, es, fr, de, it, pt, nl, ru, ja, zh, ar, ko
};
```

#### Create language context
```typescript
const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState('en');
  
  const t = (key: string) => translations[language][key] || key;
  
  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}
```

#### Use translations in components
```typescript
const { t } = useLanguage();

<h1>{t('welcome')}</h1>
```

---

## Mobile to Desktop Conversion

### Design Principles

#### Mobile (390x844px)
- Single column layout
- Stacked cards
- Bottom navigation
- Smaller text sizes
- Touch-friendly buttons (min 44x44px)

#### Desktop (1920x1080px)
- Multi-column layouts (2-3 columns)
- Centered container with `max-w-[1400px]`
- Top navigation bar
- Larger text and spacing
- Hover states and animations

### Conversion Checklist

**Layout Changes:**
- ✅ Convert from `h-screen` to flexible height
- ✅ Add `max-w-[1400px] mx-auto` containers
- ✅ Change from single column to grid layouts
- ✅ Remove bottom navigation, use top nav
- ✅ Increase padding: `px-6 → px-8`, `py-6 → py-8`

**Typography Changes:**
- ✅ Increase heading sizes by 1-2 levels
- ✅ Make body text larger and more readable
- ✅ Add more breathing room between elements

**Component Changes:**
- ✅ Make cards wider and more spacious
- ✅ Increase icon sizes: `size={20} → size={24}`
- ✅ Make avatars larger: `w-8 h-8 → w-12 h-12`
- ✅ Increase button padding

**Navigation Changes:**
- ✅ Move from bottom tab bar to top horizontal nav
- ✅ Add "Back to Home" buttons where needed
- ✅ Remove mobile-specific navigation patterns

---

## Component Guidelines

### Using shadcn/ui Components

**Import format:**
```typescript
import { Button } from "./components/ui/button";
import { Card } from "./components/ui/card";
```

**Available components:**
- Button, Card, Input, Select, Dialog
- Tabs, Accordion, Badge, Avatar
- Chart, Calendar, Checkbox, Switch
- And more (see full list in project)

### Using Icons (lucide-react)

```typescript
import { Home, Settings, TrendingUp, Award } from 'lucide-react';

<Home size={24} className="text-gray-700" />
```

### Using Images

**For new images:**
```typescript
import { ImageWithFallback } from './components/figma/ImageWithFallback';

<ImageWithFallback 
  src={imageUrl} 
  alt="Description" 
  className="w-full h-auto" 
/>
```

**For stock photos:**
Use the unsplash_tool to get relevant images.

### Creating Custom Components

**Example habit tracker component:**
```typescript
export function HabitTracker({ habits, onToggle }: Props) {
  return (
    <div className="space-y-3">
      {habits.map(habit => (
        <motion.div 
          key={habit.id}
          className="flex items-center gap-3"
        >
          <button onClick={() => onToggle(habit.id)}>
            {habit.completed ? <CheckCircle /> : <Circle />}
          </button>
          <span>{habit.name}</span>
        </motion.div>
      ))}
    </div>
  );
}
```

---

## Best Practices

### Performance

1. **Lazy load images:** Use ImageWithFallback component
2. **Optimize animations:** Use `will-change` sparingly
3. **Memoize expensive calculations:** Use `useMemo` and `useCallback`
4. **Code split routes:** Dynamic imports for pages

### Accessibility

1. **Keyboard navigation:** Ensure all interactive elements are keyboard accessible
2. **ARIA labels:** Add `aria-label` to icon-only buttons
3. **Color contrast:** Maintain WCAG AA standards (4.5:1 for text)
4. **Focus states:** Show visible focus indicators

### Code Organization

1. **Component structure:**
   ```
   - Props interface at top
   - State declarations
   - Helper functions
   - Event handlers
   - Render logic
   ```

2. **File naming:** Use PascalCase for components: `DashboardPage.tsx`

3. **Avoid inline styles:** Use Tailwind classes instead

4. **Extract reusable logic:** Create custom hooks when needed

### Testing

1. **Test user flows:** Welcome → Onboarding → Dashboard
2. **Test responsiveness:** Mobile and desktop layouts
3. **Test animations:** Ensure smooth transitions
4. **Test accessibility:** Keyboard and screen reader navigation

---

## Common Patterns

### Card Component Pattern
```typescript
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  whileHover={{ y: -4 }}
  className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100"
>
  <Icon size={28} className="text-[#00C27A] mb-3" />
  <h3 className="text-gray-800 mb-2">Title</h3>
  <p className="text-gray-600">Description</p>
</motion.div>
```

### Button Pattern
```typescript
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  className="px-6 py-3 bg-gradient-to-r from-[#00C27A] to-[#00D68F] text-white rounded-2xl shadow-md"
>
  Button Text
</motion.button>
```

### Progress Bar Pattern
```typescript
<div className="h-2 bg-gray-100 rounded-full overflow-hidden">
  <motion.div
    initial={{ width: 0 }}
    animate={{ width: `${progress}%` }}
    transition={{ duration: 1 }}
    className="h-full bg-gradient-to-r from-[#00C27A] to-[#00D68F]"
  />
</div>
```

---

## Troubleshooting

### Common Issues

**Issue:** Text getting cut off
- **Solution:** Add `whitespace-nowrap` or increase container width

**Issue:** Animations not smooth
- **Solution:** Use `transform` and `opacity` for better performance

**Issue:** Colors not matching design
- **Solution:** Double-check hex values and gradient directions

**Issue:** Layout breaking on different screens
- **Solution:** Test with `max-w-[1400px]` container and proper responsive classes

---

## Next Steps

1. **Add authentication:** Implement user login/signup
2. **Connect to backend:** Replace mock data with real API calls
3. **Add more features:** Task management, goal setting, etc.
4. **Optimize performance:** Code splitting, lazy loading
5. **Add analytics:** Track user behavior and engagement
6. **Create onboarding flow:** Welcome screens and tutorial
7. **Add notifications:** Real-time updates and reminders
8. **Implement data persistence:** Save user progress locally

---

## Resources

- **Tailwind CSS:** https://tailwindcss.com/docs
- **Motion (Framer Motion):** https://motion.dev/docs
- **Lucide Icons:** https://lucide.dev/
- **Recharts:** https://recharts.org/
- **shadcn/ui:** https://ui.shadcn.com/

---

## Support

For questions or issues with implementation:
1. Review this guide thoroughly
2. Check component examples in `/components`
3. Test in both mobile (390x844) and desktop (1920x1080) views
4. Ensure all animations are smooth and performant

---

**Version:** 1.0  
**Last Updated:** November 16, 2025  
**App Name:** Productif.io  
**Design System:** Modern Green Gradient Theme
