import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { deleteSession, removeAuthCookie } from "@/lib/auth"

async function performLogout(req: NextRequest) {
  const cookieStore = await cookies()
  // Le web envoie le jeton en cookie, le mobile dans l'en-tete Authorization.
  // Sans ce second cas, une deconnexion depuis l'app ne fermait jamais la
  // session cote serveur (26 septembre).
  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || undefined
  const token = cookieStore.get("auth_token")?.value || bearer

  if (token) {
    await deleteSession(token)
  }

  const response = NextResponse.json({ success: true })
  removeAuthCookie(response)
  return response
}

export async function POST(req: NextRequest) {
  try {
    return await performLogout(req)
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
