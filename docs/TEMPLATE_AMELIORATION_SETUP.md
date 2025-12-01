# 📋 Template Rappel Amélioration - Configuration

## ✅ Modifications effectuées

### 1. Service WhatsApp - Support multi-variables

**Fichier :** `src/services/whatsappService.js`

Ajout du support pour les templates à **plusieurs variables** :

```javascript
// Template à 1 variable (string)
await sendMessage(phone, "Contenu variable 1", null, 'template_name');

// Template à 2+ variables (object)
await sendMessage(phone, {
    var1: "Contenu variable 1",
    var2: "Contenu variable 2"
}, null, 'template_name');
```

### 2. MorningInsightsScheduler - Utilisation du template

**Fichier :** `lib/journal/MorningInsightsScheduler.js`

- Méthode `sendInsightToUser()` modifiée pour supporter les templates
- Détection automatique si `WHATSAPP_USE_TEMPLATES=true`
- Construction des deux variables :
  - `{{1}}` : Focus areas (points de concentration)
  - `{{2}}` : Recommendations (liste numérotée)

### 3. Script de test

**Fichier :** `scripts/test-amelioration-template.js`

- Test complet du template à 2 variables
- Génération automatique d'insights avec IA
- Fallback sur insights par défaut

## 📋 Format du template

Dans WhatsApp Business Manager, le template `productif_rappel_amelioration` doit avoir ce format :

```
🌅 *Bonjour ! Voici tes insights du jour*

🎯 *Aujourd'hui, concentre-toi sur :*

{{1}}

💡 *Mes recommandations :

{{2}}

✨ Bonne journée productive ! 💪
```

### Variables

**{{1}} - Focus Areas** (Points de concentration)
```
• Gestion du temps et des priorités
• Amélioration continue des processus de travail
```

**{{2}} - Recommendations** (Recommandations)
```
1. Établir un calendrier hebdomadaire pour planifier des sessions de travail dédiées
2. Utiliser des outils de gestion de projet pour suivre les progrès
3. Mettre en place des rappels quotidiens pour prioriser les tâches importantes
4. Allouer des plages horaires spécifiques pour les tâches importantes
5. Intégrer des pauses actives dans la journée de travail
```

## 🚀 Test

### Test rapide

```bash
npm run test:amelioration-template
```

### Test avec utilisateur spécifique

```bash
npm run test:amelioration-template email@example.com
```

### Ce que fait le test

1. Récupère ou génère des insights pour l'utilisateur
2. Construit les deux variables du template
3. Envoie via le template `productif_rappel_amelioration`
4. Affiche les résultats détaillés
5. Marque l'insight comme envoyé

## 📊 Résultat attendu

Sur WhatsApp :

```
🌅 *Bonjour ! Voici tes insights du jour*

🎯 *Aujourd'hui, concentre-toi sur :*

• Gestion du temps et des priorités
• Amélioration continue des processus de travail

💡 *Mes recommandations :

1. Établir un calendrier hebdomadaire pour planifier des sessions de travail dédiées
2. Utiliser des outils de gestion de projet pour suivre les progrès
3. Mettre en place des rappels quotidiens pour prioriser les tâches importantes
4. Allouer des plages horaires spécifiques pour les tâches importantes
5. Intégrer des pauses actives dans la journée de travail

✨ Bonne journée productive ! 💪
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

Les insights sont envoyés automatiquement :

- Heure configurée : `improvementTime` (par défaut 08:30)
- Fréquence : Quotidien
- Condition : Utilisateur avec journaux récents (7 jours minimum)

Configuration dans `notificationSettings` :

```javascript
{
  improvementReminder: true,
  improvementTime: "08:30"
}
```

## 🎯 Différence avec le rappel matinal

| Aspect | Rappel Matinal | Rappel Amélioration |
|--------|----------------|---------------------|
| Template | `productif_rappel_matin` | `productif_rappel_amelioration` |
| Variables | 1 (habitudes) | 2 (focus + recommandations) |
| Heure | `morningTime` (07:00) | `improvementTime` (08:30) |
| Source données | Habitudes du jour | Insights IA + journaux |
| Scheduler | `NotificationScheduler` | `MorningInsightsScheduler` |

## ⚠️ Dépannage

### Template non trouvé

```
Error: Template "productif_rappel_amelioration" not found
```

**Solution :** Vérifiez que le template est approuvé dans WhatsApp Business Manager avec les **2 variables** `{{1}}` et `{{2}}`

### Insights vides ou génériques

```
Variable {{1}}: • Continuer sur ta lancée
Variable {{2}}: 1. Continue à noter tes journées
```

**Cause :** Aucun journal récent dans les 7 derniers jours

**Solution :** 
- Notez des journaux régulièrement
- Les insights IA nécessitent au moins quelques entrées de journal

### Fallback sur message texte

Si le template échoue, le système bascule automatiquement sur un message texte classique.

## 🔄 Fonctionnement automatique

1. `MorningInsightsScheduler` s'exécute chaque minute
2. Vérifie l'heure configurée (`improvementTime`)
3. Récupère les utilisateurs avec WhatsApp activé
4. Génère ou récupère l'insight du jour (IA)
5. Si `WHATSAPP_USE_TEMPLATES=true` : envoie via template
6. Sinon : envoie en message texte classique
7. Marque l'insight comme envoyé

## ✅ Checklist

- [ ] Template `productif_rappel_amelioration` approuvé
- [ ] 2 variables `{{1}}` et `{{2}}` dans le template
- [ ] `WHATSAPP_USE_TEMPLATES=true` dans `.env`
- [ ] Test réussi : `npm run test:amelioration-template`
- [ ] Message reçu sur WhatsApp avec bon format
- [ ] Insights contiennent des données pertinentes

## 📚 Documentation

- **Test :** `scripts/test-amelioration-template.js`
- **Scheduler :** `lib/journal/MorningInsightsScheduler.js`
- **Service WhatsApp :** `src/services/whatsappService.js`

