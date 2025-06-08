import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    // Récupérer tous les leads de la waitlist
    const leads = await prisma.waitlistLead.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10 // Limiter à 10 pour éviter trop de données
    })

    // Compter par statut
    const stats = await prisma.waitlistLead.groupBy({
      by: ['status'],
      _count: {
        id: true
      }
    })

    return NextResponse.json({
      success: true,
      totalLeads: leads.length,
      leads: leads.map(lead => ({
        id: lead.id,
        email: lead.email,
        phone: lead.phone || 'Non renseigné',
        reason: lead.reason ? lead.reason.substring(0, 100) + '...' : 'Non renseigné',
        status: lead.status,
        stripeSessionId: lead.stripeSessionId || 'Aucune',
        amountPaid: lead.amountPaid || 0,
        ipAddress: lead.ipAddress || 'Inconnue',
        createdAt: lead.createdAt,
        emailCapturedAt: lead.emailCapturedAt,
        phoneAddedAt: lead.phoneAddedAt,
        paidAt: lead.paidAt,
        completedAt: lead.completedAt
      })),
      statistics: stats.reduce((acc, stat) => {
        acc[stat.status] = stat._count.id
        return acc
      }, {} as Record<string, number>)
    })

  } catch (error) {
    console.error('Erreur lors de la récupération des leads:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
} 