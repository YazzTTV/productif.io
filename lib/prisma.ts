import { PrismaClient } from '@prisma/client'

// PrismaClient est attaché au scope global en développement pour éviter
// d'épuiser les connexions à la base de données pendant le hot-reloading
const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma || new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

