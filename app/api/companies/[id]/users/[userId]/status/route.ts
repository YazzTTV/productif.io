import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { id: string; userId: string } }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return new Response("Non authentifié", { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return new Response("Non authentifié", { status: 401 });
    }

    const companyId = params.id;
    const userId = params.userId;

    // Vérifier que l'utilisateur connecté a accès à cette entreprise
    const userCompany = await prisma.companyUser.findFirst({
      where: {
        userId: decoded.userId,
        companyId,
      },
    });

    if (!userCompany) {
      return NextResponse.json(
        { message: "Accès non autorisé à cette entreprise" },
        { status: 403 }
      );
    }

    // Obtenir le statut de l'utilisateur dans l'entreprise
    const targetUserCompany = await prisma.companyUser.findFirst({
      where: {
        userId,
        companyId,
      },
    });

    if (!targetUserCompany) {
      return NextResponse.json(
        { message: "Utilisateur non trouvé dans cette entreprise" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: targetUserCompany.status,
      role: targetUserCompany.role,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération du statut:", error);
    return NextResponse.json(
      { message: "Erreur lors de la récupération du statut" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string; userId: string } }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return new Response("Non authentifié", { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return new Response("Non authentifié", { status: 401 });
    }

    const companyId = params.id;
    const userId = params.userId;
    const { status, role } = await request.json();

    // Vérifier que l'utilisateur connecté est admin de cette entreprise
    const userCompany = await prisma.companyUser.findFirst({
      where: {
        userId: decoded.userId,
        companyId,
        role: "ADMIN",
      },
    });

    if (!userCompany) {
      return NextResponse.json(
        { message: "Permission insuffisante" },
        { status: 403 }
      );
    }

    // Mettre à jour le statut de l'utilisateur
    const updatedUserCompany = await prisma.companyUser.update({
      where: {
        userId_companyId: {
          userId,
          companyId,
        },
      },
      data: {
        status: status,
        role: role,
      },
    });

    return NextResponse.json(updatedUserCompany);
  } catch (error) {
    console.error("Erreur lors de la mise à jour du statut:", error);
    return NextResponse.json(
      { message: "Erreur lors de la mise à jour du statut" },
      { status: 500 }
    );
  }
} 