# 🧪 Guide de Test - Feature 3 : Analyse Comportementale

## 🎯 Objectif

Tester l'intégration complète de la Feature 3 dans votre environnement existant.

---

## 📋 Pré-requis

- ✅ Base de données PostgreSQL accessible
- ✅ WhatsApp Business API configuré
- ✅ OpenAI API Key configurée
- ✅ Scheduler en cours d'exécution (port 3001)
- ✅ Webhook WhatsApp accessible

---

## 🚀 Phase 1 : Test Manuel via WhatsApp

### Étape 1 : Vérifier qu'un utilisateur existe avec WhatsApp

```bash
# Dans votre base de données PostgreSQL
SELECT id, email, "whatsappNumber" FROM "User" WHERE "whatsappNumber" IS NOT NULL LIMIT 1;
```

**Notez** : `userId` et `phoneNumber` pour les tests

---

### Étape 2 : Créer un CheckInSchedule de test

Créez un fichier `test-behavior-setup.js` :

```javascript
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function setupTestUser() {
  // Trouver un utilisateur avec WhatsApp
  const user = await prisma.user.findFirst({
    where: {
      whatsappNumber: { not: null }
    }
  })

  if (!user) {
    console.log('❌ Aucun utilisateur avec WhatsApp trouvé')
    return
  }

  console.log(`✅ Utilisateur trouvé: ${user.email}`)

  // Créer ou mettre à jour le schedule
  const schedule = await prisma.checkInSchedule.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      enabled: true,
      frequency: '3x_daily',
      schedules: [
        { time: '09:00', types: ['mood', 'energy'] },
        { time: '14:00', types: ['focus', 'motivation'] },
        { time: '18:00', types: ['mood', 'stress'] }
      ],
      randomize: false, // Pour les tests, désactiver la randomisation
      skipWeekends: false
    },
    update: {
      enabled: true
    }
  })

  console.log(`✅ CheckInSchedule configuré pour ${user.email}`)
  console.log(`📅 Check-ins planifiés:`, schedule.schedules)

  process.exit(0)
}

setupTestUser().catch(console.error)
```

**Exécuter** :
```bash
node test-behavior-setup.js
```

---

### Étape 3 : Envoyer des check-ins de test manuellement

Créez `test-behavior-manual.js` :

```javascript
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function addTestCheckIns() {
  const user = await prisma.user.findFirst({
    where: { whatsappNumber: { not: null } }
  })

  if (!user) {
    console.log('❌ Utilisateur non trouvé')
    return
  }

  // Simuler 7 jours de check-ins
  const now = new Date()
  const checkIns = []

  for (let i = 6; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    
    // Matin
    checkIns.push({
      userId: user.id,
      timestamp: new Date(date.setHours(9, 15)),
      type: 'mood',
      value: 7 + Math.floor(Math.random() * 3),
      triggeredBy: 'manual',
      context: {}
    })

    checkIns.push({
      userId: user.id,
      timestamp: new Date(date.setHours(9, 20)),
      type: 'energy',
      value: 6 + Math.floor(Math.random() * 3),
      triggeredBy: 'manual',
      context: {}
    })

    // Après-midi
    checkIns.push({
      userId: user.id,
      timestamp: new Date(date.setHours(14, 30)),
      type: 'focus',
      value: 6 + Math.floor(Math.random() * 3),
      triggeredBy: 'manual',
      context: {}
    })

    checkIns.push({
      userId: user.id,
      timestamp: new Date(date.setHours(14, 35)),
      type: 'motivation',
      value: 7 + Math.floor(Math.random() * 2),
      triggeredBy: 'manual',
      context: {}
    })

    // Soir
    checkIns.push({
      userId: user.id,
      timestamp: new Date(date.setHours(18, 15)),
      type: 'mood',
      value: 6 + Math.floor(Math.random() * 3),
      triggeredBy: 'manual',
      context: {}
    })

    checkIns.push({
      userId: user.id,
      timestamp: new Date(date.setHours(18, 20)),
      type: 'stress',
      value: 3 + Math.floor(Math.random() * 3),
      triggeredBy: 'manual',
      context: {}
    })
  }

  await prisma.behaviorCheckIn.createMany({ data: checkIns })

  console.log(`✅ ${checkIns.length} check-ins de test créés`)
  console.log('📊 Période: 7 derniers jours')
  
  process.exit(0)
}

addTestCheckIns().catch(console.error)
```

**Exécuter** :
```bash
node test-behavior-manual.js
```

---

### Étape 4 : Tester l'analyse via API

Créez `test-behavior-api.js` :

```javascript
const fetch = require('node-fetch')

async function testBehaviorAPI() {
  const user = await prisma.user.findFirst({
    where: { whatsappNumber: { not: null } }
  })

  if (!user) {
    console.log('❌ Utilisateur non trouvé')
    return
  }

  // Générer un token pour l'utilisateur
  const { generateApiToken } = require('./lib/api-token')
  const { token } = await generateApiToken({
    name: 'Test Behavior Feature',
    userId: user.id,
    scopes: ['behavior:read', 'behavior:write']
  })

  console.log('🔑 Token généré:', token.substring(0, 20) + '...')

  // Test 1 : Récupérer les check-ins
  console.log('\n📥 Test 1 : Récupérer les check-ins...')
  const checkInsRes = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/behavior/agent/checkin?days=7`,
    {
      headers: { 'Authorization': `Bearer ${token}` }
    }
  )
  const { checkIns } = await checkInsRes.json()
  console.log(`✅ ${checkIns.length} check-ins trouvés`)

  // Test 2 : Générer l'analyse
  console.log('\n🧠 Test 2 : Générer l\'analyse...')
  const analysisRes = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/behavior/agent/analysis?days=7`,
    {
      headers: { 'Authorization': `Bearer ${token}` }
    }
  )
  const { pattern } = await analysisRes.json()
  
  if (pattern) {
    console.log('✅ Analyse générée avec succès')
    console.log('📊 Moyennes:', {
      mood: pattern.avgMood,
      focus: pattern.avgFocus,
      motivation: pattern.avgMotivation,
      energy: pattern.avgEnergy,
      stress: pattern.avgStress
    })
    console.log('💡 Insights:', pattern.insights)
    console.log('🎯 Recommandations:', pattern.recommendations)
  } else {
    console.log('⚠️ Pas assez de données pour générer une analyse')
  }

  // Test 3 : Récupérer le schedule
  console.log('\n📅 Test 3 : Récupérer le schedule...')
  const scheduleRes = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/behavior/agent/schedule`,
    {
      headers: { 'Authorization': `Bearer ${token}` }
    }
  )
  const { schedule } = await scheduleRes.json()
  console.log('✅ Schedule:', schedule)
}

testBehaviorAPI().catch(console.error)
```

**Exécuter** :
```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000 node test-behavior-api.js
```

---

## 📱 Phase 2 : Test via WhatsApp Webhook

### Étape 1 : Configurer ngrok (si en local)

```bash
# Installer ngrok
npm install -g ngrok

# Lancer ngrok
ngrok http 3000

# Notez l'URL : https://xxxx.ngrok.io
```

**Configurer dans WhatsApp Business** :
```
Webhook URL: https://xxxx.ngrok.io/api/webhooks/whatsapp
Verify Token: (celui dans votre .env)
```

---

### Étape 2 : Tests manuels via WhatsApp

Envoyez ces messages depuis WhatsApp vers votre bot :

#### Test 1 : Demander l'analyse
```
analyse
```

**Résultat attendu** :
```
📊 **Ton analyse des 7 derniers jours**

📈 **Moyennes:**
😊 Humeur: 7.2/10
🎯 Focus: 6.8/10
🔥 Motivation: 7.5/10
⚡ Énergie: 6.5/10
😰 Stress: 4.2/10

💡 **Insights clés:**
1. [Insight de l'IA]
2. [Insight de l'IA]
...

🎯 **Recommandations:**
1. [Recommandation de l'IA]
2. [Recommandation de l'IA]
...
```

#### Test 2 : Demander les tendances
```
tendances
```

**Résultat attendu** :
```
📈 **Tes tendances sur 7 jours**

😊 **Mood**: 7.2/10 📈
🎯 **Focus**: 6.8/10 ➡️
🔥 **Motivation**: 7.5/10 📈
⚡ **Energy**: 6.5/10 📉
😰 **Stress**: 4.2/10 📉
```

#### Test 3 : Simuler un check-in manuel
```
rapport comportemental
```

**Résultat attendu** :
```
📊 [Même format que "analyse"]
```

---

## 🔄 Phase 3 : Test du Scheduler

### Étape 1 : Vérifier que le scheduler est démarré

```bash
# Dans votre terminal
curl http://localhost:3001/health
```

Ou vérifier les logs :
```bash
# Logs du scheduler
tail -f logs/scheduler.log
```

### Étape 2 : Forcer un check-in immédiatement

Créez `test-behavior-scheduler.js` :

```javascript
const { PrismaClient } = require('@prisma/client')
const { triggerScheduledCheckIn } = require('./lib/agent/handlers/behavior.handler')

const prisma = new PrismaClient()

async function testScheduler() {
  const user = await prisma.user.findFirst({
    where: { whatsappNumber: { not: null } },
    include: { notificationSettings: true }
  })

  if (!user) {
    console.log('❌ Utilisateur non trouvé')
    return
  }

  const schedule = await prisma.checkInSchedule.findUnique({
    where: { userId: user.id }
  })

  if (!schedule) {
    console.log('❌ Schedule non trouvé')
    return
  }

  console.log('🧪 Test du scheduler...')
  console.log('👤 User:', user.email)
  console.log('📱 WhatsApp:', user.notificationSettings?.whatsappNumber)

  // Simuler un déclenchement manuel
  const types = schedule.schedules[0].types
  await triggerScheduledCheckIn(
    user.id,
    user.notificationSettings?.whatsappNumber || '',
    types
  )

  console.log('✅ Check-in déclenché !')
  console.log('📱 Vérifiez WhatsApp pour voir le message')
  
  process.exit(0)
}

testScheduler().catch(console.error)
```

**Exécuter** :
```bash
node test-behavior-scheduler.js
```

**Résultat** : Vous devriez recevoir un message WhatsApp avec une question de check-in

---

## 🧪 Phase 4 : Test de Conversation

### Test du flux conversationnel

1. **Envoyer une question de check-in simulée** :
```bash
# Via le handler
node -e "
const handler = require('./lib/agent/handlers/behavior.handler')
handler.handleBehaviorCheckInCommand(
  'analyse',
  'your-user-id',
  'your-phone',
  'your-api-token'
).then(result => console.log('Result:', result))
"
```

---

## ✅ Checklist de Test Complète

### Backend
- [ ] Modèles Prisma créés (`BehaviorCheckIn`, `BehaviorPattern`, etc.)
- [ ] Migration appliquée sans erreur
- [ ] Service d'analyse accessible
- [ ] API endpoints répondent correctement

### Frontend/Webhook
- [ ] Webhook WhatsApp reçoit les messages
- [ ] Handler behavior.handler.ts appelé
- [ ] États conversationnels fonctionnels
- [ ] Réponses appropriées envoyées

### Scheduler
- [ ] BehaviorCheckInScheduler démarré
- [ ] Jobs cron créés
- [ ] Check-ins automatiques déclenchés
- [ ] Intégration avec ReactiveSchedulerManager OK

### IA/GPT-4
- [ ] Clé API OpenAI configurée
- [ ] Analyse générée avec succès
- [ ] Insights pertinents
- [ ] Recommandations actionnables

### WhatsApp
- [ ] Messages reçus
- [ ] Réponses envoyées
- [ ] Format correct
- [ ] Emojis affichés

---

## 🐛 Debugging

### Si les API ne répondent pas

```bash
# Vérifier le serveur
curl http://localhost:3000/api/health

# Vérifier les logs
tail -f logs/*.log
```

### Si le scheduler ne démarre pas

```bash
# Vérifier les imports
node -e "require('./lib/behavior/BehaviorCheckInScheduler.ts')"

# Vérifier les logs
console.log dans ReactiveSchedulerManager.js
```

### Si WhatsApp ne répond pas

```bash
# Vérifier les webhooks
curl -X POST http://localhost:3000/api/webhooks/whatsapp \
  -H "Content-Type: application/json" \
  -d '{"messageText": "analyse", "phoneNumber": "+33612345678"}'

# Vérifier les logs du handler
```

---

## 📊 Exemple de Logs Attendus

### Logs du Scheduler
```
🎯 ReactiveSchedulerManager initialisé
🚀 DÉMARRAGE DU SYSTÈME RÉACTIF COMPLET
BehaviorCheckInScheduler démarrage...
BehaviorCheckInScheduler démarré pour 1 utilisateurs
✅ SYSTÈME RÉACTIF OPÉRATIONNEL !
```

### Logs du Check-In
```
⏰ [09:08:00] Check-in scheduled pour alice-123
📱 [09:08:00] Envoi WhatsApp: "😊 Comment te sens-tu en ce moment ?"
✅ [09:10:00] Réponse reçue: 8
💾 [09:10:00] Check-in enregistré: mood=8
```

### Logs de l'Analyse IA
```
🧠 [10:00:00] Génération analyse pour alice-123 (7 jours)
📊 Données: 21 check-ins trouvés
🤖 Appel OpenAI GPT-4...
✅ Analyse générée: 5 insights, 4 recommandations
```

---

## 🎯 Résultat Final Attendu

Après tous les tests, vous devriez :

1. ✅ Recevoir des questions automatiques 3x/jour
2. ✅ Pouvoir répondre et voir la confirmation
3. ✅ Pouvoir demander "analyse" et recevoir un rapport IA
4. ✅ Pouvoir demander "tendances" et voir l'évolution
5. ✅ Voir des données dans la base PostgreSQL
6. ✅ Voir des patterns générés avec insights IA

**Tout fonctionne ? → Feature 3 est opérationnelle ! 🎉**
