import { Metadata } from "next"
import { cookies } from "next/headers"
import { verifyToken } from "@/lib/auth"
import { redirect } from "next/navigation"
import { TimePageClient } from "@/components/time/time-page-client"

export const metadata: Metadata = {
  title: "Time Tracking",
  description: "Suivez votre temps de travail",
}

export default async function TimePage({
  searchParams,
}: {
  searchParams: { taskId?: string; title?: string }
}) {
  const cookieStore = await cookies()
  const token = cookieStore.get("auth_token")?.value

  if (!token) {
    redirect("/login")
  }

  const decoded = await verifyToken(token)
  if (!decoded) {
    redirect("/login")
  }

  return <TimePageClient taskId={searchParams.taskId} taskTitle={searchParams.title} />
}

