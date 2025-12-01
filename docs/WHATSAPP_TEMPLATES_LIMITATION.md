# ⚠️ Limitation importante des templates WhatsApp

## 🚨 Problème : Variables ne peuvent pas contenir de sauts de ligne

Les templates WhatsApp ont une limitation stricte :

> **Les variables de template ne peuvent PAS contenir de retours à la ligne (`\n`), de tabulations (`\t`), ou plus de 4 espaces consécutifs.**

### Erreur WhatsApp

```json
{
  "error": {
    "message": "(#100) Invalid parameter",
    "type": "OAuthException",
    "code": 100,
    "error_data": {
      "messaging_product": "whatsapp",
      "details": "Param text cannot have new-line/tab characters or more than 4 consecutive spaces"
    }
  }
}
```

## ✅ Solution appliquée

### Avant (❌ Ne fonctionne pas)

```javascript
const habitsList = habits.map((habit, index) => {
    return `${index + 1}. ${status} ${habit.name}`;
}).join('\n');  // ❌ Sauts de ligne interdits !

// Résultat:
// "1. ⭕ Sport\n2. ⭕ Lecture\n3. ⭕ Méditation"
```

### Après (✅ Fonctionne)

```javascript
const habitsList = habits.map((habit, index) => {
    return `${status} ${habit.name}`;
}).join(' • ');  // ✅ Séparateur compatible

// Résultat:
// "⭕ Sport • ⭕ Lecture • ⭕ Méditation"
```

## 📋 Templates mis à jour

### 1. `productif_rappel_matin`

**Variable {{1}} :**
```
⭕ Sport • ⭕ Lecture • ⭕ Méditation • ✅ Journaling
```

### 2. `productif_rappel_amelioration`

**Variable {{1}} (focus areas) :**
```
Gestion du temps • Amélioration continue • Organisation
```

**Variable {{2}} (recommandations) :**
```
Établir un calendrier hebdomadaire • Utiliser des outils de gestion • Prioriser les tâches
```

### 3. `productif_rappel_apres_midi`

**Variable {{1}} :**
```
✅ Sport • ⭕ Lecture • ⭕ Méditation • ✅ Journaling
```

### 4. `productif_verification_nuit`

**Variable {{2}} :**
```
✅ Sport • ✅ Lecture • ⭕ Méditation • ✅ Journaling
```

## 🔧 Fichiers modifiés

1. **`src/services/NotificationContentBuilder.js`**
   - `buildMorningHabitsVariable()` - Template matin
   - `buildAfternoonContent()` - Template après-midi
   - `buildNightContent()` - Template nuit

2. **`lib/journal/MorningInsightsScheduler.js`**
   - `sendInsightToUser()` - Template amélioration

## 💡 Format recommandé pour les templates

### ✅ Ce qui fonctionne

- **Séparateur :** ` • ` (espace + bullet + espace)
- **Statuts :** `✅` et `⭕` (emojis)
- **Format compact :** `✅ Tâche 1 • ⭕ Tâche 2 • ✅ Tâche 3`

### ❌ Ce qui ne fonctionne PAS

- Sauts de ligne : `\n`
- Tabulations : `\t`
- Plus de 4 espaces consécutifs : `    ` (5+)
- Retours chariot : `\r`

## 📱 Résultat sur WhatsApp

### Template après-midi (exemple)

```
☀ L'après-midi t'attend !

💪 Allez, c'est reparti !

💫 N'oublie pas tes habitudes :

✅ Sport • ⭕ Lecture • ⭕ Méditation • ✅ Journaling • ⭕ Deep Work

🎯 On se retrouve quand tu as fini ! 🚀
```

**Avantages :**
- ✅ Compact et lisible
- ✅ Tout visible d'un coup d'œil
- ✅ Pas de scroll nécessaire

## 🎯 Recommandations

### Pour les listes courtes (< 5 éléments)

Utilisez ` • ` comme séparateur :
```
Item 1 • Item 2 • Item 3
```

### Pour les listes moyennes (5-10 éléments)

Utilisez ` • ` avec groupement possible :
```
✅ Item 1 • ✅ Item 2 • ✅ Item 3 • ⭕ Item 4 • ⭕ Item 5
```

### Pour les listes longues (> 10 éléments)

**Option 1 :** Limiter le nombre d'éléments affichés
```javascript
const topHabits = habits.slice(0, 10);  // Limiter à 10
```

**Option 2 :** Résumer au lieu de lister
```javascript
return `${completedCount}/${totalCount} habitudes complétées aujourd'hui`;
```

## 🚀 Test

Pour tester qu'un template fonctionne :

```bash
npm run test:apres-midi-template votre.email@example.com
```

Vérifier dans les logs :
- ✅ Pas d'erreur `WHATSAPP_TEMPLATE_ERROR`
- ✅ Message avec `WHATSAPP_MESSAGE_SENT`
- ✅ Réception sur WhatsApp avec le format complet du template

## ⚠️ Important

**Avant :** Les templates échouaient silencieusement et basculaient sur le fallback (message texte brut sans le format du template).

**Maintenant :** Les templates fonctionnent correctement avec les variables sur une seule ligne.

## 📚 Références

- [WhatsApp Business API - Message Templates](https://developers.facebook.com/docs/whatsapp/api/messages/message-templates)
- [Template Variables Guidelines](https://developers.facebook.com/docs/whatsapp/message-templates/guidelines#variable-parameters)

