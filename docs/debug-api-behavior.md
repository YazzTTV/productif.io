# 🔧 Debug de l'API Behavior

Test de l'endpoint comportemental :

```bash
curl http://localhost:3000/api/behavior/agent/analysis?days=7
```

**Si ça ne fonctionne pas**, c'est que Next.js n'est pas démarré ou que le chemin est incorrect.

## Solutions possibles :

### 1. Vérifier que Next.js tourne
```bash
curl http://localhost:3000/api/health
```

### 2. Vérifier l'URL de l'app
Dans `src/services/ai/start.ts`, `appUrl` est défini comme :
```typescript
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
```

### 3. Alternative : Simuler la réponse

Si l'API n'est pas disponible, ajoutez une réponse de secours dans l'agent IA :

```typescript
if (!behaviorResp.ok) {
    // Réponse de secours avec les 42 check-ins créés
    await whatsappService.sendMessage(from, 
        `📊 **Ton analyse des 7 derniers jours** (Données de test)\n\n` +
        `📈 **Moyennes:**\n` +
        `😊 Humeur: 7.2/10\n` +
        `🎯 Focus: 6.8/10\n` +
        `🔥 Motivation: 7.5/10\n` +
        `⚡ Énergie: 6.5/10\n` +
        `😰 Stress: 4.2/10\n\n` +
        `💡 **Insights clés:**\n` +
        `1. Continue à renseigner tes états pour recevoir une analyse\n\n` +
        `🎯 **Recommandations:**\n` +
        `1. Continue à répondre aux questions quotidiennes\n`
    );
    return res.sendStatus(200);
}
```
