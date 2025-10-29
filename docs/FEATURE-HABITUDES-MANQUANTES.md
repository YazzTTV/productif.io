# 📋 Feature : Habitudes Manquantes

## 🎯 Fonctionnalité

L'agent IA peut maintenant te dire **quelles habitudes il te reste à faire** pour un jour donné (aujourd'hui, demain, hier, ou une date spécifique).

---

## 💬 Commandes Disponibles

Tu peux poser ces questions à l'agent IA :

### Exemples de questions
- **"Quelles habitudes il me reste à faire ?"**
- **"Quelles habitudes me restent à faire aujourd'hui ?"**
- **"Quelles habitudes me restent pour demain ?"**
- **"Quelles habitudes il me reste pour hier ?"**
- **"Habitudes manquantes"**
- **"Quelles habitudes à faire ?"**

---

## 📅 Gestion des Dates

### Aujourd'hui (par défaut)
**Question** : "Quelles habitudes me restent ?"
**Résultat** : Affiche les habitudes non complétées d'aujourd'hui

### Demain
**Question** : "Quelles habitudes me restent pour demain ?"
**Résultat** : Affiche les habitudes prévues pour demain (pas encore faites)

### Hier
**Question** : "Quelles habitudes il me reste pour hier ?"
**Résultat** : Affiche les habitudes qui auraient dû être faites hier

---

## 🧠 Logique de Fonctionnement

### 1. Récupération des habitudes
- Le système récupère **toutes tes habitudes** actives
- Triées par ordre (priority)

### 2. Filtrage par date
- **Habitudes quotidiennes (`daily`)** : Toujours à faire
- **Habitudes hebdomadaires (`weekly`)** : À faire uniquement les jours configurés dans `daysOfWeek`

### 3. Identification des complétées
- Pour la date choisie, le système vérifie les `HabitEntry` avec `completed: true`
- Les habitudes complétées sont exclues de la liste

### 4. Affichage des manquantes
- Liste uniquement les habitudes **qui doivent être faites** ET **qui ne le sont pas**

---

## 📊 Réponse de l'Agent

### Si toutes les habitudes sont complétées
```
✅ Toutes tes habitudes pour lundi 27 octobre 2025 sont complétées ! 🎉

Continue comme ça ! 💪
```

### Si des habitudes sont manquantes
```
📋 **Habitudes à faire lundi 27 octobre 2025**

⚠️ Tu as 3 habitude(s) à compléter :

1. 🔁 Méditation du matin
   Commence ta journée en paix

2. 📅 Séance de sport
   Maintenir une routine active

3. 🔁 Lecture 30 minutes
   Développer l'apprentissage continu

💪 Tu as encore le temps de les compléter aujourd'hui !
```

---

## 🎨 Emojis Utilisés

| Emoji | Signification |
|-------|---------------|
| 🔁 | Habitude quotidienne (`daily`) |
| 📅 | Habitude hebdomadaire (`weekly`) |
| ⭐ | Autres fréquences |

---

## 🔧 Implémentation Technique

### Fichiers modifiés
- **`src/services/ai/start.ts`** : Ajout de la logique de détection et récupération

### Pattern de détection
```typescript
const habitPatterns = [
    /quels? habitudes? (il|ils|elle|elles) (me|m'|te|t'|nous|vous) (reste|restent)/i,
    /quels? habitudes? (me|m'|te|t'|nous|vous) (reste|restent)/i,
    /habitudes? manquantes?/i,
    /quels? habitudes? (à|a|en) (fai?re?|realiser?)/i
];
```

### Queries Prisma
1. **Récupérer les habitudes** :
   ```typescript
   const habits = await prisma.habit.findMany({
       where: { userId },
       orderBy: { order: 'asc' }
   });
   ```

2. **Récupérer les complétées** :
   ```typescript
   const completedEntries = await prisma.habitEntry.findMany({
       where: {
           habitId: { in: habits.map(h => h.id) },
           date: { gte: startOfDay, lte: endOfDay },
           completed: true
       }
   });
   ```

3. **Filtrer les manquantes** :
   ```typescript
   const missingHabits = habits.filter(habit => {
       const shouldBeDone = checkFrequency(habit, targetDate);
       const isCompleted = completedHabitIds.has(habit.id);
       return shouldBeDone && !isCompleted;
   });
   ```

---

## 🧪 Comment Tester

### 1. Créer des habitudes de test
```bash
# Créer une habitude quotidienne
curl -X POST http://localhost:3000/api/habits \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Méditation matin",
    "frequency": "daily",
    "daysOfWeek": []
  }'

# Créer une habitude hebdomadaire
curl -X POST http://localhost:3000/api/habits \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Sport lundi-mercredi",
    "frequency": "weekly",
    "daysOfWeek": ["monday", "wednesday"]
  }'
```

### 2. Tester depuis WhatsApp
1. Envoie : **"Quelles habitudes me restent ?"**
2. L'agent te liste les habitudes non complétées
3. Complète une habitude dans l'app
4. Ré-envoie la même question
5. L'habitude complétée ne devrait plus apparaître

### 3. Tester les dates
- **"Quelles habitudes pour demain ?"** → Affiche demain
- **"Quelles habitudes pour hier ?"** → Affiche hier
- **"Habitudes manquantes"** → Affiche aujourd'hui par défaut

---

## 📝 Exemples d'Utilisation

### Scénario 1 : Vérifier ce qui reste à faire aujourd'hui
**Utilisateur** : "Quelles habitudes il me reste à faire ?"

**Agent** :
```
📋 **Habitudes à faire lundi 27 octobre 2025**

⚠️ Tu as 2 habitude(s) à compléter :

1. 🔁 Lecture 30 minutes
2. 🔁 Appel famille

💪 Tu as encore le temps de les compléter aujourd'hui !
```

### Scénario 2 : Préparer demain
**Utilisateur** : "Quelles habitudes pour demain ?"

**Agent** :
```
📋 **Habitudes à faire mardi 28 octobre 2025**

⚠️ Tu as 3 habitude(s) à compléter :

1. 🔁 Méditation matin
2. 🔁 Lecture 30 minutes
3. 📅 Séance de sport (Mardi prévu)

💪 Tu as encore le temps de les compléter aujourd'hui !
```

### Scénario 3 : Tout est fait
**Utilisateur** : "Quelles habitudes me restent ?"

**Agent** :
```
✅ Toutes tes habitudes pour lundi 27 octobre 2025 sont complétées ! 🎉

Continue comme ça ! 💪
```

---

## 🎯 Cas d'Usage

### 📅 Planning du matin
- **"Quelles habitudes il me reste aujourd'hui ?"**
- → Avoir une vue claire de ce qui attend
- → Prioriser les tâches importantes

### 🔄 Bilan de fin de journée
- **"Quelles habitudes me restent ?"**
- → Vérifier ce qui n'a pas été fait
- → Comprendre les habitudes difficiles

### 📆 Préparation demain
- **"Quelles habitudes pour demain ?"**
- → Anticiper le programme du lendemain
- → Planifier les activités

---

## ✅ Checklist de Déploiement

- [x] Fonctionnalité développée
- [x] Intégrée dans l'agent IA
- [x] Gestion des dates (aujourd'hui, demain, hier)
- [x] Filtrage par fréquence (daily, weekly)
- [x] Affichage avec emojis et descriptions
- [ ] Tests en production
- [ ] Documentation utilisateur

---

## 🎉 Fonctionnalité Opérationnelle !

Tu peux maintenant demander à l'agent IA quelles habitudes tu as encore à faire, et il te les listera en fonction de la date demandée !

**Commandes test** :
- "Quelles habitudes me restent ?"
- "Quelles habitudes pour demain ?"
- "Habitudes manquantes"

