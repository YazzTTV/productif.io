# 🚀 Test rapide - Template Planification Soir

## 🎯 Objectif

Tester le template `productif_planification_soir` qui envoie un bilan de la journée le soir.

## ⚡ Test en 30 secondes

```bash
npm run test:planification-soir-template
```

ou avec un utilisateur spécifique :

```bash
npm run test:planification-soir-template votre.email@example.com
```

## ✅ Ce qui va se passer

1. Le script récupère tes tâches prioritaires du jour
2. Calcule combien tu as complété (ex: 3/5)
3. Envoie sur WhatsApp via le template

## 📱 Résultat sur WhatsApp

Vous recevrez :

```
🌙 Préparons demain ensemble

🌙 C'est l'heure du bilan et de préparer demain !

📊 Bilan du jour :

✅ 3/5 tâches accomplies

📱 Pour créer une tâche : dit simplement "planifie ma journée de demain"
```

## 📋 Prérequis

1. ✅ Template `productif_planification_soir` approuvé sur WhatsApp Business Manager
2. ✅ 1 variable `{{1}}` configurée dans le template
3. ✅ `.env` avec `WHATSAPP_USE_TEMPLATES=true`
4. ✅ WhatsApp configuré et activé pour votre compte

## 🔍 Console - Ce que vous verrez

```
🧪 === TEST TEMPLATE PLANIFICATION SOIR ===

📋 Configuration des templates:
   - WHATSAPP_USE_TEMPLATES: true
   - WHATSAPP_TEMPLATE_LANGUAGE: fr

👤 Utilisateur trouvé:
   - Email: votre@email.com
   - ID: abc123
   - WhatsApp activé: ✅

🔧 Génération du bilan des tâches de la journée...

📝 === CONTENU DE LA VARIABLE {{1}} ===
==========================================
Tâches accomplies: 3/5
==========================================

📋 Envoi via TEMPLATE WhatsApp...
   - Template: productif_planification_soir
   - Variable {{1}}: 3/5

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

### {{1}} - Tâches accomplies

Format: `"X/Y"`

Exemples:
- `"5/5"` - Toutes les tâches complétées ✅
- `"3/7"` - 3 tâches sur 7 complétées
- `"0/4"` - Aucune tâche complétée aujourd'hui
- `"0/0"` - Pas de tâches prioritaires

**Calcul**: Compte uniquement les tâches avec `priority >= 3` (tâches prioritaires)

## ❌ Problèmes courants

### "Template not found"

➡️ Le template n'est pas approuvé ou mal nommé
- Vérifier le nom exact: `productif_planification_soir`
- Vérifier qu'il a 1 variable `{{1}}`

### "0/0 tâches"

➡️ Normal si :
- Aucune tâche prioritaire créée pour aujourd'hui
- Toutes les tâches ont une priorité < 3

➡️ Solution : Créer des tâches avec `priority >= 3`

### Template désactivé

➡️ Ajouter dans `.env`:
```env
WHATSAPP_USE_TEMPLATES=true
```

## 🔄 Fallback automatique

Si le template échoue, le système envoie automatiquement un message texte avec les mêmes informations.

## 📚 Fichiers impliqués

- `src/services/NotificationContentBuilder.js` - Génère la variable {{1}}
- `src/services/NotificationService.js` - Mappe `EVENING_PLANNING` → `productif_planification_soir`
- `src/services/whatsappService.js` - Envoie via template
- `scripts/test-planification-soir-template.js` - Script de test

## 🎯 Templates disponibles

✅ **Configurés:**
1. `productif_rappel_matin` (1 variable) - 07:00
2. `productif_rappel_amelioration` (2 variables) - 08:30  
3. `productif_verification_midi` (2 variables) - 12:00
4. `productif_rappel_apres_midi` (1 variable) - 14:00
5. `productif_planification_soir` (1 variable) - 19:00

⏳ **À venir:**
6. `productif_verification_nuit`

## 💬 Interaction après réception

Après avoir reçu ce message, l'utilisateur peut **répondre directement** pour planifier sa journée :

**Exemples de réponses :**
```
"Planifie ma journée de demain"
"Demain je dois finir le rapport, appeler le client et faire du sport"
"Ajoute une tâche pour demain : préparer la réunion"
```

➡️ L'agent IA conversationnel détectera l'intention et créera automatiquement les tâches pour demain.

## 🌟 Pourquoi ce template ?

Ce moment du soir est **stratégique** car :

1. **Bilan émotionnel** : Voir son score (ex: 3/5) donne un sentiment de progression
2. **Préparation mentale** : Penser à demain réduit le stress du lendemain
3. **Routine du soir** : Crée une habitude de planification quotidienne

### Psychologie

- **3/5 ou plus** → Sentiment de réussite ✅
- **Moins de 3/5** → Motivation à faire mieux demain 💪
- **0/0** → Rappel de créer des tâches prioritaires

## 🕐 Quand ce message est-il envoyé ?

Par défaut : **19:00** (configurable via `eveningTime` dans `notificationSettings`)

C'est l'heure idéale car :
- Journée de travail terminée
- Encore assez tôt pour planifier
- Moment de transition jour → soir

## 💡 Astuce

Pour maximiser l'impact :
1. Créer 3-5 tâches prioritaires chaque matin
2. Les marquer comme complétées au fur et à mesure
3. Recevoir le bilan le soir
4. Planifier activement le lendemain

**Cercle vertueux :** Planification → Action → Bilan → Nouvelle planification

## 🔗 Comparaison avec vérification de midi

| Aspect | Midi (12:00) | Soir (19:00) |
|--------|--------------|--------------|
| Période | Matinée uniquement | Journée complète |
| Variables | 2 (tâches + temps) | 1 (tâches) |
| Objectif | Pause + bilan partiel | Bilan + planification |
| Action | Prendre une pause | Planifier demain |
| Ton | "Bonne pause !" | "Préparons demain" |

---

**Besoin d'aide ?** Consultez `docs/TEMPLATE_PLANIFICATION_SOIR_SETUP.md` pour la documentation complète.

