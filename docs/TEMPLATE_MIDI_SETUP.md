# 📋 Template Vérification Midi - Configuration

## ✅ Modifications effectuées

### 1. NotificationContentBuilder - Variables du midi

**Fichier :** `src/services/NotificationContentBuilder.js`

Méthode `buildNoonContent()` modifiée pour retourner un objet avec 2 variables :

```javascript
{
    var1: "3/5",        // Tâches accomplies
    var2: "2h30min"     // Temps de travail
}
```

**Logique :**
- Récupère les tâches prioritaires du jour
- Calcule le nombre de tâches complétées vs totales
- Calcule le temps de travail total depuis le matin
- Retourne les 2 variables formatées

### 2. NotificationService - Mapping du template

**Fichier :** `src/services/NotificationService.js`

Ajout du mapping :
```javascript
'NOON_CHECK': 'productif_verification_midi'
```

### 3. Script de test

**Fichier :** `scripts/test-midi-template.js`

- Test complet du template à 2 variables
- Affiche les statistiques de la matinée
- Fallback automatique sur message texte

## 📋 Format du template

Dans WhatsApp Business Manager, le template `productif_verification_midi` doit avoir ce format :

```
🍽 Pause déjeuner bien méritée

🕛 C'est l'heure de la pause déjeuner !

📊 Bilan de la matinée :

✅ {{1}} tâches accomplies

⏱ {{2}} de travail

💭 Comment s'est passée ta matinée ?

🍽 Bonne pause déjeuner ! On se retrouve après manger
```

### Variables

**{{1}} - Tâches accomplies** (format: "X/Y")
```
3/5
```
- X = nombre de tâches complétées
- Y = nombre total de tâches prioritaires du jour

**{{2}} - Temps de travail** (format: "XhYmin")
```
2h30min
```
- Calculé depuis minuit jusqu'à midi
- Basé sur les `timeEntry` de l'utilisateur

## 🚀 Test

### Test rapide

```bash
npm run test:midi-template
```

### Test avec utilisateur spécifique

```bash
npm run test:midi-template email@example.com
```

### Ce que fait le test

1. Récupère les tâches prioritaires du jour
2. Calcule les tâches complétées
3. Calcule le temps de travail de la matinée
4. Construit les 2 variables du template
5. Envoie via le template `productif_verification_midi`
6. Affiche les résultats détaillés
7. Enregistre en base de données

## 📊 Résultat attendu

Sur WhatsApp :

```
🍽 Pause déjeuner bien méritée

🕛 C'est l'heure de la pause déjeuner !

📊 Bilan de la matinée :

✅ 3/5 tâches accomplies

⏱ 2h30min de travail

💭 Comment s'est passée ta matinée ?

🍽 Bonne pause déjeuner ! On se retrouve après manger
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

La vérification de midi est envoyée automatiquement :

- Heure configurée : `noonTime` (par défaut 12:00)
- Fréquence : Quotidien
- Scheduler : `NotificationScheduler`

Configuration dans `notificationSettings` :

```javascript
{
  taskReminder: true,
  noonTime: "12:00"
}
```

## 📊 Données utilisées

### Tâches

- Source : Table `Task`
- Critères :
  - `dueDate` ou `scheduledFor` = aujourd'hui
  - `priority >= 3` (tâches prioritaires)
- Calcul : `completedTasks.length / totalTasks.length`

### Temps de travail

- Source : Table `TimeEntry`
- Critères :
  - `startTime >= aujourd'hui 00:00`
  - `startTime < aujourd'hui 12:00`
  - `endTime IS NOT NULL` (sessions terminées)
- Calcul : Somme des durées en minutes

## 🎯 Exemples de résultats

| Scénario | var1 | var2 | Interprétation |
|----------|------|------|----------------|
| Matinée productive | `5/5` | `3h45min` | Toutes les tâches faites, 3h45 de travail |
| En cours | `2/5` | `2h15min` | 2 tâches sur 5, 2h15 de travail |
| Début de journée | `0/5` | `0h30min` | Aucune tâche complétée, 30min de travail |
| Aucune tâche | `0/0` | `1h20min` | Pas de tâches prioritaires aujourd'hui |

## ⚠️ Dépannage

### Template non trouvé

```
Error: Template "productif_verification_midi" not found
```

**Solution :** Vérifiez que le template est approuvé avec les **2 variables** `{{1}}` et `{{2}}`

### Variables à zéro

```
Variable {{1}}: 0/0
Variable {{2}}: 0h0min
```

**Causes possibles :**
1. Aucune tâche prioritaire prévue aujourd'hui
2. Aucune session de travail enregistrée (TimeEntry)
3. Test exécuté avant d'avoir travaillé

**Solutions :**
- Créer des tâches avec `priority >= 3`
- Créer des sessions de travail (TimeEntry)
- Compléter quelques tâches avant le test

### Fallback sur message texte

Si le template échoue, le système bascule automatiquement sur un message texte classique avec les mêmes informations.

## 🔄 Fonctionnement automatique

1. `NotificationScheduler` planifie la notification à `noonTime`
2. `NotificationService.scheduleNoonNotification()` crée la notification
3. `NotificationContentBuilder.buildNoonContent()` génère les 2 variables
4. `NotificationService.processNotification()` détecte le type `NOON_CHECK`
5. Si `WHATSAPP_USE_TEMPLATES=true` : envoie via template
6. Sinon : envoie en message texte classique
7. Marque comme envoyée

## ✅ Checklist

- [ ] Template `productif_verification_midi` approuvé
- [ ] 2 variables `{{1}}` et `{{2}}` dans le template
- [ ] `WHATSAPP_USE_TEMPLATES=true` dans `.env`
- [ ] Test réussi : `npm run test:midi-template`
- [ ] Message reçu sur WhatsApp avec bon format
- [ ] Variables contiennent des données réalistes

## 📚 Documentation

- **Test :** `scripts/test-midi-template.js`
- **Builder :** `src/services/NotificationContentBuilder.js`
- **Service :** `src/services/NotificationService.js`

## 🎯 Récapitulatif des templates configurés

| Template | Variables | Type | Heure |
|----------|-----------|------|-------|
| `productif_rappel_matin` | 1 | Habitudes | 07:00 |
| `productif_rappel_amelioration` | 2 | Insights IA | 08:30 |
| `productif_verification_midi` | 2 | Statistiques | 12:00 |

**Restent à configurer :**
- `productif_rappel_apres_midi`
- `productif_planification_soir`
- `productif_verification_nuit`

