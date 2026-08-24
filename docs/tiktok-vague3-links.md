# TikTok vague 3 - liens traçables

Objectif : un code créa unique par vidéo, de `C20` à `C40`, pour pouvoir lire les performances dans `/dashboard/admin/acquisition`.

## Générer les liens

Lead form TikTok :

```bash
npm run links:tiktok -- --campaign=vague3 --from=20 --to=40 --placement=lead_form --format=csv
```

Bio TikTok :

```bash
npm run links:tiktok -- --campaign=vague3 --from=20 --to=40 --placement=bio --format=csv
```

DM ou commentaire manuel :

```bash
npm run links:tiktok -- --campaign=vague3 --from=20 --to=40 --placement=dm --format=csv
npm run links:tiktok -- --campaign=vague3 --from=20 --to=40 --placement=comment --format=csv
```

## Convention

- `campaign`: `vague3`
- `af_sub2`: code créa, par exemple `C20`
- `af_sub3`: placement, par exemple `lead_form`, `bio`, `dm`, `comment`
- `utm_content`: code créa, identique à `af_sub2`

## Lecture

Dashboard prod :

https://www.productif.io/dashboard/admin/acquisition

La table principale regroupe par `source / vague / créa / placement`, puis ajoute les comptes créés, vues paywall, fermetures paywall, achats/restores et premium en base.
