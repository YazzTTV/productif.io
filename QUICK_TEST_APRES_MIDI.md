# 🚀 Test rapide - Template Rappel Après-Midi

## 🎯 Objectif

Tester le template `productif_rappel_apres_midi` qui rappelle les habitudes en milieu de journée.

## ⚡ Test en 30 secondes

```bash
npm run test:apres-midi-template
```

ou avec un utilisateur spécifique :

```bash
npm run test:apres-midi-template votre.email@example.com
```

## ✅ Ce qui va se passer

1. Le script récupère toutes tes habitudes du jour
2. Vérifie leur statut (✅ complétée / ⭕ à faire)
3. Construit la liste formatée
4. Envoie sur WhatsApp via le template

## 📱 Résultat sur WhatsApp

Vous recevrez :

```
☀ L'après-midi t'attend !

💪 Allez, c'est reparti !

💫 N'oublie pas tes habitudes :

1. ✅ Sport
2. ⭕ Apprentissage
3. ⭕ Lecture
4. ✅ Méditation
5. ⭕ Note de sa journée
6. ⭕ Tracking
7. ⭕ Planifier Journée

🎯 On se retrouve quand tu as fini ! 🚀
```

## 📋 Prérequis

1. ✅ Template `productif_rappel_apres_midi` approuvé sur WhatsApp Business Manager
2. ✅ 1 variable `{{1}}` configurée dans le template
3. ✅ `.env` avec `WHATSAPP_USE_TEMPLATES=true`
4. ✅ WhatsApp configuré et activé pour votre compte

## 🔍 Console - Ce que vous verrez

```
🧪 === TEST TEMPLATE RAPPEL APRÈS-MIDI ===

📋 Configuration des templates:
   - WHATSAPP_USE_TEMPLATES: true
   - WHATSAPP_TEMPLATE_LANGUAGE: fr

👤 Utilisateur trouvé:
   - Email: votre@email.com
   - ID: abc123
   - WhatsApp activé: ✅

🔧 Génération de la liste des habitudes de l'après-midi...

📝 === CONTENU DE LA VARIABLE {{1}} ===
==========================================
1. ✅ Sport
2. ⭕ Apprentissage
3. ⭕ Lecture
4. ✅ Méditation
5. ⭕ Note de sa journée
==========================================

📋 Envoi via TEMPLATE WhatsApp...
   - Template: productif_rappel_apres_midi
   - Variable {{1}}: Liste des habitudes

✅ === SUCCÈS ===
📱 Message envoyé via template avec succès !
   - Message ID: wamid.xxx
   - WA ID: 33xxxxxxxxx

💡 Vérifiez votre WhatsApp pour voir le message avec le template !

💾 Enregistrement en base de données...
✅ Notification enregistrée en base de données

✅ Test terminé
```

## 📊 Variable du template

### {{1}} - Liste des habitudes

Format: Liste numérotée avec statuts

**Statuts possibles:**
- ✅ = Habitude complétée
- ⭕ = Habitude non complétée (à faire)

**Exemples:**
```
1. ✅ Sport
2. ⭕ Apprentissage
3. ⭕ Lecture
4. ✅ Méditation
```

**Source des données:**
- Table `Habit` avec `daysOfWeek` = jour actuel
- Table `HabitEntry` pour le statut de complétion

## ❌ Problèmes courants

### "Template not found"

➡️ Le template n'est pas approuvé ou mal nommé
- Vérifier le nom exact: `productif_rappel_apres_midi`
- Vérifier qu'il a 1 variable `{{1}}`

### "Aucune habitude prévue"

➡️ Normal si :
- Aucune habitude créée
- Aucune habitude prévue pour aujourd'hui (vérifier `daysOfWeek`)

➡️ Solution : Créer des habitudes et configurer les jours de la semaine

### Toutes les habitudes à ⭕

➡️ **Normal en début d'après-midi** si vous n'avez encore rien complété. Les habitudes se marqueront ✅ au fur et à mesure.

### Template désactivé

➡️ Ajouter dans `.env`:
```env
WHATSAPP_USE_TEMPLATES=true
```

## 🔄 Fallback automatique

Si le template échoue, le système envoie automatiquement un message texte avec les mêmes informations.

## 📚 Fichiers impliqués

- `src/services/NotificationContentBuilder.js` - Génère la variable {{1}}
- `src/services/NotificationService.js` - Mappe `AFTERNOON_REMINDER` → `productif_rappel_apres_midi`
- `src/services/whatsappService.js` - Envoie via template
- `scripts/test-apres-midi-template.js` - Script de test

## 🎯 Templates disponibles

✅ **Configurés:**
1. `productif_rappel_matin` (1 variable) - 07:00
2. `productif_rappel_amelioration` (2 variables) - 08:30  
3. `productif_verification_midi` (2 variables) - 12:00
4. `productif_rappel_apres_midi` (1 variable) - 14:00

⏳ **À venir:**
5. `productif_planification_soir`
6. `productif_verification_nuit`

## 💡 Différence avec le rappel du matin

| Aspect | Matin (07:00) | Après-midi (14:00) |
|--------|---------------|-------------------|
| Statuts | Tous ⭕ | Mixte ✅/⭕ |
| Objectif | Voir ce qu'il y a à faire | Rappel + progression |
| Message | "C'est parti !" | "C'est reparti !" |

## 🌟 Astuce motivation

Quand vous recevez ce rappel, vous voyez :
- ✅ = Ce que vous avez **déjà accompli** → Fierté
- ⭕ = Ce qu'il vous **reste à faire** → Focus

C'est un excellent moment pour :
1. Célébrer vos progrès du matin
2. Recentrer votre attention pour l'après-midi
3. Reprendre votre élan après le déjeuner

## 🕐 Quand ce message est-il envoyé ?

Par défaut : **14:00** (configurable via `afternoonTime` dans `notificationSettings`)

Personnalisable dans l'interface utilisateur ou en base de données.

---

**Besoin d'aide ?** Consultez `docs/TEMPLATE_APRES_MIDI_SETUP.md` pour la documentation complète.

