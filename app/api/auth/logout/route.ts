import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { deleteSession, removeAuthCookie } from "@/lib/auth"

async function performLogout() {
  const cookieStore = await cookies()
  const token = cookieStore.get("auth_token")?.value

  if (token) {
    await deleteSession(token)
  }

  const response = NextResponse.json({ success: true })
  removeAuthCookie(response)
  return response
}

export async function POST() {
  try {
    return await performLogout()
  } catch (error) {
    console.error("Erreur lors de la déconnexion:", error)
    return NextResponse.json({ error: "Erreur lors de la déconnexion" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value

    if (token) {
      await deleteSession(token)
    }

    const response = NextResponse.redirect(new URL("/", request.url))
    removeAuthCookie(response)
    return response
  } catch (error) {
    console.error("Erreur lors de la déconnexion:", error)
    return NextResponse.redirect(new URL("/login", request.url))
  }
}
