import { getAuthUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { SettingsForm } from "@/components/settings/settings-form"
import { redirect } from "next/navigation"

export default async function SettingsPage() {
  const user = await getAuthUser()
  
  if (!user) {
    redirect("/login")
  }

  // Récupérer les informations de l'utilisateur
  const userInfo = await prisma.user.findUnique({
    where: {
      id: user.id,
    },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
    },
  })

  if (!userInfo) {
    redirect("/login")
  }

  return <SettingsForm user={userInfo} />
} 