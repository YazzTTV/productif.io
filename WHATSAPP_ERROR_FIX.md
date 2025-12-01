# Correction des erreurs ETIMEDOUT WhatsApp

## 🐛 Problème identifié

L'agent IA rencontrait des erreurs `ETIMEDOUT` lors de l'envoi de messages WhatsApp via l'API Facebook Graph. Après ces erreurs, l'agent continuait à bugger et renvoyait les mêmes messages plusieurs fois.

### Causes identifiées :

1. **Pas de timeout configuré** sur les requêtes HTTP axios
2. **Pas de mécanisme de retry** en cas d'erreur temporaire (timeout, problèmes réseau)
3. **Pas de déduplication** des messages, causant des envois multiples du même message
4. **Gestion d'erreurs insuffisante** dans le code principal (`start.ts`)

## ✅ Solutions implémentées

### 1. WhatsAppService amélioré (`src/services/ai/WhatsAppService.ts`)

#### a) Configuration de timeout
```typescript
timeout: this.REQUEST_TIMEOUT_MS // 30 secondes
```

#### b) Système de retry avec backoff exponentiel
- **3 tentatives maximum** (configurable via `MAX_RETRIES`)
- **Délais progressifs** : 1s, 2s, 4s entre les tentatives
- **Retry intelligent** : uniquement sur les erreurs réessayables
  - Timeouts (ETIMEDOUT, ECONNABORTED)
  - Erreurs réseau (ECONNREFUSED, ENOTFOUND)
  - Rate limiting (HTTP 429)
  - Erreurs serveur (HTTP 5xx)

#### c) Déduplication des messages
- **Cache en mémoire** pour détecter les doublons
- **Fenêtre de 1 minute** : un message identique ne peut être envoyé deux fois dans cette période
- **Nettoyage automatique** : le cache est nettoyé toutes les 5 minutes
- **Hash des messages** : basé sur `numéro + contenu (100 premiers caractères)`

#### d) Logs détaillés
```
⏱️ Timeout lors de l'envoi du message WhatsApp
🔌 Erreur de connexion réseau
🚦 Rate limit atteint
⚠️ Message en double détecté et ignoré
🔄 Nouvelle tentative dans Xms...
```

### 2. Gestion d'erreurs sécurisée dans start.ts

#### Fonction wrapper `safeSendMessage`
```typescript
async function safeSendMessage(to: string, message: string): Promise<boolean> {
    try {
        await whatsappService.sendMessage(to, message);
        return true;
    } catch (error) {
        console.error('🔴 Erreur lors de l\'envoi (gestion sécurisée)', ...);
        return false; // Ne pas planter l'application
    }
}
```

**Avantages :**
- Empêche l'application de crasher sur une erreur d'envoi
- Tous les 34 appels à `sendMessage` sont maintenant sécurisés
- Logs centralisés et informatifs
- Continue le traitement même si un message ne peut pas être envoyé

## 📊 Améliorations apportées

### Performance
- ✅ Timeout de 30s pour éviter les blocages infinis
- ✅ Retry automatique sur les erreurs temporaires
- ✅ Backoff exponentiel pour ne pas surcharger l'API

### Fiabilité
- ✅ Déduplication pour éviter les messages en double
- ✅ Gestion gracieuse des erreurs (pas de crash)
- ✅ Logs détaillés pour le debugging

### Maintenabilité
- ✅ Code bien structuré avec des fonctions privées claires
- ✅ Configuration centralisée (timeout, retry, fenêtre de déduplication)
- ✅ Documentation inline (JSDoc)

## 🔧 Configuration

Les paramètres peuvent être ajustés dans `WhatsAppService` :

```typescript
private readonly DEDUP_WINDOW_MS = 60000;      // Fenêtre de déduplication (1 min)
private readonly REQUEST_TIMEOUT_MS = 30000;   // Timeout des requêtes (30s)
private readonly MAX_RETRIES = 3;              // Nombre de tentatives
```

## 🧪 Scénarios testés

### Scénario 1 : Timeout
```
Tentative 1 → ETIMEDOUT
  ↓ Attente 1s
Tentative 2 → ETIMEDOUT
  ↓ Attente 2s
Tentative 3 → ETIMEDOUT
  ↓
❌ Échec définitif après 3 tentatives
🔴 Erreur loggée mais l'agent continue
```

### Scénario 2 : Message en double
```
Message 1 → Envoyé ✅
Message 2 (identique, < 1min) → ⚠️ Ignoré (doublon détecté)
```

### Scénario 3 : Erreur temporaire puis succès
```
Tentative 1 → ECONNREFUSED
  ↓ Attente 1s
Tentative 2 → ✅ Succès
```

## 📝 Recommandations

### Monitoring
- Surveiller les logs pour détecter les patterns d'erreur
- Alerter si le taux d'échec dépasse un seuil (ex: 10%)
- Monitorer le taux de déduplication

### Production
- Considérer l'utilisation de **Redis** pour la déduplication si plusieurs instances du service tournent
- Implémenter un **circuit breaker** si les erreurs persistent trop longtemps
- Ajouter des **métriques** (Prometheus, DataDog, etc.)

### Variables d'environnement (optionnel)
Ajouter la possibilité de configurer via `.env` :
```env
WHATSAPP_TIMEOUT_MS=30000
WHATSAPP_MAX_RETRIES=3
WHATSAPP_DEDUP_WINDOW_MS=60000
```

## 🎯 Résultat attendu

L'agent IA devrait maintenant :
- ✅ **Gérer les timeouts** de manière gracieuse avec retry automatique
- ✅ **Ne plus envoyer de messages en double** même en cas d'erreur
- ✅ **Continuer de fonctionner** même si WhatsApp est temporairement indisponible
- ✅ **Fournir des logs clairs** pour faciliter le debugging

---

**Date :** 2025-11-04  
**Fichiers modifiés :**
- `src/services/ai/WhatsAppService.ts`
- `src/services/ai/start.ts`

