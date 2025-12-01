# 📋 Template Planification Soir - Configuration

## ✅ Modifications effectuées

### 1. NotificationContentBuilder - Variable des tâches accomplies

**Fichier :** `src/services/NotificationContentBuilder.js`

Méthode `buildEveningContent()` modifiée pour retourner le bilan des tâches :

```javascript
async buildEveningContent(userId) {
    // Récupère les tâches prioritaires du jour
    // Compte combien ont été complétées
    
    return "3/5"; // X tâches complétées / Y tâches totales
}
```

**Logique :**
- Récupère toutes les tâches prioritaires du jour (`priority >= 3`)
- Compte les tâches complétées vs totales
- Retourne le format "X/Y"

### 2. NotificationService - Mapping du template

**Fichier :** `src/services/NotificationService.js`

Ajout du mapping :
```javascript
'EVENING_PLANNING': 'productif_planification_soir'
```

### 3. Script de test

**Fichier :** `scripts/test-planification-soir-template.js`

- Test complet du template à 1 variable
- Affiche le bilan de la journée
- Fallback automatique sur message texte

## 📋 Format du template

Dans WhatsApp Business Manager, le template `productif_planification_soir` doit avoir ce format :

```
🌙 Préparons demain ensemble

🌙 C'est l'heure du bilan et de préparer demain !

📊 Bilan du jour :

✅ {{1}} tâches accomplies

📱 Pour créer une tâche : dit simplement "planifie ma journée de demain"
```

### Variable

**{{1}} - Tâches accomplies**

Format: `"X/Y"`
```
3/5
```
- X = nombre de tâches complétées
- Y = nombre total de tâches prioritaires

**Calcul:**
- Filtre les tâches avec `priority >= 3`
- Filtre celles du jour (`dueDate` ou `scheduledFor` = aujourd'hui)
- Compte les complétées vs totales

## 🚀 Test

### Test rapide

```bash
npm run test:planification-soir-template
```

### Test avec utilisateur spécifique

```bash
npm run test:planification-soir-template email@example.com
```

### Ce que fait le test

1. Récupère les tâches prioritaires du jour
2. Calcule le nombre complété vs total
3. Construit la variable {{1}} (ex: "3/5")
4. Envoie via le template `productif_planification_soir`
5. Affiche les résultats détaillés
6. Enregistre en base de données

## 📊 Résultat attendu

Sur WhatsApp :

```
🌙 Préparons demain ensemble

🌙 C'est l'heure du bilan et de préparer demain !

📊 Bilan du jour :

✅ 3/5 tâches accomplies

📱 Pour créer une tâche : dit simplement "planifie ma journée de demain"
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

La planification du soir est envoyée automatiquement :

- Heure configurée : `eveningTime` (par défaut 19:00)
- Fréquence : Quotidien
- Scheduler : `NotificationScheduler`

Configuration dans `notificationSettings` :

```javascript
{
  taskReminder: true,
  eveningTime: "19:00"
}
```

## 📊 Données utilisées

### Tâches

- Source : Table `Task`
- Critères :
  - `dueDate` ou `scheduledFor` = aujourd'hui
  - `priority >= 3` (tâches prioritaires)
- Calcul : `completedTasks.length / totalTasks.length`

### Pourquoi uniquement les tâches prioritaires ?

Les tâches prioritaires (`priority >= 3`) représentent les tâches les plus importantes de la journée. Le bilan du soir se concentre sur ces tâches pour donner un aperçu de la productivité sans surcharger d'information.

## 🎯 Exemples de résultats

| Scénario | Variable {{1}} | Interprétation |
|----------|---------------|----------------|
| Journée productive | `5/5` | Toutes les tâches complétées ✅ |
| Bonne progression | `4/6` | Majorité des tâches faites |
| En cours | `2/5` | Quelques tâches complétées |
| Début difficile | `0/3` | Aucune tâche complétée |
| Pas de tâches | `0/0` | Aucune tâche prioritaire aujourd'hui |

## 📱 Interaction utilisateur

Le message invite l'utilisateur à planifier sa journée de demain :

> **"Pour créer une tâche : dit simplement 'planifie ma journée de demain'"**

Cette phrase encourage l'utilisateur à utiliser l'agent conversationnel WhatsApp pour planifier le lendemain.

### Exemples de commandes

L'utilisateur peut répondre avec :
- "Planifie ma journée de demain"
- "Demain je dois faire X, Y, Z"
- "Ajoute une tâche pour demain"
- Etc.

## ⚠️ Dépannage

### Template non trouvé

```
Error: Template "productif_planification_soir" not found
```

**Solution :** Vérifiez que le template est approuvé avec **1 variable** `{{1}}`

### Variable à zéro

```
Variable {{1}}: 0/0
```

**Causes possibles :**
1. Aucune tâche prioritaire créée pour aujourd'hui
2. Toutes les tâches ont une priorité < 3

**Solutions :**
- Créer des tâches avec `priority >= 3`
- Vérifier que les tâches ont `dueDate` ou `scheduledFor` = aujourd'hui

### Fallback sur message texte

Si le template échoue, le système bascule automatiquement sur un message texte classique avec les mêmes informations.

## 🔄 Fonctionnement automatique

1. `NotificationScheduler` planifie la notification à `eveningTime`
2. `NotificationService.scheduleEveningNotification()` crée la notification
3. `NotificationContentBuilder.buildEveningContent()` génère la variable {{1}}
4. `NotificationService.processNotification()` détecte le type `EVENING_PLANNING`
5. Si `WHATSAPP_USE_TEMPLATES=true` : envoie via template
6. Sinon : envoie en message texte classique
7. Marque comme envoyée

## ✅ Checklist

- [ ] Template `productif_planification_soir` approuvé
- [ ] 1 variable `{{1}}` dans le template
- [ ] `WHATSAPP_USE_TEMPLATES=true` dans `.env`
- [ ] Test réussi : `npm run test:planification-soir-template`
- [ ] Message reçu sur WhatsApp avec bon format
- [ ] Variable contient le bon bilan (ex: "3/5")

## 📚 Documentation

- **Test :** `scripts/test-planification-soir-template.js`
- **Builder :** `src/services/NotificationContentBuilder.js`
- **Service :** `src/services/NotificationService.js`

## 🎯 Récapitulatif des templates configurés

| Template | Variables | Type | Heure |
|----------|-----------|------|-------|
| `productif_rappel_matin` | 1 | Habitudes | 07:00 |
| `productif_rappel_amelioration` | 2 | Insights IA | 08:30 |
| `productif_verification_midi` | 2 | Statistiques | 12:00 |
| `productif_rappel_apres_midi` | 1 | Habitudes | 14:00 |
| `productif_planification_soir` | 1 | Bilan | 19:00 |

**Reste à configurer :**
- `productif_verification_nuit`

## 💡 Cas d'usage typique

**Scénario :** L'utilisateur a planifié 5 tâches prioritaires, il en a complété 3.

**Message reçu à 19:00 :**
```
🌙 Préparons demain ensemble

🌙 C'est l'heure du bilan et de préparer demain !

📊 Bilan du jour :

✅ 3/5 tâches accomplies

📱 Pour créer une tâche : dit simplement "planifie ma journée de demain"
```

**L'utilisateur répond :**
> "Planifie ma journée de demain : finir le rapport, appeler le client, faire du sport"

➡️ L'agent IA crée automatiquement 3 tâches pour demain.

## 🔗 Similitudes avec autres templates

### Template similaire : Vérification de midi

Même variable pour les tâches, mais contexte différent :
- Midi = Bilan de la matinée (00:00 → 12:00)
- Soir = Bilan de toute la journée (00:00 → 19:00)

### Différence

| Aspect | Midi | Soir |
|--------|------|------|
| Période | Matinée uniquement | Journée complète |
| Variables | 2 (tâches + temps) | 1 (tâches) |
| Objectif | Pause + bilan partiel | Bilan + planification |
| Action | Prendre une pause | Planifier demain |

## 🚀 Optimisation future

**Idée :** Ajouter une 2ème variable pour le temps total travaillé dans la journée (comme pour la vérification de midi).

**Format possible :**
```
📊 Bilan du jour :

✅ {{1}} tâches accomplies
⏱ {{2}} de travail

📱 Pour créer une tâche : dit simplement "planifie ma journée de demain"
```

Cela donnerait un bilan plus complet (tâches + temps).

## 🌟 Objectif du template

Ce template marque **la transition jour → soir** :
1. **Bilan** : Voir ce qui a été accompli aujourd'hui
2. **Planification** : Préparer activement la journée de demain
3. **Motivation** : Encourager l'utilisateur à planifier via l'agent IA

C'est un moment clé pour :
- Célébrer les accomplissements
- Identifier ce qui n'a pas été fait
- Préparer un lendemain productif

