# 🚀 Quick Start - Feature 3 (Analyse Comportementale)

## ✅ Problème Résolu !

Le système fonctionne maintenant. Voici comment le démarrer et le tester.

---

## 1️⃣ Démarrage du Système

### A. Démarrer le Scheduler
```bash
npm run start:scheduler
```

**Vérification** : Vous devriez voir dans les logs :
```
🔔 BehaviorCheckInScheduler démarrage...
✅ Behavior handler chargé
✅ BehaviorCheckInScheduler démarré pour X utilisateurs
```

### B. Démarrer l'Agent IA
```bash
npm run start:ai
```

---

## 2️⃣ Tests Immédiats

### Test 1 : Envoyer une question manuellement
```bash
node scripts/test-scheduler-manual.js
```

**Résultat attendu** :
- Question envoyée sur WhatsApp (+33783642205)
- État conversationnel créé

### Test 2 : Vérifier l'état conversationnel
```bash
node scripts/check-conversation-state.js
```

**Résultat attendu** :
```
✅ État actif: awaiting_checkin_energy
💡 Le système attend une réponse de type: energy
```

### Test 3 : Répondre à la question
**Sur WhatsApp**, envoyez simplement : `8`

**Résultat attendu** :
```
⚡ Super ! 8/10 - Continue comme ça ! 🎉
```

### Test 4 : Vérifier l'enregistrement
```bash
node scripts/check-behavior-checkins.js
```

**Résultat attendu** :
- Nouveau check-in avec valeur 8/10
- Type: energy
- TriggeredBy: scheduled

---

## 3️⃣ Commandes Utilisateur

### Analyse complète
**WhatsApp** : `analyse`

**Réponse attendue** :
```
📊 **Ton analyse des 7 derniers jours**

📈 **Moyennes:**
😊 Humeur: 8.0/10
🎯 Focus: 8.0/10
🔥 Motivation: 7.0/10
⚡ Énergie: 7.5/10
😰 Stress: 4.5/10

💡 **Insights clés:**
1. Tes données montrent...
2. Tu gères bien...

🎯 **Recommandations:**
1. Planifie tes tâches...
2. Prends une pause...
```

### Voir les tendances
**WhatsApp** : `tendance`

**Réponse attendue** :
```
📈 **Tes tendances sur 7 jours**

😊 **Mood**: 7.8/10 📈
🎯 **Focus**: 7.2/10 ➡️
🔥 **Motivation**: 7.5/10 📈
```

---

## 4️⃣ Horaires Programmés

Les questions sont envoyées automatiquement à :

| Heure | Types | Exemples de questions |
|-------|-------|----------------------|
| **09:00** | Mood, Energy | "😊 Comment te sens-tu ?" |
| **11:50** | Focus, Motivation | "🎯 Quel est ton niveau de concentration ?" |
| **18:00** | Mood, Stress | "😰 Quel est ton niveau de stress ?" |

**Note** : Le système choisit aléatoirement un type et une question parmi ceux configurés.

---

## 5️⃣ Vérifications de Santé

### Vérifier que le scheduler est actif
```bash
# Dans les logs du scheduler, cherchez :
"BehaviorCheckInScheduler démarré pour X utilisateurs"
```

### Vérifier les check-ins en base
```bash
node scripts/check-behavior-checkins.js
```

### Vérifier l'état conversationnel
```bash
node scripts/check-conversation-state.js
```

---

## 🐛 Troubleshooting

### Problème : "triggerScheduledCheckIn non disponible"
**Solution** : Le fichier `behavior.handler.js` est manquant ou corrompu.
```bash
# Vérifier que le fichier existe
ls lib/agent/handlers/behavior.handler.js
```

### Problème : Questions non reçues
**Solutions** :
1. Vérifier que le scheduler est démarré
2. Vérifier la configuration WhatsApp (`.env`)
3. Vérifier que l'utilisateur a `whatsappEnabled: true` dans `NotificationSettings`

### Problème : Réponses non enregistrées
**Solutions** :
1. Redémarrer l'agent IA (modifications récentes)
2. Vérifier l'état conversationnel
3. Vérifier les logs de l'agent IA

---

## 📊 Commandes Utiles

```bash
# Configurer un utilisateur
node scripts/setup-user-783642205.js

# Générer des données de test
node scripts/test-behavior-checkins.js

# Vérifier la configuration
node scripts/check-schedule-timing.js

# Envoyer une question manuellement
node scripts/test-scheduler-manual.js

# Vérifier l'état
node scripts/check-conversation-state.js

# Vérifier les check-ins
node scripts/check-behavior-checkins.js
```

---

## ✅ Checklist de Déploiement

- [ ] Scheduler démarré
- [ ] Agent IA démarré  
- [ ] Test manuel envoyé
- [ ] Question reçue sur WhatsApp
- [ ] Réponse "8" enregistrée
- [ ] Commande "analyse" fonctionnelle
- [ ] Horaires automatiques configurés

---

## 🎯 Prochaine Question Automatique

Selon l'heure actuelle, la prochaine question sera envoyée :
- **Si < 09:00** → Question à 09:00
- **Si 09:00-11:50** → Question à 11:50
- **Si 11:50-18:00** → Question à 18:00
- **Si > 18:00** → Question demain à 09:00

---

## 📞 Support

En cas de problème, vérifier :
1. Logs du scheduler : `npm run start:scheduler`
2. Logs de l'agent IA : `npm run start:ai`
3. Document de diagnostic : `docs/FEATURE-3-DIAGNOSTIC-RESOLUTION.md`

**Feature 3 est maintenant opérationnelle ! 🎉**

