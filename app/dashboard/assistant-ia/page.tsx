import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth'
import { AIAgentConductor } from '@/components/ai/ai-agent-conductor'

export const dynamic = 'force-dynamic'

export default async function AssistantIAPage() {
  const user = await getAuthUser()

  if (!user) {
    redirect("/login")
  }

  // Récupérer le nom de l'utilisateur
  let userName = "Student"
  if (user.name) {
    userName = user.name.split(' ')[0] || user.name
  } else if (user.email) {
    userName = user.email.split('@')[0]
  }

  return <AIAgentConductor userName={userName} />
}
