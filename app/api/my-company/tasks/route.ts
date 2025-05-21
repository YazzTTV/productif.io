import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    // Récupérer l'entreprise de l'utilisateur
    const userCompany = await prisma.userCompany.findFirst({
      where: { userId: user.id }
    })

    if (!userCompany) {
      return NextResponse.json({ 
        error: "Vous n'êtes pas associé à une entreprise" 
      }, { status: 404 })
    }
    
    // Récupérer les utilisateurs de l'entreprise
    const companyUsers = await prisma.userCompany.findMany({
      where: { 
        companyId: userCompany.companyId,
        isActive: true
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })
    
    const userIds = companyUsers.map(cu => cu.user.id)
    const userMap = new Map(companyUsers.map(cu => [
      cu.user.id, 
      { name: cu.user.name, email: cu.user.email }
    ]))
    
    if (userIds.length > 0) {
      // Récupérer les tâches pour tous les utilisateurs de l'entreprise
      const tasks = await prisma.task.findMany({
        where: {
          userId: { in: userIds }
        },
        orderBy: [
          { order: 'desc' }
        ],
        include: {
          project: {
            select: {
              id: true,
              name: true,
              color: true
            }
          }
        }
      })
      
      // Ajouter les informations de l'utilisateur à chaque tâche
      const tasksWithUserInfo = tasks.map(task => {
        const userInfo = userMap.get(task.userId)
        return {
          ...task,
          userName: userInfo ? userInfo.name : null,
          userEmail: userInfo ? userInfo.email : 'Inconnu'
        }
      })
      
      return NextResponse.json({ 
        tasks: tasksWithUserInfo,
        company: {
          id: userCompany.companyId
        }
      })
    }
    
    return NextResponse.json({ 
      tasks: [],
      company: {
        id: userCompany.companyId
      }
    })
  } catch (error) {
    console.error("[MY_COMPANY_TASKS_GET]", error)
    return NextResponse.json({ error: "Erreur lors du chargement des tâches" }, { status: 500 })
  }
} 