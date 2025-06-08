# Système de Classement (Leaderboard) - Documentation

## Introduction

Le système de classement de productif.io permet d'afficher un tableau de bord compétitif entre tous les utilisateurs, basé sur leurs performances de gamification. Ce système encourage l'engagement et la motivation à travers une saine compétition.

## Architecture du Système

### Backend

#### Service de Gamification
Le classement est géré par le `GamificationService` dans `services/gamification.ts` :

**Interface LeaderboardEntry** :
```typescript
interface LeaderboardEntry {
  userId: string;
  userName: string | null;
  userEmail: string;
  totalPoints: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  totalHabitsCompleted: number;
  achievements: number;
  rank: number;
}
```

**Méthode principale** :
```typescript
async getLeaderboard(limit: number = 50, userId?: string): Promise<{
  leaderboard: LeaderboardEntry[];
  userRank?: number;
  totalUsers: number;
}>
```

#### Critères de Classement

Le classement est calculé selon cet ordre de priorité :
1. **Points totaux** (priorité principale)
2. **Niveau** (en cas d'égalité de points)
3. **Streak actuel** (en cas d'égalité de niveau)
4. **Nombre total d'habitudes complétées** (départage final)

#### API Endpoint

**Route** : `/api/gamification/leaderboard`
**Méthode** : GET
**Authentification** : Session utilisateur ou Token API

**Paramètres de requête** :
- `limit` (optionnel) : Nombre d'utilisateurs à retourner (défaut: 50, max: 100)
- `includeUserRank` (optionnel) : Inclure le rang de l'utilisateur actuel (défaut: false)

**Réponse** :
```json
{
  "leaderboard": [
    {
      "userId": "user_123",
      "userName": "John Doe",
      "userEmail": "john@example.com",
      "totalPoints": 2500,
      "level": 8,
      "currentStreak": 15,
      "longestStreak": 25,
      "totalHabitsCompleted": 150,
      "achievements": 12,
      "rank": 1
    }
  ],
  "userRank": 5,
  "totalUsers": 1250
}
```

### Frontend

#### Composant Principal : Leaderboard

**Emplacement** : `components/gamification/Leaderboard.tsx`

**Fonctionnalités** :
- Affichage du top 50 par défaut avec option "Afficher plus" jusqu'à 100
- Icônes spéciales pour le podium (🏆, 🥈, 🥉)
- Couleurs de niveau selon la progression
- Statistiques détaillées par utilisateur
- Cartes de statistiques générales
- Gestion d'erreurs et états de chargement

**Cartes de statistiques** :
- **Champion actuel** : Premier du classement avec ses statistiques
- **Participants** : Nombre total d'utilisateurs actifs
- **Record de points** : Maximum de points atteint

#### Composant Compact : LeaderboardCompact

**Emplacement** : `components/gamification/LeaderboardCompact.tsx`

**Fonctionnalités** :
- Top 5 seulement pour intégration dashboard
- Affichage de la position utilisateur si hors top 5
- Lien vers le classement complet
- Design optimisé pour les petits espaces

#### Page Dédiée

**Route** : `/dashboard/leaderboard`
**Composant** : `app/dashboard/leaderboard/page.tsx`

Page complète dédiée au classement avec :
- Affichage jusqu'à 100 utilisateurs
- Métadonnées SEO optimisées
- Mise en page responsive

### Intégration Navigation

#### Navigation Dashboard
Ajout du lien "Classement" dans `components/dashboard/nav.tsx` :
```typescript
{
  name: 'Classement',
  href: '/dashboard/leaderboard',
  icon: Users,
  current: pathname === '/dashboard/leaderboard',
}
```

#### Dashboard Principal
Intégration du `LeaderboardCompact` dans la grille responsive du dashboard :
```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Autres composants */}
  <LeaderboardCompact />
</div>
```

## Calcul des Points et Niveaux

### Système de Points
- **Habitude complétée** : Points variables selon la difficulté
- **Streak maintenu** : Bonus multiplicateur
- **Achievements débloqués** : Points bonus significatifs

### Niveaux et Couleurs
```typescript
const getLevelColor = (level: number) => {
  if (level >= 10) return 'text-purple-600 font-bold';
  if (level >= 7) return 'text-blue-600 font-semibold';
  if (level >= 4) return 'text-green-600';
  if (level >= 2) return 'text-yellow-600';
  return 'text-gray-600';
};
```

### Achievements
Le nombre d'achievements débloqués contribue au score global et influence le classement.

## Sécurité et Confidentialité

### Données Affichées
- **Public** : Nom d'utilisateur (ou "Utilisateur anonyme"), points, niveau, streaks, achievements
- **Privé** : Email (uniquement pour l'identification interne), données détaillées d'habitudes

### Authentification
- Session utilisateur requise pour accéder au classement
- Compatible avec les tokens API pour les intégrations

## Optimisations Performance

### Cache et Limitations
- Limitation à 100 utilisateurs maximum par requête
- Requêtes optimisées avec `include` et `select` Prisma
- Calcul de rang efficient avec tri en base de données

### Responsive Design
- Grille adaptive selon la taille d'écran
- Composants optimisés mobile
- Chargement progressif des données

## Cas d'Usage

### Motivation Utilisateur
- Comparaison avec d'autres utilisateurs
- Objectifs de progression claire
- Reconnaissance des achievements

### Gamification
- Intégration avec le système de points existant
- Encouragement des streaks
- Competition saine entre utilisateurs

### Analytics
- Métriques d'engagement utilisateur
- Identification des power users
- Données pour améliorer la rétention

## Maintenance et Évolutions

### Monitoring
- Surveillance des performances des requêtes
- Métriques d'utilisation du classement
- Erreurs et temps de réponse

### Évolutions Futures
- **Classements temporels** : Hebdomadaire, mensuel, annuel
- **Catégories** : Classements par type d'habitude
- **Groupes** : Classements d'équipes ou entreprises
- **Récompenses** : Badges spéciaux pour les leaders
- **Historique** : Évolution du rang dans le temps

## API pour Développeurs

### Endpoint Principal
```bash
curl -X GET "https://productif.io/api/gamification/leaderboard?limit=10&includeUserRank=true" \
  -H "Authorization: Bearer {votre_token}"
```

### Intégration Widget
Le `LeaderboardCompact` peut être intégré dans n'importe quelle page :
```typescript
import LeaderboardCompact from '@/components/gamification/LeaderboardCompact';

// Dans votre composant
<LeaderboardCompact />
```

## Changelog

### Version 1.0 (2025-05-27)
- ✅ Implémentation complète du système de classement
- ✅ API endpoint `/api/gamification/leaderboard`
- ✅ Composants React `Leaderboard` et `LeaderboardCompact`
- ✅ Page dédiée `/dashboard/leaderboard`
- ✅ Intégration navigation et dashboard principal
- ✅ Système de points, niveaux et achievements
- ✅ Design responsive et accessibilité

---

*Cette documentation couvre la version initiale du système de classement. Pour les mises à jour et nouvelles fonctionnalités, consultez le changelog et les notes de version.* 