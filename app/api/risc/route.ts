import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createRemoteJWKSet, jwtVerify, JWTPayload } from "jose"

// JWKS Google pour la vérification des tokens RISC
// On utilise les clés publiques Google standards (même clés que pour les ID Tokens)
const googleJWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/oauth2/v3/certs")
)

// Audiences attendues pour les événements RISC (client IDs OAuth séparés par des virgules)
const RISC_AUDIENCES = (process.env.GOOGLE_RISC_AUDIENCES || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean)

if (RISC_AUDIENCES.length === 0) {
  console.warn(
    "[RISC] GOOGLE_RISC_AUDIENCES n'est pas configuré. Les tokens RISC ne pourront pas être validés correctement."
  )
}

function extractSubject(payload: any): { sub?: string; email?: string } {
  const events = payload?.events
  if (!events || typeof events !== "object") return {}

  for (const eventPayload of Object.values(events) as any[]) {
    const subject = eventPayload?.subject
    if (!subject) continue

    // Cas le plus courant: iss-sub
    if (subject.subject_type === "iss-sub" && typeof subject.sub === "string") {
      return { sub: subject.sub }
    }

    // Cas: id_token_claims
    if (subject.subject_type === "id_token_claims") {
      const sub =
        typeof subject.sub === "string" ? subject.sub : undefined
      const email =
        typeof subject.email === "string" ? subject.email : undefined
      if (sub || email) return { sub, email }
    }

    // Fallback: sous-champs simples
    if (typeof subject.sub === "string") return { sub: subject.sub }
    if (typeof subject.email === "string") return { email: subject.email }
  }

  return {}
}

async function extractTokenFromRequest(req: Request): Promise<string | null> {
  const contentType = req.headers.get("content-type") || ""

  try {
    if (contentType.includes("application/json")) {
      const body = await req.json().catch(() => null)
      if (body && typeof body === "object") {
        // Google peut envoyer { token: "<jwt>" } ou un champ similaire
        if (typeof (body as any).token === "string") {
          return (body as any).token
        }
        if (typeof (body as any).id_token === "string") {
          return (body as any).id_token
        }
      }
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      const raw = await req.text()
      const params = new URLSearchParams(raw)
      const token = params.get("token") || params.get("id_token")
      if (token) return token
    } else {
      // Fallback : certains intégrateurs envoient directement le JWT dans le body brut
      const raw = await req.text()
      if (raw && raw.split(".").length === 3) {
        return raw.trim()
      }
    }
  } catch (error) {
    console.error("[RISC] Erreur lors de l'extraction du token:", error)
  }

  return null
}

export async function POST(req: Request) {
  try {
    const token = await extractTokenFromRequest(req)

    if (!token) {
      console.error("[RISC] Aucun token JWT trouvé dans la requête")
      return NextResponse.json(
        { error: "Missing RISC token" },
        { status: 400 }
      )
    }

    let payload: JWTPayload & {
      sub?: string
      email?: string
      events?: any
    }

    try {
      const { payload: verifiedPayload } = await jwtVerify(token, googleJWKS, {
        // Accepter les deux variantes d'issuer (avec et sans / final)
        issuer: [
          "https://accounts.google.com",
          "https://accounts.google.com/",
        ],
        // jose gère nativement aud sous forme de string ou array,
        // et compare contre cette liste d'audiences autorisées.
        audience: RISC_AUDIENCES.length > 0 ? RISC_AUDIENCES : undefined,
      })

      payload = verifiedPayload as any
    } catch (error: any) {
      if (
        typeof error?.message === "string" &&
        error.message.includes('unexpected "aud"')
      ) {
        try {
          const parts = token.split(".")
          if (parts.length === 3) {
            const decoded = JSON.parse(
              Buffer.from(parts[1], "base64").toString("utf8")
            )
            console.error(
              "[RISC] Échec de vérification du JWT RISC (aud inattendu):",
              decoded.aud
            )
          }
        } catch {
          // ignore decoding errors, we log le message brut
        }
      } else {
        console.error(
          "[RISC] Échec de vérification du JWT RISC:",
          error?.message
        )
      }

      return NextResponse.json(
        { error: "Invalid RISC token" },
        { status: 401 }
      )
    }

    const events = (payload as any).events
    const { sub, email: subjectEmail } = extractSubject(payload as any)
    const email =
      (subjectEmail || (payload as any).email)?.toLowerCase() || undefined
    const subject = sub

    console.log("[RISC] Événement reçu", {
      sub: subject,
      email,
      eventsType: events
        ? Object.keys(events)
        : undefined,
    })

    if (!subject && !email) {
      console.warn(
        "[RISC] Payload sans sub ni email, impossible de mapper l'utilisateur",
        payload
      )
      // On renvoie quand même 200 pour que Google ne spamme pas
      return NextResponse.json({ received: true }, { status: 200 })
    }

    // 1) Tenter de trouver l'utilisateur via googleSubject (mapping robuste)
    let user =
      subject &&
      (await prisma.user.findFirst({
        where: { googleSubject: subject },
      }))

    // 2) Fallback : lookup par email si disponible
    if (!user && email) {
      user = await prisma.user.findUnique({
        where: { email },
      })
    }

    if (!user) {
      console.warn(
        "[RISC] Utilisateur introuvable pour le sujet/email",
        subject,
        email
      )
      return NextResponse.json({ received: true }, { status: 200 })
    }

    // 3) Invalider toutes les sessions :
    //    - incrémenter tokenVersion (tous les JWT existants deviennent invalides)
    //    - supprimer les entrées Session existantes (pour traçabilité / nettoyage)
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: {
          tokenVersion: { increment: 1 },
        },
      }),
      prisma.session.deleteMany({
        where: { userId: user.id },
      }),
    ])

    console.log(
      "[RISC] Sessions révoquées pour l'utilisateur",
      user.id,
      "sub:",
      subject
    )

    // Toujours répondre 200 pour éviter les retries continus côté Google
    return NextResponse.json({ received: true }, { status: 200 })
  } catch (error: any) {
    console.error("[RISC] Erreur interne:", error)
    // On renvoie 200 mais on loggue l'erreur pour investigation
    return NextResponse.json(
      { received: false, error: "Internal error" },
      { status: 200 }
    )
  }
}

