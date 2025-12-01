# 🚀 Test rapide - Template Vérification Nuit

## 🎯 Objectif

Tester le template `productif_verification_nuit` qui envoie un bilan complet de la journée avant de dormir.

## ⚡ Test en 30 secondes

```bash
npm run test:verification-nuit-template
```

ou avec un utilisateur spécifique :

```bash
npm run test:verification-nuit-template votre.email@example.com
```

## ✅ Ce qui va se passer

1. Le script récupère toutes tes habitudes du jour
2. Calcule le ratio complétées/totales (ex: 11/13)
3. Génère la liste détaillée avec statuts (✅/⭕)
4. Calcule ton temps de travail total
5. Envoie sur WhatsApp via le template

## 📱 Résultat sur WhatsApp

Vous recevrez :

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

## 📋 Prérequis

1. ✅ Template `productif_verification_nuit` approuvé sur WhatsApp Business Manager
2. ✅ 3 variables `{{1}}`, `{{2}}`, `{{3}}` configurées dans le template
3. ✅ `.env` avec `WHATSAPP_USE_TEMPLATES=true`
4. ✅ WhatsApp configuré et activé pour votre compte

## 🔍 Console - Ce que vous verrez

```
🧪 === TEST TEMPLATE VÉRIFICATION NUIT ===

📋 Configuration des templates:
   - WHATSAPP_USE_TEMPLATES: true
   - WHATSAPP_TEMPLATE_LANGUAGE: fr

👤 Utilisateur trouvé:
   - Email: votre@email.com
   - ID: abc123
   - WhatsApp activé: ✅

🔧 Génération du bilan complet de la journée...

📝 === CONTENU DES VARIABLES ===
==========================================
Variable {{1}} - Habitudes du jour: 11/13

Variable {{2}} - État des habitudes:
1. ✅ Apprentissage
2. ✅ Note de sa journée
3. ⭕ Dormir 00h
...

Variable {{3}} - Temps de travail total: 5h30min
==========================================

📋 Envoi via TEMPLATE WhatsApp...
   - Template: productif_verification_nuit
   - Variable {{1}}: 11/13
   - Variable {{2}}: Liste de 13 habitudes
   - Variable {{3}}: 5h30min

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

### {{1}} - Ratio des habitudes

Format: `"X/Y"`

Exemples:
- `"13/13"` - Toutes les habitudes complétées ✅
- `"11/13"` - 11 sur 13 complétées (85%)
- `"7/13"` - Plus de la moitié
- `"0/13"` - Aucune complétée
- `"0/0"` - Pas d'habitudes configurées

### {{2}} - Liste détaillée des habitudes

Format: Liste numérotée avec statuts

**Statuts:**
- ✅ = Habitude complétée
- ⭕ = Habitude non complétée

**Exemple:**
```
1. ✅ Sport
2. ✅ Apprentissage
3. ⭕ Lecture
4. ✅ Méditation
```

### {{3}} - Temps de travail total

Format: `"XhYmin"`

Exemples:
- `"8h30min"` - Journée très productive
- `"5h30min"` - Bonne journée de travail
- `"2h15min"` - Demi-journée
- `"0h0min"` - Aucun temps enregistré

**Calcul**: Somme de tous les `timeEntry` depuis 00:00 jusqu'à maintenant

## ❌ Problèmes courants

### "Template not found"

➡️ Le template n'est pas approuvé ou mal nommé
- Vérifier le nom exact: `productif_verification_nuit`
- Vérifier qu'il a 3 variables `{{1}}`, `{{2}}`, `{{3}}`

### "0/0 habitudes"

➡️ Normal si :
- Aucune habitude créée
- Aucune habitude prévue pour aujourd'hui (vérifier `daysOfWeek`)

➡️ Solution : Créer des habitudes et configurer les jours

### Liste trop longue ({{2}})

Si vous avez beaucoup d'habitudes (>20), la liste sera très longue mais le template l'acceptera (limite WhatsApp : 1024 caractères).

### Template désactivé

➡️ Ajouter dans `.env`:
```env
WHATSAPP_USE_TEMPLATES=true
```

## 🔄 Fallback automatique

Si le template échoue, le système envoie automatiquement un message texte avec les mêmes informations.

## 📚 Fichiers impliqués

- `src/services/NotificationContentBuilder.js` - Génère les 3 variables
- `src/services/NotificationService.js` - Mappe `NIGHT_CHECK` → `productif_verification_nuit`
- `src/services/whatsappService.js` - Envoie via template avec 3 variables
- `scripts/test-verification-nuit-template.js` - Script de test

## 🎯 Templates disponibles

✅ **TOUS LES TEMPLATES CONFIGURÉS :**
1. `productif_rappel_matin` (1 variable) - 07:00
2. `productif_rappel_amelioration` (2 variables) - 08:30  
3. `productif_verification_midi` (2 variables) - 12:00
4. `productif_rappel_apres_midi` (1 variable) - 14:00
5. `productif_planification_soir` (1 variable) - 19:00
6. `productif_verification_nuit` (3 variables) - 22:00

🎉 **SYSTÈME COMPLET !**

## 💭 Objectif du template

Ce template est **le bilan final de la journée** :

1. **Réflexion** : Voir tout ce qui a été accompli
2. **Completion** : Dernière chance de cocher les habitudes restantes
3. **Journaling** : Encourager à noter sa journée
4. **Motivation** : Aller dormir avec satisfaction

### Psychologie

Recevoir ce message à 22:00 permet de :
- **Clôturer la journée** mentalement
- **Célébrer les succès** (11/13 = fierté)
- **Identifier ce qui reste** (2 habitudes)
- **S'endormir satisfait** (bonne note finale)

## 🌟 Pourquoi 3 variables ?

C'est le template **le plus complet** car il combine :

| Variable | Information | Impact |
|----------|-------------|--------|
| {{1}} | Score global | Vue d'ensemble rapide |
| {{2}} | Détail habitudes | Voir ce qui reste à faire |
| {{3}} | Temps travaillé | Quantifier l'effort |

➡️ **Bilan holistique** de la journée en un seul message.

## 🕐 Quand ce message est-il envoyé ?

Par défaut : **22:00** (configurable via `nightTime` dans `notificationSettings`)

**Pourquoi 22:00 ?**
- Journée terminée
- Avant de se coucher
- Encore temps de compléter les dernières habitudes
- Prépare un bon sommeil

## 💡 Astuce motivation

Quand vous recevez ce message :

1. **Lisez votre score** (11/13) → Fierté ✅
2. **Regardez la liste** → Identifiez les 2 restantes ⭕
3. **Complétez rapidement** ce qui est possible
4. **Notez votre journée** (2 minutes)
5. **Dormez satisfait** 😴

**Objectif :** Aller dormir avec un sentiment d'accomplissement.

## 🔗 Comparaison avec autres bilans

| Template | Moment | Variables | Détails |
|----------|--------|-----------|---------|
| Midi | 12:00 | 2 | Matinée uniquement |
| Soir | 19:00 | 1 | Tâches seulement |
| **Nuit** | **22:00** | **3** | **Bilan total** ✨ |

➡️ Le template de nuit est le **plus complet**.

## 📝 Action suggérée

> "💭 Prends 2 minutes pour compléter et noter comment s'est passée ta journée."

Cette phrase encourage à :
1. **Compléter** les dernières habitudes
2. **Journaliser** (essentiel pour les insights IA du lendemain)
3. **Limiter le temps** (2 minutes = pas d'excuse)

## 🎊 Félicitations !

**Le dernier template est configuré !** 🎉

Votre système de notifications WhatsApp est maintenant **100% complet** avec :
- ✅ 6 templates configurés
- ✅ Tous les moments de la journée couverts
- ✅ Scripts de test pour chaque template
- ✅ Documentation complète

**Prochaine étape :** Tester tous les templates et les approuver dans WhatsApp Business Manager !

---

**Besoin d'aide ?** Consultez `docs/TEMPLATE_VERIFICATION_NUIT_SETUP.md` pour la documentation complète.

