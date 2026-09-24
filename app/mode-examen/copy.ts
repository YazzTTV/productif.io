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
  demo: { title: string; caption: string }
  friction: {
    titleLead: string
    titleAccent: string
    titleTail: string
    intro: string
    items: string[]
    stakes: string
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
      "Tu lances ta session, tes applis se ferment, et il n'y a aucun bouton pour les rouvrir. Ça se déverrouille tout seul à la fin.",
    ctaPrimary: "Commencer gratuitement",
    ctaSecondary: "Voir comment ça marche",
    trialNote: (days) =>
      `${days} jours d'essai Premium, rien n'est débité pendant l'essai. Pensé pour le PASS, la prépa, le droit et les concours.`,
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
  demo: {
    title: "Ce qui se passe quand tu essaies d'ouvrir TikTok",
    caption:
      "Pas de bouton pour ignorer. Ton app se rouvre toute seule à la fin du bloc, et pas avant.",
  },
  friction: {
    titleLead: "Tu as déjà essayé. Et tu as arrêté au bout de ",
    titleAccent: "deux semaines",
    titleTail: ".",
    intro:
      "Les vingt applications de la rentrée dernière, l'agenda papier, le planificateur parfait. Normal que ça n'ait pas tenu : ces outils ne font rien quand tu ne les ouvres pas. Si tu t'es déjà dit une de ces phrases :",
    items: [
      "J'ai refait mon planning trois fois cette semaine. J'ai ouvert zéro chapitre.",
      "Je prends mon téléphone pour vérifier un truc. Je le repose une heure après.",
      "Je suis à fond trois jours, et le jeudi je ne rouvre plus rien.",
      "Il me reste onze chapitres, je ne sais pas lequel prendre, alors je n'en prends aucun.",
    ],
    stakes:
      "La veille, il te reste trois chapitres et tu sais déjà que tu ne les feras pas. Ce n'est pas la soirée qui a raté, c'est les trois semaines d'avant.",
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
          "Tu rentres tes matières, leurs coefficients, tes chapitres et tes dates d'examen. À chaque session, l'app choisit quoi réviser en premier selon le coefficient et l'examen le plus proche.",
      },
      blocking: {
        title: "Blocage des distractions",
        description:
          "Pendant un bloc de révision, les applications qui te sortent du travail sont bloquées. Tu ne peux pas les rouvrir toi-même, et tout se déverrouille à la fin du bloc.",
      },
      day: {
        title: "Ta semaine planifiée en un clic",
        description:
          "Un bouton place tes révisions dans les créneaux libres de ton agenda Google, par priorité. Tes deux meilleures heures passent dans les révisions au lieu de l'arbitrage.",
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
    subtitle:
      "Teste sans risque. Et si tu hésites sur le prix : une année redoublée, c'est douze mois de ta vie.",
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
    monthlyTagline: "Sans engagement. Tu arrêtes quand tu veux.",
    monthlyItems: (days) => [
      "Toutes les fonctions Premium",
      "Sans engagement, annulable à tout moment",
      `${days} jours d'essai, rien de débité`,
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
      "You start your session, your apps close, and there is no button to reopen them. It unlocks itself at the end.",
    ctaPrimary: "Start for free",
    ctaSecondary: "See how it works",
    trialNote: (days) =>
      `${days}-day Premium trial, nothing charged during the trial. Built for heavy revision loads and competitive exams.`,
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
  demo: {
    title: "What happens when you try to open TikTok",
    caption:
      "No ignore button. Your app reopens on its own at the end of the block, and not before.",
  },
  friction: {
    titleLead: "You've tried before. And you quit after ",
    titleAccent: "two weeks",
    titleTail: ".",
    intro:
      "The twenty apps you downloaded last September, the paper planner, the perfect system. Of course it didn't last: none of those tools do anything when you don't open them. If you have ever said one of these:",
    items: [
      "I redid my schedule three times this week. I opened zero chapters.",
      "I pick up my phone to check one thing. I put it down an hour later.",
      "I go all in for three days, and by Thursday I don't open anything.",
      "I have eleven chapters left, I don't know which one to pick, so I pick none.",
    ],
    stakes:
      "The night before, you have three chapters left and you already know you won't do them. It isn't the evening that failed. It's the three weeks before.",
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
          "You enter your subjects, their weights, your chapters and your exam dates. At each session, the app picks what to revise first based on weight and the nearest exam.",
      },
      blocking: {
        title: "Distraction blocking",
        description:
          "During a revision block, the apps that pull you out of work are blocked. You can't unlock them yourself, and everything reopens when the block ends.",
      },
      day: {
        title: "Your week planned in one tap",
        description:
          "One button places your revision in the free slots of your Google Calendar, by priority. Your two best hours go into revision instead of deciding.",
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
    subtitle:
      "Try it at no risk. And if the price gives you pause: repeating a year costs you twelve months of your life.",
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
    monthlyTagline: "No commitment. Cancel whenever you want.",
    monthlyItems: (days) => [
      "Every Premium feature",
      "No commitment, cancel any time",
      `${days}-day trial, nothing charged`,
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
        a: "Because once your session starts, there is no going back: your apps stay blocked until the block ends, with no button to reopen them. And if you don't open the app, reminders come and find you. The only discipline you need is to press start.",
      },
      {
        q: "How is this different from a normal planner?",
        a: "A planner waits for you to open it and leaves every decision to you. Here the order of your chapters is calculated by priority, and distractions are cut off while you work. Making a list was never the hard part, starting was.",
      },
      {
        q: "Is it really built for heavy revision loads and competitive exams?",
        a: "Yes. Exam Mode is designed for large volumes and fixed exam dates: you enter your chapters and your dates, it ranks everything by priority and tells you what to revise at each session.",
      },
      {
        q: "How much does it cost?",
        a: `There's a free version to try it out. Premium is ${prices.monthly} a month or ${prices.yearly} a year, which is ${prices.yearlyPerMonth} a month. You get a ${prices.trialDays}-day free Premium trial: it runs through the App Store, nothing is charged during the trial, and you cancel in one tap from your Apple subscriptions.`,
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
      a: "Parce qu'une fois ta session lancée, tu ne peux plus revenir en arrière : tes applis restent bloquées jusqu'à la fin du bloc, sans aucun bouton pour les rouvrir. Et si tu n'ouvres pas l'app, des rappels viennent te chercher. La seule discipline qu'il te faut, c'est d'appuyer sur démarrer.",
    },
    {
      q: "En quoi c'est différent d'un planificateur classique ?",
      a: "Un planificateur attend que tu l'ouvres et te laisse décider de tout. Ici, l'ordre des chapitres est calculé par priorité, et les distractions sont coupées pendant que tu travailles. Le problème n'a jamais été de faire une liste, c'est de s'y mettre.",
    },
    {
      q: "C'est vraiment fait pour le PASS ou la prépa ?",
      a: "Oui. Le Mode Examen est pensé pour les gros volumes et les dates de concours : tu rentres tes chapitres et tes dates, il classe tout par priorité et t'indique quoi réviser à chaque session.",
    },
    {
      q: "Combien ça coûte ?",
      a: `Il y a une version gratuite pour tester. Le Premium est à ${prices.monthly} par mois ou ${prices.yearly} par an, soit ${prices.yearlyPerMonth} par mois. Tu as ${prices.trialDays} jours d'essai Premium gratuits : l'essai passe par l'App Store, rien n'est débité pendant l'essai, et tu annules en un geste depuis tes abonnements Apple.`,
    },
    {
      q: "Ça marche sur quel téléphone ?",
      a: "L'app est disponible sur iPhone. La version Android arrive plus tard.",
    },
  ]
}

export const pageCopy: Record<Locale, PageCopy> = { fr, en }
