# 📋 Configuration finale des templates WhatsApp

## ✅ Templates utilisés (4 sur 6)

| # | Notification | Template WhatsApp | Format |
|---|--------------|-------------------|--------|
| 1 | Rappel matin | `productif_rappel_matin` | ✅ Template |
| 2 | Amélioration | `productif_rappel_amelioration` | ✅ Template |
| 3 | Vérification midi | `productif_verification_midi` | ✅ Template |
| 4 | Rappel après-midi | ❌ Pas de template | 📱 Message texte |
| 5 | Planification soir | `productif_planification_soir` | ✅ Template |
| 6 | Vérification nuit | ❌ Pas de template | 📱 Message texte |

## 🎯 Pourquoi 2 notifications sans template ?

### Limitation WhatsApp

Les **variables de template WhatsApp ne peuvent pas contenir de sauts de ligne** (`\n`).

**Erreur si on essaie :**
```json
{
  "error": {
    "message": "(#100) Invalid parameter",
    "details": "Param text cannot have new-line/tab characters"
  }
}
```

### Solution appliquée

Pour les notifications **après-midi** et **nuit** qui ont besoin de **listes longues d'habitudes** avec des sauts de ligne, on utilise des **messages texte classiques** au lieu de templates.

**Avantage :** Pas de limitation 24h car ce sont des messages de session (dans la fenêtre de 24h après interaction).

## 📱 Messages envoyés

### 🌅 Rappel matin (Template)

```
🌅 Bonjour et bonne journée !

🌅 C'est parti pour une nouvelle journée !

⭕ Sport • ⭕ Lecture • ⭕ Méditation • ✅ Journaling

Bonne journée ! 💙
```

**Format :** Template avec 1 variable (habitudes sur une ligne)

---

### 💡 Amélioration (Template)

```
🌅 *Bonjour ! Voici tes insights du jour*

🎯 *Aujourd'hui, concentre-toi sur :*

Gestion du temps • Amélioration continue

💡 *Mes recommandations :

Planifier ta journée • Utiliser des outils • Prioriser

✨ Bonne journée productive ! 💪
```

**Format :** Template avec 2 variables (focus + recommandations sur une ligne)

---

### 🍽 Vérification midi (Template)

```
🍽 Pause déjeuner bien méritée

🕛 C'est l'heure de la pause déjeuner !

📊 Bilan de la matinée :

✅ 3/5 tâches accomplies

⏱ 2h30min de travail

💭 Comment s'est passée ta matinée ?

🍽 Bonne pause déjeuner ! On se retrouve après manger
```

**Format :** Template avec 2 variables (tâches + temps)

---

### ☀ Rappel après-midi (Message texte)

```
☀ L'après-midi t'attend !

💪 Allez, c'est reparti !

💫 N'oublie pas tes habitudes :

1. ✅ Sport
2. ⭕ Lecture
3. ⭕ Méditation
4. ✅ Journaling
5. ⭕ Deep Work
6. ⭕ Tracking
7. ⭕ Planifier Journée
8. ⭕ Tâche 1
9. ⭕ Tâche 2
10. ⭕ Réveil 8h

🎯 On se retrouve quand tu as fini ! 🚀
```

**Format :** Message texte classique (liste avec sauts de ligne)

---

### 🌙 Planification soir (Template)

```
🌙 Préparons demain ensemble

🌙 C'est l'heure du bilan et de préparer demain !

📊 Bilan du jour :

✅ 3/5 tâches accomplies

📱 Pour créer une tâche : dit simplement "planifie ma journée de demain"
```

**Format :** Template avec 1 variable (ratio tâches)

---

### ✨ Vérification nuit (Message texte)

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

**Format :** Message texte classique (liste avec sauts de ligne + stats)

---

## ⚙️ Configuration

### Dans `.env`

```env
WHATSAPP_USE_TEMPLATES=true
WHATSAPP_TEMPLATE_LANGUAGE=fr
```

### Dans le code

**Fichier :** `src/services/NotificationService.js`

```javascript
const notificationTemplates = {
    'MORNING_REMINDER': 'productif_rappel_matin',
    'NOON_CHECK': 'productif_verification_midi',
    // 'AFTERNOON_REMINDER': null,  // Message texte
    'EVENING_PLANNING': 'productif_planification_soir',
    // 'NIGHT_CHECK': null  // Message texte
};
```

Les types `AFTERNOON_REMINDER` et `NIGHT_CHECK` ne sont **pas mappés** à un template, donc ils seront automatiquement envoyés en **message texte classique**.

---

## 🧪 Tests

### Templates (4)

```bash
npm run test:morning-template
npm run test:amelioration-template
npm run test:midi-template
npm run test:planification-soir-template
```

### Messages texte (2)

```bash
npm run test:apres-midi-template
npm run test:verification-nuit-template
```

**Note :** Les scripts de test fonctionnent toujours, mais pour après-midi et nuit, ils envoient maintenant des messages texte au lieu de templates.

---

## 🎯 Templates à créer dans WhatsApp Business Manager

**Seulement 4 templates à créer :**

1. ✅ `productif_rappel_matin` (1 variable)
2. ✅ `productif_rappel_amelioration` (2 variables)
3. ✅ `productif_verification_midi` (2 variables)
4. ✅ `productif_planification_soir` (1 variable)

**Pas besoin de créer :**
- ❌ `productif_rappel_apres_midi` (message texte)
- ❌ `productif_verification_nuit` (message texte)

---

## 📊 Avantages de cette configuration

### Templates (4 notifications)

✅ **Contournent la limite 24h** (messages proactifs approuvés)  
✅ **Format professionnel** (officiels WhatsApp Business)  
✅ **Variables courtes** (taux, temps, focus)  
✅ **Convient aux listes courtes** sur une ligne

### Messages texte (2 notifications)

✅ **Listes longues formatées** avec sauts de ligne  
✅ **Plus lisibles** pour 10+ habitudes  
✅ **Pas de limite de variables**  
✅ **Envoyés dans la fenêtre 24h** (après interaction utilisateur)

---

## 🔄 Fallback automatique

Si un **template échoue**, le système bascule automatiquement sur un **message texte** avec le même contenu.

---

## 🎊 Résultat final

- **4 templates WhatsApp** professionnels pour les notifications clés
- **2 messages texte** pour les listes longues d'habitudes
- **6 moments de la journée** couverts (07:00 → 22:00)
- **Format optimal** pour chaque type de contenu

**La meilleure configuration pour productif-io ! 🚀**

