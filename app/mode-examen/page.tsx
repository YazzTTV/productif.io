import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { Calendar, ShieldOff, Flame, BellRing, ListChecks, LineChart, Check } from "lucide-react"
import {
  PRICE_MONTHLY,
  PRICE_YEARLY,
  PRICE_YEARLY_PER_MONTH,
  PRICE_YEARLY_BACK_TO_SCHOOL,
  YEARLY_SAVING_PERCENT,
  TRIAL_DAYS,
  BACK_TO_SCHOOL_END_LABEL,
  formatEur,
  formatPercent,
} from "@/lib/pricing"

/**
 * Landing de campagne, point de chute du trafic TikTok / Instagram.
 *
 * Volontairement distincte de la homepage : celle-ci vouvoie et s'adresse à un
 * public large ("coach IA", "Transformez la concentration en discipline"), alors
 * que les créas et les bios des comptes tutoient et promettent deux choses
 * précises, le planning qui se construit seul et le téléphone qui se bloque.
 * Servir la homepage à ce trafic crée une rupture entre la pub et la page.
 *
 * Les prix viennent de lib/pricing.ts, jamais retapés ici.
 */

const APP_STORE_URL = process.env.NEXT_PUBLIC_APP_STORE_URL

export const metadata: Metadata = {
  title: "Mode Examen - productif.io | Ton planning de révisions se construit tout seul",
  description:
    "Tu sais quoi faire, le problème c'est de t'y mettre. Ton planning de révisions se construit tout seul et ton téléphone se bloque jusqu'à la fin du bloc. Conçu pour PACES, prépa, droit et concours.",
  openGraph: {
    title: "Mode Examen - productif.io",
    description:
      "Ton planning de révisions se construit tout seul. Et ton téléphone se bloque jusqu'à ce que tu l'aies fait.",
    type: "website",
    url: "https://productif.io/mode-examen",
  },
}

const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "productif.io",
  applicationCategory: "EducationApplication",
  operatingSystem: "iOS",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "EUR",
    description: `Version gratuite disponible, Premium à ${PRICE_MONTHLY} EUR/mois ou ${PRICE_YEARLY} EUR/an`,
  },
  description:
    "Application de révision pour étudiants : le planning se construit par priorité et les applications distrayantes sont bloquées pendant les blocs de travail.",
}

/** Destination unique de TOUS les CTA de la page : l'App Store quand l'URL est
 *  configurée, sinon l'onboarding web plutôt qu'un lien mort. Tout bouton de
 *  cette page doit passer par ici, sinon il diverge en silence. */
function CtaLink({ label, className }: { label: string; className: string }) {
  if (APP_STORE_URL) {
    return (
      <a href={APP_STORE_URL} target="_blank" rel="noopener" className={className}>
        {label}
      </a>
    )
  }
  return (
    <Link href="/onboarding" className={className}>
      {label}
    </Link>
  )
}

/** CTA principal, style plein vert. */
function PrimaryCta({ label, className = "" }: { label: string; className?: string }) {
  const base =
    "inline-flex items-center justify-center px-8 py-4 bg-[#16a34a] text-white rounded-3xl font-medium text-base hover:bg-[#15803d] transition-colors duration-200"

  return <CtaLink label={label} className={`${base} ${className}`} />
}

const frictions = [
  "Tu perds 40 minutes à t'organiser avant de commencer à travailler.",
  "Tu prends ton téléphone 5 minutes, tu le reposes une heure plus tard.",
  "Tu es à fond trois jours, puis tu décroches et tu culpabilises.",
  "Devant la pile de polys, tu ne sais même pas par où attaquer.",
]

const features = [
  {
    icon: Calendar,
    title: "Mode Examen",
    signature: true,
    description:
      "Tu rentres tes chapitres et tes dates d'examen. L'app les classe par priorité et découpe tes révisions jour par jour. Chaque matin, tu sais quoi ouvrir.",
  },
  {
    icon: ShieldOff,
    title: "Blocage des distractions",
    description:
      "Pendant un bloc de révision, les applications qui te sortent du travail sont bloquées. Tu ne peux pas les rouvrir toi-même, et tout se déverrouille à la fin du bloc.",
  },
  {
    icon: ListChecks,
    title: "La journée déjà décidée",
    description:
      "Tu coches le soir, tu ouvres le matin, la journée est prête. Tes deux meilleures heures passent dans les révisions au lieu de l'arbitrage.",
  },
  {
    icon: Flame,
    title: "Régularité",
    description:
      "Des séries de jours travaillés et une progression visible. C'est ce qui casse le cycle trois jours à fond puis plus rien.",
  },
  {
    icon: BellRing,
    title: "Relances au bon moment",
    description:
      "Si tu n'ouvres pas l'app, elle vient te chercher. C'est la différence avec les applications que tu as laissées tomber.",
  },
  {
    icon: LineChart,
    title: "Ta progression, en clair",
    description:
      "Temps de concentration réel, blocs tenus, régularité. Tu vois noir sur blanc que tu avances.",
  },
]

const freePlan = [
  "2 sessions focus par jour, 25 minutes",
  "3 habitudes",
  "Plan du jour, 3 événements",
  "7 jours d'historique",
]

const premiumPlan = [
  "Mode Examen, sans limite",
  "Sessions focus et blocage illimités",
  "Habitudes et relances illimitées",
  "Historique complet et statistiques",
  "Classement et défis",
]

export default function ModeExamenPage() {
  return (
    <main className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />

      {/* ================= HERO ================= */}
      <section className="px-6 pt-16 pb-24 md:pt-24">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-10">
            <div className="bg-white rounded-3xl p-4 shadow-sm border border-black/[0.03]">
              <Image src="/icon-new.png" alt="productif.io" width={64} height={64} className="w-16 h-16" priority />
            </div>
          </div>

          <span className="inline-flex items-center px-4 py-1.5 rounded-full border border-[#16a34a]/20 bg-[#16a34a]/5 text-sm font-medium text-[#16a34a] tracking-tight">
            Mode Examen
          </span>

          <h1 className="mt-8 text-5xl md:text-7xl font-light text-gray-900 tracking-[-0.04em] leading-tight">
            Tu sais quoi faire.
            <br />
            Le problème, c&apos;est de <span className="text-[#16a34a]">t&apos;y mettre</span>.
          </h1>

          <p className="mt-8 text-xl md:text-2xl text-gray-600 font-light max-w-2xl mx-auto leading-relaxed">
            Ton planning de révisions se construit tout seul. Et ton téléphone se bloque jusqu&apos;à ce
            que tu l&apos;aies fait.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <PrimaryCta label={`Commencer gratuitement`} />
            <Link
              href="#le-systeme"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-gray-900 rounded-3xl font-medium text-base border border-black/[0.08] hover:bg-gray-50 transition-colors duration-200"
            >
              Voir comment ça marche
            </Link>
          </div>

          <p className="mt-8 text-sm text-gray-500">
            {TRIAL_DAYS} jours d&apos;essai Premium, sans carte bancaire. Pensé pour PACES, prépa,
            droit et concours.
          </p>
        </div>
      </section>

      {/* ================= FREIN N1 ================= */}
      <section className="py-24 md:py-32 px-6 bg-[#fafafa] border-y border-black/[0.04]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-light text-gray-900 tracking-[-0.04em]">
            Tu as déjà essayé. Et tu as arrêté au bout de{" "}
            <span className="text-[#16a34a]">deux semaines</span>.
          </h2>
          <p className="mt-8 text-lg text-gray-600 leading-relaxed">
            Les vingt applications de la rentrée dernière, l&apos;agenda papier, le planificateur
            parfait. Normal que ça n&apos;ait pas tenu : ces outils ne font rien quand tu ne les ouvres
            pas.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-14 text-left">
            {frictions.map((item) => (
              <div
                key={item}
                className="bg-white border border-black/[0.06] rounded-3xl p-6 text-gray-700 text-sm leading-relaxed"
              >
                {item}
              </div>
            ))}
          </div>

          <p className="mt-14 text-lg font-medium text-gray-900">
            Ce n&apos;est pas une question de motivation. C&apos;est une question de système.
          </p>
        </div>
      </section>

      {/* ================= FEATURES ================= */}
      <section id="le-systeme" className="py-24 md:py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-light text-gray-900 tracking-[-0.04em] text-center max-w-3xl mx-auto">
            Ce qui te fait vraiment travailler
          </h2>
          <p className="mt-6 text-center text-gray-600 text-lg max-w-2xl mx-auto">
            Trois choses, pas trente : démarrer, rester concentré, tenir dans la durée.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-16">
            {features.map((f) => (
              <div
                key={f.title}
                className={`rounded-3xl p-8 shadow-sm transition-colors ${
                  f.signature
                    ? "bg-[#16a34a]/[0.04] border-2 border-[#16a34a]/30"
                    : "bg-white border border-[#16a34a]/10 hover:border-[#16a34a]/20"
                }`}
              >
                <f.icon size={24} strokeWidth={1.5} className="text-[#16a34a] mb-4" />
                {f.signature && (
                  <span className="block text-xs font-semibold uppercase tracking-[0.1em] text-[#16a34a] mb-2">
                    La fonctionnalité signature
                  </span>
                )}
                <h3 className="text-xl font-medium text-gray-900 mb-3 tracking-tight">{f.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= PRICING ================= */}
      <section className="py-24 md:py-32 px-6 bg-[#fafafa] border-y border-black/[0.04]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-light text-gray-900 tracking-[-0.04em] text-center">
            Commence gratuitement
          </h2>
          <p className="mt-6 text-center text-gray-600 text-lg">
            Teste sans risque. Passe en Premium quand tu vois que ça marche.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 items-stretch">
            {/* Gratuit */}
            <div className="bg-white border border-black/[0.06] rounded-3xl p-8 flex flex-col">
              <h3 className="text-sm font-semibold uppercase tracking-[0.06em] text-gray-500">
                Gratuit
              </h3>
              <div className="mt-4 text-4xl font-light text-gray-900 tracking-tight">0 €</div>
              <p className="mt-1 text-sm text-gray-500">Pour tester sans t&apos;engager</p>
              <ul className="mt-8 space-y-3 flex-1">
                {freePlan.map((item) => (
                  <li key={item} className="flex gap-3 text-sm text-gray-700">
                    <Check size={16} className="text-[#16a34a] flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
                <li className="flex gap-3 text-sm text-gray-400">
                  <span className="flex-shrink-0 mt-0.5 w-4 text-center">·</span>
                  Mode Examen non inclus
                </li>
              </ul>
              <CtaLink
                label="Commencer"
                className="mt-8 inline-flex items-center justify-center px-6 py-3.5 bg-white text-gray-900 rounded-2xl font-medium text-sm border border-black/[0.08] hover:bg-gray-50 transition-colors"
              />
            </div>

            {/* Annuel, mis en avant */}
            <div className="relative bg-white border-2 border-[#16a34a] rounded-3xl p-8 flex flex-col shadow-sm">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#16a34a] text-white text-xs font-semibold uppercase tracking-[0.08em] px-4 py-1.5 rounded-full whitespace-nowrap">
                Le plus choisi
              </span>
              <h3 className="text-sm font-semibold uppercase tracking-[0.06em] text-gray-500">
                Premium annuel
              </h3>
              <div className="mt-4 text-4xl font-light text-gray-900 tracking-tight">
                {formatEur(PRICE_YEARLY)}
                <span className="text-base text-gray-500 font-normal">/an</span>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Soit {formatEur(PRICE_YEARLY_PER_MONTH)} par mois,{" "}
                {formatPercent(YEARLY_SAVING_PERCENT)} d&apos;économie
              </p>
              <ul className="mt-8 space-y-3 flex-1">
                {premiumPlan.map((item) => (
                  <li key={item} className="flex gap-3 text-sm text-gray-700">
                    <Check size={16} className="text-[#16a34a] flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
              <PrimaryCta
                label={`Essayer ${TRIAL_DAYS} jours gratuitement`}
                className="mt-8 !px-6 !py-3.5 !text-sm !rounded-2xl"
              />
            </div>

            {/* Mensuel */}
            <div className="bg-white border border-black/[0.06] rounded-3xl p-8 flex flex-col">
              <h3 className="text-sm font-semibold uppercase tracking-[0.06em] text-gray-500">
                Premium mensuel
              </h3>
              <div className="mt-4 text-4xl font-light text-gray-900 tracking-tight">
                {formatEur(PRICE_MONTHLY)}
                <span className="text-base text-gray-500 font-normal">/mois</span>
              </div>
              <p className="mt-1 text-sm text-gray-500">Moins qu&apos;un café par semaine</p>
              <ul className="mt-8 space-y-3 flex-1">
                <li className="flex gap-3 text-sm text-gray-700">
                  <Check size={16} className="text-[#16a34a] flex-shrink-0 mt-0.5" />
                  Toutes les fonctions Premium
                </li>
                <li className="flex gap-3 text-sm text-gray-700">
                  <Check size={16} className="text-[#16a34a] flex-shrink-0 mt-0.5" />
                  Sans engagement, annulable à tout moment
                </li>
                <li className="flex gap-3 text-sm text-gray-700">
                  <Check size={16} className="text-[#16a34a] flex-shrink-0 mt-0.5" />
                  {TRIAL_DAYS} jours d&apos;essai, sans carte
                </li>
              </ul>
              <PrimaryCta
                label={`Essayer ${TRIAL_DAYS} jours`}
                className="mt-8 !px-6 !py-3.5 !text-sm !rounded-2xl !bg-white !text-gray-900 border border-black/[0.08] hover:!bg-gray-50"
              />
            </div>
          </div>

          {/* Offre de rentrée */}
          <div className="mt-10 bg-white border border-[#16a34a]/30 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <p className="text-lg font-medium text-gray-900">
                Offre de rentrée : {formatEur(PRICE_YEARLY_BACK_TO_SCHOOL)} par an jusqu&apos;au{" "}
                {BACK_TO_SCHOOL_END_LABEL}
              </p>
              <p className="mt-1 text-sm text-gray-600">
                Ensuite le prix repasse à {formatEur(PRICE_YEARLY)}.
              </p>
            </div>
            <PrimaryCta label="Profiter de l'offre" className="!px-6 !py-3.5 !text-sm !rounded-2xl" />
          </div>
        </div>
      </section>

      {/* ================= FAQ ================= */}
      <section className="py-24 md:py-32 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-light text-gray-900 tracking-[-0.04em] text-center mb-14">
            Les questions que tu te poses
          </h2>

          <div className="space-y-3">
            {[
              {
                q: "J'ai déjà abandonné plein d'applications. Pourquoi pas celle-là ?",
                a: "Parce que celle-là agit même quand tu ne l'ouvres pas : le planning est déjà prêt le matin, les relances tombent au bon moment, et le téléphone se bloque pendant les blocs. Tu n'as pas besoin de discipline pour démarrer.",
              },
              {
                q: "En quoi c'est différent d'un planificateur classique ?",
                a: "Un planificateur attend que tu l'ouvres et te laisse décider de tout. Ici, l'ordre des chapitres est calculé par priorité, et les distractions sont coupées pendant que tu travailles. Le problème n'a jamais été de faire une liste, c'est de s'y mettre.",
              },
              {
                q: "C'est vraiment fait pour la PACES ou la prépa ?",
                a: "Oui. Le Mode Examen est pensé pour les gros volumes et les dates de concours : tu rentres tes chapitres et tes dates, il répartit tout et t'indique quoi réviser chaque jour.",
              },
              {
                q: "Combien ça coûte ?",
                a: `Il y a une version gratuite pour tester. Le Premium est à ${formatEur(PRICE_MONTHLY)} par mois ou ${formatEur(PRICE_YEARLY)} par an, soit ${formatEur(PRICE_YEARLY_PER_MONTH)} par mois. Tu as ${TRIAL_DAYS} jours d'essai Premium gratuits, sans carte bancaire.`,
              },
              {
                q: "Ça marche sur quel téléphone ?",
                a: "L'app est disponible sur iPhone. La version Android arrive plus tard.",
              },
            ].map((item) => (
              <details
                key={item.q}
                className="group bg-white border border-black/[0.06] rounded-3xl overflow-hidden"
              >
                <summary className="cursor-pointer list-none px-7 py-5 font-medium text-gray-900 flex items-center justify-between gap-6">
                  {item.q}
                  <span className="text-[#16a34a] text-xl font-light transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <div className="px-7 pb-6 text-gray-600 text-sm leading-relaxed">{item.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ================= CTA FINAL ================= */}
      <section className="py-24 md:py-32 px-6 bg-[#fafafa] border-t border-black/[0.04]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-light text-gray-900 tracking-[-0.04em]">
            Arrête de t&apos;organiser. Mets-toi au travail.
          </h2>
          <p className="mt-6 text-lg text-gray-600">
            Installe productif.io et lance ton premier bloc maintenant.
          </p>
          <div className="mt-10 flex justify-center">
            <PrimaryCta label="Commencer gratuitement" />
          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="py-10 px-6 border-t border-black/[0.06]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <span className="font-medium text-gray-900">productif.io</span>
          <div className="flex items-center gap-5">
            <Link href="/" className="hover:text-gray-900 transition-colors">
              Site
            </Link>
            <Link href="/terms" className="hover:text-gray-900 transition-colors">
              CGU
            </Link>
            <Link href="/privacy-policy" className="hover:text-gray-900 transition-colors">
              Confidentialité
            </Link>
          </div>
          <span>© {new Date().getFullYear()} productif.io</span>
        </div>
      </footer>
    </main>
  )
}
