# Configuration Stripe pour le Paywall

## 🔑 Price IDs à configurer

Ouvrez le fichier `app/(onboarding-new)/stripe-checkout.tsx` et remplacez les Price IDs :

```typescript
const STRIPE_PRICE_IDS = {
  monthly: 'price_1XXXXXXXXXXXXXX', // ⚠️ À remplacer par votre vrai Price ID mensuel
  annual: 'price_1XXXXXXXXXXXXXX',  // ⚠️ À remplacer par votre vrai Price ID annuel
};
```

## 📝 Comment obtenir vos Price IDs Stripe

1. Connectez-vous à votre [Dashboard Stripe](https://dashboard.stripe.com/)
2. Allez dans **Produits** > **Vos produits**
3. Créez ou sélectionnez votre produit "Productif.io Premium"
4. Pour chaque tarif (mensuel et annuel), copiez le **Price ID** qui commence par `price_`

### Exemple de configuration :
```typescript
const STRIPE_PRICE_IDS = {
  monthly: 'price_1OxxxxxxxxxxxxQ2Kxxxx',  // Plan mensuel $14.99/mois
  annual: 'price_1OxxxxxxxxxxxxQ2Kxxxx',   // Plan annuel $9.99/mois (facturé $119.88/an)
};
```

## 🔄 Options d'implémentation

### Option 1 : Stripe Checkout (Redirection web) ✅ Recommandé
- L'utilisateur est redirigé vers une page de paiement Stripe hébergée
- Plus simple à implémenter
- Déjà configuré dans `stripe-checkout.tsx`

### Option 2 : API Backend personnalisée
Si vous avez votre propre backend :

```typescript
const response = await fetch('https://votre-api.com/create-checkout-session', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    priceId: STRIPE_PRICE_IDS[plan],
    plan: plan,
    userId: 'user_id_here' // Si vous avez un système d'auth
  })
});
const { url } = await response.json();
await Linking.openURL(url);
```

## 🎯 Flux actuel

1. Utilisateur sélectionne un plan (annuel ou mensuel) dans `profile-reveal.tsx`
2. Clic sur "Start My Free Trial"
3. Redirection vers `stripe-checkout.tsx` avec le plan sélectionné
4. Affichage des détails du plan et bouton "Continuer vers le paiement"
5. Redirection vers Stripe Checkout avec le Price ID correspondant
6. Après paiement, l'utilisateur est redirigé vers le dashboard

## 📋 Plans tarifaires actuels

- **Plan Mensuel** : $14.99/mois
- **Plan Annuel** : $9.99/mois (facturé $119.88/an) - Économie de $60/an

## ⚠️ Important

N'oubliez pas de configurer :
- Les **webhooks Stripe** pour écouter les événements de paiement
- Les **URLs de retour** (success_url et cancel_url) dans votre configuration Stripe
- Les **clés API Stripe** dans votre environnement (`.env`)

## 🔐 Variables d'environnement

Ajoutez dans votre `.env` ou `app.json` :

```json
{
  "extra": {
    "stripePublishableKey": "pk_test_...",
    "stripeSecretKey": "sk_test_..." // ⚠️ Côté backend seulement
  }
}
```


