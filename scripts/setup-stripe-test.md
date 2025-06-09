# Configuration Stripe Test Local

## 1. Installer Stripe CLI

```bash
# Windows (via Chocolatey)
choco install stripe-cli

# Ou télécharger depuis : https://stripe.com/docs/stripe-cli
```

## 2. Se connecter à Stripe

```bash
stripe login
```

## 3. Créer un fichier .env.local

Créez un fichier `.env.local` à la racine du projet avec :

```env
# Base de données (même URL que production pour les tests)
DATABASE_URL="votre_database_url"

# Stripe TEST keys (récupérez-les depuis https://dashboard.stripe.com/test/apikeys)
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."  # Sera généré automatiquement

# NextAuth
NEXTAUTH_SECRET="votre_secret"
NEXTAUTH_URL="http://localhost:3000"

# URL locale
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## 4. Démarrer le serveur local

```bash
npm run dev
```

## 5. Forwarder les webhooks Stripe (dans un autre terminal)

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Cette commande va :
- Générer un webhook secret temporaire
- Afficher le secret (copiez-le dans STRIPE_WEBHOOK_SECRET)
- Forwarder tous les événements Stripe vers votre serveur local

## 6. Tester un paiement

1. Allez sur http://localhost:3000/waitlist
2. Inscrivez-vous avec un email de test
3. Utilisez une carte de test Stripe : `4242 4242 4242 4242`
4. Surveillez les logs du webhook dans le terminal

## 7. Cartes de test Stripe

- **Succès** : `4242 4242 4242 4242`
- **Échec** : `4000 0000 0000 0002`
- **3D Secure** : `4000 0025 0000 3155`

Date d'expiration : n'importe quelle date future
CVC : n'importe quel code à 3 chiffres

## 8. Vérifier les logs

- Dans le terminal avec `stripe listen`, vous verrez les événements
- Dans votre serveur Next.js, vous verrez les logs du webhook
- Dans https://dashboard.stripe.com/test/events, vous pouvez voir tous les événements 