import { redirect } from "next/navigation"
import { getAuthUser } from "@/lib/auth"
import { TasksEnhanced } from "@/components/tasks/tasks-enhanced"

export const dynamic = 'force-dynamic'

export default async function TasksPage() {
  const user = await getAuthUser()
  
  if (!user) {
    redirect("/login")
  }

  return <TasksEnhanced />
}

