# 📋 Template Vérification Nuit - Configuration

## ✅ Modifications effectuées

### 1. NotificationContentBuilder - Variables du bilan de nuit

**Fichier :** `src/services/NotificationContentBuilder.js`

Méthode `buildNightContent()` modifiée pour retourner un objet avec 3 variables :

```javascript
{
    var1: "11/13",           // Ratio habitudes complétées
    var2: "1. ✅ Sport\n2. ⭕ Lecture\n...",  // Liste détaillée
    var3: "5h30min"          // Temps de travail total
}
```

**Logique :**
- Récupère toutes les habitudes du jour avec leur statut
- Calcule le ratio complétées/totales
- Génère la liste détaillée avec statuts (✅/⭕)
- Calcule le temps de travail total depuis minuit
- Retourne les 3 variables formatées

### 2. NotificationService - Mapping du template

**Fichier :** `src/services/NotificationService.js`

Ajout du mapping :
```javascript
'NIGHT_CHECK': 'productif_verification_nuit'
```

### 3. Script de test

**Fichier :** `scripts/test-verification-nuit-template.js`

- Test complet du template à 3 variables
- Affiche le bilan complet de la journée
- Fallback automatique sur message texte

## 📋 Format du template

Dans WhatsApp Business Manager, le template `productif_verification_nuit` doit avoir ce format :

```
✨ Bilan de ta journée

🌙 Dernière étape avant d'aller dormir !

📊 Habitudes du jour : {{1}}

💫 État des habitudes :

{{2}}

⏱ Temps de travail total : {{3}}

💭 Prends 2 minutes pour compléter et noter comment s'est passée ta journée.

🌅 On se retrouve demain matin pour une nouvelle journée productive ! 💪
```

### Variables

**{{1}} - Ratio des habitudes** (format: "X/Y")
```
11/13
```
- X = nombre d'habitudes complétées
- Y = nombre total d'habitudes du jour

**{{2}} - Liste détaillée des habitudes**
```
1. ✅ Apprentissage
2. ✅ Note de sa journée
3. ⭕ Dormir 00h
4. ✅ Sport
5. ✅ Tracking
6. ✅ Planifier Journée
7. ✅ Tâche 1
8. ✅ Tâche 2
9. ⭕ Réveil 8h
10. ✅ no porn
11. ✅ Tâche 3
12. ✅ Routine du soir
13. ✅ Routine du matin
14. ✅ Deep Work
```
- Liste numérotée avec statuts
- ✅ = Complétée
- ⭕ = Non complétée

**{{3}} - Temps de travail total** (format: "XhYmin")
```
5h30min
```
- Calculé depuis minuit jusqu'à maintenant
- Basé sur les `timeEntry` de l'utilisateur

## 🚀 Test

### Test rapide

```bash
npm run test:verification-nuit-template
```

### Test avec utilisateur spécifique

```bash
npm run test:verification-nuit-template email@example.com
```

### Ce que fait le test

1. Récupère toutes les habitudes du jour
2. Vérifie leur statut de complétion
3. Calcule le temps de travail total
4. Construit les 3 variables du template
5. Envoie via le template `productif_verification_nuit`
6. Affiche les résultats détaillés
7. Enregistre en base de données

## 📊 Résultat attendu

Sur WhatsApp :

```
✨ Bilan de ta journée

🌙 Dernière étape avant d'aller dormir !

📊 Habitudes du jour : 11/13

💫 État des habitudes :

1. ✅ Apprentissage
2. ✅ Note de sa journée
3. ⭕ Dormir 00h
4. ✅ Sport
5. ✅ Tracking
6. ✅ Planifier Journée
7. ✅ Tâche 1
8. ✅ Tâche 2
9. ⭕ Réveil 8h
10. ✅ no porn
11. ✅ Tâche 3
12. ✅ Routine du soir
13. ✅ Routine du matin
14. ✅ Deep Work

⏱ Temps de travail total : 5h30min

💭 Prends 2 minutes pour compléter et noter comment s'est passée ta journée.

🌅 On se retrouve demain matin pour une nouvelle journée productive ! 💪
```

## 🔧 Configuration

### Prérequis

1. Template approuvé dans WhatsApp Business Manager
2. Configuration dans `.env` :
   ```env
   WHATSAPP_USE_TEMPLATES=true
   WHATSAPP_TEMPLATE_LANGUAGE=fr
   ```

### Déclenchement automatique

La vérification de nuit est envoyée automatiquement :

- Heure configurée : `nightTime` (par défaut 22:00)
- Fréquence : Quotidien
- Scheduler : `NotificationScheduler`

Configuration dans `notificationSettings` :

```javascript
{
  taskReminder: true,
  nightTime: "22:00"
}
```

## 📊 Données utilisées

### Habitudes

- Source : Table `Habit`
- Critères :
  - `userId` = utilisateur actuel
  - `daysOfWeek` contient le jour actuel
- Inclusion : Table `HabitEntry` pour vérifier complétion
  - `date` = aujourd'hui
  - `completed` = true/false

### Temps de travail

- Source : Table `TimeEntry`
- Critères :
  - `userId` = utilisateur actuel
  - `startTime >= aujourd'hui 00:00`
  - `endTime IS NOT NULL` (sessions terminées)
- Calcul : Somme des durées en minutes

## 🎯 Exemples de résultats

| Scénario | var1 | var2 | var3 | Interprétation |
|----------|------|------|------|----------------|
| Journée excellente | `13/13` | Toutes ✅ | `8h30min` | Journée parfaite ! |
| Bonne journée | `11/13` | Majorité ✅ | `5h30min` | Très bonne journée |
| Journée moyenne | `7/13` | Mixte | `3h15min` | Progrès à faire |
| Début difficile | `2/13` | Majorité ⭕ | `1h00min` | Journée compliquée |
| Pas d'habitudes | `0/0` | Aucune | `0h0min` | Pas d'habitudes configurées |

## 💭 Objectif du template

Ce template est **le bilan final de la journée** avant de dormir :

1. **Réflexion** : Voir ce qui a été accompli
2. **Completion** : Dernière chance de cocher des habitudes
3. **Journaling** : Encourager à noter sa journée
4. **Motivation** : Préparer mentalement le lendemain

### Psychologie

- **Score élevé (>80%)** → Fierté et satisfaction ✅
- **Score moyen (50-80%)** → Conscience des progrès 💪
- **Score faible (<50%)** → Motivation pour demain 🎯

## ⚠️ Dépannage

### Template non trouvé

```
Error: Template "productif_verification_nuit" not found
```

**Solution :** Vérifiez que le template est approuvé avec les **3 variables** `{{1}}`, `{{2}}`, et `{{3}}`

### Variables vides ou à zéro

```
Variable {{1}}: 0/0
Variable {{2}}: Aucune habitude
Variable {{3}}: 0h0min
```

**Causes possibles :**
1. Aucune habitude créée
2. Aucune habitude prévue pour aujourd'hui (vérifier `daysOfWeek`)
3. Aucune session de travail enregistrée (TimeEntry)

**Solutions :**
- Créer des habitudes
- Configurer les jours de la semaine pour chaque habitude
- Créer des sessions de travail (TimeEntry)

### Liste trop longue ({{2}})

Si l'utilisateur a beaucoup d'habitudes (>15), la liste peut être longue.

**Note :** WhatsApp limite la longueur des variables à 1024 caractères. Le code tronque automatiquement si nécessaire.

### Fallback sur message texte

Si le template échoue, le système bascule automatiquement sur un message texte classique avec les mêmes informations.

## 🔄 Fonctionnement automatique

1. `NotificationScheduler` planifie la notification à `nightTime`
2. `NotificationService.scheduleNightNotification()` crée la notification
3. `NotificationContentBuilder.buildNightContent()` génère les 3 variables
4. `NotificationService.processNotification()` détecte le type `NIGHT_CHECK`
5. Si `WHATSAPP_USE_TEMPLATES=true` : envoie via template
6. Sinon : envoie en message texte classique
7. Marque comme envoyée

## ✅ Checklist

- [ ] Template `productif_verification_nuit` approuvé
- [ ] 3 variables `{{1}}`, `{{2}}`, `{{3}}` dans le template
- [ ] `WHATSAPP_USE_TEMPLATES=true` dans `.env`
- [ ] Test réussi : `npm run test:verification-nuit-template`
- [ ] Message reçu sur WhatsApp avec bon format
- [ ] Toutes les variables affichées correctement

## 📚 Documentation

- **Test :** `scripts/test-verification-nuit-template.js`
- **Builder :** `src/services/NotificationContentBuilder.js`
- **Service :** `src/services/NotificationService.js`

## 🎯 Récapitulatif complet des templates

| Template | Variables | Type | Heure | Statut |
|----------|-----------|------|-------|--------|
| `productif_rappel_matin` | 1 | Habitudes | 07:00 | ✅ |
| `productif_rappel_amelioration` | 2 | Insights IA | 08:30 | ✅ |
| `productif_verification_midi` | 2 | Statistiques | 12:00 | ✅ |
| `productif_rappel_apres_midi` | 1 | Habitudes | 14:00 | ✅ |
| `productif_planification_soir` | 1 | Bilan | 19:00 | ✅ |
| `productif_verification_nuit` | 3 | Bilan complet | 22:00 | ✅ |

**🎉 TOUS LES TEMPLATES SONT CONFIGURÉS !**

## 💡 Cas d'usage typique

**Scénario :** L'utilisateur a complété 11 habitudes sur 13 et travaillé 5h30.

**Message reçu à 22:00 :**
```
✨ Bilan de ta journée

🌙 Dernière étape avant d'aller dormir !

📊 Habitudes du jour : 11/13

💫 État des habitudes :

1. ✅ Sport
2. ✅ Apprentissage
3. ⭕ Dormir 00h
4. ✅ Méditation
... (liste complète)

⏱ Temps de travail total : 5h30min

💭 Prends 2 minutes pour compléter et noter comment s'est passée ta journée.

🌅 On se retrouve demain matin pour une nouvelle journée productive ! 💪
```

**L'utilisateur peut :**
1. Cocher les 2 dernières habitudes restantes
2. Noter sa journée dans le journal
3. Aller dormir avec satisfaction (11/13 = 85%)

## 🔗 Template le plus complet

Ce template est **le plus riche en informations** :

| Aspect | Détails |
|--------|---------|
| Variables | 3 (le plus) |
| Données | Habitudes + Temps |
| Objectif | Bilan complet avant sommeil |
| Action | Compléter + journaliser |

### Comparaison avec autres bilans

| Template | Moment | Variables | Focus |
|----------|--------|-----------|-------|
| Midi | 12:00 | 2 | Matinée uniquement |
| Soir | 19:00 | 1 | Tâches seulement |
| **Nuit** | **22:00** | **3** | **Bilan total** |

## 🚀 Optimisation future

**Idée :** Ajouter une 4ème variable pour le score de satisfaction (si l'utilisateur a noté sa journée).

**Format possible :**
```
💯 Score de la journée : {{4}}
```

Cela encouragerait encore plus à utiliser le journal quotidien.

## 🌟 Importance de ce template

C'est **le dernier message de la journée**, il doit être :
1. **Complet** : Tout le bilan en un coup d'œil
2. **Motivant** : Valoriser les accomplissements
3. **Incitatif** : Encourager à compléter et journaliser
4. **Positif** : Préparer un bon sommeil

**Cercle vertueux :** Bilan → Satisfaction → Motivation → Meilleur sommeil → Meilleure journée demain

## 📝 Message final

> "💭 Prends 2 minutes pour compléter et noter comment s'est passée ta journée."

Cette phrase est **clé** car elle :
- Rappelle de compléter les dernières habitudes
- Encourage à journaliser (essentiel pour les insights IA)
- Fixe un temps court (2 minutes) pour éviter la procrastination

## 🎊 Félicitations !

**Tous les 6 templates sont maintenant configurés !** 🎉

Votre système de notifications WhatsApp est **complet** et **professionnel**.

