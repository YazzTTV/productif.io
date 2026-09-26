/**
 * Logique pure de la seconde moitie de l'onboarding 1.5 : calcul, ecran du
 * planning, ecran avant le paywall, sorties du paywall et reprise apres une app
 * tuee.
 *
 * Aucun import d'execution ici, comme lib/onboardingLogic.ts : ce fichier se
 * teste avec `npx tsx` (scripts/test-onboarding-plan-view.ts). Les ecrans lui
 * passent les blocs du serveur et les reponses du questionnaire, il leur rend
 * des jours a afficher, des decisions de navigation et des TEXTES A TRADUIRE
 * ({ key, params, fallback }), que l'ecran passe tels quels a t().
 *
 * Deux conditions de la decision du 25 septembre vivent ici :
 *   - les reponses du questionnaire RESSORTENT, sinon la prise de conscience
 *     qu'il provoque ne se convertit en rien. Au moins deux phrases construites
 *     sur les vraies reponses, avec un repli neutre quand une reponse manque ;
 *   - le mot « essai » n'apparait jamais : seul le paywall Superwall connait
 *     l'eligibilite a l'offre d'essai (regle Apple 3.1.2). Ici : « avec Premium ».
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Meme forme que StudyBlock (lib/api.ts), redeclaree pour rester sans import. */
export interface PlanBlock {
  taskId: string;
  title: string;
  subjectId: string | null;
  subjectName: string | null;
  examDate: string | null;
  start: string;
  end: string;
  minutes: number;
  autoPlanned: boolean;
}

/** Texte a traduire : l'ecran appelle t(key, params, fallback). */
export interface Copy {
  key: string;
  params?: Record<string, string | number>;
  fallback: string;
}

export interface PlanDay {
  /** YYYY-MM-DD, jour local de l'appareil. */
  ymd: string;
  /** Minuit local de ce jour. */
  date: Date;
  /** 0 = aujourd'hui, 1 = demain. */
  offset: number;
  blocks: PlanBlock[];
}

export interface PlanSummary {
  sessions: number;
  subjects: number;
  /** Duree la plus frequente d'une seance, en minutes. 30 par defaut. */
  typicalMinutes: number;
  /**
   * Au moins une seance porte un vrai chapitre. Faux quand l'etudiant a repondu
   * « pas encore » partout : le serveur n'a cree que des seances generiques
   * (« Séance 1 »), et dire « chaque seance a son chapitre » serait faux.
   */
  hasChapters: boolean;
}

type Answers = Record<string, unknown>;

// ---------------------------------------------------------------------------
// Dates et heures, toujours en heure LOCALE de l'appareil
// ---------------------------------------------------------------------------

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const pad = (n: number) => String(n).padStart(2, '0');

function localYmd(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * Ecart en jours calendaires locaux. Par les composantes de date et non par
 * une division de millisecondes : un passage a l'heure d'hiver fait une
 * journee de 25 h, qu'une division arrondirait mal.
 */
export function localDayOffset(date: Date, now: Date): number {
  const a = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  const b = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((a - b) / MS_PER_DAY);
}

/** « 9h00 », « 14h30 » : l'heure comme on l'ecrit en francais. */
export function formatHour(date: Date): string {
  return `${date.getHours()}h${pad(date.getMinutes())}`;
}

function validDate(iso: string): Date | null {
  const date = new Date(iso);
  return Number.isFinite(date.getTime()) ? date : null;
}

// ---------------------------------------------------------------------------
// Blocs
// ---------------------------------------------------------------------------

/** Blocs pas encore termines, du plus proche au plus lointain. */
export function upcomingBlocks(blocks: PlanBlock[], now: Date = new Date()): PlanBlock[] {
  return blocks
    .filter((block) => {
      const end = validDate(block.end);
      return !!end && !!validDate(block.start) && end.getTime() > now.getTime();
    })
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
}

/**
 * Premier bloc qui n'a PAS encore commence : c'est celui que l'ecran d'essai
 * annonce (« Demain 9h00 ... tes applis se verrouillent »). Un bloc deja en
 * cours ne serait plus verrouille automatiquement (le blocage automatique ne
 * programme jamais un bloc deja commence, utils/autoBlocking.ts).
 */
export function nextBlockToLock(blocks: PlanBlock[], now: Date = new Date()): PlanBlock | null {
  return upcomingBlocks(blocks, now).find((block) => new Date(block.start).getTime() > now.getTime()) ?? null;
}

/** Les blocs regroupes par jour local, sur `days` jours a partir d'aujourd'hui. Jours vides omis. */
export function groupBlocksByDay(blocks: PlanBlock[], now: Date = new Date(), days = 14): PlanDay[] {
  const byDay = new Map<string, PlanDay>();
  for (const block of upcomingBlocks(blocks, now)) {
    const start = new Date(block.start);
    const offset = localDayOffset(start, now);
    if (offset < 0 || offset >= days) continue;
    const ymd = localYmd(start);
    let day = byDay.get(ymd);
    if (!day) {
      day = { ymd, date: new Date(start.getFullYear(), start.getMonth(), start.getDate()), offset, blocks: [] };
      byDay.set(ymd, day);
    }
    day.blocks.push(block);
  }
  return [...byDay.values()].sort((a, b) => a.offset - b.offset);
}

/** Titre d'une seance generique ecrit par le serveur (onboardingPlan.ts, numbered('Séance')). */
const GENERIC_SESSION_TITLE = /^s[eé]ance\s+\d+$/i;

export function summarizePlan(blocks: PlanBlock[], now: Date = new Date()): PlanSummary {
  const upcoming = upcomingBlocks(blocks, now);
  const subjects = new Set(upcoming.map((b) => b.subjectId ?? b.subjectName ?? '').filter(Boolean));
  const hasChapters = upcoming.some((b) => !GENERIC_SESSION_TITLE.test((b.title || '').trim()));
  const counts = new Map<number, number>();
  for (const block of upcoming) {
    if (!Number.isFinite(block.minutes) || block.minutes <= 0) continue;
    counts.set(block.minutes, (counts.get(block.minutes) ?? 0) + 1);
  }
  let typicalMinutes = 30;
  let best = 0;
  for (const [minutes, count] of counts) {
    if (count > best || (count === best && minutes < typicalMinutes)) {
      best = count;
      typicalMinutes = minutes;
    }
  }
  return { sessions: upcoming.length, subjects: subjects.size, typicalMinutes, hasChapters };
}

const MAX_LABEL_TITLE = 42;

/**
 * « Anatomie ch. 1 » pour un chapitre cree par nombre (« Chapitre 1 »),
 * « Anatomie, séance 2 » pour une seance generique, « Anatomie : Le squelette »
 * pour un titre colle par l'etudiant. Les deux premiers titres sont ceux que
 * le serveur ecrit (lib/planning/onboardingPlan.ts, numbered()).
 */
export function blockLabel(block: Pick<PlanBlock, 'title' | 'subjectName'>): string {
  const title = (block.title || '').replace(/\s+/g, ' ').trim();
  const subject = (block.subjectName || '').replace(/\s+/g, ' ').trim();
  const chapter = title.match(/^chapitre\s+(\d+)$/i);
  const session = title.match(/^s[eé]ance\s+(\d+)$/i);
  if (!subject) return title;
  if (chapter) return `${subject} ch. ${chapter[1]}`;
  if (session) return `${subject}, séance ${session[1]}`;
  if (!title) return subject;
  const short = title.length > MAX_LABEL_TITLE ? `${title.slice(0, MAX_LABEL_TITLE - 1).trimEnd()}…` : title;
  return `${subject} : ${short}`;
}

/**
 * La phrase de l'ecran d'essai, construite sur le premier vrai bloc :
 * « Demain 9h00, Anatomie ch. 1 : tes applis se verrouillent toutes seules. »
 * `formatDay` donne le nom du jour au-dela de demain, dans la langue de l'app.
 */
export function trialHeadline(
  block: PlanBlock | null,
  now: Date,
  formatDay: (date: Date) => string
): Copy {
  if (!block) {
    return {
      key: 'onbTrialHeadlineNoBlock',
      fallback: 'Dès ta première séance, tes applis se verrouillent toutes seules.',
    };
  }
  const start = new Date(block.start);
  const offset = localDayOffset(start, now);
  const params = { time: formatHour(start), label: blockLabel(block) };
  if (offset <= 0) {
    return {
      key: 'onbTrialHeadlineToday',
      params,
      fallback: "Aujourd'hui {time}, {label} : tes applis se verrouillent toutes seules.",
    };
  }
  if (offset === 1) {
    return {
      key: 'onbTrialHeadlineTomorrow',
      params,
      fallback: 'Demain {time}, {label} : tes applis se verrouillent toutes seules.',
    };
  }
  const day = formatDay(start);
  return {
    key: 'onbTrialHeadlineLater',
    params: { ...params, day: day.charAt(0).toUpperCase() + day.slice(1) },
    fallback: '{day} {time}, {label} : tes applis se verrouillent toutes seules.',
  };
}

// ---------------------------------------------------------------------------
// Cours en gris, autour des seances
// ---------------------------------------------------------------------------

export interface BusySlot {
  start: string;
  end: string;
}

/**
 * Ligne grise d'un jour : les heures de cours, pour montrer que les seances
 * passent autour. Meme regle que le serveur (lib/planning/weeklyBusy.ts,
 * weeklyBusyCoverage) : la reponse a la question de secours s'AJOUTE a
 * l'agenda lu, elle ne s'efface pas devant lui. Un agenda de l'iPhone lu mais
 * vide ce jour-la (ENT non abonne) n'annule donc pas « je finis vers 18h ».
 *   - creneaux de l'agenda ce jour-la ET reponse (en semaine) : une seule
 *     plage qui couvre les deux, de min(8h, 1er creneau) a max(heure, dernier) ;
 *   - reponse seule (en semaine) : « Cours jusqu'a 18h » ;
 *   - creneaux seuls : « Occupe de 8h00 a 16h30 ».
 * Les creneaux viennent de l'agenda de l'iPhone lu a l'ecran cours (en
 * memoire seulement). Memes filtres que inferClassesEndHour
 * (lib/onboardingLogic.ts) : un evenement du soir ou de plus de 12 h n'est pas
 * un cours.
 */
export function busyLineForDay(
  day: Date,
  context: { slots: BusySlot[] | null; classesEndHour: number | null }
): Copy | null {
  const dayYmd = localYmd(day);
  let first: Date | null = null;
  let last: Date | null = null;
  for (const slot of context.slots ?? []) {
    const start = validDate(slot.start);
    const end = validDate(slot.end);
    if (!start || !end || end <= start) continue;
    if (localYmd(start) !== dayYmd) continue;
    const hour = start.getHours() + start.getMinutes() / 60;
    if (hour < 7 || hour >= 19) continue;
    if (end.getTime() - start.getTime() > 12 * 60 * 60 * 1000) continue;
    if (!first || start < first) first = start;
    if (!last || end > last) last = end;
  }

  const weekday = day.getDay();
  const declared = !!context.classesEndHour && weekday >= 1 && weekday <= 5;

  if (first && last) {
    if (declared) {
      // Debut et fin des cours declares (8h, meme valeur que CLASSES_START cote serveur).
      const classesStart = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 8, 0);
      const classesEnd = new Date(day.getFullYear(), day.getMonth(), day.getDate(), context.classesEndHour as number, 0);
      if (classesStart < first) first = classesStart;
      if (classesEnd > last) last = classesEnd;
    }
    return {
      key: 'onbPlanBusyRange',
      params: { from: formatHour(first), to: formatHour(last) },
      fallback: 'Occupé de {from} à {to}',
    };
  }
  if (declared) {
    return {
      key: 'onbPlanClassesUntil',
      params: { hour: context.classesEndHour as number },
      fallback: "Cours jusqu'à {hour}h",
    };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Les reponses du questionnaire qui ressortent
// ---------------------------------------------------------------------------

const list = (value: unknown): string[] => (Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : []);
const num = (value: unknown): number | null => (typeof value === 'number' && Number.isFinite(value) ? value : null);

/**
 * Lecture des reponses en quelques traits. Les echelles du questionnaire vont
 * de 1 a 5 et partent de 3 par defaut : seuls les extremes (1-2, 4-5) sont lus
 * comme une vraie reponse, un 3 peut etre un curseur jamais touche.
 */
export function readTraits(answers: Answers) {
  const struggles = list(answers.dailyStruggles);
  const goals = list(answers.goals);
  const wantToChange = list(answers.wantToChange);
  const focusQuality = num(answers.focusQuality);
  const mentalLoad = num(answers.mentalLoad);
  const pressure = num(answers.pressureLevel);
  return {
    focus: struggles.includes('focus') || (focusQuality !== null && focusQuality <= 2),
    overwhelmed:
      struggles.includes('toomany') ||
      answers.overthinkTasks === true ||
      goals.includes('overwhelmed') ||
      (mentalLoad !== null && mentalLoad >= 4),
    behind: struggles.includes('fear') || answers.currentSituation === 'catchingup',
    guilt: struggles.includes('guilt') || answers.shouldDoMore === true,
    pressure:
      struggles.includes('stress') ||
      goals.includes('stress') ||
      wantToChange.includes('reducestress') ||
      (pressure !== null && pressure >= 4),
    triedBefore: list(answers.triedBefore),
  };
}

/**
 * Phrases de l'ecran du planning : 2 a 3, chacune construite sur une reponse
 * reelle et sur ce que le planning fait VRAIMENT (seances de N minutes avec un
 * chapitre, recalcul chaque nuit, temps libre en dehors). Complete par des
 * phrases neutres quand les reponses ne disent rien : l'ecran en a toujours 2.
 */
export function planInsights(answers: Answers, summary: PlanSummary, max = 3): Copy[] {
  const traits = readTraits(answers);
  const out: Copy[] = [];
  const used = new Set<string>();
  const push = (topic: string, copy: Copy) => {
    if (used.has(topic) || out.length >= max) return;
    used.add(topic);
    out.push(copy);
  };

  if (traits.focus) {
    push('length', {
      key: 'onbPlanInsightFocus',
      params: { minutes: summary.typicalMinutes },
      fallback: "Tu as dit que ta concentration s'éparpille : tes séances font {minutes} min, pas plus.",
    });
  }
  if (traits.overwhelmed) {
    push(
      'what',
      summary.hasChapters
        ? {
            key: 'onbPlanInsightOverwhelmed',
            fallback: 'Tu as dit que tu ne sais plus par quoi commencer : chaque séance a déjà son chapitre et son heure.',
          }
        : {
            key: 'onbPlanInsightOverwhelmedNoChapters',
            fallback: 'Tu as dit que tu ne sais plus par quoi commencer : chaque séance a déjà sa matière et son heure.',
          }
    );
  }
  if (traits.behind) {
    // Le rattrapage d'une seance ratee est reserve a Premium (autoPlan.ts,
    // catchUpMode "full") : un nouvel inscrit est gratuit, donc on ne lui
    // promet que le recalcul de nuit, vrai pour tous, et on nomme Premium pour
    // le reste.
    push('replan', {
      key: 'onbPlanInsightBehind',
      fallback:
        "Tu as peur de prendre du retard : chaque nuit, ton planning se recalcule sur ce qu'il te reste. Avec Premium, une séance ratée est replacée toute seule.",
    });
  }
  if (traits.guilt) {
    push('rest', {
      key: 'onbPlanInsightGuilt',
      fallback: "Tu culpabilises quand tu te reposes : tout ce qui n'est pas dans ce planning, c'est du temps libre.",
    });
  }
  if (traits.pressure && summary.sessions > 1) {
    // « sur 14 jours » serait faux quand l'examen tombe avant : le planning
    // s'arrete a l'examen. On donne le nombre, pas la duree.
    push('pressure', {
      key: 'onbPlanInsightPressure',
      params: { count: summary.sessions },
      fallback: 'Tu as dit que la pression est forte : {count} séances sont déjà placées, et chaque matin tu sais ce que tu révises.',
    });
  }

  // Replis neutres, vrais pour tout planning.
  push(
    'what',
    summary.hasChapters
      ? {
          key: 'onbPlanInsightNeutralWhat',
          fallback: "Chaque séance a son chapitre et son heure : tu n'as plus à décider quoi réviser.",
        }
      : {
          key: 'onbPlanInsightNeutralWhatNoChapters',
          fallback: "Chaque séance a sa matière et son heure : tu n'as plus à décider quand réviser.",
        }
  );
  // Pas de « si tu rates une seance » : en gratuit, une seance ratee n'est
  // pas replacee (autoPlan.ts), seul le recalcul de nuit est vrai pour tous.
  push('replan', {
    key: 'onbPlanInsightNeutralReplan',
    fallback: "Chaque nuit, ton planning se recalcule sur ce qu'il te reste à réviser.",
  });
  // Au moins 2 : chacun des deux replis couvre un sujet different, et un sujet
  // deja pris par une vraie reponse en fournit deja une.
  return out;
}

/**
 * Phrases de l'ecran avant le paywall. La premiere reprend « Tu as deja
 * essaye quoi ? », la seconde la concentration. Toutes deux vendent ce que
 * Premium ajoute (le verrouillage), jamais un « essai ».
 */
export function trialInsights(answers: Answers, summary: PlanSummary): Copy[] {
  const traits = readTraits(answers);
  const out: Copy[] = [];
  const tried = traits.triedBefore;

  if (tried.includes('screen_time')) {
    out.push({
      key: 'onbTrialInsightScreenTime',
      fallback: "Tu as déjà essayé le Temps d'écran : il se lève avec « Ignorer la limite ». Pendant une séance Productif, ce bouton n'existe pas.",
    });
  } else if (tried.includes('airplane_mode')) {
    out.push({
      key: 'onbTrialInsightAirplane',
      fallback: "Tu as déjà essayé le mode avion : il se coupe en deux secondes. Pendant une séance, tes applis restent fermées jusqu'à la fin.",
    });
  } else if (tried.includes('other_room')) {
    out.push({
      key: 'onbTrialInsightOtherRoom',
      fallback: 'Tu as déjà essayé le téléphone dans une autre pièce : il finit toujours par revenir. Ici tu le gardes, tes applis restent fermées.',
    });
  } else if (tried.includes('nothing')) {
    out.push({
      key: 'onbTrialInsightNothing',
      fallback: "Tu n'as encore rien essayé : ici, pas de réglage à tenir, le verrou se pose et se lève tout seul à l'heure de tes séances.",
    });
  }

  if (traits.focus) {
    out.push({
      key: 'onbTrialInsightFocus',
      params: { minutes: summary.typicalMinutes },
      fallback: "Tu as dit que ta concentration s'éparpille : tes séances font {minutes} min, téléphone verrouillé.",
    });
  } else if (traits.overwhelmed) {
    out.push(
      summary.hasChapters
        ? {
            key: 'onbTrialInsightOverwhelmed',
            fallback: "Tu as dit que tu ne sais plus par quoi commencer : à l'heure dite, le chapitre est choisi et tes applis sont déjà fermées.",
          }
        : {
            key: 'onbTrialInsightOverwhelmedNoChapters',
            fallback: "Tu as dit que tu ne sais plus par quoi commencer : à l'heure dite, la matière est choisie et tes applis sont déjà fermées.",
          }
    );
  }

  if (out.length === 0) {
    out.push({
      key: 'onbTrialInsightNeutral',
      fallback: "Pendant une séance, tes applis choisies restent fermées jusqu'à la fin. Aucun bouton pour tricher.",
    });
  }
  return out.slice(0, 2);
}

// ---------------------------------------------------------------------------
// Du planning au Mode Examen
// ---------------------------------------------------------------------------

/**
 * Parametres de /exam/setup pour lancer la seance sur CE bloc. Meme forme que
 * la carte du planning (StudyPlanCard.openExamOn, PlannedBlockParams dans
 * utils/examAccessRules.ts) : l'ecran de reglage met ce chapitre en tete et
 * reprend la duree du bloc. Sans bloc, rien : l'ecran choisit lui-meme.
 */
export function examParamsForBlock(block: PlanBlock | null): Record<string, string> {
  if (!block) return {};
  return {
    taskId: block.taskId,
    title: block.title,
    subjectId: block.subjectId ?? '',
    subjectName: block.subjectName ?? '',
    minutes: String(block.minutes),
    fromPlan: '1',
  };
}

// ---------------------------------------------------------------------------
// Sortie du paywall de l'ecran d'essai
// ---------------------------------------------------------------------------

/** Ce que l'ecran a obtenu de useSuperwall().triggerEvent, ou une exception. */
export type TrialPaywallOutcome =
  | {
      kind: 'result';
      reason: string;
      presented: boolean;
      result: 'purchased' | 'restored' | 'declined' | null;
      skippedReason: string | null;
    }
  | { kind: 'error' };

export interface TrialExit {
  /**
   * Ecran suivant. `verify` : relire l'abonnement (serveur force, puis StoreKit)
   * avant de choisir, parce que l'issue du paywall ne dit rien d'utile.
   */
  next: 'premium-setup' | 'free-sessions' | 'verify';
  /** Raison a journaliser en `paywall_skipped`, null si un paywall s'est bien affiche. */
  skipped: string | null;
}

/**
 * Ou mene le bouton « Activer le blocage automatique » une fois le paywall
 * passe. Regles :
 *   - deja premium (le hook n'a rien affiche) ou achat, ou restauration :
 *     l'ecran apres achat ;
 *   - refus explicite : les seances offertes, sans autre verification ;
 *   - aucun paywall affiche (placement absent du tableau de bord, holdout,
 *     audience non trouvee, delai, erreur) : on journalise `paywall_skipped` et
 *     on verifie. Un compte deja abonne chez Apple peut ne pas voir de paywall
 *     (audience qui l'exclut) : il ne doit pas atterrir sur l'ecran « refus » ;
 *   - paywall ferme sans resultat connu : on verifie aussi, sans `paywall_skipped`.
 */
export function decideTrialExit(outcome: TrialPaywallOutcome): TrialExit {
  if (outcome.kind === 'error') return { next: 'verify', skipped: 'error' };
  if (outcome.reason === 'premium_user') return { next: 'premium-setup', skipped: null };
  if (outcome.result === 'purchased' || outcome.result === 'restored') {
    return { next: 'premium-setup', skipped: null };
  }
  if (outcome.result === 'declined') return { next: 'free-sessions', skipped: null };
  if (outcome.reason === 'presented') {
    if (outcome.presented) return { next: 'verify', skipped: null };
    return { next: 'verify', skipped: outcome.skippedReason ?? 'not_presented' };
  }
  return { next: 'verify', skipped: outcome.reason || 'unknown' };
}

// ---------------------------------------------------------------------------
// Reprise apres une app tuee
// ---------------------------------------------------------------------------

/**
 * Route ou reprendre l'onboarding, ou null s'il n'y a rien a reprendre.
 * `resumable` : les ecrans ou l'on peut revenir, dans l'ordre du parcours (le
 * premier sert quand le dernier ecran est inconnu : app tuee juste apres la
 * creation du compte, ou nom d'ecran d'une ancienne version).
 */
export function resumeRouteFor(
  inProgress: boolean,
  lastStep: string | null,
  resumable: readonly string[]
): string | null {
  if (!inProgress || resumable.length === 0) return null;
  const step = lastStep && resumable.includes(lastStep) ? lastStep : resumable[0];
  return `/(onboarding-new)/${step}`;
}

// ---------------------------------------------------------------------------
// Calcul du planning
// ---------------------------------------------------------------------------

/**
 * Le calcul a-t-il echoue sur le delai de l'app ? apiCall (lib/api.ts) rejette
 * au bout du delai avec « La requête a pris trop de temps », et c'est ce qui
 * distingue un serveur lent d'une panne dans `onboarding_plan_built`.
 */
export function isPlanTimeout(error: unknown, elapsedMs: number, timeoutMs: number): boolean {
  if (elapsedMs >= timeoutMs - 250) return true;
  const message = error instanceof Error ? error.message : String(error ?? '');
  return /timeout|trop de temps/i.test(message);
}

// ---------------------------------------------------------------------------
// Seances offertes (apres un refus)
// ---------------------------------------------------------------------------

/**
 * Titre de l'ecran des seances offertes, accorde au nombre que renvoie
 * GET /api/auth/me (`examFreeRemaining`). null = le serveur ne dit rien (serveur
 * anterieur a la 1.5, reponse degradee) : on ne promet alors aucune seance.
 */
export function freeSessionsTitle(remaining: number | null): Copy {
  if (remaining === null) {
    return { key: 'onbFreeTitleUnknown', fallback: 'Ton planning est prêt' };
  }
  if (remaining <= 0) {
    return { key: 'onbFreeTitleNone', fallback: 'Tes séances offertes sont utilisées' };
  }
  if (remaining === 1) {
    return { key: 'onbFreeTitleOne', fallback: 'Ta séance bloquée offerte' };
  }
  return {
    key: 'onbFreeTitleMany',
    params: { count: remaining },
    fallback: 'Tes {count} séances bloquées offertes',
  };
}

// ---------------------------------------------------------------------------
// Blocage automatique active (apres un achat)
// ---------------------------------------------------------------------------

/**
 * Ce que l'ecran apres achat dit du blocage automatique, selon le compte rendu
 * de la synchronisation (lib/studyPlanSync.ts, statut de utils/autoBlocking.ts).
 * Chaque phrase dit ce qui se passe VRAIMENT : le blocage ne programme que les
 * seances des 24 prochaines heures, et il est reprogramme a chaque ouverture
 * de l'app.
 */
export function autoBlockResultCopy(
  status: string | null,
  scheduled: number,
  next: PlanBlock | null,
  now: Date,
  formatDay: (date: Date) => string
): Copy {
  if (status === 'active') {
    if (scheduled > 1) {
      return {
        key: 'onbSetupAutoActiveMany',
        params: { count: scheduled },
        fallback: "C'est prêt : tes {count} prochaines séances se verrouilleront toutes seules.",
      };
    }
    if (scheduled === 1) {
      return {
        key: 'onbSetupAutoActiveOne',
        fallback: "C'est prêt : ta prochaine séance se verrouillera toute seule.",
      };
    }
    // Actif, mais rien de programme : le blocage ne se programme qu'a
    // l'ouverture de l'app, pour les 24 heures qui suivent
    // (utils/autoBlocking.ts). On le dit, pour que « 0 programmee » ne passe
    // pas pour une panne, et sans promettre ce que l'app ne fait pas seule.
    if (next) {
      const start = new Date(next.start);
      const offset = localDayOffset(start, now);
      const time = formatHour(start);
      if (offset <= 0) {
        return {
          key: 'onbSetupAutoActiveLaterToday',
          params: { time },
          fallback:
            "C'est activé. Le blocage se programme à chaque ouverture de l'app, pour les 24 heures qui suivent. Ta prochaine séance : aujourd'hui à {time}.",
        };
      }
      if (offset === 1) {
        return {
          key: 'onbSetupAutoActiveLaterTomorrow',
          params: { time },
          fallback:
            "C'est activé. Le blocage se programme à chaque ouverture de l'app, pour les 24 heures qui suivent. Ta prochaine séance : demain à {time}.",
        };
      }
      return {
        key: 'onbSetupAutoActiveLaterDay',
        params: { time, day: formatDay(start) },
        fallback:
          "C'est activé. Le blocage se programme à chaque ouverture de l'app, pour les 24 heures qui suivent. Ta prochaine séance : {day} à {time}.",
      };
    }
    return {
      key: 'onbSetupAutoActiveNoBlock',
      fallback: "C'est activé : dès qu'une séance est placée dans ton planning, elle se verrouille toute seule.",
    };
  }
  if (status === 'not_premium') {
    // Le webhook d'achat n'est pas encore arrive (il suit souvent la fermeture
    // du paywall), ou c'est une restauration, qui n'en produit aucun. On ne
    // promet donc pas de delai.
    return {
      key: 'onbSetupAutoPending',
      fallback:
        "Apple a bien enregistré ton abonnement, notre serveur ne l'a pas encore reçu. Le blocage automatique se programmera tout seul dès qu'il l'aura, à une prochaine ouverture de l'app.",
    };
  }
  if (status === 'not_authorized') {
    return {
      key: 'onbSetupAutoNotAuthorized',
      fallback: "Sans l'autorisation Temps d'écran, iOS ne laisse pas l'app bloquer tes applis.",
    };
  }
  if (status === 'no_selection') {
    return {
      key: 'onbSetupAutoNoSelection',
      fallback: 'Choisis au moins une appli à bloquer pendant tes séances.',
    };
  }
  if (status === 'unsupported') {
    return {
      key: 'onbSetupAutoUnsupported',
      fallback: "Le blocage des applis n'est pas disponible sur cet appareil.",
    };
  }
  return {
    key: 'onbSetupAutoRetryLater',
    fallback: "Le blocage n'a pas pu être programmé tout de suite. L'app recommencera à ta prochaine ouverture.",
  };
}
