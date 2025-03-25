import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { deleteSession, removeAuthCookie } from "@/lib/auth"

export async function POST() {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get("auth_token")?.value

    if (token) {
      await deleteSession(token)
    }

    const response = NextResponse.json({ success: true })
    removeAuthCookie(response)

    return response
  } catch (error) {
    console.error("Erreur lors de la déconnexion:", error)
    return NextResponse.json({ error: "Erreur lors de la déconnexion" }, { status: 500 })
  }
}

