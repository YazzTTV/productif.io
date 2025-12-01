/**
 * Service de normalisation de texte pour améliorer la robustesse
 * de la compréhension des messages utilisateur
 */
export class TextNormalizer {
  // Dictionnaire d'abréviations SMS courantes
  private static SMS_ABBREVIATIONS: Record<string, string> = {
    'c': 'c\'est',
    'j': 'je',
    't': 'tu',
    'm': 'me',
    's': 'se',
    'l': 'le',
    'd': 'de',
    'n': 'ne',
    'qu': 'que',
    'pr': 'pour',
    'ds': 'dans',
    'vs': 'vous',
    'tt': 'tout',
    'tts': 'tous',
    'bcp': 'beaucoup',
    'pk': 'pourquoi',
    'pq': 'parce que',
    'pt': 'petit',
    'ptt': 'petite',
    'ptdr': 'pété de rire',
    'mdr': 'mort de rire',
    'lol': 'laughing out loud',
    'stp': 's\'il te plaît',
    'svp': 's\'il vous plaît',
    'rdv': 'rendez-vous',
    'dem1n': 'demain',
    'dem1': 'demain',
    'dem': 'demain',
    'auj': 'aujourd\'hui',
    'aujdh': 'aujourd\'hui',
    'h': 'heure',
    'min': 'minute',
    'sec': 'seconde',
  }

  // Corrections d'orthographe courantes
  private static COMMON_TYPOS: Record<string, string> = {
    'kommence': 'commence',
    'commance': 'commence',
    'commence': 'commence',
    'démare': 'démarre',
    'demare': 'démarre',
    'demarre': 'démarre',
    'travaiiler': 'travailler',
    'travailler': 'travailler',
    'travailer': 'travailler',
    'journee': 'journée',
    'journe': 'journée',
    'journe': 'journée',
    'planif': 'planifie',
    'planifie': 'planifie',
    'organise': 'organise',
    'organise': 'organise',
    'prepare': 'prépare',
    'prepare': 'prépare',
    'terminé': 'terminé',
    'terminé': 'terminé',
    'terminé': 'terminé',
    'fini': 'fini',
    'fini': 'fini',
    'validé': 'validé',
    'validé': 'validé',
    'complété': 'complété',
    'complété': 'complété',
  }

  /**
   * Normalise un texte pour améliorer la compréhension
   */
  static normalize(text: string): string {
    if (!text || typeof text !== 'string') {
      return ''
    }

    // Normaliser la casse et supprimer les espaces en début/fin
    let normalized = text.toLowerCase().trim()

    // Remplacer les abréviations SMS (en respectant les limites de mots)
    for (const [abbrev, full] of Object.entries(this.SMS_ABBREVIATIONS)) {
      // Utiliser des limites de mots pour éviter les remplacements partiels
      const regex = new RegExp(`\\b${this.escapeRegex(abbrev)}\\b`, 'gi')
      normalized = normalized.replace(regex, full)
    }

    // Corriger les fautes courantes
    for (const [typo, correct] of Object.entries(this.COMMON_TYPOS)) {
      const regex = new RegExp(`\\b${this.escapeRegex(typo)}\\b`, 'gi')
      normalized = normalized.replace(regex, correct)
    }

    // Normaliser les apostrophes (différents types d'apostrophes)
    normalized = normalized.replace(/[''`]/g, '\'')

    // Normaliser les espaces multiples
    normalized = normalized.replace(/\s+/g, ' ')

    // Supprimer les espaces en début/fin
    normalized = normalized.trim()

    return normalized
  }

  /**
   * Échappe les caractères spéciaux pour les regex
   */
  private static escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }

  /**
   * Vérifie si deux textes sont similaires après normalisation
   */
  static areSimilar(text1: string, text2: string, threshold: number = 0.8): boolean {
    const norm1 = this.normalize(text1)
    const norm2 = this.normalize(text2)
    
    if (norm1 === norm2) return true
    
    // Calcul de similarité simple basé sur les mots communs
    const words1 = norm1.split(/\s+/)
    const words2 = norm2.split(/\s+/)
    
    const commonWords = words1.filter(w => words2.includes(w))
    const similarity = commonWords.length / Math.max(words1.length, words2.length)
    
    return similarity >= threshold
  }
}

