import { TextNormalizer } from './TextNormalizer'
import { COMMAND_VARIATIONS, CommandVariation } from './CommandVariations'

export interface MatchResult {
  matches: boolean
  confidence: number
  matchedVariation?: string
  matchedKeywords?: string[]
}

/**
 * Service de matching flexible pour comprendre les commandes
 * même avec des variations, fautes d'orthographe, etc.
 */
export class FlexibleMatcher {
  /**
   * Vérifie si un message correspond à une commande avec tolérance aux erreurs
   */
  static matchesCommand(
    message: string,
    commandKey: keyof typeof COMMAND_VARIATIONS
  ): MatchResult {
    const normalized = TextNormalizer.normalize(message)
    const command = COMMAND_VARIATIONS[commandKey]

    if (!command) {
      return { matches: false, confidence: 0 }
    }

    // 1. Vérifier les variations exactes avec similarité
    let bestMatch: { confidence: number; variation?: string } = { confidence: 0 }

    for (const variation of command.variations) {
      const similarity = this.calculateSimilarity(normalized, variation)
      if (similarity > bestMatch.confidence) {
        bestMatch = { confidence: similarity, variation }
      }
    }

    // Si on a une bonne correspondance avec une variation, on retourne
    if (bestMatch.confidence >= command.minConfidence) {
      return {
        matches: true,
        confidence: bestMatch.confidence,
        matchedVariation: bestMatch.variation
      }
    }

    // 2. Vérifier par mots-clés primaires et contexte
    const matchedPrimaryKeywords = command.primaryKeywords.filter(kw =>
      normalized.includes(kw)
    )
    const matchedContextKeywords = command.contextKeywords.filter(kw =>
      normalized.includes(kw)
    )

    // Si on a au moins un mot-clé primaire ET un mot-clé de contexte
    if (matchedPrimaryKeywords.length > 0 && matchedContextKeywords.length > 0) {
      const keywordConfidence = this.calculateKeywordConfidence(
        matchedPrimaryKeywords,
        matchedContextKeywords,
        command
      )
      
      if (keywordConfidence >= command.minConfidence) {
        return {
          matches: true,
          confidence: keywordConfidence,
          matchedKeywords: [...matchedPrimaryKeywords, ...matchedContextKeywords]
        }
      }
    }

    // 3. Vérifier avec matching partiel (si au moins 2 mots-clés primaires)
    if (matchedPrimaryKeywords.length >= 2) {
      const partialConfidence = 0.6 + (matchedPrimaryKeywords.length * 0.1)
      if (partialConfidence >= command.minConfidence) {
        return {
          matches: true,
          confidence: partialConfidence,
          matchedKeywords: matchedPrimaryKeywords
        }
      }
    }

    // 4. Vérifier avec matching très flexible (si beaucoup de mots-clés)
    const totalMatched = matchedPrimaryKeywords.length + matchedContextKeywords.length
    if (totalMatched >= 3) {
      return {
        matches: true,
        confidence: 0.65,
        matchedKeywords: [...matchedPrimaryKeywords, ...matchedContextKeywords]
      }
    }

    return { matches: false, confidence: 0 }
  }

  /**
   * Calcule la confiance basée sur les mots-clés trouvés
   */
  private static calculateKeywordConfidence(
    primaryKeywords: string[],
    contextKeywords: string[],
    command: CommandVariation
  ): number {
    const primaryWeight = 0.6
    const contextWeight = 0.4

    const primaryScore = Math.min(primaryKeywords.length / command.primaryKeywords.length, 1)
    const contextScore = Math.min(contextKeywords.length / command.contextKeywords.length, 1)

    return (primaryScore * primaryWeight) + (contextScore * contextWeight)
  }

  /**
   * Calcule la similarité entre deux chaînes (algorithme de Levenshtein)
   */
  private static calculateSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1.0

    const longer = str1.length > str2.length ? str1 : str2
    const shorter = str1.length > str2.length ? str2 : str1

    if (longer.length === 0) return 1.0

    const distance = this.levenshteinDistance(longer, shorter)
    const similarity = (longer.length - distance) / longer.length

    // Bonus si les mots principaux sont présents
    const words1 = str1.split(/\s+/)
    const words2 = str2.split(/\s+/)
    const commonWords = words1.filter(w => words2.includes(w))
    const wordSimilarity = commonWords.length / Math.max(words1.length, words2.length)

    // Combiner la similarité de caractères et de mots
    return (similarity * 0.6) + (wordSimilarity * 0.4)
  }

  /**
   * Calcule la distance de Levenshtein entre deux chaînes
   */
  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = []

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i]
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          )
        }
      }
    }

    return matrix[str2.length][str1.length]
  }

  /**
   * Trouve la meilleure correspondance parmi plusieurs commandes
   */
  static findBestMatch(
    message: string,
    commandKeys: (keyof typeof COMMAND_VARIATIONS)[]
  ): { command: keyof typeof COMMAND_VARIATIONS; result: MatchResult } | null {
    let bestMatch: {
      command: keyof typeof COMMAND_VARIATIONS
      result: MatchResult
    } | null = null

    for (const commandKey of commandKeys) {
      const result = this.matchesCommand(message, commandKey)
      if (result.matches) {
        if (!bestMatch || result.confidence > bestMatch.result.confidence) {
          bestMatch = { command: commandKey, result }
        }
      }
    }

    return bestMatch
  }
}

