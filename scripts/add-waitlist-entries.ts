import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const entries = [
  {
    email: "contact@simplement.me",
    phone: "33603254616",
    motivation: "Je tracks déjà beaucoup mon planning + utilise le timings boxing je veux tester l'IA",
    currentStep: 2,
    status: "paye"
  },
  {
    email: "davidlund5@gmail.com",
    phone: "33783181942",
    motivation: "Je veux être plus productif",
    currentStep: 2,
    status: "paye"
  },
  {
    email: "s.djebali@outlook.fr",
    phone: "767057527",
    motivation: "Optimiser mon temps",
    currentStep: 2,
    status: "paye"
  },
  {
    email: "maxime@lcns.agency.com",
    phone: "33628343238",
    motivation: "Gestion de todo/projet par agent IA",
    currentStep: 2,
    status: "paye"
  },
  {
    email: "benazzouzkhalil@gmail.com",
    phone: "32468679970",
    motivation: "Je suis productif",
    currentStep: 2,
    status: "paye"
  },
  {
    email: "tetralabmanage@gmail.com",
    phone: "33769694349",
    motivation: "Besoin d'une organisation plus minimaliste",
    currentStep: 2,
    status: "paye"
  },
  {
    email: "thibautfortorio@gmail.com",
    phone: "33769292618",
    motivation: "Besoin de max",
    currentStep: 2,
    status: "paye"
  }
]

async function main() {
  console.log("🚀 Début de la mise à jour des entrées waitlist...")

  for (const entry of entries) {
    try {
      await prisma.waitlistEntry.upsert({
        where: { email: entry.email },
        update: {
          ...entry,
          updatedAt: new Date()
        },
        create: {
          ...entry,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })

      console.log(`✅ Mis à jour/Ajouté: ${entry.email}`)
    } catch (error) {
      console.error(`❌ Erreur pour ${entry.email}:`, error)
    }
  }

  console.log("✨ Terminé!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 