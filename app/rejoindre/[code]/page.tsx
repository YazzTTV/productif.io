/**
 * Page d'atterrissage d'un lien d'invitation (ami ou groupe) partage depuis
 * l'onglet Communaute de l'app : https://www.productif.io/rejoindre/CODE
 *
 * App installee : « Ouvrir dans l'app » passe par productifio://rejoindre/CODE
 * (mobile-app-new/app/rejoindre/[code].tsx). Sinon : App Store, puis le code
 * se tape dans Communaute > J'ai un code. Aucune donnee personnelle affichee
 * au-dela du « Prenom I. » deja visible dans les classements.
 */

import type { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import { displayName, normalizeCode } from "@/lib/community"
import { DEFAULT_PRODUCTIF_APP_STORE_URL } from "@/lib/tiktok-attribution-links"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Rejoins-moi sur Productif",
  description: "Comparez vos heures de révision de la semaine.",
  robots: { index: false, follow: false },
}

async function resolve(code: string) {
  const owner = await prisma.user.findUnique({ where: { friendCode: code }, select: { name: true } })
  if (owner) return { kind: "friend" as const, label: displayName(owner.name) }
  const group = await prisma.leaderboardGroup.findUnique({ where: { inviteCode: code }, select: { name: true } })
  if (group) return { kind: "group" as const, label: group.name }
  return null
}

export default async function JoinPage({ params }: { params: Promise<{ code: string }> }) {
  const { code: raw } = await params
  const code = normalizeCode(raw)
  const target = code ? await resolve(code).catch(() => null) : null

  const title = !target
    ? "Ce lien d'invitation n'est plus valable"
    : target.kind === "friend"
      ? `${target.label} t'invite sur Productif`
      : `Rejoins le groupe « ${target.label} »`

  return (
    <main className="min-h-screen bg-white px-4 py-16 text-neutral-900">
      <div className="mx-auto max-w-md text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-green-600">Productif</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">{title}</h1>
        {target && (
          <p className="mt-4 text-neutral-600">
            Chaque semaine, vous comparez vos heures de révision réelles. Pas de likes, pas de messages : juste qui s&apos;y
            met vraiment.
          </p>
        )}

        {target && code && (
          <>
            <a
              href={`productifio://rejoindre/${code}`}
              className="mt-10 block rounded-2xl bg-green-600 px-6 py-4 font-semibold text-white"
            >
              J&apos;ai l&apos;app, ouvrir l&apos;invitation
            </a>
            <a
              href={DEFAULT_PRODUCTIF_APP_STORE_URL}
              className="mt-3 block rounded-2xl border border-neutral-200 px-6 py-4 font-semibold"
            >
              Télécharger sur l&apos;App Store
            </a>
            <div className="mt-10 rounded-2xl bg-neutral-50 px-6 py-5">
              <p className="text-sm text-neutral-500">Après l&apos;installation, tape ce code dans Communauté</p>
              <p className="mt-2 font-mono text-3xl font-semibold tracking-[0.3em]">{code}</p>
            </div>
          </>
        )}

        {!target && (
          <a
            href={DEFAULT_PRODUCTIF_APP_STORE_URL}
            className="mt-10 block rounded-2xl bg-green-600 px-6 py-4 font-semibold text-white"
          >
            Découvrir Productif sur l&apos;App Store
          </a>
        )}
      </div>
    </main>
  )
}
