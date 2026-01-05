# Productif.io - Design Implementation Guide
## Guide complet de mise en place du design système par page

---

## 🎨 Design DNA - Principes fondamentaux

### Palette de couleurs
- **Blanc principal** : `#FFFFFF`
- **Accent vert** : `#16A34A`
- **Noir avec opacités** : 
  - Texte principal : `text-black` ou `text-black/80`
  - Texte secondaire : `text-black/60` ou `text-black/40`
  - Bordures : `border-black/10` ou `border-black/20`
  - Backgrounds subtils : `bg-black/5`

### Philosophie d'interaction
- **Chef d'orchestre silencieux** : Le système agit sans parler
- **Interactions par boutons UNIQUEMENT** : Pas de chat ouvert, pas de conversations, pas de discours motivationnels
- **Design calme** : Retirer la charge mentale plutôt que stimuler
- **Gamification par consistance** : Récompenser la répétition, pas l'intensité

### Composants UI standards
- **Boutons primaires** : `bg-[#16A34A] text-white rounded-2xl h-14`
- **Boutons secondaires** : `border border-black/10 rounded-2xl hover:bg-black/5`
- **Cards** : `bg-white border border-black/10 rounded-3xl p-6`
- **Modals** : Bottom sheet style avec `rounded-t-[2rem]`, handle en haut
- **Inputs** : `border border-black/10 rounded-2xl px-5 py-4 focus:border-black/20`
- **Transitions** : Toujours fluides avec `transition-all` ou Motion spring

### Typographie
- **Headers** : `text-2xl tracking-tight` avec `letterSpacing: '-0.03em'`
- **Labels** : `text-sm text-black/60 uppercase tracking-wide`
- **Body** : Ne pas override les styles de `/src/styles/theme.css` sauf demande explicite

---

## 📱 Pages du système - Checklist complète

### 1. ✅ Onboarding (16 écrans)
**Fichier** : `/src/app/components/onboarding/Onboarding.tsx`

**État actuel** : ✅ Design complet et finalisé

**Fonctionnalités** :
- 16 écrans professionnels avec support multilingue (FR/EN/ES)
- Progression visuelle avec dots indicator
- Collecte des données utilisateur (prénom, objectifs, matières, coefficients)
- Animations fluides avec Motion
- Boutons "Continue" / "Skip" selon le contexte

**Design checklist** :
- ✅ Palette minimaliste (blanc + noir/opacité + vert)
- ✅ Bottom sheet pour sélections multiples
- ✅ Animations spring naturelles
- ✅ Headers avec `text-2xl tracking-tight`
- ✅ Cards avec `rounded-3xl border-black/10`

---

### 2. ✅ Dashboard
**Fichier** : `/src/app/components/DashboardEnhanced.tsx`

**État actuel** : ✅ Design complet et finalisé

**Fonctionnalités** :
- Header avec salutation, streak, XP progress
- Navigation vers toutes les features principales
- Stats du jour (focus sessions, tasks, habits)
- Quick actions (Start Focus, Review Habits, etc.)
- Bottom navigation (Dashboard, Tasks, AI, Leaderboard, Settings)

**Design checklist** :
- ✅ Cards avec shadow subtile
- ✅ XP Progress bar avec dégradé vert
- ✅ Icons Lucide React
- ✅ Grid responsive pour stats
- ✅ Bottom nav sticky avec active states

**Premium features** :
- Affichage du badge Premium si `isPremium={true}`
- Access complet à Analytics

---

### 3. ✅ Focus Flow
**Fichier** : `/src/app/components/FocusFlow.tsx`

**État actuel** : ✅ Design complet et finalisé

**Fonctionnalités** :
- Sélection de la durée (25, 45, 90 min)
- Timer circulaire avec animation
- Contrôles pause/resume
- End of session avec XP reward
- Trigger du Paywall après la première session (freemium)

**Design checklist** :
- ✅ Timer circulaire minimaliste
- ✅ Boutons ronds pour contrôles
- ✅ Animation progressive du cercle
- ✅ XP Feedback avec confetti subtils
- ✅ Exit avec confirmation

**Premium trigger** :
- Première Focus Session complète → `onShowPaywall()`

---

### 4. ✅ Exam Mode (avec Preview)
**Fichiers** : 
- `/src/app/components/ExamMode.tsx`
- `/src/app/components/ExamModePreview.tsx`

**État actuel** : ✅ Design complet avec système de verrouillage premium

**Fonctionnalités** :
- **ExamModePreview** : Version blurée pour utilisateurs gratuits
  - Sections floutées avec `backdrop-blur-md`
  - CTA calme "Try Exam Mode" qui déclenche le paywall
  - Aperçu de la valeur sans bloquer brutalement
- **ExamMode** : Version complète pour premium
  - Configuration de l'exam (date, durée, sujets)
  - Planning de révision automatique
  - Stratégie personnalisée

**Design checklist** :
- ✅ Preview avec blur progressif
- ✅ Lock icon subtil
- ✅ Message informatif, jamais agressif
- ✅ CTA vert qui ouvre le paywall sur demande

**Premium logic** :
```tsx
case 'exam':
  if (isPremium) {
    return <ExamMode onExit={() => setCurrentScreen('dashboard')} />;
  } else {
    return <ExamModePreview onNavigate={setCurrentScreen} />;
  }
```

---

### 5. ✅ Plan My Day (avec Preview)
**Fichiers** : 
- `/src/app/components/PlanMyDay.tsx`
- `/src/app/components/PlanMyDayPreview.tsx`

**État actuel** : ✅ Design complet avec système de verrouillage premium

**Fonctionnalités** :
- **PlanMyDayPreview** : Version blurée pour utilisateurs gratuits
  - Aperçu de la structure de planning
  - Sections floutées avec descriptions
  - CTA "Try Plan My Day" qui déclenche le paywall
- **PlanMyDay** : Version complète pour premium
  - Planning par blocs temporels
  - Time blocking interactif
  - Suggestion intelligente de tâches

**Design checklist** :
- ✅ Preview avec blur sur les time blocks
- ✅ Message de valeur clair
- ✅ CTA non intrusif
- ✅ Transition douce vers paywall

**Premium logic** :
```tsx
case 'plan':
  if (isPremium) {
    return <PlanMyDay onComplete={...} onBack={...} />;
  } else {
    return <PlanMyDayPreview onNavigate={setCurrentScreen} />;
  }
```

---

### 6. ✅ Review Habits (avec AddHabitModal)
**Fichiers** :
- `/src/app/components/ReviewHabits.tsx`
- `/src/app/components/AddHabitModal.tsx`

**État actuel** : ✅ Design complet avec limite freemium (3 habitudes)

**Fonctionnalités** :
- Review des habitudes quotidiennes par catégorie :
  - Morning (Start the day)
  - Day (During work)
  - Evening (Wind down)
  - Anti-habits (Avoid this behavior)
- Toggle completion avec animation
- Streak indicator pour chaque habitude
- **Bouton "Add a habit"** :
  - Modal bottom sheet pour créer une nouvelle habitude
  - Sélection de catégorie avec radio buttons visuels
  - **Limite freemium : 3 habitudes maximum**
  - Au-delà de 3 → affiche message de limite + CTA "Upgrade to Premium"

**Design checklist** :
- ✅ Cards par catégorie avec header
- ✅ Toggle buttons avec checkmark animation
- ✅ Streak badge (🔥 + nombre)
- ✅ Modal bottom sheet avec handle
- ✅ Message de limite calme avec Lock icon
- ✅ Fields désactivés (opacity 40%) quand limite atteinte

**Premium logic** :
```tsx
<AddHabitModal
  isPremium={isPremium}
  currentHabitCount={habits.length}
  onUpgrade={() => onNavigate('paywall')}
/>
```

**Limite freemium** :
- Gratuit : 3 habitudes max
- Premium : Illimité

---

### 7. ⚠️ Daily Journal (avec microphone)
**Fichier** : `/src/app/components/DailyJournal.tsx`

**État actuel** : Fonctionnel mais à vérifier pour le design DNA

**Fonctionnalités** :
- Input pour journal quotidien
- Fonctionnalité microphone pour voice-to-text
- Sauvegarde des entrées
- Historique des journaux

**Design à vérifier** :
- [ ] Vérifier palette de couleurs (blanc + vert #16A34A)
- [ ] Headers avec `text-2xl tracking-tight`
- [ ] Bouton microphone avec animation
- [ ] Input avec `rounded-2xl border-black/10`
- [ ] Cards pour historique avec `rounded-3xl`

**Recommandations** :
- Utiliser Motion pour animations du microphone
- Feedback visuel pendant l'enregistrement (wave animation)
- Bouton "Save" avec `bg-[#16A34A]`

---

### 8. ⚠️ Tasks (système complet avec AI Assistant)
**Fichiers** :
- `/src/app/components/Tasks.tsx`
- `/src/app/components/AddTaskModal.tsx`
- `/src/app/components/TasksCalendar.tsx`

**État actuel** : Fonctionnel mais à vérifier pour le design DNA

**Fonctionnalités** :
- Liste des tasks par status (To Do, In Progress, Done)
- **AddTaskModal** : Bottom sheet pour créer une tâche
  - Titre, description, deadline, priority
  - Sélection de matière
  - Estimation de durée
- **TasksCalendar** : Vue calendrier des tasks
- Intégration avec AI Assistant pour suggestions

**Design à vérifier** :
- [ ] Cards de task avec `rounded-3xl`
- [ ] Priority badges (High/Medium/Low) avec couleurs cohérentes
- [ ] Modal avec style bottom sheet
- [ ] Checkbox animations pour completion
- [ ] Calendar view avec design minimaliste

**Recommandations** :
- Status chips : `bg-[#16A34A]/10 text-[#16A34A]` pour "Done"
- Priority High : `bg-red-500/10 text-red-600`
- Swipe actions pour mobile (avec Motion gestures)

---

### 9. ⚠️ Stress/Mood Tracker
**Fichier** : `/src/app/components/StressMood.tsx`

**État actuel** : À vérifier pour le design DNA

**Fonctionnalités** :
- Sélection du niveau de stress (1-5)
- Tracking de l'humeur
- Suggestions basées sur le stress
- Historique

**Design à vérifier** :
- [ ] Scale visuelle pour stress level
- [ ] Emoji picker pour mood
- [ ] Graph pour historique
- [ ] Suggestions cards avec `rounded-3xl`

**Recommandations** :
- Utiliser des cercles colorés pour les niveaux (du vert au rouge)
- Animation douce lors de la sélection
- Graph minimaliste avec Recharts

---

### 10. ✅ AI Agent Conductor
**Fichier** : `/src/app/components/AIAgentConductor.tsx`

**État actuel** : ✅ Design complet et finalisé

**Fonctionnalités** :
- Hub central pour toutes les actions quotidiennes
- Boutons d'action rapide (Plan My Day, Review Habits, Daily Journal)
- Suggestion intelligente basée sur l'heure
- Navigation vers Tasks, Weekly Exam Strategy
- **Interactions par boutons UNIQUEMENT** (pas de chat)

**Design checklist** :
- ✅ Cards d'action avec icons Lucide
- ✅ Layout grid responsive
- ✅ Headers avec emojis subtils
- ✅ Boutons avec hover states
- ✅ Navigation fluide vers toutes les features

**Premium integration** :
- Affiche preview ou full version selon `isPremium`

---

### 11. ✅ Leaderboard
**Fichier** : `/src/app/components/LeaderboardEnhanced.tsx`

**État actuel** : ✅ Design complet et finalisé

**Fonctionnalités** :
- Classement global par XP
- Position de l'utilisateur
- Top 3 avec podium visuel
- Streak indicators pour chaque user
- Filtres (Global, Friends, School)

**Design checklist** :
- ✅ Cards avec rank badges
- ✅ Avatar circulaires
- ✅ Top 3 avec mise en avant (médailles)
- ✅ User actuel highlighté avec `bg-[#16A34A]/10`
- ✅ XP et streak affichés clairement

**Premium features** :
- Aucune restriction

---

### 12. ✅ Community Invite (Invitations & Referral)
**Fichier** : `/src/app/components/CommunityInvite.tsx`

**État actuel** : ✅ Design complet avec système de gamification

**Fonctionnalités** :
- Code de référence unique
- Bouton "Share" pour inviter des amis
- Rewards par invité (XP bonus)
- Liste des invités avec leur progression
- Landing page pour nouveaux utilisateurs

**Design checklist** :
- ✅ Code de référence dans une card avec bouton copy
- ✅ Share button avec animation
- ✅ Rewards cards avec `bg-[#16A34A]/5`
- ✅ Liste des invités avec avatars
- ✅ Confetti animation lors du partage

---

### 13. ✅ Paywall (conversion-focused)
**Fichier** : `/src/app/components/Paywall.tsx`

**État actuel** : ✅ Design complet optimisé pour la conversion

**Fonctionnalités** :
- Header avec "Upgrade to Premium"
- Liste des features premium :
  - Unlimited Habits
  - Plan My Day
  - Exam Mode
  - Advanced Analytics
  - Priority Support
- Pricing (mensuel/annuel)
- CTA "Start Premium"
- Bouton "Maybe later" discret

**Design checklist** :
- ✅ Header avec gradient vert subtil
- ✅ Feature list avec checkmarks verts
- ✅ Pricing cards avec best value badge
- ✅ CTA button large et visible
- ✅ Exit option discrète (pas de dark patterns)

**Trigger points** :
1. Après la première Focus Session
2. Tentative d'accès à Plan My Day (freemium)
3. Tentative d'accès à Exam Mode (freemium)
4. Tentative d'accès à Analytics (freemium)
5. Tentative d'ajouter plus de 3 habitudes (freemium)

---

### 14. ⚠️ Settings
**Fichier** : `/src/app/components/Settings.tsx`

**État actuel** : À vérifier pour le design DNA

**Fonctionnalités** :
- Gestion du profil
- Préférences (langue, notifications)
- Gestion du compte premium
- Support & feedback
- Logout

**Design à vérifier** :
- [ ] Sections groupées avec headers
- [ ] Toggle switches pour préférences
- [ ] Cards avec `rounded-3xl`
- [ ] Avatar upload avec preview
- [ ] Boutons d'action (Save, Logout) cohérents

**Recommandations** :
- Section groups : `border-b border-black/10`
- Toggle switches : Utiliser un composant UI custom avec vert #16A34A
- Bouton Logout : `border-red-500/20 text-red-600`

---

### 15. ✅ Analytics (avec Preview)
**Fichiers** :
- `/src/app/components/Analytics.tsx`
- `/src/app/components/AnalyticsPreview.tsx`
- `/src/app/components/AnalyticsCard.tsx`

**État actuel** : ✅ Design complet avec système de verrouillage premium

**Fonctionnalités** :
- **AnalyticsPreview** : Version blurée pour utilisateurs gratuits
  - 3 metrics blurées
  - Message de valeur clair
  - CTA "Unlock Analytics" qui déclenche le paywall
- **Analytics** : Version complète pour premium
  - Focus time par jour/semaine
  - Tasks completed trends
  - Habits consistency
  - XP progression
  - Graphs avec Recharts

**Design checklist** :
- ✅ Preview avec blur sur les graphs
- ✅ Cards avec `rounded-3xl`
- ✅ Graphs minimalistes (ligne verte #16A34A)
- ✅ Stats avec icons Lucide
- ✅ Message de valeur sans être agressif

**Premium logic** :
```tsx
case 'analytics':
  if (isPremium) {
    return <Analytics onNavigate={setCurrentScreen} />;
  } else {
    return <AnalyticsPreview onNavigate={setCurrentScreen} />;
  }
```

---

### 16. ⚠️ Weekly Exam Strategy Engine
**Fichier** : `/src/app/components/WeeklyExamStrategy.tsx`

**État actuel** : À vérifier pour le design DNA

**Fonctionnalités** :
- Planning de révision pour la semaine
- Priorisation automatique des matières
- Suggestions de sessions
- Intégration avec Exam Mode

**Design à vérifier** :
- [ ] Calendar view minimaliste
- [ ] Cards par jour avec sessions suggérées
- [ ] Priority indicators cohérents
- [ ] CTA "Start today's plan" avec `bg-[#16A34A]`

**Recommandations** :
- Utiliser un layout par jour (lundi → dimanche)
- Cards de session avec durée estimée
- Couleurs par matière (palette cohérente)

---

## 🎯 Composants réutilisables

### XPFeedback
**Fichier** : `/src/app/components/XPFeedback.tsx`

**Usage** : Afficher les gains d'XP après une action
```tsx
<XPFeedback 
  show={showXP}
  amount={25}
  onComplete={() => setShowXP(false)}
/>
```

**Design** :
- ✅ Animation avec confetti subtils
- ✅ Badge circulaire avec `+25 XP`
- ✅ Fade out automatique

---

### XPProgress
**Fichier** : `/src/app/components/XPProgress.tsx`

**Usage** : Barre de progression XP vers le prochain niveau
```tsx
<XPProgress 
  currentXP={2654}
  nextLevelXP={3000}
/>
```

**Design** :
- ✅ Barre avec dégradé vert
- ✅ Affichage du niveau actuel
- ✅ Percentage visible

---

### StreakIndicator
**Fichier** : `/src/app/components/StreakIndicator.tsx`

**Usage** : Afficher le streak actuel
```tsx
<StreakIndicator streak={12} />
```

**Design** :
- ✅ 🔥 emoji + nombre
- ✅ Badge avec `bg-orange-500/10 text-orange-600`

---

## 📋 Checklist de mise en place du design

### Phase 1 : Audit des pages existantes
- [ ] Daily Journal : Vérifier la palette et les composants
- [ ] Tasks : Harmoniser les cards et modals
- [ ] Stress/Mood : Revoir les interactions visuelles
- [ ] Settings : Standardiser les sections
- [ ] Weekly Exam Strategy : Aligner avec le design DNA

### Phase 2 : Standardisation des composants
- [ ] Créer un composant Button réutilisable (si pas déjà fait)
- [ ] Créer un composant Card réutilisable
- [ ] Créer un composant Modal bottom sheet réutilisable
- [ ] Créer un composant Input réutilisable
- [ ] Créer un composant Toggle Switch réutilisable

### Phase 3 : Harmonisation des animations
- [ ] Toutes les transitions utilisent Motion ou `transition-all`
- [ ] Spring animations pour les modals (`damping: 30, stiffness: 300`)
- [ ] Hover states cohérents sur tous les boutons
- [ ] Loading states avec spinners ou skeletons

### Phase 4 : Responsive design
- [ ] Toutes les pages sont responsive (mobile-first)
- [ ] Bottom navigation sticky sur mobile
- [ ] Modals en full screen sur très petits écrans
- [ ] Grid layout s'adapte selon la taille d'écran

### Phase 5 : Premium integration
- [ ] Vérifier tous les trigger points du paywall
- [ ] S'assurer que les previews affichent la valeur
- [ ] Tester le flow freemium → premium sur toutes les features
- [ ] Badge "Premium" visible sur le profil si `isPremium={true}`

---

## 🚀 Priorités de développement

### Haute priorité (Design DNA critique)
1. ✅ Review Habits avec AddHabitModal (FAIT)
2. ⚠️ Daily Journal (voice-to-text + design)
3. ⚠️ Tasks + AddTaskModal (harmonisation)

### Moyenne priorité (Expérience utilisateur)
4. ⚠️ Stress/Mood Tracker
5. ⚠️ Settings
6. ⚠️ Weekly Exam Strategy Engine

### Basse priorité (Déjà fonctionnels)
7. ✅ Tous les autres composants sont déjà alignés avec le design DNA

---

## 📚 Ressources

### Fichiers de style
- `/src/styles/theme.css` : Variables CSS et typographie
- `/src/styles/fonts.css` : Imports de fonts
- Ne pas créer de `tailwind.config.js` (Tailwind v4.0)

### Packages utilisés
- `motion/react` : Animations (anciennement Framer Motion)
- `lucide-react` : Icons (toujours vérifier l'existence avec bash tool)
- `recharts` : Graphs et charts
- `sonner` : Toast notifications

### Conventions de code
- Components en PascalCase : `AddHabitModal.tsx`
- Props interfaces : `AddHabitModalProps`
- State prefix : `is`, `has`, `show` pour les booleans
- Handlers : `handle` prefix (ex: `handleSubmit`)

---

## ✅ Statut global

**Pages complètes (Design DNA 100%)** : 11/16
- ✅ Onboarding
- ✅ Dashboard
- ✅ Focus Flow
- ✅ Exam Mode + Preview
- ✅ Plan My Day + Preview
- ✅ Review Habits + AddHabitModal
- ✅ AI Agent Conductor
- ✅ Leaderboard
- ✅ Community Invite
- ✅ Paywall
- ✅ Analytics + Preview

**Pages à auditer** : 5/16
- ⚠️ Daily Journal
- ⚠️ Tasks + AddTaskModal + TasksCalendar
- ⚠️ Stress/Mood
- ⚠️ Settings
- ⚠️ Weekly Exam Strategy Engine

---

**Dernière mise à jour** : Janvier 2026
**Version** : 1.0
