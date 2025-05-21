# Documentation: Système de priorité et niveau d'énergie

## Vue d'ensemble

Cette documentation explique le système de priorité et de niveau d'énergie utilisé pour trier et organiser les tâches dans Productif.io.

## Nouvelle structure (Mai 2025)

### Priorités des tâches

Les priorités des tâches sont représentées par des valeurs numériques de 0 à 4. Plus la valeur est élevée, plus la priorité est importante.

| Valeur | Libellé    | Description                               |
|--------|------------|-------------------------------------------|
| 0      | Optionnel  | Tâches qui peuvent être reportées ou ignorées |
| 1      | À faire    | Tâches importantes mais pas urgentes      |
| 2      | Important  | Tâches qui méritent de l'attention        |
| 3      | Urgent     | Tâches qui requièrent une action rapide   |
| 4      | Quick Win  | Priorité maximale, gains rapides          |

### Niveaux d'énergie

Le niveau d'énergie indique combien d'énergie mentale ou physique une tâche nécessite. Les valeurs vont de 0 à 3. Plus la valeur est élevée, plus la tâche demande d'énergie.

| Valeur | Libellé  | Description                               |
|--------|----------|-------------------------------------------|
| 0      | Faible   | Tâches simples, peu d'effort mental       |
| 1      | Moyen    | Tâches de complexité moyenne              |
| 2      | Élevé    | Tâches complexes, besoin de concentration |
| 3      | Extrême  | Tâches très exigeantes mentalement        |

## Calcul de l'ordre des tâches

L'ordre de tri des tâches est calculé en combinant la priorité et le niveau d'énergie selon la formule suivante :

```
ordre = score_priorité + score_énergie
```

Où :
- `score_priorité` varie de 1000 (Optionnel) à 5000 (Quick Win)
- `score_énergie` varie de 100 (Faible) à 400 (Extrême)

Ainsi, les tâches sont d'abord triées par priorité, puis par niveau d'énergie.

### Exemples de scores

| Priorité    | Niveau d'énergie | Score total | Rang |
|-------------|------------------|-------------|------|
| 4 (Quick Win) | 3 (Extrême)      | 5400        | 1    |
| 4 (Quick Win) | 0 (Faible)       | 5100        | 2    |
| 3 (Urgent)    | 3 (Extrême)      | 4400        | 3    |
| 0 (Optionnel) | 3 (Extrême)      | 1400        | 4    |

## Utilisation dans l'API

Lors de la création ou de la mise à jour d'une tâche via l'API, vous devez fournir des valeurs numériques :

```json
{
  "title": "Ma tâche importante",
  "priority": 4,  // Quick Win
  "energyLevel": 3  // Extrême
}
```

## Notes sur la migration (Mai 2025)

Cette structure a été mise en place en mai 2025 et a nécessité une migration des données existantes. Les valeurs ont été inversées par rapport à l'ancienne structure où 0 représentait la priorité la plus élevée (Quick Win) et 0 le niveau d'énergie le plus élevé (Extrême).

### Correspondance avec l'ancienne structure

| Nouvelle valeur priorité | Ancienne valeur priorité |
|--------------------------|--------------------------|
| 0 (Optionnel)            | 4 (Optionnel)            |
| 1 (À faire)              | 3 (À faire)              |
| 2 (Important)            | 2 (Important)            |
| 3 (Urgent)               | 1 (Urgent)               |
| 4 (Quick Win)            | 0 (Quick Win)            |

| Nouvelle valeur énergie | Ancienne valeur énergie |
|-------------------------|-------------------------|
| 0 (Faible)              | 3 (Faible)              |
| 1 (Moyen)               | 2 (Moyen)               |
| 2 (Élevé)               | 1 (Élevé)               |
| 3 (Extrême)             | 0 (Extrême)             | 