# Server-to-Server Notification Endpoint pour Sign in with Apple

## 📋 Qu'est-ce que c'est ?

Le **Server-to-Server Notification Endpoint** est un endpoint webhook que vous devez configurer dans Apple Developer pour recevoir des notifications d'Apple concernant les comptes utilisateurs Sign in with Apple.

**C'est différent de l'endpoint d'authentification** (`/api/auth/oauth/apple`) qui gère la connexion initiale.

## 🔔 Types de Notifications Reçues

Apple envoie des notifications dans ces cas :

1. **Changement de préférences de transfert d'email**
   - Quand un utilisateur change ses préférences de transfert d'email dans les paramètres Apple
   - Vous devez mettre à jour l'email de l'utilisateur dans votre base de données

2. **Suppression du compte d'application**
   - Quand un utilisateur supprime son compte dans votre application
   - Vous devez désactiver ou supprimer le compte utilisateur

3. **Suppression définitive du compte Apple**
   - Quand un utilisateur supprime définitivement son compte Apple
   - Vous devez gérer la suppression des données utilisateur selon votre politique de confidentialité

## 🌐 URL Recommandée

Pour votre application Productif.io, utilisez :

```
https://www.productif.io/api/auth/oauth/apple/notifications
```

**Pourquoi cette URL ?**
- Cohérente avec votre structure d'API existante (`/api/auth/oauth/apple`)
- Facile à maintenir et comprendre
- Suit les conventions REST de votre application

## ⚙️ Configuration dans Apple Developer

### Étape 1 : Accéder à la Configuration

1. Allez sur [developer.apple.com](https://developer.apple.com)
2. Connectez-vous avec votre compte Apple Developer
3. Allez dans **Certificates, Identifiers & Profiles**
4. Cliquez sur **Identifiers**
5. Sélectionnez votre App ID : `io.productif.app`
6. Cliquez sur **"Sign In with Apple"** dans la section Capabilities
7. Cliquez sur **"Configure"**

### Étape 2 : Configurer l'Endpoint

1. Dans la section **"Server-to-Server Notification Endpoint"**, entrez :
   ```
   https://www.productif.io/api/auth/oauth/apple/notifications
   ```

2. **Important** : L'URL doit :
   - ✅ Être absolue (avec `https://`)
   - ✅ Inclure le schéma (`https`)
   - ✅ Inclure le host (`www.productif.io`)
   - ✅ Inclure le path (`/api/auth/oauth/apple/notifications`)
   - ✅ Utiliser TLS 1.2 ou supérieur (votre serveur doit le supporter)

3. Cliquez sur **"Save"**

## 🔒 Exigences de Sécurité

### TLS 1.2 ou Supérieur

Votre serveur doit supporter TLS 1.2 minimum. Vérifiez que :
- Votre certificat SSL est valide
- Votre serveur (Vercel/Railway/etc.) supporte TLS 1.2+
- Les certificats ne sont pas expirés

### Validation des Notifications

Apple envoie les notifications avec :
- Un JWT signé dans le header `Authorization`
- Vous devez vérifier la signature du JWT avec les clés publiques d'Apple
- Utilisez le même mécanisme que pour vérifier les identity tokens

## 📝 Format des Notifications

Apple envoie des notifications au format JWT. Exemple de payload :

```json
{
  "iss": "https://appleid.apple.com",
  "aud": "io.productif.app",
  "iat": 1234567890,
  "jti": "unique-notification-id",
  "events": [
    {
      "type": "email-disabled",
      "sub": "user-apple-id",
      "email": "user@example.com",
      "is_private_email": true
    }
  ]
}
```

### Types d'Événements

- `email-disabled` : L'utilisateur a désactivé le transfert d'email
- `email-enabled` : L'utilisateur a activé le transfert d'email
- `consent-withdrawn` : L'utilisateur a retiré son consentement (suppression du compte app)
- `account-delete` : L'utilisateur a supprimé son compte Apple

## 🛠️ Implémentation

Un endpoint a été créé dans votre application :
- **Fichier** : `app/api/auth/oauth/apple/notifications/route.ts`
- **Méthode** : `POST`
- **URL** : `https://www.productif.io/api/auth/oauth/apple/notifications`

### Fonctionnalités Implémentées

✅ Vérification de la signature JWT avec les clés publiques Apple
✅ Gestion des événements `email-disabled` et `email-enabled`
✅ Gestion de l'événement `consent-withdrawn` (désactivation du compte)
✅ Gestion de l'événement `account-delete` (suppression du compte)
✅ Logging des notifications pour le debugging
✅ Réponse 200 OK pour confirmer la réception

## 🧪 Test de l'Endpoint

### Test Manuel

Vous pouvez tester l'endpoint avec curl :

```bash
curl -X POST https://www.productif.io/api/auth/oauth/apple/notifications \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "events": [{
      "type": "email-disabled",
      "sub": "test-user-id"
    }]
  }'
```

### Test avec Apple

Apple enverra automatiquement des notifications de test lors de la configuration initiale. Vérifiez vos logs pour confirmer la réception.

## 📊 Monitoring

### Logs à Surveiller

- Réception des notifications (succès/échec)
- Erreurs de validation JWT
- Événements traités (email-disabled, consent-withdrawn, etc.)
- Utilisateurs affectés

### Alertes Recommandées

Configurez des alertes pour :
- Échecs de validation JWT
- Erreurs 500 sur l'endpoint
- Taux d'erreur élevé

## ✅ Checklist de Configuration

Avant de soumettre votre app :

- [ ] Endpoint créé et déployé : `/api/auth/oauth/apple/notifications`
- [ ] URL configurée dans Apple Developer Portal
- [ ] TLS 1.2+ vérifié sur votre serveur
- [ ] Validation JWT implémentée et testée
- [ ] Gestion des événements implémentée
- [ ] Logging configuré
- [ ] Tests effectués avec des notifications réelles
- [ ] Documentation interne créée pour l'équipe

## 🔗 Ressources

- [Documentation Apple - Sign in with Apple Server-to-Server Notifications](https://developer.apple.com/documentation/sign_in_with_apple/sign_in_with_apple_rest_api/verifying_a_user)
- [Apple Developer Portal](https://developer.apple.com/account/resources/identifiers/list)
- [JWT Verification avec jose](https://github.com/panva/jose)

---

**Note** : Cet endpoint est **obligatoire** si vous utilisez Sign in with Apple. Apple recommande fortement de l'implémenter pour gérer correctement les changements de compte utilisateur.

