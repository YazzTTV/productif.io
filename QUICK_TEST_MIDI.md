# 🚀 Test rapide - Template Vérification Midi

## 🎯 Objectif

Tester le template `productif_verification_midi` qui envoie un bilan de la matinée à l'heure du déjeuner.

## ⚡ Test en 30 secondes

```bash
npm run test:midi-template
```

ou avec un utilisateur spécifique :

```bash
npm run test:midi-template votre.email@example.com
```

## ✅ Ce qui va se passer

1. Le script récupère vos tâches prioritaires du jour
2. Calcule combien vous avez complété (ex: 3/5)
3. Calcule votre temps de travail (ex: 2h30min)
4. Envoie sur WhatsApp via le template

## 📱 Résultat sur WhatsApp

Vous recevrez :

```
🍽 Pause déjeuner bien méritée

🕛 C'est l'heure de la pause déjeuner !

📊 Bilan de la matinée :

✅ 3/5 tâches accomplies

⏱ 2h30min de travail

💭 Comment s'est passée ta matinée ?

🍽 Bonne pause déjeuner ! On se retrouve après manger
```

## 📋 Prérequis

1. ✅ Template `productif_verification_midi` approuvé sur WhatsApp Business Manager
2. ✅ 2 variables `{{1}}` et `{{2}}` configurées dans le template
3. ✅ `.env` avec `WHATSAPP_USE_TEMPLATES=true`
4. ✅ WhatsApp configuré et activé pour votre compte

## 🔍 Console - Ce que vous verrez

```
🧪 === TEST TEMPLATE VÉRIFICATION MIDI ===

📋 Configuration des templates:
   - WHATSAPP_USE_TEMPLATES: true
   - WHATSAPP_TEMPLATE_LANGUAGE: fr

👤 Utilisateur trouvé:
   - Email: votre@email.com
   - ID: abc123
   - WhatsApp activé: ✅

🔧 Génération des statistiques de la matinée...

📝 === CONTENU DES VARIABLES ===
==========================================
Variable {{1}} - Tâches accomplies: 3/5
Variable {{2}} - Temps de travail: 2h30min
==========================================

📋 Envoi via TEMPLATE WhatsApp...
   - Template: productif_verification_midi
   - Variable {{1}}: 3/5
   - Variable {{2}}: 2h30min

✅ === SUCCÈS ===
📱 Message envoyé via template avec succès !
   - Message ID: wamid.xxx
   - WA ID: 33xxxxxxxxx

💡 Vérifiez votre WhatsApp pour voir le message avec le template !

💾 Enregistrement en base de données...
✅ Notification enregistrée en base de données

✅ Test terminé
```

## 📊 Variables du template

### {{1}} - Tâches accomplies

Format: `"X/Y"`

Exemples:
- `"5/5"` - Toutes les tâches complétées
- `"3/7"` - 3 tâches sur 7 complétées
- `"0/4"` - Aucune tâche complétée
- `"0/0"` - Pas de tâches prioritaires aujourd'hui

**Calcul**: Compte les tâches avec `priority >= 3` et `dueDate` ou `scheduledFor` = aujourd'hui

### {{2}} - Temps de travail

Format: `"XhYmin"`

Exemples:
- `"3h45min"` - 3 heures 45 minutes
- `"1h30min"` - 1 heure 30 minutes
- `"0h45min"` - 45 minutes
- `"0h0min"` - Aucun temps enregistré

**Calcul**: Somme des `timeEntry` de 00:00 à 12:00 aujourd'hui

## ❌ Problèmes courants

### "Template not found"

➡️ Le template n'est pas approuvé ou mal nommé
- Vérifier le nom exact: `productif_verification_midi`
- Vérifier qu'il a 2 variables `{{1}}` et `{{2}}`

### "0/0 tâches - 0h0min"

➡️ Normal si :
- Aucune tâche prioritaire créée pour aujourd'hui
- Aucune session de travail enregistrée (TimeEntry)

➡️ Solution : Créer des tâches avec `priority >= 3`

### Template désactivé

➡️ Ajouter dans `.env`:
```env
WHATSAPP_USE_TEMPLATES=true
```

## 🔄 Fallback automatique

Si le template échoue, le système envoie automatiquement un message texte avec les mêmes informations.

## 📚 Fichiers impliqués

- `src/services/NotificationContentBuilder.js` - Génère les 2 variables
- `src/services/NotificationService.js` - Mappe `NOON_CHECK` → `productif_verification_midi`
- `src/services/whatsappService.js` - Envoie via template avec variables
- `scripts/test-midi-template.js` - Script de test

## 🎯 Templates disponibles

✅ **Configurés:**
1. `productif_rappel_matin` (1 variable) - 07:00
2. `productif_rappel_amelioration` (2 variables) - 08:30  
3. `productif_verification_midi` (2 variables) - 12:00

⏳ **À venir:**
4. `productif_rappel_apres_midi`
5. `productif_planification_soir`
6. `productif_verification_nuit`

## 💡 Astuce

Pour tester avec des données réalistes :
1. Créez 3-5 tâches prioritaires pour aujourd'hui
2. Complétez-en 2-3
3. Créez quelques TimeEntry (sessions de travail)
4. Relancez le test

---

**Besoin d'aide ?** Consultez `docs/TEMPLATE_MIDI_SETUP.md` pour la documentation complète.

