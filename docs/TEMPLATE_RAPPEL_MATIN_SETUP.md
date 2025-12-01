# 📋 Configuration du Template Rappel Matinal

## ✅ Modifications effectuées

### 1. Services modifiés

**Fichiers mis à jour :**
- `src/services/whatsappService.js` - Ajout support des templates
- `src/services/NotificationContentBuilder.js` - Modification pour retourner uniquement les habitudes
- `src/services/NotificationService.js` - Mapping des types aux templates

### 2. Fonctionnalités ajoutées

#### a) `whatsappService.js`
- Configuration des templates via variables d'environnement
- Méthode `sendTemplateMessage()` pour envoyer via template
- Paramètre `templateName` dans `sendMessage()`
- Fallback automatique sur message texte si template échoue

#### b) `NotificationContentBuilder.js`
- `buildMorningHabitsVariable()` : construit uniquement la liste des habitudes
- `buildMorningContent()` modifié pour retourner uniquement les habitudes (variable {{1}})

#### c) `NotificationService.js`
- Mapping des types de notifications aux templates :
  ```javascript
  'MORNING_REMINDER': 'productif_rappel_matin'
  ```
- Détection automatique et utilisation du template approprié

## 🚀 Configuration

### Étape 1 : Activer les templates dans `.env`

Ajoutez dans votre fichier `.env` :

```env
# Activer l'utilisation des templates WhatsApp
WHATSAPP_USE_TEMPLATES=true

# Langue des templates
WHATSAPP_TEMPLATE_LANGUAGE=fr
```

### Étape 2 : Vérifier le template dans WhatsApp Business Manager

Votre template `productif_rappel_matin` doit être **approuvé** avec ce format :

```
🌅 Bonjour et bonne journée !

🌅 C'est parti pour une nouvelle journée !

{{1}}

Bonne journée ! 💙
```

**Variable {{1}}** sera remplacée par :
```
💫 Tes habitudes pour aujourd'hui :
1. ⭕ Apprentissage
2. ⭕ Note de sa journée
3. ⭕ Dormir 00h
4. ⭕ Sport
5. ⭕ Tracking
6. ⭕ Planifier Journée
... etc
```

### Étape 3 : Redémarrer les services

```bash
# Redémarrer le service de notifications
npm run restart-notification-service

# Ou redémarrer tous les services
npm run dev
```

## 📊 Logs de vérification

Après configuration, vous devriez voir dans les logs :

### Au démarrage du service
```
WHATSAPP_USE_TEMPLATES: ✅ Activé
📋 Templates activés
```

### Lors de l'envoi d'une notification matinale
```
🔵 [abc123] Envoi WhatsApp pour notification xxx (type: MORNING_REMINDER, template: productif_rappel_matin)
📋 [abc123] Utilisation du template "productif_rappel_matin" pour 33612345678
📋 [def456] Envoi via template "productif_rappel_matin" pour 33612345678
✅ [def456] Template "productif_rappel_matin" envoyé avec succès
```

## 🔄 Fonctionnement

### Avec template activé (`WHATSAPP_USE_TEMPLATES=true`)

1. `NotificationScheduler` planifie une notification `MORNING_REMINDER`
2. `NotificationContentBuilder.buildMorningContent()` récupère les habitudes
3. `NotificationService.processNotification()` détecte le type `MORNING_REMINDER`
4. Mapping automatique vers le template `productif_rappel_matin`
5. `whatsappService.sendTemplateMessage()` envoie via l'API WhatsApp avec le template
6. ✅ Message reçu avec le format du template + liste des habitudes

### Sans template (fallback)

Si le template échoue ou n'est pas activé :
- Fallback automatique sur message texte classique
- Format : titre + contenu + signature
- ⚠️ Soumis à la limitation de 24h

## 🎯 Prochaines étapes

### Pour ajouter les autres templates

Décommentez dans `NotificationService.js` :

```javascript
const notificationTemplates = {
    'MORNING_REMINDER': 'productif_rappel_matin',
    'NOON_CHECK': 'productif_verification_midi',           // ← Décommenter
    'AFTERNOON_REMINDER': 'productif_rappel_apres_midi',   // ← Décommenter
    'EVENING_PLANNING': 'productif_planification_soir',    // ← Décommenter
    'NIGHT_CHECK': 'productif_verification_nuit'           // ← Décommenter
};
```

### Puis modifiez les méthodes correspondantes

Dans `NotificationContentBuilder.js` :
- `buildNoonContent()` → retourner uniquement la variable {{1}}
- `buildAfternoonContent()` → retourner uniquement la variable {{1}}
- `buildEveningContent()` → retourner uniquement la variable {{1}}
- `buildNightContent()` → retourner uniquement la variable {{1}}

## 🧪 Test

### Test manuel

```bash
# Envoyer une notification de test
node scripts/test-morning-notification.js
```

### Vérifier dans les logs

```bash
# Voir les logs en temps réel
tail -f logs/notifications.log | grep "template"
```

## ⚠️ Troubleshooting

### Template non trouvé
```
Error: WhatsApp Template API error: 404 - Template not found
```
**Solution :** Vérifiez que le template est approuvé dans WhatsApp Business Manager

### Fallback sur message texte
```
❌ [abc123] Erreur avec template "productif_rappel_matin", fallback sur message texte
```
**Solution :** Le template a échoué mais le message est quand même envoyé (en texte classique)

### Templates désactivés
```
WHATSAPP_USE_TEMPLATES: ❌ Désactivé
```
**Solution :** Ajoutez `WHATSAPP_USE_TEMPLATES=true` dans votre `.env`

## ✅ Résumé

- ✅ Template `productif_rappel_matin` configuré
- ✅ Notifications matinales utilisent le template automatiquement
- ✅ Fallback automatique si template échoue
- ✅ Plus de limite de 24h avec les templates
- ✅ 5 autres templates prêts à être activés

Votre rappel matinal utilise maintenant le template WhatsApp ! 🎉

