import type { Locale } from "@/lib/i18n"

/**
 * Copie de la page /mode-examen, en francais et en anglais.
 *
 * Pourquoi ce fichier existe plutot que des cles dans lib/i18n.tsx : cette page
 * porte une centaine de chaines qui ne servent qu'a elle. Les verser dans le
 * dictionnaire global rendrait les deux illisibles. Les chaines partagees
 * restent dans i18n, la copie de campagne vit avec sa page.
 *
 * L'anglais existe pour une raison precise : le lancement Product Hunt envoie
 * un trafic majoritairement anglophone et de bureau sur une page qui n'existait
 * qu'en francais, donc chaque visiteur repartait sans comprendre l'offre.
 *
 * Les montants ne sont jamais ecrits ici. Ils viennent de lib/pricing.ts et
 * sont injectes par les fonctions ci-dessous.
 */

export type FeatureId = "exam" | "blocking" | "day" | "streak" | "reminders" | "progress"

type Feature = { title: string; description: string }

export type PageCopy = {
  hero: {
    badge: string
    titleLine1: string
    titleLead: string
    titleAccent: string
    subtitle: string
    ctaPrimary: string
    ctaSecondary: string
    trialNote: (days: number) => string
  }
  emailInline: { prompt: string }
  emailForm: {
    label: string
    placeholder: string
    submit: string
    sending: string
    success: string
    errorGeneric: string
    errorNetwork: string
  }
  emailSection: { title: string; body: string; note: string }
  friction: {
    titleLead: string
    titleAccent: string
    titleTail: string
    intro: string
    items: string[]
    closing: string
  }
  features: { title: string; subtitle: string; signatureLabel: string; items: Record<FeatureId, Feature> }
  pricing: {
    title: string
    subtitle: string
    freeLabel: string
    freePrice: string
    freeTagline: string
    freeItems: string[]
    freeExcluded: string
    freeCta: string
    yearlyBadge: string
    yearlyLabel: string
    perYear: string
    yearlyTagline: (perMonth: string, saving: string) => string
    premiumItems: string[]
    yearlyCta: (days: number) => string
    monthlyLabel: string
    perMonth: string
    monthlyTagline: string
    monthlyItems: (days: number) => string[]
    monthlyCta: (days: number) => string
    backToSchoolTitle: (price: string, endLabel: string) => string
    backToSchoolNote: (price: string) => string
    backToSchoolCta: string
  }
  faq: { title: string; items: { q: string; a: string }[] }
  finalCta: { title: string; body: string; cta: string }
  footer: { site: string; terms: string; privacy: string }
}

const fr: PageCopy = {
  hero: {
    badge: "Mode Examen",
    titleLine1: "Tu sais quoi faire.",
    titleLead: "Le problème, c'est de ",
    titleAccent: "t'y mettre",
    subtitle:
      "Ton planning de révisions se construit tout seul. Et ton téléphone se bloque jusqu'à ce que tu l'aies fait.",
    ctaPrimary: "Commencer gratuitement",
    ctaSecondary: "Voir comment ça marche",
    trialNote: (days) =>
      `${days} jours d'essai Premium, sans carte bancaire. Pensé pour PACES, prépa, droit et concours.`,
  },
  emailInline: {
    prompt: "Sur Android, ou sur ordinateur ? Laisse ton email, je t'envoie le lien.",
  },
  emailForm: {
    label: "Ton adresse email",
    placeholder: "ton@email.com",
    submit: "Préviens-moi",
    sending: "Envoi...",
    success: "C'est noté. Tu reçois le lien dès que c'est dispo pour toi.",
    errorGeneric: "Une erreur est survenue. Réessaie dans un instant.",
    errorNetwork: "Connexion impossible. Réessaie dans un instant.",
  },
  emailSection: {
    title: "Pas sur iPhone, ou pas maintenant ?",
    body: "L'app est sur iPhone aujourd'hui. Laisse ton email et tu reçois le lien quand c'est dispo pour toi, sans avoir à y repenser.",
    note: "Une adresse email, rien d'autre. Pas de spam, désinscription en un clic.",
  },
  friction: {
    titleLead: "Tu as déjà essayé. Et tu as arrêté au bout de ",
    titleAccent: "deux semaines",
    titleTail: ".",
    intro:
      "Les vingt applications de la rentrée dernière, l'agenda papier, le planificateur parfait. Normal que ça n'ait pas tenu : ces outils ne font rien quand tu ne les ouvres pas.",
    items: [
      "Tu perds 40 minutes à t'organiser avant de commencer à travailler.",
      "Tu prends ton téléphone 5 minutes, tu le reposes une heure plus tard.",
      "Tu es à fond trois jours, puis tu décroches et tu culpabilises.",
      "Devant la pile de polys, tu ne sais même pas par où attaquer.",
    ],
    closing: "Ce n'est pas une question de motivation. C'est une question de système.",
  },
  features: {
    title: "Ce qui te fait vraiment travailler",
    subtitle: "Trois choses, pas trente : démarrer, rester concentré, tenir dans la durée.",
    signatureLabel: "La fonctionnalité signature",
    items: {
      exam: {
        title: "Mode Examen",
        description:
          "Tu rentres tes chapitres et tes dates d'examen. L'app les classe par priorité et découpe tes révisions jour par jour. Chaque matin, tu sais quoi ouvrir.",
      },
      blocking: {
        title: "Blocage des distractions",
        description:
          "Pendant un bloc de révision, les applications qui te sortent du travail sont bloquées. Tu ne peux pas les rouvrir toi-même, et tout se déverrouille à la fin du bloc.",
      },
      day: {
        title: "La journée déjà décidée",
        description:
          "Tu coches le soir, tu ouvres le matin, la journée est prête. Tes deux meilleures heures passent dans les révisions au lieu de l'arbitrage.",
      },
      streak: {
        title: "Régularité",
        description:
          "Des séries de jours travaillés et une progression visible. C'est ce qui casse le cycle trois jours à fond puis plus rien.",
      },
      reminders: {
        title: "Relances au bon moment",
        description:
          "Si tu n'ouvres pas l'app, elle vient te chercher. C'est la différence avec les applications que tu as laissées tomber.",
      },
      progress: {
        title: "Ta progression, en clair",
        description:
          "Temps de concentration réel, blocs tenus, régularité. Tu vois noir sur blanc que tu avances.",
      },
    },
  },
  pricing: {
    title: "Commence gratuitement",
    subtitle: "Teste sans risque. Passe en Premium quand tu vois que ça marche.",
    freeLabel: "Gratuit",
    freePrice: "0 €",
    freeTagline: "Pour tester sans t'engager",
    freeItems: [
      "2 sessions focus par jour, 25 minutes",
      "3 habitudes",
      "Plan du jour, 3 événements",
      "7 jours d'historique",
    ],
    freeExcluded: "Mode Examen non inclus",
    freeCta: "Commencer",
    yearlyBadge: "Le plus choisi",
    yearlyLabel: "Premium annuel",
    perYear: "/an",
    yearlyTagline: (perMonth, saving) => `Soit ${perMonth} par mois, ${saving} d'économie`,
    premiumItems: [
      "Mode Examen, sans limite",
      "Sessions focus et blocage illimités",
      "Habitudes et relances illimitées",
      "Historique complet et statistiques",
      "Classement et défis",
    ],
    yearlyCta: (days) => `Essayer ${days} jours gratuitement`,
    monthlyLabel: "Premium mensuel",
    perMonth: "/mois",
    monthlyTagline: "Moins qu'un café par semaine",
    monthlyItems: (days) => [
      "Toutes les fonctions Premium",
      "Sans engagement, annulable à tout moment",
      `${days} jours d'essai, sans carte`,
    ],
    monthlyCta: (days) => `Essayer ${days} jours`,
    backToSchoolTitle: (price, endLabel) => `Offre de rentrée : ${price} par an jusqu'au ${endLabel}`,
    backToSchoolNote: (price) => `Ensuite le prix repasse à ${price}.`,
    backToSchoolCta: "Profiter de l'offre",
  },
  faq: {
    title: "Les questions que tu te poses",
    items: [],
  },
  finalCta: {
    title: "Arrête de t'organiser. Mets-toi au travail.",
    body: "Installe productif.io et lance ton premier bloc maintenant.",
    cta: "Commencer gratuitement",
  },
  footer: { site: "Site", terms: "CGU", privacy: "Confidentialité" },
}

const en: PageCopy = {
  hero: {
    badge: "Exam Mode",
    titleLine1: "You know what to do.",
    titleLead: "The hard part is ",
    titleAccent: "getting started",
    subtitle:
      "Your revision schedule builds itself. And your phone stays locked until you've done the work.",
    ctaPrimary: "Start for free",
    ctaSecondary: "See how it works",
    trialNote: (days) =>
      `${days}-day Premium trial, no card required. Built for heavy revision loads and competitive exams.`,
  },
  emailInline: {
    prompt: "On Android, or on a computer? Leave your email and I'll send you the link.",
  },
  emailForm: {
    label: "Your email address",
    placeholder: "you@email.com",
    submit: "Notify me",
    sending: "Sending...",
    success: "Got it. You'll get the link as soon as it's available for you.",
    errorGeneric: "Something went wrong. Please try again in a moment.",
    errorNetwork: "Connection failed. Please try again in a moment.",
  },
  emailSection: {
    title: "Not on iPhone, or not right now?",
    body: "The app is on iPhone today. Leave your email and you'll get the link when it's available for you, without having to think about it again.",
    note: "One email address, nothing else. No spam, unsubscribe in one click.",
  },
  friction: {
    titleLead: "You've tried before. And you quit after ",
    titleAccent: "two weeks",
    titleTail: ".",
    intro:
      "The twenty apps you downloaded last September, the paper planner, the perfect system. Of course it didn't last: none of those tools do anything when you don't open them.",
    items: [
      "You lose 40 minutes organising before you start actually working.",
      "You pick up your phone for 5 minutes and put it down an hour later.",
      "You go all in for three days, then drop off and feel guilty about it.",
      "Faced with the pile of course notes, you don't even know where to start.",
    ],
    closing: "It isn't a motivation problem. It's a system problem.",
  },
  features: {
    title: "What actually gets you working",
    subtitle: "Three things, not thirty: start, stay focused, keep going.",
    signatureLabel: "The signature feature",
    items: {
      exam: {
        title: "Exam Mode",
        description:
          "You enter your chapters and your exam dates. The app ranks them by priority and splits your revision day by day. Every morning, you know what to open.",
      },
      blocking: {
        title: "Distraction blocking",
        description:
          "During a revision block, the apps that pull you out of work are blocked. You can't unlock them yourself, and everything reopens when the block ends.",
      },
      day: {
        title: "The day already decided",
        description:
          "You tick the boxes at night, you open the app in the morning, the day is ready. Your two best hours go into revision instead of deciding.",
      },
      streak: {
        title: "Consistency",
        description:
          "Streaks of days worked and visible progress. That's what breaks the three-days-then-nothing cycle.",
      },
      reminders: {
        title: "Nudges at the right moment",
        description:
          "If you don't open the app, it comes to find you. That's the difference with every app you've already abandoned.",
      },
      progress: {
        title: "Your progress, in plain numbers",
        description:
          "Real focus time, blocks held, consistency. You see in black and white that you're moving forward.",
      },
    },
  },
  pricing: {
    title: "Start for free",
    subtitle: "Try it at no risk. Go Premium once you see it working.",
    freeLabel: "Free",
    freePrice: "€0",
    freeTagline: "To try it without committing",
    freeItems: [
      "2 focus sessions a day, 25 minutes",
      "3 habits",
      "Today's plan, 3 events",
      "7 days of history",
    ],
    freeExcluded: "Exam Mode not included",
    freeCta: "Get started",
    yearlyBadge: "Most popular",
    yearlyLabel: "Premium yearly",
    perYear: "/year",
    yearlyTagline: (perMonth, saving) => `That's ${perMonth} a month, ${saving} saved`,
    premiumItems: [
      "Exam Mode, unlimited",
      "Unlimited focus sessions and blocking",
      "Unlimited habits and reminders",
      "Full history and statistics",
      "Leaderboard and challenges",
    ],
    yearlyCta: (days) => `Try ${days} days free`,
    monthlyLabel: "Premium monthly",
    perMonth: "/month",
    monthlyTagline: "Less than one coffee a week",
    monthlyItems: (days) => [
      "Every Premium feature",
      "No commitment, cancel any time",
      `${days}-day trial, no card`,
    ],
    monthlyCta: (days) => `Try ${days} days`,
    backToSchoolTitle: (price, endLabel) => `Back-to-school offer: ${price} a year until ${endLabel}`,
    backToSchoolNote: (price) => `After that the price goes back to ${price}.`,
    backToSchoolCta: "Get the offer",
  },
  faq: {
    title: "The questions you're asking",
    items: [],
  },
  finalCta: {
    title: "Stop organising. Start working.",
    body: "Install productif.io and run your first block now.",
    cta: "Start for free",
  },
  footer: { site: "Website", terms: "Terms", privacy: "Privacy" },
}

/**
 * FAQ traitee a part parce que deux reponses interpolent des montants, et que
 * les garder dans l'objet principal obligerait a typer toute la liste en
 * fonctions pour deux entrees.
 */
export function faqItems(
  locale: Locale,
  prices: { monthly: string; yearly: string; yearlyPerMonth: string; trialDays: number },
): { q: string; a: string }[] {
  if (locale === "en") {
    return [
      {
        q: "I've already abandoned plenty of apps. Why would this one be different?",
        a: "Because this one acts even when you don't open it: the schedule is ready in the morning, the nudges land at the right moment, and the phone locks during your blocks. You don't need discipline to get started.",
      },
      {
        q: "How is this different from a normal planner?",
        a: "A planner waits for you to open it and leaves every decision to you. Here the order of your chapters is calculated by priority, and distractions are cut off while you work. Making a list was never the hard part, starting was.",
      },
      {
        q: "Is it really built for heavy revision loads and competitive exams?",
        a: "Yes. Exam Mode is designed for large volumes and fixed exam dates: you enter your chapters and your dates, it spreads everything out and tells you what to revise each day.",
      },
      {
        q: "How much does it cost?",
        a: `There's a free version to try it out. Premium is ${prices.monthly} a month or ${prices.yearly} a year, which is ${prices.yearlyPerMonth} a month. You get a ${prices.trialDays}-day free Premium trial, no card required.`,
      },
      {
        q: "Which phones does it work on?",
        a: "The app is available on iPhone. The Android version is coming later.",
      },
    ]
  }

  return [
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
      a: `Il y a une version gratuite pour tester. Le Premium est à ${prices.monthly} par mois ou ${prices.yearly} par an, soit ${prices.yearlyPerMonth} par mois. Tu as ${prices.trialDays} jours d'essai Premium gratuits, sans carte bancaire.`,
    },
    {
      q: "Ça marche sur quel téléphone ?",
      a: "L'app est disponible sur iPhone. La version Android arrive plus tard.",
    },
  ]
}

export const pageCopy: Record<Locale, PageCopy> = { fr, en }
