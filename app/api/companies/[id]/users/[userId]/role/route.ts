import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { isUserAdmin } from "@/lib/admin-utils"
import { prisma } from "@/lib/prisma"

export async function PUT(
  request: Request,
  { params }: { params: { id: string; userId: string } }
) {
  try {
    console.log("Début de la mise à jour du rôle - Params:", params)
    const companyId = params.id
    const userId = params.userId

    if (!companyId || !userId) {
      console.log("Identifiants manquants:", { companyId, userId })
      return NextResponse.json(
        { error: "Identifiants manquants" },
        { status: 400 }
      )
    }

    // Récupérer le body de la requête
    const body = await request.json()
    const { isAdmin } = body
    console.log("Body reçu:", body)

    if (isAdmin === undefined) {
      console.log("Le statut d'administrateur est manquant dans le body")
      return NextResponse.json(
        { error: "Le statut d'administrateur est requis" },
        { status: 400 }
      )
    }

    // Vérifier l'authentification
    const currentUser = await getAuthUser()
    if (!currentUser) {
      console.log("Utilisateur non authentifié")
      return NextResponse.json(
        { error: "Vous devez être connecté pour accéder à cette ressource" },
        { status: 401 }
      )
    }

    // Vérifier les droits d'administrateur global
    const isSuperAdmin = await isUserAdmin(currentUser.id, true)
    console.log("Vérification des droits d'administrateur:", { isSuperAdmin, currentUserId: currentUser.id })
    
    if (!isSuperAdmin) {
      return NextResponse.json(
        { error: "Vous n'avez pas les droits pour modifier les rôles d'entreprise" },
        { status: 403 }
      )
    }

    try {
      // Vérifier que l'entreprise existe
      const company = await prisma.company.findUnique({
        where: { id: companyId }
      })
      
      if (!company) {
        return NextResponse.json(
          { error: "Entreprise non trouvée" },
          { status: 404 }
        )
      }

      // Vérifier que l'utilisateur existe et récupérer son rôle actuel
      const user = await prisma.user.findUnique({
        where: { id: userId }
      })
      
      if (!user) {
        return NextResponse.json(
          { error: "Utilisateur non trouvé" },
          { status: 404 }
        )
      }

      // Vérifier que l'utilisateur appartient à l'entreprise
      const userCompany = await prisma.userCompany.findFirst({
        where: {
          userId: userId,
          companyId: companyId
        }
      })
      
      if (!userCompany) {
        return NextResponse.json(
          { error: "L'utilisateur n'est pas membre de cette entreprise" },
          { status: 404 }
        )
      }

      console.log("Mise à jour du rôle de l'utilisateur:", { 
        userId, 
        companyId, 
        isAdmin,
        currentRole: user.role
      })

      if (isAdmin) {
        // Si on le rend admin, on met à jour uniquement managedCompanyId
        await prisma.user.update({
          where: { id: userId },
          data: {
            managedCompanyId: companyId,
            updatedAt: new Date()
          }
        })
        
        // S'assurer que l'utilisateur est bien lié à l'entreprise
        await prisma.userCompany.upsert({
          where: {
            userId_companyId: {
              userId: userId,
              companyId: companyId
            }
          },
          create: {
            userId: userId,
            companyId: companyId,
            isActive: true
          },
          update: {
            isActive: true
          }
        })

        console.log("L'utilisateur a été défini comme administrateur de l'entreprise")
      } else {
        // Si on retire le rôle d'admin, on retire managedCompanyId
        await prisma.user.update({
          where: { id: userId },
          data: {
            managedCompanyId: null,
            updatedAt: new Date()
          }
        })

        console.log("Le rôle d'administrateur de l'entreprise a été retiré")
      }

      // Vérifier la mise à jour
      const updatedUser = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          role: true,
          managedCompanyId: true,
          companies: {
            where: {
              companyId: companyId
            },
            select: {
              isActive: true
            }
          }
        }
      })
      console.log("État final de l'utilisateur:", updatedUser)

      return NextResponse.json({ 
        success: true,
        message: `L'utilisateur est maintenant ${isAdmin ? 'administrateur' : 'membre standard'} de l'entreprise` 
      })
    } catch (dbError) {
      console.error("Erreur lors des opérations de base de données:", dbError)
      throw dbError
    }
    
  } catch (error) {
    console.error("Erreur lors de la modification du rôle de l'utilisateur:", error)
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la modification du rôle de l'utilisateur" },
      { status: 500 }
    )
  }
} 