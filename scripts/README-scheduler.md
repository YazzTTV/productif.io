# Scripts de gestion des notifications via le scheduler Railway

Ces scripts permettent d'interagir directement avec le scheduler déployé sur Railway pour désactiver les notifications.

## 📋 Scripts disponibles

### 1. `disable-notifications-scheduler.js`

Désactive toutes les notifications pour un utilisateur (ou tous les utilisateurs) et notifie le scheduler sur Railway pour arrêter immédiatement les tâches planifiées.

**Usage:**
```bash
# Désactiver pour un utilisateur spécifique (par email)
node scripts/disable-notifications-scheduler.js noah@example.com

# Désactiver pour un utilisateur (par ID)
node scripts/disable-notifications-scheduler.js clx123abc456

# Désactiver pour TOUS les utilisateurs
node scripts/disable-notifications-scheduler.js all
```

**Ce que fait le script:**
1. Trouve l'utilisateur dans la base de données
2. Désactive **seulement les notifications non souhaitées** dans `notification_settings`:
   - ❌ Après-midi ("L'après-midi commence")
   - ❌ Soir ("Planifie demain", "Préparer demain")
   - ❌ Nuit, amélioration, tâches, habitudes, motivation, résumés
3. **Conserve les notifications essentielles**:
   - ✅ Matin ("Nouvelle journée")
   - ✅ Midi (pause)
   - ✅ Récap soir ("Bilan du soir")
4. Envoie une requête HTTP au scheduler sur Railway via `/api/update-user`
5. Le scheduler arrête immédiatement les tâches non souhaitées et reprogramme seulement les notifications essentielles

**Variables d'environnement:**
- `SCHEDULER_URL` : URL du scheduler Railway (par défaut: `https://scheduler-production-70cc.up.railway.app`)

### 2. `check-scheduler-status.js`

Vérifie le statut du scheduler sur Railway (healthcheck et statut détaillé).

**Usage:**
```bash
node scripts/check-scheduler-status.js
```

**Ce que fait le script:**
1. Vérifie le healthcheck (`/health`)
2. Récupère le statut détaillé (`/status`)
3. Affiche le nombre de jobs actifs et les informations du scheduler

## 🔧 Configuration

Assurez-vous que votre fichier `.env` contient:

```env
SCHEDULER_URL=https://scheduler-production-70cc.up.railway.app
DATABASE_URL=postgresql://...
```

## 🚀 Exécution sur Railway

Si vous voulez exécuter le script directement sur Railway (où la base de données est accessible):

```bash
railway run node scripts/disable-notifications-scheduler.js [email|userId|all]
```

## 📝 Exemples

### Désactiver les notifications pour vous-même

```bash
node scripts/disable-notifications-scheduler.js votre@email.com
```

### Vérifier que le scheduler fonctionne

```bash
node scripts/check-scheduler-status.js
```

### Désactiver pour tous les utilisateurs (attention!)

```bash
node scripts/disable-notifications-scheduler.js all
```

## ⚠️ Notes importantes

- Le script modifie directement la base de données ET notifie le scheduler
- Les notifications non souhaitées sont désactivées immédiatement (pas besoin de redémarrer le scheduler)
- Le scheduler arrête automatiquement les tâches cron non souhaitées et conserve les notifications essentielles
- Les notifications essentielles (matin, pause, récap) restent actives
- Pour réactiver d'autres notifications, utilisez l'application mobile ou l'API
