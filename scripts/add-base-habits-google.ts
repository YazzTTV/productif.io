import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Fonction simple pour inférer la catégorie d'une habitude
function inferHabitCategory(name: string, description?: string | null): string {
  const text = `${name || ""} ${description || ""}`.toLowerCase()
  
  // Anti-habitudes
  if (
    /\b(no|ne pas|sans|stop|arrêter|éviter)\b/.test(text) ||
    text.includes("réseaux sociaux") ||
    text.includes("junk food") ||
    text.includes("alcool") ||
    text.includes("porn") ||
    text.includes("scrolling")
  ) {
    return "ANTI"
  }
  
  // Soir / récupération / sommeil
  if (
    text.includes("sommeil") ||
    text.includes("dormir") ||
    text.includes("coucher") ||
    text.includes("écran") ||
    text.includes("écrans") ||
    text.includes("déconnexion") ||
    text.includes("routine du soir") ||
    text.includes("préparer demain") ||
    text.includes("journal du soir") ||
    text.includes("éteindre") ||
    text.includes("screens off")
  ) {
    return "EVENING"
  }
  
  // Matin / démarrage / clarté
  if (
    text.includes("réveil") ||
    text.includes("lever") ||
    text.includes("routine du matin") ||
    text.includes("planifier la journée") ||
    text.includes("plan my day") ||
    text.includes("clarifier") ||
    text.includes("intention") ||
    text.includes("gratitude matin") ||
    text.includes("hydratation") ||
    text.includes("eau au réveil") ||
    text.includes("méditation")
  ) {
    return "MORNING"
  }
  
  // Par défaut : exécution / journée
  return "DAY"
}

// Habitudes de base à ajouter
const BASE_HABITS = [
  {
    name: "Apprentissage",
    description: "Notez ce que vous avez appris aujourd'hui",
    color: "#4338CA", // Indigo
    frequency: "daily",
    daysOfWeek: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
    order: 0,
  },
  {
    name: "Note de sa journée",
    description: "Évaluez votre journée sur 10 et expliquez pourquoi",
    color: "#0EA5E9", // Sky
    frequency: "daily",
    daysOfWeek: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
    order: 1,
  },
]

async function addBaseHabitsForGoogle() {
  try {
    const email = 'google@google.com'
    
    console.log(`🔍 Recherche de l'utilisateur avec l'email: ${email}...`)
    
    // Rechercher l'utilisateur par email
    const user = await prisma.user.findUnique({
      where: {
        email: email,
      },
    })

    if (!user) {
      console.log(`❌ Utilisateur avec l'email "${email}" non trouvé`)
      return
    }

    console.log(`\n✅ Utilisateur trouvé: ${user.name} (${user.email})`)

    // Vérifier les habitudes existantes
    const existingHabits = await prisma.habit.findMany({
      where: {
        userId: user.id,
      },
    })

    console.log(`   Habitudes existantes: ${existingHabits.length}`)

    // Pour chaque habitude de base
    for (const habitData of BASE_HABITS) {
      // Vérifier si l'habitude existe déjà
      const existingHabit = existingHabits.find(
        h => h.name.toLowerCase() === habitData.name.toLowerCase()
      )

      if (existingHabit) {
        console.log(`   ⏭️  Habitude "${habitData.name}" existe déjà, ignorée`)
      } else {
        // Trouver l'ordre maximum actuel
        const maxOrderHabit = await prisma.habit.findFirst({
          where: { userId: user.id },
          orderBy: { order: 'desc' },
          select: { order: true },
        })

        const maxOrder = maxOrderHabit ? maxOrderHabit.order + 1 : habitData.order

        // Inférer la catégorie de l'habitude
        const inferredCategory = inferHabitCategory(habitData.name, habitData.description)

        // Créer l'habitude
        const habit = await prisma.habit.create({
          data: {
            ...habitData,
            userId: user.id,
            order: maxOrder,
            inferredCategory,
          },
        })

        console.log(`   ✅ Habitude "${habit.name}" créée (ordre: ${habit.order}, catégorie: ${inferredCategory})`)
      }
    }

    console.log('\n✅ Terminé!')
  } catch (error) {
    console.error('❌ Erreur:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

addBaseHabitsForGoogle()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })

