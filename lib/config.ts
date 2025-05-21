export const JWT_SECRET = process.env.JWT_SECRET || "un_secret_tres_securise_pour_jwt_tokens"
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