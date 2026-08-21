/**
 * Configuration globale SANS SECRET, importable depuis un composant client.
 *
 * Pourquoi ce fichier existe et pourquoi il ne doit pas retourner dans
 * `lib/config.ts` : ce dernier lève au niveau du module quand `JWT_SECRET`
 * manque. Or les variables d'environnement serveur n'existent pas dans le
 * navigateur, donc tout composant `"use client"` qui importe `lib/config`
 * embarque ce throw dans son bundle et casse la page à l'import.
 *
 * C'est arrivé en production du 6 au 21 août : `components/auth/auto-logout.tsx`
 * importait `appConfig` depuis `lib/config`, et comme `AutoLogout` est monté
 * dans `app/dashboard/layout.tsx` et `app/focus/layout.tsx`, TOUTE la section
 * dashboard du site tombait sur "Application error: a client-side exception".
 * Le commit `356f9e8` (retrait du secret de repli) était juste, le couplage ne
 * l'était pas.
 *
 * Règle : rien qui touche à un secret ou à une variable d'environnement
 * serveur n'entre dans ce fichier.
 */
export const appConfig = {
  // Déconnexion automatique lors de la fermeture de la page
  autoLogoutEnabled: true,
}
