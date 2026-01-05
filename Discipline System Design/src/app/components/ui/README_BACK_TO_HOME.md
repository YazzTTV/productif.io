# BackToHomeHeader Component

Un composant réutilisable pour ajouter un bouton "Retour à l'accueil" en haut de chaque fonction de l'assistant IA.

## 🎯 Utilisation

### Import

```tsx
import { BackToHomeHeader } from './ui/BackToHomeHeader';
```

### Exemple basique

```tsx
<BackToHomeHeader
  onBack={() => onNavigate('dashboard')}
  title="Plan My Day"
  subtitle="AI-generated schedule"
/>
```

### Avec icône personnalisée

```tsx
import { Sparkles } from 'lucide-react';

<BackToHomeHeader
  onBack={() => onNavigate('dashboard')}
  title="Your Ideal Day"
  subtitle="Tomorrow, March 11"
  icon={<Sparkles className="w-5 h-5 text-[#16A34A]" />}
/>
```

### Avec icône Home au lieu de ArrowLeft

```tsx
<BackToHomeHeader
  onBack={() => onNavigate('dashboard')}
  title="Tasks"
  useHomeIcon={true}
/>
```

## 📦 Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `onBack` | `() => void` | ✅ | - | Fonction appelée au clic sur le bouton retour |
| `title` | `string` | ✅ | - | Titre principal affiché |
| `subtitle` | `string` | ❌ | - | Sous-titre optionnel |
| `icon` | `React.ReactNode` | ❌ | - | Icône personnalisée à gauche du titre |
| `useHomeIcon` | `boolean` | ❌ | `false` | Utilise l'icône Home au lieu de ArrowLeft |

## 🎨 Design

- **Position:** Sticky top-0, reste visible au scroll
- **Background:** Blanc avec bordure inférieure subtile
- **Bouton:** Cercle avec border, hover effect scale
- **Animation:** Motion de whileHover et whileTap
- **Typography:** Condensée avec letter-spacing -0.04em

## 📱 Responsive

- **Mobile:** Full width, padding adapté
- **Desktop:** Same design, hover states visibles

## ✨ Exemples d'intégration

### Dans PlanMyDay.tsx

```tsx
return (
  <div className="min-h-screen">
    <BackToHomeHeader
      onBack={onBack}
      title="Your Ideal Day"
      subtitle="Tomorrow, March 11"
      icon={<Sparkles className="w-5 h-5 text-[#16A34A]" />}
    />
    {/* Rest of content */}
  </div>
);
```

### Dans Tasks.tsx

```tsx
return (
  <div className="min-h-screen">
    <BackToHomeHeader
      onBack={() => onNavigate('dashboard')}
      title="Your Tasks"
      subtitle="Organized by subject and impact."
    />
    {/* Rest of content */}
  </div>
);
```

### Dans WeeklyExamStrategy.tsx

```tsx
return (
  <div className="min-h-screen">
    <BackToHomeHeader
      onBack={onExit}
      title="Weekly Exam Strategy"
      subtitle="Focus on what truly matters"
    />
    {/* Rest of content */}
  </div>
);
```

## 🔍 Structure visuelle

```
┌────────────────────────────────────────┐
│  [←]  [Icon]  Title                    │
│             Subtitle                   │
└────────────────────────────────────────┘
     ↑      ↑       ↑
  Button  Optional  Required
```

## 💡 Best Practices

1. **Toujours utiliser** dans les fonctions de l'AI Assistant
2. **onBack** doit toujours ramener au dashboard/home
3. **Title** concis (2-4 mots max)
4. **Subtitle** optionnel, utilisé pour contexte supplémentaire
5. **Icon** uniquement si pertinent (pas obligatoire)

## ⚡ Performance

- Utilise `motion` de motion/react pour animations fluides
- Sticky positioning pour rester visible
- z-index 40 pour être au-dessus du contenu

## 🎯 Cohérence avec le design system

✅ Blanc (#FFFFFF) background  
✅ Vert (#16A34A) pour les icônes de statut  
✅ Typography condensée  
✅ Animations subtiles  
✅ Pas d'emojis  
✅ Microcopy rassurant
