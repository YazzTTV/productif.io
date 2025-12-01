# 📋 Template Rappel Après-Midi - Configuration

## ✅ Modifications effectuées

### 1. NotificationContentBuilder - Variable des habitudes

**Fichier :** `src/services/NotificationContentBuilder.js`

Méthode `buildAfternoonContent()` modifiée pour retourner la liste complète des habitudes avec leur statut :

```javascript
async buildAfternoonContent(userId) {
    // Récupère TOUTES les habitudes du jour avec leur statut
    // ✅ = complétée
    // ⭕ = non complétée
    
    return "1. ✅ Sport\n2. ⭕ Lecture\n3. ⭕ Méditation\n...";
}
```

**Logique :**
- Récupère toutes les habitudes prévues pour aujourd'hui (jour de la semaine)
- Vérifie leur statut de complétion via `habitEntry`
- Retourne la liste formatée avec statuts

### 2. NotificationService - Mapping du template

**Fichier :** `src/services/NotificationService.js`

Ajout du mapping :
```javascript
'AFTERNOON_REMINDER': 'productif_rappel_apres_midi'
```

### 3. Script de test

**Fichier :** `scripts/test-apres-midi-template.js`

- Test complet du template à 1 variable
- Affiche la liste des habitudes avec statuts
- Fallback automatique sur message texte

## 📋 Format du template

Dans WhatsApp Business Manager, le template `productif_rappel_apres_midi` doit avoir ce format :

```
☀ L'après-midi t'attend !

💪 Allez, c'est reparti !

💫 N'oublie pas tes habitudes :

{{1}}

🎯 On se retrouve quand tu as fini ! 🚀
```

### Variable

**{{1}} - Liste des habitudes**

Format: Liste numérotée avec statuts
```
1. ⭕ Apprentissage
2. ⭕ Sport
3. ✅ Méditation
4. ⭕ Lecture
5. ⭕ Tracking
```

**Statuts:**
- ✅ = Habitude déjà complétée
- ⭕ = Habitude non complétée (à faire)

**Source des données:**
- Table `Habit` avec `daysOfWeek` contenant le jour actuel
- Table `HabitEntry` pour vérifier la complétion
- Filtre par `userId` et date du jour

## 🚀 Test

### Test rapide

```bash
npm run test:apres-midi-template
```

### Test avec utilisateur spécifique

```bash
npm run test:apres-midi-template email@example.com
```

### Ce que fait le test

1. Récupère toutes les habitudes prévues pour aujourd'hui
2. Vérifie leur statut de complétion
3. Construit la liste formatée (variable {{1}})
4. Envoie via le template `productif_rappel_apres_midi`
5. Affiche les résultats détaillés
6. Enregistre en base de données

## 📊 Résultat attendu

Sur WhatsApp :

```
☀ L'après-midi t'attend !

💪 Allez, c'est reparti !

💫 N'oublie pas tes habitudes :

1. ⭕ Apprentissage
2. ✅ Sport
3. ⭕ Note de sa journée
4. ⭕ Dormir 00h
5. ⭕ Tracking
6. ⭕ Planifier Journée
7. ✅ Tâche 1
8. ⭕ Tâche 2
9. ⭕ Réveil 8h
10. ⭕ no porn
11. ⭕ Tâche 3
12. ⭕ Routine du soir
13. ⭕ Routine du matin
14. ⭕ Deep Work

🎯 On se retrouve quand tu as fini ! 🚀
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

Le rappel de l'après-midi est envoyé automatiquement :

- Heure configurée : `afternoonTime` (par défaut 14:00)
- Fréquence : Quotidien
- Scheduler : `NotificationScheduler`

Configuration dans `notificationSettings` :

```javascript
{
  taskReminder: true,
  afternoonTime: "14:00"
}
```

## 📊 Données utilisées

### Habitudes

- Source : Table `Habit`
- Critères :
  - `userId` = utilisateur actuel
  - `daysOfWeek` contient le jour actuel (ex: "monday", "tuesday"...)
- Inclusion : Table `HabitEntry` pour vérifier complétion
  - `date` = aujourd'hui
  - `completed` = true/false

### Logique de statut

```javascript
if (habit.entries.length > 0 && habit.entries[0].completed) {
    status = "✅"; // Complétée
} else {
    status = "⭕"; // Non complétée
}
```

## 🎯 Différences avec le rappel du matin

| Aspect | Matin | Après-midi |
|--------|-------|------------|
| Moment | Début de journée | Milieu de journée |
| Objectif | Voir toutes les habitudes à faire | Rappel + progression |
| Statuts | Tous ⭕ (non commencées) | Mixte ✅/⭕ (progression) |
| Motivation | "C'est parti !" | "C'est reparti !" |

## ⚠️ Dépannage

### Template non trouvé

```
Error: Template "productif_rappel_apres_midi" not found
```

**Solution :** Vérifiez que le template est approuvé avec **1 variable** `{{1}}`

### Aucune habitude

```
Variable {{1}}: Aucune habitude prévue pour cet après-midi.
```

**Causes possibles :**
1. Aucune habitude créée
2. Aucune habitude prévue pour aujourd'hui (vérifier `daysOfWeek`)
3. Toutes les habitudes sont désactivées

**Solutions :**
- Créer des habitudes
- Configurer les jours de la semaine pour chaque habitude
- Vérifier que le jour actuel correspond

### Toutes les habitudes à ⭕

**Normal en début d'après-midi** si l'utilisateur n'a encore rien fait. Les statuts se mettent à jour au fur et à mesure de la journée.

## 🔄 Fonctionnement automatique

1. `NotificationScheduler` planifie la notification à `afternoonTime`
2. `NotificationService.scheduleAfternoonNotification()` crée la notification
3. `NotificationContentBuilder.buildAfternoonContent()` génère la variable {{1}}
4. `NotificationService.processNotification()` détecte le type `AFTERNOON_REMINDER`
5. Si `WHATSAPP_USE_TEMPLATES=true` : envoie via template
6. Sinon : envoie en message texte classique
7. Marque comme envoyée

## ✅ Checklist

- [ ] Template `productif_rappel_apres_midi` approuvé
- [ ] 1 variable `{{1}}` dans le template
- [ ] `WHATSAPP_USE_TEMPLATES=true` dans `.env`
- [ ] Test réussi : `npm run test:apres-midi-template`
- [ ] Message reçu sur WhatsApp avec bon format
- [ ] Habitudes affichées avec bons statuts

## 📚 Documentation

- **Test :** `scripts/test-apres-midi-template.js`
- **Builder :** `src/services/NotificationContentBuilder.js`
- **Service :** `src/services/NotificationService.js`

## 🎯 Récapitulatif des templates configurés

| Template | Variables | Type | Heure |
|----------|-----------|------|-------|
| `productif_rappel_matin` | 1 | Habitudes | 07:00 |
| `productif_rappel_amelioration` | 2 | Insights IA | 08:30 |
| `productif_verification_midi` | 2 | Statistiques | 12:00 |
| `productif_rappel_apres_midi` | 1 | Habitudes | 14:00 |

**Restent à configurer :**
- `productif_planification_soir`
- `productif_verification_nuit`

## 💡 Cas d'usage typique

**Scénario :** L'utilisateur a complété 3 habitudes le matin, il lui en reste 5 à faire.

**Message reçu à 14:00 :**
```
☀ L'après-midi t'attend !

💪 Allez, c'est reparti !

💫 N'oublie pas tes habitudes :

1. ✅ Routine du matin
2. ✅ Sport
3. ✅ Apprentissage
4. ⭕ Planifier Journée
5. ⭕ Deep Work
6. ⭕ Note de sa journée
7. ⭕ Routine du soir
8. ⭕ Dormir 00h

🎯 On se retrouve quand tu as fini ! 🚀
```

➡️ **Motivation :** L'utilisateur voit qu'il a déjà accompli 3 habitudes (✅), et il lui en reste 5 (⭕) pour finir sa journée.

## 🔗 Similitudes avec autres templates

### Template similaire : Rappel du matin

Même structure, même variable, seule différence = moment d'envoi :
- Matin = Début de journée, tout à ⭕
- Après-midi = Milieu de journée, mixte ✅/⭕

### Réutilisation de logique

Le code de `buildAfternoonContent()` est presque identique à `buildMorningHabitsVariable()`, juste adapté au contexte de l'après-midi.

## 🚀 Optimisation possible

Pour éviter de surcharger l'utilisateur, on pourrait filtrer pour ne montrer que les habitudes **non complétées**. Cependant, montrer les habitudes complétées (✅) apporte de la motivation et un sentiment de progression.

**Option future :** Ajouter un paramètre pour personnaliser l'affichage.

