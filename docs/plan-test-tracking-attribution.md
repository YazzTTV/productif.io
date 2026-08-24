# Plan de test - Tracking attribution Productif

Date: 2026-08-24

## Changements a couvrir

### Web landing `/mode-examen`

Ajouts:

- tracking Vercel Analytics `mode_examen_view`
- tracking Vercel Analytics `mode_examen_app_store_click`
- tracking Vercel Analytics `mode_examen_lead_submit`
- generation de CTA AppsFlyer OneLink avec les UTM de la page

Fichiers:

- `lib/funnel-analytics.ts`
- `app/mode-examen/mode-examen-content.tsx`
- `components/mode-examen/email-capture.tsx`

### Mobile attribution

Ajouts:

- normalisation AppsFlyer `pid/c`, `media_source/campaign`, `utm_content`, `af_ad`, `af_sub2`, `deep_link_sub*`
- queue locale de l'attribution avant login/signup
- flush vers `/api/user/attribution` apres authentification
- conservation des details dans `User.attributionData`

Fichiers:

- `mobile-app-new/hooks/useAppsFlyer.ts`
- `mobile-app-new/app/_layout.tsx`

### Mobile analytics Arthur

Ajouts sur `origin/main`:

- Firebase Analytics produit
- events `app_opened`, `screen_view`, `signup_started`, `signup_completed`, `onboarding_completed`, `exam_mode_started`, `paywall_viewed`, `paywall_dismissed`, `purchase_completed`, `purchase_restored`

Correctif du bug Arthur:

- branche locale: `fix/arthur-success-analytics`
- worktree: `/Users/noah/Documents/dev/productif.io-fix-arthur-success`
- commit: `e48e46b fix(mobile): remettre le tracking onboarding dans le handler`
- correction: `trackEvent('onboarding_completed', { next_action: 'view_calendar' })` est dans `handleViewCalendar`, plus en fin de fichier.

## Ce qui se teste sur Vercel

Tester sur une preview Vercel avant prod.

URL de test:

```text
https://<preview>/mode-examen?utm_source=tiktok&utm_medium=organic&utm_campaign=vague2&utm_content=C10
```

Checklist:

1. La page `/mode-examen` charge correctement.
2. Un event `mode_examen_view` apparait dans Vercel Analytics.
3. Chaque CTA principal pointe vers `https://productif.onelink.me/HCEk...`.
4. L'URL du CTA contient:
   - `pid=tiktok_organic`
   - `c=vague2`
   - `af_ad=C10`
   - `af_sub2=C10`
   - `af_sub3=<placement>`
   - `deep_link_value=mode_examen`
5. Le clic CTA remonte `mode_examen_app_store_click`.
6. Le formulaire email remonte `mode_examen_lead_submit`.

Ne pas envoyer directement en prod tant que les CTA n'ont pas ete verifies sur preview.

## Ce qui exige TestFlight

Un test local web ou Vercel ne suffit pas pour valider:

- AppsFlyer deferred deep linking apres installation
- Firebase Analytics mobile
- liaison install -> signup -> attribution backend
- Superwall purchase tracking dans l'app

Il faut une build iOS TestFlight, parce que ces pieces dependent des SDK natifs, de l'app installee et du comportement iOS.

Checklist TestFlight:

1. Installer une build qui contient:
   - les changements AppsFlyer attribution
   - les changements Firebase Analytics d'Arthur
   - le fix `success.tsx`
2. Depuis un iPhone sans app installee, ouvrir un OneLink:

```text
https://productif.onelink.me/HCEk?pid=tiktok_organic&c=vague2&af_channel=organic&af_ad=C10&af_sub2=C10&af_sub3=testflight&deep_link_value=mode_examen
```

3. Installer via TestFlight ou ouvrir l'app selon le scenario disponible.
4. Creer un compte.
5. Verifier que `/api/user/attribution` recoit les donnees apres signup.
6. Verifier en base sur l'utilisateur:
   - `attributionSource = tiktok_organic`
   - `attributionProvider = appsflyer`
   - `attributionData.campaign = vague2`
   - `attributionData.af_ad = C10`
   - `attributionData.af_sub2 = C10`
7. Finir l'onboarding.
8. Verifier Firebase Analytics:
   - `app_opened`
   - `signup_completed`
   - `onboarding_completed`
9. Declencher un paywall.
10. Verifier Firebase Analytics:
   - `paywall_viewed`
   - `paywall_dismissed` ou `purchase_completed`

## Ordre recommande

1. Merger ou reprendre le fix Arthur `e48e46b`.
2. Merger les changements web attribution.
3. Deployer une preview Vercel.
4. Valider les CTA OneLink et les events Vercel Analytics.
5. Faire une build TestFlight avec les changements mobile.
6. Valider AppsFlyer + Firebase + backend attribution sur un compte de test.
7. Ensuite seulement, deploy prod Vercel et release mobile.

## Risques connus

- Le `tsc` complet mobile echoue deja sur de la dette existante hors tracking.
- Le lint mobile ciblé passe avec un warning preexistant `appCheckReady` inutilise dans `_layout.tsx`.
- Le fichier `success.tsx` contient encore des erreurs TypeScript preexistantes sur `withTiming(..., { delay })`, independantes du bug d'Arthur.
- Si le OneLink AppsFlyer n'est pas configure pour l'app iOS en dashboard AppsFlyer, le clic peut rediriger mais ne pas attribuer correctement l'installation.
