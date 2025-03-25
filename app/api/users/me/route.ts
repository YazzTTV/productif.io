import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function DELETE(req: Request) {
  try {
    // Vérifier l'authentification
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json(
        { error: "Vous devez être connecté pour accéder à cette ressource" },
        { status: 401 }
      )
    }

    // Pour des raisons de sécurité, demander une confirmation
    const { confirmation } = await req.json()
    if (confirmation !== "SUPPRIMER") {
      return NextResponse.json(
        { error: "La confirmation de suppression est incorrecte" },
        { status: 400 }
      )
    }

    // Vérifier si l'utilisateur est administrateur en utilisant une requête SQL brute
    // pour éviter les problèmes avec les types TypeScript
    const isAdmin = await prisma.$queryRaw`
      SELECT EXISTS(
        SELECT 1 FROM "User" 
        WHERE id = ${user.id} 
        AND "managedCompanyId" IS NOT NULL
      ) as "isAdmin"
    `

    if (isAdmin && Array.isArray(isAdmin) && isAdmin.length > 0 && isAdmin[0].isAdmin) {
      return NextResponse.json(
        { 
          error: "Vous êtes administrateur d'une entreprise. Veuillez transférer votre rôle à un autre utilisateur avant de supprimer votre compte." 
        },
        { status: 403 }
      )
    }

    // Supprimer l'utilisateur - les relations en cascade seront supprimées automatiquement
    await prisma.user.delete({
      where: { id: user.id }
    })

    return NextResponse.json({ 
      success: true,
      message: "Votre compte a été supprimé avec succès" 
    })
    
  } catch (error) {
    console.error("Erreur lors de la suppression du compte:", error)
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la suppression de votre compte." },
      { status: 500 }
    )
  }
} 