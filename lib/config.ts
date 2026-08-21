/**
 * Secret de signature des JWT. Source unique.
 *
 * Aucune valeur de repli : le dépôt est public, donc tout secret par défaut
 * écrit ici serait un secret publié. Une valeur de repli faisait basculer
 * silencieusement tout environnement sans JWT_SECRET sur une chaîne connue de
 * tous, permettant de forger un jeton pour n'importe quel compte.
 *
 * On échoue au runtime si la variable manque, mais PAS pendant le build Next :
 * `next build` importe ce module pour bundler les routes, et les variables
 * d'environnement ne sont pas garanties présentes à cette étape. Un throw au
 * build ferait échouer tout le déploiement et laisserait l'ancienne version en
 * ligne. Le fail-closed reste entier : à l'exécution d'une requête, l'absence
 * de secret lève bien.
 */
const isNextBuild = process.env.NEXT_PHASE === "phase-production-build"
if (!process.env.JWT_SECRET && !isNextBuild) {
  throw new Error(
    "JWT_SECRET manquant. Refus de démarrer avec un secret par défaut : définissez la variable d'environnement."
  )
}
export const JWT_SECRET = process.env.JWT_SECRET as string
export const JWT_EXPIRES_IN = "7d"

export const AUTH_COOKIE_NAME = "auth_token"
export const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  path: "/",
  secure: process.env.NODE_ENV === "production",
  maxAge: 60 * 60 * 24 * 7, // 7 jours
}

/**
 * Configuration de l'application
 */

/**
 * `appConfig` a demenage dans `lib/app-config.ts` pour qu'un composant client
 * puisse le lire sans embarquer le throw sur JWT_SECRET ci-dessus. Reexporte
 * ici pour le code serveur qui l'importait deja.
 */
export { appConfig } from "./app-config" 