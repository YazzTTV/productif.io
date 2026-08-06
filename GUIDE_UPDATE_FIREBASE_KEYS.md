# Guide de mise à jour des clés Firebase

## 📋 Ce que tu as fait

✅ Tu as mis à jour le fichier `google-services.json` pour l'app Android

## 🔧 Ce qu'il reste à faire

### 1. Vérifier que la clé API a changé

Si tu as régénéré la clé API dans Firebase Console, vérifie que la nouvelle clé est différente de l'ancienne :
- Ancienne clé : (vérifie dans l'ancien `google-services.json` si tu l'as sauvegardé)
- Nouvelle clé : (vérifie dans le nouveau `google-services.json`)

### 2. Mettre à jour Railway pour le scheduler

Le scheduler utilise un **Service Account Firebase** différent (pour envoyer les notifications depuis le backend).

#### Étape 1 : Télécharger le nouveau Service Account

1. Va sur [Firebase Console](https://console.firebase.google.com/)
2. Sélectionne le projet `productifio-47a08`
3. Va dans **Paramètres du projet** (⚙️) → **Comptes de service**
4. Clique sur **Générer une nouvelle clé privée** (ou utilise le service account existant)
5. Télécharge le fichier JSON

#### Étape 2 : Extraire les valeurs du JSON

Ouvre le fichier JSON téléchargé et note ces 3 valeurs :

```json
{
  "project_id": "productifio-47a08",           ← FIREBASE_PROJECT_ID
  "client_email": "firebase-adminsdk-...",     ← FIREBASE_CLIENT_EMAIL
  "private_key": "-----BEGIN PRIVATE KEY-----\n..."  ← FIREBASE_PRIVATE_KEY
}
```

#### Étape 3 : Mettre à jour Railway

1. Va sur [Railway Dashboard](https://railway.app/)
2. Sélectionne ton projet
3. Clique sur le service **scheduler**
4. Va dans l'onglet **Variables**
5. Mets à jour ces 3 variables :

   **FIREBASE_PROJECT_ID** :
   ```
   productifio-47a08
   ```

   **FIREBASE_CLIENT_EMAIL** :
   ```
   firebase-adminsdk-XXXXX@productifio-47a08.iam.gserviceaccount.com
   ```
   (Copie la valeur `client_email` du JSON)

   **FIREBASE_PRIVATE_KEY** :
   ```
   -----BEGIN PRIVATE KEY-----
   <COLLER ICI LA CLÉ PRIVÉE COMPLÈTE DU JSON>
   -----END PRIVATE KEY-----
   ```
   (Ne jamais committer de vraie clé dans ce fichier : le dépôt est public.)
   ⚠️ **IMPORTANT** : Copie TOUTE la clé privée, y compris :
   - `-----BEGIN PRIVATE KEY-----`
   - Toutes les lignes de la clé
   - `-----END PRIVATE KEY-----`
   
   Les retours à la ligne (`\n`) seront gérés automatiquement par le code.

6. Sauvegarde les variables
7. Railway redémarrera automatiquement le scheduler

### 3. Vérifier que tout fonctionne

Une fois Railway redémarré, teste une notification :

```bash
# Script de test (si disponible)
node scripts/test-android-notification.js
```

Ou vérifie les logs Railway pour voir si Firebase s'initialise correctement.

## 📝 Résumé

| Fichier/Variable | Usage | Où mettre à jour |
|------------------|-------|------------------|
| `google-services.json` | App Android (client) | `mobile-app-new/android/app/` |
| `FIREBASE_PROJECT_ID` | Scheduler (backend) | Railway Variables |
| `FIREBASE_CLIENT_EMAIL` | Scheduler (backend) | Railway Variables |
| `FIREBASE_PRIVATE_KEY` | Scheduler (backend) | Railway Variables |

## ⚠️ Notes importantes

- Le `project_id` reste généralement le même (`productifio-47a08`)
- Si tu régénères un nouveau service account, le `client_email` changera
- La `private_key` change à chaque régénération
- Railway redémarre automatiquement après la mise à jour des variables
- Aucun changement de code nécessaire

## ✅ Checklist

- [ ] Nouveau `google-services.json` en place
- [ ] Nouveau Service Account JSON téléchargé
- [ ] Variables Railway mises à jour :
  - [ ] `FIREBASE_PROJECT_ID`
  - [ ] `FIREBASE_CLIENT_EMAIL`
  - [ ] `FIREBASE_PRIVATE_KEY`
- [ ] Scheduler Railway redémarré (automatique)
- [ ] Test d'une notification Android
