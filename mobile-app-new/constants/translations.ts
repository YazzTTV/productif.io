/**
 * Système de traductions complet pour l'application mobile
 * Supporte: Français (fr), Anglais (en), Espagnol (es)
 */

export type Language = 'fr' | 'en' | 'es';

export const translations = {
  // ═══════════════════════════════════════════════════════════════════════════
  // FRANÇAIS
  // ═══════════════════════════════════════════════════════════════════════════
  fr: {
    // ─── Sélection de langue ───────────────────────────────────────────────────
    chooseLanguage: 'Choisissez votre langue',
    changeAnytime: 'Vous pouvez changer cela à tout moment.',
    
    // ─── Écran d'accueil ───────────────────────────────────────────────────────
    welcomeTitle: 'Vous travaillez dur. Mais sans système.',
    welcomeSubtitle: 'Productif.io aide les étudiants à transformer leurs efforts en résultats — sans épuisement.',
    getStarted: 'Continuer',
    alreadyHaveAccount: "J'ai déjà un compte",
    
    // ─── Authentification ──────────────────────────────────────────────────────
    welcomeBack: 'Bon retour',
    createAccount: 'Créez votre compte',
    chooseFastest: 'Choisissez la façon la plus rapide de continuer.',
    continueWithGoogle: 'Continuer avec Google',
    continueWithApple: 'Continuer avec Apple',
    continueWithEmail: 'Continuer avec Email',
    or: 'ou',
    emailPlaceholder: 'Votre email',
    passwordPlaceholder: 'Mot de passe',
    noSpam: 'Nous ne spammons jamais.',
    createAccountLink: 'Créer un compte',
    loginButton: 'Se connecter',
    signUpButton: "S'inscrire",
    forgotPassword: 'Mot de passe oublié ?',
    
    // ─── Value Awareness ───────────────────────────────────────────────────────
    notTheProblem: "Vous n'êtes pas le problème.",
    workALot: 'Vous travaillez beaucoup.',
    stayDisciplined: 'Vous essayez de rester discipliné.',
    feelsScattered: 'Mais tout semble éparpillé.',
    lackOfSystem: "Le problème est l'absence d'un système clair.",
    
    // ─── Identity ──────────────────────────────────────────────────────────────
    tellAboutYourself: 'Parlez-nous de vous.',
    firstName: 'Prénom',
    studentType: "Type d'étudiant",
    highSchool: 'Lycée',
    university: 'Université',
    medLawPrepa: 'Médecine / Droit / Prépa',
    engineeringBusiness: "École d'ingénieurs / Commerce",
    other: 'Autre',
    helpsAdapt: 'Cela nous aide à adapter le système pour vous.',
    next: 'Suivant',
    continue: 'Continuer',
    
    // ─── Goals & Pressure ──────────────────────────────────────────────────────
    whatMatters: "Qu'est-ce qui compte le plus en ce moment ?",
    succeedExams: 'Réussir mes examens',
    reduceStress: 'Réduire le stress',
    stayConsistent: 'Rester constant',
    stopOverwhelmed: 'Arrêter de me sentir débordé',
    useTimeBetter: 'Mieux utiliser mon temps',
    pressureLevel: "Quelle est l'intensité de votre pression actuelle ?",
    low: 'Faible',
    veryHigh: 'Très élevée',
    
    // ─── Academic Context ──────────────────────────────────────────────────────
    currentSituation: 'Laquelle de ces situations vous ressemble le plus ?',
    selectOne: 'Sélectionnez une option',
    preparingExams: 'Je bosse beaucoup… mais je ne me sens pas efficace.',
    maintainingConsistency: "Je suis constamment en retard, peu importe combien j'essaie.",
    catchingUp: 'Je suis stressé même quand je travaille.',
    highPerformance: 'Les examens approchent et je me sens mal préparé.',
    stressManagement: "Je n'ai pas de système clair, tout semble désordonné.",
    
    // ─── Daily Struggles ───────────────────────────────────────────────────────
    dailyDifficulties: 'Quels sont les défis quotidiens ?',
    selectMultiple: "Sélectionnez toutes les options qui s'appliquent",
    tooManyTasks: 'Trop de tâches dans ma tête',
    difficultyFocusing: 'Difficulté à se concentrer profondément',
    constantStress: 'Stress constant',
    guiltyResting: 'Se sentir coupable de se reposer',
    fearFallingBehind: 'Peur de se laisser distancer par les autres',
    
    // ─── Work Style Diagnostic ─────────────────────────────────────────────────
    workStyleTitle: 'Aidez-nous à comprendre votre style de travail',
    helpUsUnderstand: 'Soyez honnête — cela nous aide à adapter le système',
    mentalLoad: 'Charge mentale',
    focusQuality: 'Qualité de la concentration',
    endOfDaySatisfaction: 'Satisfaction à la fin de la journée',
    moderate: 'Modéré',
    overwhelming: 'Écrasant',
    scattered: 'Éparpillé',
    deep: 'Profond',
    never: 'Jamais',
    sometimes: 'Parfois',
    often: 'Souvent',
    overthinkQuestion: 'Réfléchissez-vous trop à ce sur quoi travailler ?',
    shouldDoMoreQuestion: 'Vous sentez-vous toujours obligé de faire plus ?',
    yes: 'Oui',
    no: 'Non',
    
    // ─── Goals & Intent ────────────────────────────────────────────────────────
    whatToChange: 'Ce que vous voulez changer ?',
    workWithClarity: 'Travailler avec clarté',
    feelInControl: 'Se sentir en contrôle',
    beConsistent: 'Être plus constant',
    stopWastingEnergy: "Arrêter de gaspiller de l'énergie mentale",
    timeHorizon: 'Horizon temporel',
    next2Weeks: 'Les 2 prochaines semaines',
    thisSemester: 'Ce semestre',
    thisYear: 'Cette année',
    
    // ─── Tasks Awareness ───────────────────────────────────────────────────────
    whatToDo: 'Que devez-vous faire demain ?',
    writeOrSpeak: 'Écrivez ou parlez librement. Nous organiserons tout.',
    messyIsFine: "Le désordre n'est pas grave.",
    classesLectures: 'Cours / conférences',
    deadlines: 'Échéances',
    revisions: 'Révisions',
    avoiding: "Choses que j'évite",
    personalObligations: 'Obligations personnelles',
    typeOrSpeak: 'Tapez ici ou appuyez sur le micro pour parler...',
    
    // ─── Task Clarification ────────────────────────────────────────────────────
    whatWeUnderstood: 'Voici ce que nous avons compris.',
    mustDoTomorrow: 'À faire demain',
    buildIdealDay: 'Construire ma journée idéale',
    
    // ─── AI Processing ─────────────────────────────────────────────────────────
    designingDay: 'Conception de votre journée idéale…',
    understandingPriorities: 'Comprendre les priorités',
    estimatingEffort: "Estimer l'effort et l'énergie",
    creatingPlan: 'Créer un plan réaliste',
    
    // ─── Ideal Day ─────────────────────────────────────────────────────────────
    idealDayTitle: 'Voici votre journée idéale pour demain.',
    topPriorities: 'Vos 3 priorités',
    enoughForGoodDay: 'Cela suffit pour faire de demain une bonne journée.',
    syncCalendar: 'Synchroniser avec Google Agenda',
    startFocusNow: 'Commencer Focus maintenant',
    adjust: 'Ajuster',
    
    // ─── Calendar Sync ─────────────────────────────────────────────────────────
    syncYourDay: 'Synchronisez votre journée',
    googleCalendar: 'Google Agenda',
    appleCalendar: 'Calendrier Apple',
    createEvents: 'Nous créons des événements pour votre plan.',
    connectCalendar: 'Connecter le calendrier',
    skip: 'Passer pour le moment',
    
    // ─── Success ───────────────────────────────────────────────────────────────
    dayIsReady: 'Votre journée est prête.',
    focusWithoutThinking: 'Vous pouvez maintenant vous concentrer sans réfléchir.',
    startFocus: 'Commencer Focus',
    viewInCalendar: 'Voir dans le calendrier',
    freePlanActivated: 'Plan gratuit activé.',
    
    // ─── Dashboard ─────────────────────────────────────────────────────────────
    goodMorning: 'Bonjour',
    goodAfternoon: 'Bon après-midi',
    goodEvening: 'Bonsoir',
    todaysIdealDay: 'Journée idéale de {name}',
    today: "Aujourd'hui",
    currentState: 'État actuel',
    focus: 'Focus',
    energy: 'Énergie',
    stress: 'Stress',
    mainPriority: 'Priorité principale',
    alsoScheduled: 'Également planifié',
    todaysHabits: "Habitudes d'aujourd'hui",
    startFocusButton: 'Commencer Focus',
    
    // ─── Navigation ────────────────────────────────────────────────────────────
    home: 'Accueil',
    tasks: 'Tâches',
    agent: 'Agent',
    mood: 'Humeur',
    board: 'Classement',
    settings: 'Paramètres',
    
    // ─── AI Conductor ──────────────────────────────────────────────────────────
    aiConductor: 'Conducteur IA',
    systemActions: 'Actions système',
    whatWouldYouLikeToDo: 'Que souhaitez-vous faire ?',
    planMyDay: 'Planifier ma journée',
    generateOptimizedSchedule: 'Générer un planning optimisé',
    startFocusAction: 'Commencer focus',
    beginMainPriority: 'Commencer votre priorité principale',
    manageHabits: 'Gérer les habitudes',
    viewUpdateHabits: 'Voir et mettre à jour les habitudes',
    dailyJournal: 'Journal quotidien',
    reflectOnProgress: 'Réfléchir à vos progrès',
    noChatMode: 'Pas de chat ouvert. Le système décide, vous validez.',
    recentInsights: 'Insights récents',
    focusPeaks: 'Votre concentration culmine entre 9h et 11h.',
    scheduleHardTasksEarly: 'Planifiez les tâches difficiles tôt.',
    restDaysImprove: 'Les jours de repos améliorent les performances de 18%.',
    sundayRecovery: 'Le dimanche est votre jour de récupération idéal.',
    workBestIn90Min: 'Vous travaillez mieux par blocs de 90 minutes.',
    adjustedSchedule: 'Planning ajusté en conséquence.',
    
    // ─── Focus Mode ────────────────────────────────────────────────────────────
    pause: 'Pause',
    resume: 'Reprendre',
    everythingElseDisappeared: 'Tout le reste a disparu.',
    
    // ─── Leaderboard ───────────────────────────────────────────────────────────
    leaderboard: 'Classement',
    consistencyBeatsIntensity: "La constance bat l'intensité.",
    todayFilter: "Aujourd'hui",
    weekFilter: 'Semaine',
    allTimeFilter: 'Tout temps',
    youDontNeedToWin: "Vous n'avez pas besoin de gagner.",
    youJustNeedToShowUp: "Vous avez juste besoin d'être présent.",
    rankedByConsistency: 'Classé par constance, pas par volume.',
    daysStreak: 'j de série',
    sessions: 'sessions',
    xpPoints: 'XP',
    you: 'Vous',
    seeFull: 'Voir le classement complet',
    upgradeToPremium: 'Passer à Premium',
    currentStreak: 'Série actuelle',
    days: 'jours',
    weeklyXp: 'XP hebdo',
    totalXp: 'XP total',
    todaysXp: "XP d'aujourd'hui",
    focusSessions: 'Sessions focus',
    thisWeek: 'cette semaine',
    statsPrivate: 'Les stats sont privées. Pas de messagerie.',
    
    // ─── Settings ──────────────────────────────────────────────────────────────
    language: 'Langue',
    theme: 'Thème',
    light: 'Clair',
    dark: 'Sombre',
    system: 'Système',
    notifications: 'Notifications',
    account: 'Compte',
    logout: 'Déconnexion',
    deleteAccount: 'Supprimer le compte',
    about: 'À propos',
    help: 'Aide',
    privacy: 'Confidentialité',
    terms: 'Conditions',
    
    // ─── Paywall ───────────────────────────────────────────────────────────────
    unlockFullPotential: 'Débloquez tout le potentiel',
    freeTrial: '7 jours gratuits',
    monthlyPlan: 'Mensuel',
    yearlyPlan: 'Annuel',
    perMonth: '/mois',
    perYear: '/an',
    bestValue: 'Meilleure offre',
    savePercent: 'Économisez {percent}%',
    unlimitedAI: 'IA illimitée',
    advancedAnalytics: 'Analyses avancées',
    prioritySupport: 'Support prioritaire',
    allFeatures: 'Toutes les fonctionnalités',
    startTrial: "Commencer l'essai gratuit",
    restorePurchases: 'Restaurer les achats',
    
    // ─── Erreurs & Messages ────────────────────────────────────────────────────
    error: 'Erreur',
    success: 'Succès',
    loading: 'Chargement...',
    retry: 'Réessayer',
    cancel: 'Annuler',
    save: 'Sauvegarder',
    delete: 'Supprimer',
    confirm: 'Confirmer',
    networkError: 'Erreur de connexion',
    tryAgain: 'Veuillez réessayer',
    somethingWentWrong: "Une erreur s'est produite",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ENGLISH
  // ═══════════════════════════════════════════════════════════════════════════
  en: {
    // ─── Language Selection ────────────────────────────────────────────────────
    chooseLanguage: 'Choose your language',
    changeAnytime: 'You can change this anytime.',
    
    // ─── Welcome Screen ────────────────────────────────────────────────────────
    welcomeTitle: 'You work hard. But without a system.',
    welcomeSubtitle: 'Productif.io helps students turn effort into results — without burnout.',
    getStarted: 'Continue',
    alreadyHaveAccount: 'I already have an account',
    
    // ─── Authentication ────────────────────────────────────────────────────────
    welcomeBack: 'Welcome back',
    createAccount: 'Create your account',
    chooseFastest: 'Choose the fastest way to continue.',
    continueWithGoogle: 'Continue with Google',
    continueWithApple: 'Continue with Apple',
    continueWithEmail: 'Continue with Email',
    or: 'or',
    emailPlaceholder: 'Your email',
    passwordPlaceholder: 'Password',
    noSpam: "We don't spam. Ever.",
    createAccountLink: 'Create an account',
    loginButton: 'Log in',
    signUpButton: 'Sign up',
    forgotPassword: 'Forgot password?',
    
    // ─── Value Awareness ───────────────────────────────────────────────────────
    notTheProblem: "You're not the problem.",
    workALot: 'You work a lot.',
    stayDisciplined: 'You try to stay disciplined.',
    feelsScattered: 'But everything feels scattered.',
    lackOfSystem: 'The problem is the lack of a clear system.',
    
    // ─── Identity ──────────────────────────────────────────────────────────────
    tellAboutYourself: 'Tell us about yourself.',
    firstName: 'First name',
    studentType: 'Student type',
    highSchool: 'High school',
    university: 'University',
    medLawPrepa: 'Med / Law / Prepa',
    engineeringBusiness: 'Engineering / Business school',
    other: 'Other',
    helpsAdapt: 'This helps us adapt the system to you.',
    next: 'Next',
    continue: 'Continue',
    
    // ─── Goals & Pressure ──────────────────────────────────────────────────────
    whatMatters: 'What matters most right now?',
    succeedExams: 'Succeed in exams',
    reduceStress: 'Reduce stress',
    stayConsistent: 'Stay consistent',
    stopOverwhelmed: 'Stop feeling overwhelmed',
    useTimeBetter: 'Use my time better',
    pressureLevel: 'How intense is your current pressure?',
    low: 'Low',
    veryHigh: 'Very high',
    
    // ─── Academic Context ──────────────────────────────────────────────────────
    currentSituation: 'Which of these feels closest to your situation?',
    selectOne: 'Select one',
    preparingExams: "I study a lot… but I don't feel efficient.",
    maintainingConsistency: "I'm constantly behind, no matter how hard I try.",
    catchingUp: "I'm stressed even when I'm working.",
    highPerformance: 'Exams are coming and I feel underprepared.',
    stressManagement: "I don't have a clear system — everything feels messy.",
    
    // ─── Daily Struggles ───────────────────────────────────────────────────────
    dailyDifficulties: 'What makes your days difficult?',
    selectMultiple: 'Select all that apply',
    tooManyTasks: 'Too many tasks in my head',
    difficultyFocusing: 'Difficulty focusing deeply',
    constantStress: 'Constant stress',
    guiltyResting: 'Feeling guilty when resting',
    fearFallingBehind: 'Fear of falling behind others',
    
    // ─── Work Style Diagnostic ─────────────────────────────────────────────────
    workStyleTitle: 'Help us understand your work style',
    helpUsUnderstand: 'Be honest — this helps us adapt the system',
    mentalLoad: 'Mental load',
    focusQuality: 'Focus quality',
    endOfDaySatisfaction: 'End-of-day satisfaction',
    moderate: 'Moderate',
    overwhelming: 'Overwhelming',
    scattered: 'Scattered',
    deep: 'Deep',
    never: 'Never',
    sometimes: 'Sometimes',
    often: 'Often',
    overthinkQuestion: 'Do you overthink what to work on?',
    shouldDoMoreQuestion: 'Do you feel you should always do more?',
    yes: 'Yes',
    no: 'No',
    
    // ─── Goals & Intent ────────────────────────────────────────────────────────
    whatToChange: 'What do you want to change?',
    workWithClarity: 'Work with clarity',
    feelInControl: 'Feel in control',
    beConsistent: 'Be more consistent',
    stopWastingEnergy: 'Stop wasting mental energy',
    timeHorizon: 'Time horizon',
    next2Weeks: 'Next 2 weeks',
    thisSemester: 'This semester',
    thisYear: 'This year',
    
    // ─── Tasks Awareness ───────────────────────────────────────────────────────
    whatToDo: 'What do you have to do tomorrow?',
    writeOrSpeak: "Write or speak freely. We'll organize it.",
    messyIsFine: 'Messy is fine.',
    classesLectures: 'Classes / lectures',
    deadlines: 'Deadlines',
    revisions: 'Revisions',
    avoiding: "Things I'm avoiding",
    personalObligations: 'Personal obligations',
    typeOrSpeak: 'Type here or tap mic to speak...',
    
    // ─── Task Clarification ────────────────────────────────────────────────────
    whatWeUnderstood: "Here's what we understood.",
    mustDoTomorrow: 'Must do tomorrow',
    buildIdealDay: 'Build my ideal day',
    
    // ─── AI Processing ─────────────────────────────────────────────────────────
    designingDay: 'Designing your ideal day…',
    understandingPriorities: 'Understanding priorities',
    estimatingEffort: 'Estimating effort & energy',
    creatingPlan: 'Creating a realistic plan',
    
    // ─── Ideal Day ─────────────────────────────────────────────────────────────
    idealDayTitle: "Here's your ideal day for tomorrow.",
    topPriorities: 'Your 3 priorities',
    enoughForGoodDay: 'This is enough to make tomorrow a good day.',
    syncCalendar: 'Sync to Google Calendar',
    startFocusNow: 'Start Focus now',
    adjust: 'Adjust',
    
    // ─── Calendar Sync ─────────────────────────────────────────────────────────
    syncYourDay: 'Sync your day',
    googleCalendar: 'Google Calendar',
    appleCalendar: 'Apple Calendar',
    createEvents: 'We create events for your plan.',
    connectCalendar: 'Connect Calendar',
    skip: 'Skip for now',
    
    // ─── Success ───────────────────────────────────────────────────────────────
    dayIsReady: 'Your day is ready.',
    focusWithoutThinking: 'You can now focus without thinking.',
    startFocus: 'Start Focus',
    viewInCalendar: 'View in Calendar',
    freePlanActivated: 'Free plan activated.',
    
    // ─── Dashboard ─────────────────────────────────────────────────────────────
    goodMorning: 'Good morning',
    goodAfternoon: 'Good afternoon',
    goodEvening: 'Good evening',
    todaysIdealDay: "{name}'s Ideal Day",
    today: 'Today',
    currentState: 'Current state',
    focus: 'Focus',
    energy: 'Energy',
    stress: 'Stress',
    mainPriority: 'Main priority',
    alsoScheduled: 'Also scheduled',
    todaysHabits: "Today's habits",
    startFocusButton: 'Start focus',
    
    // ─── Navigation ────────────────────────────────────────────────────────────
    home: 'Home',
    tasks: 'Tasks',
    agent: 'Agent',
    mood: 'Mood',
    board: 'Board',
    settings: 'Settings',
    
    // ─── AI Conductor ──────────────────────────────────────────────────────────
    aiConductor: 'AI Conductor',
    systemActions: 'System actions',
    whatWouldYouLikeToDo: 'What would you like to do?',
    planMyDay: 'Plan my day',
    generateOptimizedSchedule: 'Generate an optimized schedule',
    startFocusAction: 'Start focus',
    beginMainPriority: 'Begin your main priority',
    manageHabits: 'Manage habits',
    viewUpdateHabits: 'View and update daily habits',
    dailyJournal: 'Daily journal',
    reflectOnProgress: 'Reflect on your progress',
    noChatMode: 'No open chat. The system decides, you validate.',
    recentInsights: 'Recent insights',
    focusPeaks: 'Your focus peaks between 9–11 AM.',
    scheduleHardTasksEarly: 'Schedule hard tasks early.',
    restDaysImprove: 'Rest days improve performance by 18%.',
    sundayRecovery: 'Sunday is your ideal recovery day.',
    workBestIn90Min: 'You work best in 90-minute blocks.',
    adjustedSchedule: 'Adjusted your schedule accordingly.',
    
    // ─── Focus Mode ────────────────────────────────────────────────────────────
    pause: 'Pause',
    resume: 'Resume',
    everythingElseDisappeared: 'Everything else disappeared.',
    
    // ─── Leaderboard ───────────────────────────────────────────────────────────
    leaderboard: 'Leaderboard',
    consistencyBeatsIntensity: 'Consistency beats intensity.',
    todayFilter: 'Today',
    weekFilter: 'Week',
    allTimeFilter: 'All-Time',
    youDontNeedToWin: "You don't need to win.",
    youJustNeedToShowUp: 'You just need to show up.',
    rankedByConsistency: 'Ranked by consistency, not volume.',
    daysStreak: 'd streak',
    sessions: 'sessions',
    xpPoints: 'XP',
    you: 'You',
    seeFull: 'See full rankings',
    upgradeToPremium: 'Upgrade to Premium',
    currentStreak: 'Current streak',
    days: 'days',
    weeklyXp: 'Weekly XP',
    totalXp: 'Total XP',
    todaysXp: "Today's XP",
    focusSessions: 'Focus sessions',
    thisWeek: 'this week',
    statsPrivate: 'Stats are private. No messaging available.',
    
    // ─── Settings ──────────────────────────────────────────────────────────────
    language: 'Language',
    theme: 'Theme',
    light: 'Light',
    dark: 'Dark',
    system: 'System',
    notifications: 'Notifications',
    account: 'Account',
    logout: 'Log out',
    deleteAccount: 'Delete account',
    about: 'About',
    help: 'Help',
    privacy: 'Privacy',
    terms: 'Terms',
    
    // ─── Paywall ───────────────────────────────────────────────────────────────
    unlockFullPotential: 'Unlock full potential',
    freeTrial: '7-day free trial',
    monthlyPlan: 'Monthly',
    yearlyPlan: 'Yearly',
    perMonth: '/month',
    perYear: '/year',
    bestValue: 'Best value',
    savePercent: 'Save {percent}%',
    unlimitedAI: 'Unlimited AI',
    advancedAnalytics: 'Advanced analytics',
    prioritySupport: 'Priority support',
    allFeatures: 'All features',
    startTrial: 'Start free trial',
    restorePurchases: 'Restore purchases',
    
    // ─── Errors & Messages ─────────────────────────────────────────────────────
    error: 'Error',
    success: 'Success',
    loading: 'Loading...',
    retry: 'Retry',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    confirm: 'Confirm',
    networkError: 'Connection error',
    tryAgain: 'Please try again',
    somethingWentWrong: 'Something went wrong',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ESPAÑOL
  // ═══════════════════════════════════════════════════════════════════════════
  es: {
    // ─── Selección de idioma ───────────────────────────────────────────────────
    chooseLanguage: 'Elige tu idioma',
    changeAnytime: 'Puedes cambiar esto en cualquier momento.',
    
    // ─── Pantalla de bienvenida ────────────────────────────────────────────────
    welcomeTitle: 'Trabajas duro. Pero sin sistema.',
    welcomeSubtitle: 'Productif.io ayuda a los estudiantes a convertir el esfuerzo en resultados — sin agotamiento.',
    getStarted: 'Continuar',
    alreadyHaveAccount: 'Ya tengo una cuenta',
    
    // ─── Autenticación ─────────────────────────────────────────────────────────
    welcomeBack: 'Bienvenido de vuelta',
    createAccount: 'Crea tu cuenta',
    chooseFastest: 'Elige la forma más rápida de continuar.',
    continueWithGoogle: 'Continuar con Google',
    continueWithApple: 'Continuar con Apple',
    continueWithEmail: 'Continuar con Email',
    or: 'o',
    emailPlaceholder: 'Tu email',
    passwordPlaceholder: 'Contraseña',
    noSpam: 'Nunca enviamos spam.',
    createAccountLink: 'Crear una cuenta',
    loginButton: 'Iniciar sesión',
    signUpButton: 'Registrarse',
    forgotPassword: '¿Olvidaste tu contraseña?',
    
    // ─── Value Awareness ───────────────────────────────────────────────────────
    notTheProblem: 'Tú no eres el problema.',
    workALot: 'Trabajas mucho.',
    stayDisciplined: 'Intentas mantenerte disciplinado.',
    feelsScattered: 'Pero todo parece disperso.',
    lackOfSystem: 'El problema es la falta de un sistema claro.',
    
    // ─── Identity ──────────────────────────────────────────────────────────────
    tellAboutYourself: 'Cuéntanos sobre ti.',
    firstName: 'Nombre',
    studentType: 'Tipo de estudiante',
    highSchool: 'Bachillerato',
    university: 'Universidad',
    medLawPrepa: 'Medicina / Derecho / Preparatoria',
    engineeringBusiness: 'Escuela de ingeniería / Negocios',
    other: 'Otro',
    helpsAdapt: 'Esto nos ayuda a adaptar el sistema para ti.',
    next: 'Siguiente',
    continue: 'Continuar',
    
    // ─── Goals & Pressure ──────────────────────────────────────────────────────
    whatMatters: '¿Qué es lo más importante ahora?',
    succeedExams: 'Aprobar los exámenes',
    reduceStress: 'Reducir el estrés',
    stayConsistent: 'Mantener la consistencia',
    stopOverwhelmed: 'Dejar de sentirme abrumado',
    useTimeBetter: 'Usar mejor mi tiempo',
    pressureLevel: '¿Qué tan intensa es tu presión actual?',
    low: 'Baja',
    veryHigh: 'Muy alta',
    
    // ─── Academic Context ──────────────────────────────────────────────────────
    currentSituation: '¿Cuál de estas situaciones se asemeja más a la tuya?',
    selectOne: 'Selecciona una',
    preparingExams: 'Estudio mucho… pero no me siento eficiente.',
    maintainingConsistency: 'Estoy constantemente atrasado, sin importar cuánto intente.',
    catchingUp: 'Estoy estresado incluso cuando trabajo.',
    highPerformance: 'Los exámenes se acercan y me siento mal preparado.',
    stressManagement: 'No tengo un sistema claro, todo parece desordenado.',
    
    // ─── Daily Struggles ───────────────────────────────────────────────────────
    dailyDifficulties: '¿Qué dificulta tus días?',
    selectMultiple: 'Selecciona todo lo que aplica',
    tooManyTasks: 'Demasiadas tareas en mi cabeza',
    difficultyFocusing: 'Dificultad para concentrarme profundamente',
    constantStress: 'Estrés constante',
    guiltyResting: 'Sentirme culpable de descansar',
    fearFallingBehind: 'Miedo a quedarme atrás de los demás',
    
    // ─── Work Style Diagnostic ─────────────────────────────────────────────────
    workStyleTitle: 'Ayúdanos a entender tu estilo de trabajo',
    helpUsUnderstand: 'Sé honesto — esto nos ayuda a adaptar el sistema',
    mentalLoad: 'Carga mental',
    focusQuality: 'Calidad de concentración',
    endOfDaySatisfaction: 'Satisfacción al final del día',
    moderate: 'Moderado',
    overwhelming: 'Abrumador',
    scattered: 'Disperso',
    deep: 'Profundo',
    never: 'Nunca',
    sometimes: 'A veces',
    often: 'A menudo',
    overthinkQuestion: '¿Piensas demasiado en qué trabajar?',
    shouldDoMoreQuestion: '¿Te sientes obligado a hacer más siempre?',
    yes: 'Sí',
    no: 'No',
    
    // ─── Goals & Intent ────────────────────────────────────────────────────────
    whatToChange: '¿Qué quieres cambiar?',
    workWithClarity: 'Trabajar con claridad',
    feelInControl: 'Sentirme en control',
    beConsistent: 'Ser más consistente',
    stopWastingEnergy: 'Dejar de desperdiciar energía mental',
    timeHorizon: 'Horizonte temporal',
    next2Weeks: 'Las próximas 2 semanas',
    thisSemester: 'Este semestre',
    thisYear: 'Este año',
    
    // ─── Tasks Awareness ───────────────────────────────────────────────────────
    whatToDo: '¿Qué tienes que hacer mañana?',
    writeOrSpeak: 'Escribe o habla libremente. Lo organizaremos.',
    messyIsFine: 'El desorden está bien.',
    classesLectures: 'Clases / conferencias',
    deadlines: 'Plazos',
    revisions: 'Revisiones',
    avoiding: 'Cosas que estoy evitando',
    personalObligations: 'Obligaciones personales',
    typeOrSpeak: 'Escribe aquí o toca el micrófono para hablar...',
    
    // ─── Task Clarification ────────────────────────────────────────────────────
    whatWeUnderstood: 'Esto es lo que entendimos.',
    mustDoTomorrow: 'Debo hacer mañana',
    buildIdealDay: 'Construir mi día ideal',
    
    // ─── AI Processing ─────────────────────────────────────────────────────────
    designingDay: 'Diseñando tu día ideal…',
    understandingPriorities: 'Entendiendo prioridades',
    estimatingEffort: 'Estimando esfuerzo y energía',
    creatingPlan: 'Creando un plan realista',
    
    // ─── Ideal Day ─────────────────────────────────────────────────────────────
    idealDayTitle: 'Aquí está tu día ideal para mañana.',
    topPriorities: 'Tus 3 prioridades',
    enoughForGoodDay: 'Esto es suficiente para hacer de mañana un buen día.',
    syncCalendar: 'Sincronizar con Google Calendar',
    startFocusNow: 'Comenzar Focus ahora',
    adjust: 'Ajustar',
    
    // ─── Calendar Sync ─────────────────────────────────────────────────────────
    syncYourDay: 'Sincroniza tu día',
    googleCalendar: 'Google Calendar',
    appleCalendar: 'Calendario de Apple',
    createEvents: 'Creamos eventos para tu plan.',
    connectCalendar: 'Conectar calendario',
    skip: 'Omitir por ahora',
    
    // ─── Success ───────────────────────────────────────────────────────────────
    dayIsReady: 'Tu día está listo.',
    focusWithoutThinking: 'Ahora puedes concentrarte sin pensar.',
    startFocus: 'Comenzar Focus',
    viewInCalendar: 'Ver en el calendario',
    freePlanActivated: 'Plan gratuito activado.',
    
    // ─── Dashboard ─────────────────────────────────────────────────────────────
    goodMorning: 'Buenos días',
    goodAfternoon: 'Buenas tardes',
    goodEvening: 'Buenas noches',
    todaysIdealDay: 'Día ideal de {name}',
    today: 'Hoy',
    currentState: 'Estado actual',
    focus: 'Enfoque',
    energy: 'Energía',
    stress: 'Estrés',
    mainPriority: 'Prioridad principal',
    alsoScheduled: 'También programado',
    todaysHabits: 'Hábitos de hoy',
    startFocusButton: 'Comenzar enfoque',
    
    // ─── Navigation ────────────────────────────────────────────────────────────
    home: 'Inicio',
    tasks: 'Tareas',
    agent: 'Agente',
    mood: 'Ánimo',
    board: 'Ranking',
    settings: 'Ajustes',
    
    // ─── AI Conductor ──────────────────────────────────────────────────────────
    aiConductor: 'Conductor IA',
    systemActions: 'Acciones del sistema',
    whatWouldYouLikeToDo: '¿Qué te gustaría hacer?',
    planMyDay: 'Planificar mi día',
    generateOptimizedSchedule: 'Generar un horario optimizado',
    startFocusAction: 'Comenzar enfoque',
    beginMainPriority: 'Comenzar tu prioridad principal',
    manageHabits: 'Gestionar hábitos',
    viewUpdateHabits: 'Ver y actualizar hábitos diarios',
    dailyJournal: 'Diario',
    reflectOnProgress: 'Reflexionar sobre tu progreso',
    noChatMode: 'Sin chat abierto. El sistema decide, tú validas.',
    recentInsights: 'Insights recientes',
    focusPeaks: 'Tu concentración alcanza su máximo entre 9-11 AM.',
    scheduleHardTasksEarly: 'Programa las tareas difíciles temprano.',
    restDaysImprove: 'Los días de descanso mejoran el rendimiento en 18%.',
    sundayRecovery: 'El domingo es tu día ideal de recuperación.',
    workBestIn90Min: 'Trabajas mejor en bloques de 90 minutos.',
    adjustedSchedule: 'Horario ajustado en consecuencia.',
    
    // ─── Focus Mode ────────────────────────────────────────────────────────────
    pause: 'Pausar',
    resume: 'Reanudar',
    everythingElseDisappeared: 'Todo lo demás desapareció.',
    
    // ─── Leaderboard ───────────────────────────────────────────────────────────
    leaderboard: 'Clasificación',
    consistencyBeatsIntensity: 'La constancia vence a la intensidad.',
    todayFilter: 'Hoy',
    weekFilter: 'Semana',
    allTimeFilter: 'Todo el tiempo',
    youDontNeedToWin: 'No necesitas ganar.',
    youJustNeedToShowUp: 'Solo necesitas aparecer.',
    rankedByConsistency: 'Clasificado por constancia, no por volumen.',
    daysStreak: 'd de racha',
    sessions: 'sesiones',
    xpPoints: 'XP',
    you: 'Tú',
    seeFull: 'Ver ranking completo',
    upgradeToPremium: 'Actualizar a Premium',
    currentStreak: 'Racha actual',
    days: 'días',
    weeklyXp: 'XP semanal',
    totalXp: 'XP total',
    todaysXp: 'XP de hoy',
    focusSessions: 'Sesiones de enfoque',
    thisWeek: 'esta semana',
    statsPrivate: 'Las estadísticas son privadas. Sin mensajería.',
    
    // ─── Settings ──────────────────────────────────────────────────────────────
    language: 'Idioma',
    theme: 'Tema',
    light: 'Claro',
    dark: 'Oscuro',
    system: 'Sistema',
    notifications: 'Notificaciones',
    account: 'Cuenta',
    logout: 'Cerrar sesión',
    deleteAccount: 'Eliminar cuenta',
    about: 'Acerca de',
    help: 'Ayuda',
    privacy: 'Privacidad',
    terms: 'Términos',
    
    // ─── Paywall ───────────────────────────────────────────────────────────────
    unlockFullPotential: 'Desbloquea todo el potencial',
    freeTrial: '7 días gratis',
    monthlyPlan: 'Mensual',
    yearlyPlan: 'Anual',
    perMonth: '/mes',
    perYear: '/año',
    bestValue: 'Mejor oferta',
    savePercent: 'Ahorra {percent}%',
    unlimitedAI: 'IA ilimitada',
    advancedAnalytics: 'Análisis avanzados',
    prioritySupport: 'Soporte prioritario',
    allFeatures: 'Todas las funciones',
    startTrial: 'Comenzar prueba gratis',
    restorePurchases: 'Restaurar compras',
    
    // ─── Errores & Mensajes ────────────────────────────────────────────────────
    error: 'Error',
    success: 'Éxito',
    loading: 'Cargando...',
    retry: 'Reintentar',
    cancel: 'Cancelar',
    save: 'Guardar',
    delete: 'Eliminar',
    confirm: 'Confirmar',
    networkError: 'Error de conexión',
    tryAgain: 'Por favor, inténtalo de nuevo',
    somethingWentWrong: 'Algo salió mal',
  },
};

// Type helper pour les clés de traduction
export type TranslationKey = keyof typeof translations.fr;

// Fonction helper pour obtenir une traduction
export function getTranslation(language: Language, key: TranslationKey): string {
  return translations[language][key] || translations.en[key] || key;
}

