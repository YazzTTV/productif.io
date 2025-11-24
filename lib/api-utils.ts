/**
 * Fonction utilitaire pour vérifier et parser les réponses JSON
 * Gère les cas où l'API retourne du HTML (redirection) au lieu de JSON
 */
export async function safeJsonResponse<T = any>(
  response: Response,
  endpointName: string = "API"
): Promise<T> {
  // Cloner la réponse pour pouvoir lire le texte si nécessaire
  const clonedResponse = response.clone()
  const contentType = response.headers.get("content-type")
  
  // Vérifier que la réponse est bien du JSON
  if (!contentType || !contentType.includes("application/json")) {
    const text = await clonedResponse.text()
    console.error(`[${endpointName}] Réponse non-JSON reçue:`, text.substring(0, 200))
    
    // Si c'est une erreur d'authentification, rediriger vers login
    if (response.status === 401 || response.status === 403) {
      if (typeof window !== "undefined") {
        window.location.href = "/login"
      }
      throw new Error("Non authentifié")
    }
    
    // Si c'est du HTML (redirection), rediriger vers login
    if (text.includes("<!DOCTYPE") || text.includes("<html")) {
      if (typeof window !== "undefined") {
        window.location.href = "/login"
      }
      throw new Error("Redirection vers login détectée")
    }
    
    // Si c'est une erreur serveur, lever une erreur avec le texte
    if (!response.ok) {
      throw new Error(`Erreur ${response.status}: ${text.substring(0, 100)}`)
    }
    
    throw new Error(`Réponse invalide de ${endpointName} (attendu JSON, reçu ${contentType})`)
  }
  
  // Parser le JSON
  try {
    const data = await response.json()
    
    // Si la réponse n'est pas OK, lever une erreur avec les données JSON
    if (!response.ok) {
      throw new Error(data.error || data.message || `Erreur ${response.status}`)
    }
    
    return data
  } catch (parseError: any) {
    // Si le parsing échoue, essayer de lire comme texte pour voir ce que c'est
    if (parseError.message && parseError.message.includes("JSON")) {
      const text = await clonedResponse.text()
      console.error(`[${endpointName}] Erreur de parsing JSON:`, text.substring(0, 200))
      
      // Si c'est du HTML (redirection), rediriger vers login
      if (text.includes("<!DOCTYPE") || text.includes("<html")) {
        if (typeof window !== "undefined") {
          window.location.href = "/login"
        }
        throw new Error("Redirection vers login détectée")
      }
      
      throw new Error(`Erreur de parsing JSON: ${parseError.message}`)
    }
    throw parseError
  }
}
