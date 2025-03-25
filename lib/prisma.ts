import { PrismaClient } from "@prisma/client"

// PrismaClient est attaché au scope global en développement pour éviter
// d'épuiser les connexions à la base de données pendant le hot-reloading
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["query"],
  })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

