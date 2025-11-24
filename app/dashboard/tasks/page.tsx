import { redirect } from "next/navigation"
import { getAuthUser } from "@/lib/auth"
import { NewTasksPage } from "@/components/tasks/new-tasks-page"

export const dynamic = 'force-dynamic'

export default async function TasksPage() {
  const user = await getAuthUser()
  
  if (!user) {
    redirect("/login")
  }

  return <NewTasksPage />
}

