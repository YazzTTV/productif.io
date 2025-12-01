# 🧪 Guide de Test - Notification Matinale avec Template

## 🚀 Test rapide

### Option 1 : Test automatique (premier utilisateur avec WhatsApp)

```bash
npm run test:morning-template
```

### Option 2 : Test avec un utilisateur spécifique

```bash
npm run test:morning-template email@example.com
```

Ou directement :

```bash
node scripts/test-morning-template.js email@example.com
```

## 📋 Prérequis

### 1. Configuration dans `.env`

Assurez-vous d'avoir :

```env
# Activer les templates
WHATSAPP_USE_TEMPLATES=true

# Langue des templates
WHATSAPP_TEMPLATE_LANGUAGE=fr

# Configuration WhatsApp
WHATSAPP_PHONE_NUMBER_ID=votre_phone_number_id
WHATSAPP_ACCESS_TOKEN=votre_access_token
```

### 2. Template approuvé dans WhatsApp Business Manager

Le template `productif_rappel_matin` doit être **approuvé** avec ce format :

```
🌅 Bonjour et bonne journée !

🌅 C'est parti pour une nouvelle journée !

{{1}}

Bonne journée ! 💙
```

## 🔍 Ce que fait le script

1. ✅ Vérifie la configuration des templates
2. ✅ Trouve un utilisateur avec WhatsApp activé
3. ✅ Récupère les habitudes de l'utilisateur
4. ✅ Construit la variable `{{1}}` (liste des habitudes)
5. ✅ Envoie via le template `productif_rappel_matin`
6. ✅ Affiche les résultats et logs
7. ✅ Enregistre en base de données

## 📊 Résultat attendu

### Dans la console

```
🧪 === TEST DE NOTIFICATION MATINALE AVEC TEMPLATE ===

📋 Configuration des templates:
   - WHATSAPP_USE_TEMPLATES: true
   - WHATSAPP_TEMPLATE_LANGUAGE: fr

👤 Utilisateur trouvé:
   - Email: user@example.com
   - WhatsApp activé: ✅
   - Numéro WhatsApp: 33612345678

🔧 Génération du contenu des habitudes...

📝 === CONTENU DE LA VARIABLE {{1}} ===
💫 Tes habitudes pour aujourd'hui :
1. ⭕ Apprentissage
2. ⭕ Note de sa journée
3. ⭕ Dormir 00h
...

📋 Envoi via TEMPLATE WhatsApp...
   - Template: productif_rappel_matin

✅ === SUCCÈS ===
📱 Message envoyé via template avec succès !
   - Message ID: wamid.xxx
   - WA ID: 33612345678

💡 Vérifiez votre WhatsApp pour voir le message avec le template !
```

### Sur WhatsApp

Vous devriez recevoir :

```
🌅 Bonjour et bonne journée !

🌅 C'est parti pour une nouvelle journée !

💫 Tes habitudes pour aujourd'hui :
1. ⭕ Apprentissage
2. ⭕ Note de sa journée
3. ⭕ Dormir 00h
4. ⭕ Sport
5. ⭕ Tracking
... (toutes vos habitudes)

Bonne journée ! 💙
```

## ⚠️ Dépannage

### Erreur : "Template not found"

```
❌ === ERREUR AVEC TEMPLATE ===
Error: WhatsApp Template API error: 404 - Template not found
```

**Solutions :**
1. Vérifiez que le template `productif_rappel_matin` est **approuvé** dans WhatsApp Business Manager
2. Vérifiez que le nom correspond exactement (sensible à la casse)
3. Attendez 24-48h après la soumission du template

### Erreur : "Templates désactivés"

```
⚠️ Templates désactivés - Envoi en message texte classique
```

**Solution :**
Ajoutez dans `.env` :
```env
WHATSAPP_USE_TEMPLATES=true
```

### Erreur : "Aucun utilisateur trouvé"

```
❌ Aucun utilisateur avec WhatsApp activé trouvé
```

**Solutions :**
1. Utilisez un email spécifique : `node scripts/test-morning-template.js email@example.com`
2. Vérifiez qu'au moins un utilisateur a WhatsApp activé dans la base de données

### Fallback sur message texte

Si le template échoue, le script bascule automatiquement sur un message texte classique. C'est normal et permet de tester même si le template n'est pas encore approuvé.

## 🔄 Test avec différents utilisateurs

```bash
# Test avec votre email
node scripts/test-morning-template.js votre@email.com

# Test avec un autre utilisateur
node scripts/test-morning-template.js autre@email.com
```

## 📝 Vérification dans la base de données

Le script enregistre automatiquement la notification dans `notificationHistory` :

```sql
SELECT * FROM "NotificationHistory" 
WHERE type = 'MORNING_REMINDER' 
ORDER BY "sentAt" DESC 
LIMIT 1;
```

## ✅ Checklist de test

- [ ] Configuration `.env` correcte
- [ ] Template approuvé dans WhatsApp Business Manager
- [ ] Utilisateur avec WhatsApp activé dans la base
- [ ] Script exécuté sans erreur
- [ ] Message reçu sur WhatsApp
- [ ] Format du template correct
- [ ] Liste des habitudes complète
- [ ] Notification enregistrée en base

## 🎯 Prochaines étapes

Une fois le test réussi :

1. ✅ Le template fonctionne correctement
2. ✅ Les notifications matinales automatiques utiliseront le template
3. ✅ Plus de problème de limite de 24h
4. ✅ Prêt pour activer les 5 autres templates

## 💡 Astuce

Pour tester plusieurs fois rapidement :

```bash
# Test rapide
npm run test:morning-template

# Vérifier les logs
tail -f logs/notifications.log | grep "template"
```

## 📚 Documentation

- **Guide complet** : `docs/TEMPLATE_RAPPEL_MATIN_SETUP.md`
- **Configuration** : `TEMPLATE_WHATSAPP_README.md`

