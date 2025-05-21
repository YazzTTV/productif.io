import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verify } from "jsonwebtoken"
import { prisma } from "@/lib/prisma"

// Fonction utilitaire pour vérifier l'authentification
async function getAuthUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get("auth_token")?.value

  if (!token) {
    return null
  }

  try {
    const decoded = verify(token, process.env.JWT_SECRET || "fallback_secret")
    console.log("[PROJECTS_CLEANUP] Token décodé:", JSON.stringify(decoded))
    
    // Tenter de récupérer l'ID utilisateur de différentes façons
    const userId = typeof decoded === 'object' ? (
      (decoded as any).userId || // Format standard de notre JWT
      (decoded as any).id ||     // Format alternatif 
      (decoded as any).sub       // Format standard JWT
    ) : null;
    
    if (!userId) {
      console.error("[PROJECTS_CLEANUP] ID utilisateur non trouvé dans le token:", JSON.stringify(decoded))
      return null
    }
    
    return { id: userId }
  } catch (error) {
    console.error("[PROJECTS_CLEANUP] Erreur lors de la vérification du token:", error)
    return null
  }
}

// GET /api/debug/projects/cleanup - Identifier et supprimer les projets fantômes
export async function GET(request: Request) {
  try {
    const user = await getAuthUser()

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    // 1. Récupérer tous les projets de l'utilisateur
    const allProjects = await prisma.project.findMany({
      where: {
        userId: user.id,
      },
      include: {
        _count: {
          select: {
            tasks: true,
          }
        }
      }
    })

    // 2. Identifier les projets visibles dans l'interface
    // Ce sont généralement les projets qui ont été créés récemment ou qui ont des tâches
    const projectsWithTasks = allProjects.filter(p => p._count.tasks > 0)
    const orphanProjects = allProjects.filter(p => p._count.tasks === 0)

    // 3. Liste les projets orphelins
    const orphanProjectNames = orphanProjects.map(p => p.name)
    const orphanProjectIds = orphanProjects.map(p => p.id)

    // 4. Option pour supprimer les projets orphelins
    const shouldDelete = request.url.includes('delete=true')
    let deletedCount = 0

    if (shouldDelete && orphanProjectIds.length > 0) {
      const deleteResult = await prisma.project.deleteMany({
        where: {
          id: { in: orphanProjectIds },
          // Double vérification pour ne pas supprimer des projets avec des tâches
          NOT: {
            tasks: {
              some: {}
            }
          }
        }
      })
      deletedCount = deleteResult.count
    }

    return NextResponse.json({
      total: allProjects.length,
      withTasks: projectsWithTasks.length,
      orphans: orphanProjects.length,
      orphanNames: orphanProjectNames,
      deleted: shouldDelete ? deletedCount : 0,
      message: shouldDelete 
        ? `${deletedCount} projets orphelins supprimés` 
        : `Ajoutez "?delete=true" à l'URL pour supprimer ${orphanProjects.length} projets orphelins`
    })
  } catch (error) {
    console.error("Erreur lors du nettoyage des projets:", error)
    return NextResponse.json({ error: "Erreur lors du nettoyage des projets" }, { status: 500 })
  }
} 