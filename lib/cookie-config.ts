export const getCookieConfig = (req?: Request) => {
  const isProduction = process.env.NODE_ENV === "production"
  const domain = isProduction 
    ? process.env.NEXT_PUBLIC_APP_URL 
      ? new URL(process.env.NEXT_PUBLIC_APP_URL).hostname 
      : undefined
    : undefined

  return {
    httpOnly: true,
    secure: isProduction, // Utiliser HTTPS uniquement en production
    sameSite: isProduction ? "none" as const : "lax" as const, // Permettre les cookies cross-origin en production
    path: "/",
    domain: domain,
    maxAge: 60 * 60 * 24 * 7 // 7 jours
  }
}

export const getClientCookieConfig = (req?: Request) => {
  const baseConfig = getCookieConfig(req)
  return {
    ...baseConfig,
    httpOnly: false
  }
} 