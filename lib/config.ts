/**
 * Secret de signature des JWT. Source unique.
 *
 * Aucune valeur de repli : le dépôt est public, donc tout secret par défaut
 * écrit ici serait un secret publié. Une valeur de repli faisait basculer
 * silencieusement tout environnement sans JWT_SECRET sur une chaîne connue de
 * tous, permettant de forger un jeton pour n'importe quel compte. On échoue
 * bruyamment au démarrage plutôt que de démarrer avec un secret compromis.
 */
if (!process.env.JWT_SECRET) {
  throw new Error(
    "JWT_SECRET manquant. Refus de démarrer avec un secret par défaut : définissez la variable d'environnement."
  )
}
export const JWT_SECRET = process.env.JWT_SECRET
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

export const appConfig = {
  // Déconnexion automatique lors de la fermeture de la page
  autoLogoutEnabled: true,
  
  // Autres configurations globales de l'application peuvent être ajoutées ici
} 