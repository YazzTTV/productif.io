# QR dynamiques Montpellier

Ce document centralise le systeme de QR codes dynamiques ajoute pour les affiches Productif.io a Montpellier.

## Principe

Les QR codes imprimes ne doivent pas pointer directement vers l'App Store ou une page finale.

Ils doivent pointer vers une URL courte de Productif.io :

```text
https://productif.io/r/<slug>
```

Cette URL courte redirige ensuite vers une destination finale stockee en base de donnees.

Avantage : si une affiche est deja imprimee, on peut changer la destination finale sans modifier ni reimprimer le QR code.

## Liens a utiliser pour les affiches Montpellier

| Lieu | URL stable a encoder dans le QR |
| --- | --- |
| BU Richter | `https://productif.io/r/montpellier-bu-richter` |
| BU Sciences | `https://productif.io/r/montpellier-bu-sciences` |
| BU Triolet | `https://productif.io/r/montpellier-bu-triolet` |
| Fac MOMA | `https://productif.io/r/montpellier-fac-moma` |
| Fac Eco | `https://productif.io/r/montpellier-fac-eco` |
| Fac Medecine | `https://productif.io/r/montpellier-fac-medecine` |
| Fac Droit | `https://productif.io/r/montpellier-fac-droit` |

Ces URLs sont celles a transformer en QR code.

## Destination initiale

Chaque lien redirige par defaut vers la page `/mode-examen`, avec un tracking propre par emplacement.

Exemple pour BU Richter :

```text
https://productif.io/mode-examen?utm_source=qr&utm_medium=offline&utm_campaign=montpellier-campus&utm_content=montpellier-bu-richter
```

La campagne commune est :

```text
montpellier-campus
```

Le champ `utm_content` change selon l'emplacement.

## Fichiers ajoutes ou modifies

- Route publique de redirection : `app/r/[slug]/route.ts`
- API admin pour creer/lister les liens : `app/api/admin/qr-links/route.ts`
- API admin pour lire/modifier un lien : `app/api/admin/qr-links/[slug]/route.ts`
- Helper d'autorisation admin : `lib/qr-admin-auth.ts`
- Schema Prisma : `prisma/schema.prisma`
- Migration SQL : `prisma/migrations/20260921120000_add_qr_redirects/migration.sql`
- Script de creation/mise a jour Montpellier : `scripts/create-montpellier-qr-links.ts`

## Creation automatique des liens

Les 7 liens Montpellier sont ajoutes directement dans la migration :

```text
prisma/migrations/20260921120000_add_qr_redirects/migration.sql
```

Ils seront donc crees quand la migration sera appliquee en production.

Commande de deploiement habituelle :

```bash
npx prisma migrate deploy
```

Note : au moment de la creation, la base Neon indiquait une divergence de migrations :

```text
Migration presente en base mais absente localement :
20260822130000_add_product_analytics
```

Donc ne pas forcer une migration manuelle sans verifier l'etat de la base.

## Re-creer ou mettre a jour les liens Montpellier

Une commande npm a ete ajoutee :

```bash
npm run links:montpellier-qr
```

Elle fait un `upsert` des 7 liens : si le lien existe deja, il est mis a jour ; sinon il est cree.

Variables optionnelles :

```bash
QR_TARGET_BASE_URL="https://productif.io/mode-examen" npm run links:montpellier-qr
QR_PUBLIC_BASE_URL="https://productif.io" npm run links:montpellier-qr
```

## Modifier la destination finale d'un QR

Pour modifier la destination finale sans changer le QR imprime :

```bash
curl -X PATCH https://productif.io/api/admin/qr-links/montpellier-bu-richter \
  -H "Authorization: Bearer $QR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"targetUrl": "https://productif.io/nouvelle-page"}'
```

Remplacer `montpellier-bu-richter` par le slug voulu.

## Lister les liens existants

```bash
curl https://productif.io/api/admin/qr-links \
  -H "Authorization: Bearer $QR_ADMIN_TOKEN"
```

La reponse contient notamment :

- `slug`
- `shortUrl`
- `targetUrl`
- `scanCount`
- `isActive`

## Voir les scans recents d'un lien

```bash
curl https://productif.io/api/admin/qr-links/montpellier-bu-richter \
  -H "Authorization: Bearer $QR_ADMIN_TOKEN"
```

La reponse contient les informations du lien et les 50 derniers scans.

## Configuration requise

Ajouter une variable d'environnement en production :

```text
QR_ADMIN_TOKEN=<token-secret>
```

Cette cle permet de modifier les liens via l'API admin.

Alternative : un utilisateur connecte avec le role `SUPER_ADMIN` peut aussi acceder aux endpoints admin.

## Notes importantes

- Les QR imprimes doivent toujours utiliser les URLs `https://productif.io/r/...`.
- Ne jamais imprimer directement l'URL finale si on veut pouvoir la changer plus tard.
- La route publique ajoute automatiquement `utm_source=qr`, `utm_medium=offline` et `utm_campaign=<slug>` si la destination n'a pas deja ces parametres.
- Chaque scan est enregistre dans `qr_redirect_scans`.
- L'adresse IP est hashee avant stockage.
