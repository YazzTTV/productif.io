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
    console.log("[FORCE_CLEANUP] Token décodé:", JSON.stringify(decoded))
    
    // Tenter de récupérer l'ID utilisateur de différentes façons
    const userId = typeof decoded === 'object' ? (
      (decoded as any).userId || // Format standard de notre JWT
      (decoded as any).id ||     // Format alternatif
      (decoded as any).sub       // Format standard JWT
    ) : null;
    
    if (!userId) {
      console.error("[FORCE_CLEANUP] ID utilisateur non trouvé dans le token:", JSON.stringify(decoded))
      return null
    }
    
    return { id: userId }
  } catch (error) {
    console.error("[FORCE_CLEANUP] Erreur lors de la vérification du token:", error)
    return null
  }
}

// GET /api/debug/projects/force-cleanup - Forcer le nettoyage des projets
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
      },
      orderBy: {
        createdAt: 'desc' // Ordre de création pour trouver les plus récents
      }
    })

    // 2. Garder uniquement les 3 projets les plus récents (ou ceux avec des tâches)
    // Ces projets seront préservés
    const projectsToKeep = allProjects
      .filter(p => p._count.tasks > 0 || p.name === "MOMA" || p.name === "Saas" || p.name === "productif.io")
      .slice(0, 10); // Limiter à 10 projets maximum (par précaution)

    const projectIdsToKeep = projectsToKeep.map(p => p.id);
    
    // 3. Identifier les projets à supprimer (tous les autres)
    const projectsToDelete = allProjects.filter(p => !projectIdsToKeep.includes(p.id));
    const projectIdsToDelete = projectsToDelete.map(p => p.id);

    // 4. Option pour confirmer la suppression
    const shouldDelete = request.url.includes('confirm=true')
    let deletedCount = 0;

    if (shouldDelete && projectIdsToDelete.length > 0) {
      const deleteResult = await prisma.project.deleteMany({
        where: {
          id: { in: projectIdsToDelete },
        }
      })
      deletedCount = deleteResult.count
    }

    return NextResponse.json({
      total: allProjects.length,
      toKeep: {
        count: projectsToKeep.length,
        names: projectsToKeep.map(p => p.name)
      },
      toDelete: {
        count: projectsToDelete.length,
        names: projectsToDelete.map(p => p.name)
      },
      deleted: shouldDelete ? deletedCount : 0,
      message: shouldDelete 
        ? `${deletedCount} projets supprimés avec succès` 
        : `Pour confirmer la suppression de ${projectsToDelete.length} projets, ajoutez "?confirm=true" à l'URL`
    })
  } catch (error) {
    console.error("Erreur lors du nettoyage forcé des projets:", error)
    return NextResponse.json({ error: "Erreur lors du nettoyage des projets" }, { status: 500 })
  }
} 