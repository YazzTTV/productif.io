/**
 * Script de test pour l'API /api/dashboard/deepwork-stats
 * 
 * Usage:
 *   node scripts/test-deepwork-stats-api.js [--url=<url>] [--email=<email>] [--password=<password>] [--token=<jwt_token>]
 * 
 * Exemples:
 *   node scripts/test-deepwork-stats-api.js
 *   node scripts/test-deepwork-stats-api.js --url=https://productif.io
 *   node scripts/test-deepwork-stats-api.js --url=http://localhost:3000 --email=admin@productif.io --password=admin123
 *   node scripts/test-deepwork-stats-api.js --url=https://productif.io --token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 */

// Configuration par défaut
const DEFAULT_CONFIG = {
  url: process.env.API_URL || 'https://productif.io',
  email: process.env.TEST_EMAIL || 'admin@productif.io',
  password: process.env.TEST_PASSWORD || 'admin123',
  token: process.env.TEST_TOKEN || null
}

// Parser les arguments de ligne de commande
function parseArgs() {
  const args = process.argv.slice(2)
  const config = { ...DEFAULT_CONFIG }
  
  args.forEach(arg => {
    if (arg.startsWith('--url=')) {
      config.url = arg.split('=')[1]
    } else if (arg.startsWith('--email=')) {
      config.email = arg.split('=')[1]
    } else if (arg.startsWith('--password=')) {
      config.password = arg.split('=')[1]
    } else if (arg.startsWith('--token=')) {
      config.token = arg.split('=')[1]
    }
  })
  
  return config
}

// Fonction pour formater les durées
function formatDuration(seconds) {
  if (!seconds || seconds === 0) return '0m'
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

// Fonction pour formater les heures
function formatHours(hours) {
  if (!hours || hours === 0) return '0h'
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  if (m > 0) {
    return `${h}h ${m}m`
  }
  return `${h}h`
}

// Fonction principale de test
async function testDeepWorkStatsAPI(config) {
  console.log('🧪 === TEST API DEEP WORK STATS ===\n')
  console.log(`📍 URL: ${config.url}`)
  
  let authCookie = null

  try {
    // Si un token est fourni, l'utiliser directement
    if (config.token) {
      console.log(`🔑 Utilisation du token JWT fourni\n`)
      console.log('─'.repeat(60))
      authCookie = `auth_token=${config.token}`
      console.log(`🍪 Token: ${config.token.substring(0, 50)}...`)
    } else {
      // Sinon, se connecter avec email/password
      console.log(`👤 Email: ${config.email}\n`)
      console.log('─'.repeat(60))
      
      // Étape 1: Connexion pour obtenir le cookie d'authentification
      console.log('\n🔐 ÉTAPE 1: Connexion...')
      const loginResponse = await fetch(`${config.url}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: config.email,
          password: config.password
        })
      })

      if (!loginResponse.ok) {
        const errorText = await loginResponse.text()
        throw new Error(`❌ Échec de la connexion: ${loginResponse.status} - ${errorText}`)
      }

      // Extraire le cookie d'authentification
      const setCookieHeader = loginResponse.headers.get('set-cookie')
      
      if (setCookieHeader) {
        // Les cookies peuvent être séparés par des virgules ou des points-virgules
        // Essayer d'abord de trouver auth_token directement
        const cookieMatch = setCookieHeader.match(/auth_token=([^;,\s]+)/)
        if (cookieMatch) {
          authCookie = `auth_token=${cookieMatch[1]}`
        } else {
          // Méthode alternative: split par virgule puis chercher
          const cookies = setCookieHeader.split(',').map(c => c.trim())
          for (const cookie of cookies) {
            if (cookie.startsWith('auth_token=')) {
              authCookie = cookie.split(';')[0]
              break
            }
          }
        }
      }

      if (!authCookie) {
        // Dernière tentative: chercher dans toute la chaîne
        const allCookies = loginResponse.headers.get('set-cookie') || ''
        const match = allCookies.match(/auth_token=([^;,\s]+)/)
        if (match) {
          authCookie = `auth_token=${match[1]}`
        }
      }

      if (!authCookie) {
        console.error('❌ Headers reçus:', Object.fromEntries(loginResponse.headers.entries()))
        throw new Error('❌ Impossible de récupérer le cookie d\'authentification')
      }

      console.log('✅ Connexion réussie')
      console.log(`🍪 Cookie: ${authCookie.substring(0, 50)}...`)
    }

    // Tester l'API deepwork-stats
    if (!config.token) {
      console.log('\n📊 ÉTAPE 2: Test de l\'API /api/dashboard/deepwork-stats...')
    } else {
      console.log('\n📊 Test de l\'API /api/dashboard/deepwork-stats...')
    }
    
    // Préparer les headers - utiliser Authorization Bearer si c'est un token API
    const headers = {
      'Content-Type': 'application/json'
    }
    
    if (config.token) {
      // Si c'est un token fourni directement, utiliser Authorization Bearer
      headers['Authorization'] = `Bearer ${config.token}`
    } else {
      // Sinon, utiliser le cookie
      headers['Cookie'] = authCookie
    }
    
    const statsResponse = await fetch(`${config.url}/api/dashboard/deepwork-stats`, {
      method: 'GET',
      headers
    })

    console.log(`📡 Status: ${statsResponse.status} ${statsResponse.statusText}`)

    // Vérifier le Content-Type
    const contentType = statsResponse.headers.get('content-type') || ''
    console.log(`📄 Content-Type: ${contentType}`)

    if (!statsResponse.ok) {
      const errorText = await statsResponse.text()
      throw new Error(`❌ Erreur API: ${statsResponse.status} - ${errorText}`)
    }

    // Vérifier que la réponse est bien du JSON
    if (!contentType.includes('application/json')) {
      const responseText = await statsResponse.text()
      console.error('❌ La réponse n\'est pas du JSON:')
      console.error(responseText.substring(0, 500))
      throw new Error(`❌ Réponse non-JSON reçue (Content-Type: ${contentType})`)
    }

    const stats = await statsResponse.json()
    
    console.log('✅ Réponse reçue avec succès\n')
    console.log('─'.repeat(60))
    console.log('\n📈 STATISTIQUES DEEP WORK:\n')
    
    // Afficher les statistiques de manière formatée
    console.log('📅 AUJOURD\'HUI:')
    console.log(`   • Heures: ${stats.today.hours.toFixed(2)}h (${formatHours(stats.today.hours)})`)
    console.log(`   • Secondes: ${stats.today.seconds}s`)
    
    console.log('\n📆 7 DERNIERS JOURS:')
    console.log(`   • Heures: ${stats.week.hours.toFixed(2)}h (${formatHours(stats.week.hours)})`)
    console.log(`   • Secondes: ${stats.week.seconds}s`)
    
    console.log('\n⏱️  TOUT TEMPS:')
    console.log(`   • Heures: ${stats.allTime.hours.toFixed(2)}h (${formatHours(stats.allTime.hours)})`)
    console.log(`   • Secondes: ${stats.allTime.seconds}s`)
    
    console.log('\n🏆 MEILLEURE SESSION:')
    console.log(`   • Durée: ${stats.bestSession}`)
    console.log(`   • Secondes: ${stats.bestSessionSeconds}s`)
    
    console.log('\n─'.repeat(60))
    console.log('\n📋 RÉPONSE JSON COMPLÈTE:')
    console.log(JSON.stringify(stats, null, 2))
    
    console.log('\n─'.repeat(60))
    console.log('✅ TEST RÉUSSI!\n')
    
    return { success: true, stats }

  } catch (error) {
    console.error('\n❌ ERREUR:', error.message)
    console.error('\n─'.repeat(60))
    console.log('💡 Vérifiez que:')
    console.log('   • L\'URL est correcte et accessible')
    console.log('   • Les identifiants sont valides')
    console.log('   • L\'API est déployée et fonctionnelle')
    console.log('   • La base de données est accessible\n')
    return { success: false, error: error.message }
  }
}

// Exécution du script
const config = parseArgs()
testDeepWorkStatsAPI(config)
  .then(result => {
    process.exit(result.success ? 0 : 1)
  })
  .catch(error => {
    console.error('❌ Erreur fatale:', error)
    process.exit(1)
  })

