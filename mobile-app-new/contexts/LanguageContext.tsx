import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Locale = 'fr' | 'en';

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LOCALE_STORAGE_KEY = '@productif_locale';

// Traductions de base
const translations = {
  fr: {
    // Navigation
    'dashboard': 'Tableau de bord',
    'projects': 'Projets',
    'tasks': 'Tâches',
    'habits': 'Habitudes',
    'timer': 'Minuteur',
    'assistant': 'Assistant',
    'more': 'Plus',
    'settings': 'Paramètres',
    'analytics': 'Analyses',
    'objectives': 'Objectifs',
    'notifications': 'Notifications',
    
    // Common
    'save': 'Enregistrer',
    'cancel': 'Annuler',
    'delete': 'Supprimer',
    'edit': 'Modifier',
    'add': 'Ajouter',
    'create': 'Créer',
    'update': 'Mettre à jour',
    'loading': 'Chargement...',
    'error': 'Erreur',
    'success': 'Succès',
    'done': 'Terminé',
    'today': 'Aujourd\'hui',
    'day': 'jour',
    'days': 'jours',
    'left': 'restant',
    'upgrade': 'Passer Pro',
    'viewAll': 'Voir tout',
    'viewData': 'Voir les données',
    'points': 'points',
    'continue': 'Continuer',
    'or': 'ou',
    
    // Dashboard
    'hello': 'Bonjour',
    'letsMakeTodayProductive': 'Faisons de cette journée une réussite',
    'dailyProgress': 'Progression du jour',
    'focusTime': 'Temps de focus',
    'tasksCompleted': 'Tâches terminées',
    'currentStreak': 'Série actuelle',
    'productivityScore': 'Score de productivité',
    'totalHours': 'Total',
    'thisWeek': 'Cette semaine',
    'bestTime': 'Meilleur',
    'globalRank': 'Classement',
    'weeklyTrend': 'Tendance hebdomadaire',
    'dailyHabits': 'Habitudes quotidiennes',
    'achievementsUnlocked': 'Succès débloqués',
    'unlocked': 'Débloqué',
    'leaderboard': 'Classement',
    'viewFullLeaderboard': 'Voir le classement complet',
    
    // Settings
    'theme': 'Thème',
    'language': 'Langue',
    'light': 'Clair',
    'dark': 'Sombre',
    'system': 'Système',
    'french': 'Français',
    'english': 'Anglais',
    
    // Onboarding - Intro
    'introSubtitle': 'En difficulté avec la concentration, la procrastination et les habitudes dispersées ? Réglons ça ensemble.',
    'letsGo': 'Allons-y',
    'takesLessMinutes': 'Prend moins de 2 minutes',
    
    // Onboarding - Language
    'chooseLanguage': 'Choisissez votre langue',
    'selectPreferredLanguage': 'Sélectionnez votre langue préférée pour continuer',
    'changeLanguageLater': 'Vous pouvez modifier cela plus tard dans les Paramètres',
    
    // Onboarding - Connection
    'connectionTitle': 'Comment souhaitez-vous continuer?',
    'connectionSubtitle': 'Connectez-vous avec votre plateforme préférée',
    'aiAssistantBenefit': 'Assistant IA pour vous guider 24/7',
    'trackHabitsBenefit': 'Suivez vos habitudes et créez des séries',
    'advancedAnalyticsBenefit': 'Analyses et insights avancés',
    'competeFriendsBenefit': 'Compétez avec vos amis',
    'syncDevicesBenefit': 'Synchronisez sur tous vos appareils',
    'joinElite': 'Rejoignez l\'élite — Créez votre compte',
    'freeTrialNoCC': 'Essai gratuit de 7 jours • Aucune carte de crédit requise',
    'continueWithEmail': 'Continuer avec Email',
    'continueWithApple': 'Continuer avec Apple',
    'continueWithGoogle': 'Continuer avec Google',
    'alreadyHaveAccount': 'Vous avez déjà un compte?',
    'logIn': 'Se connecter',
    'skipForNow': 'Passer pour le moment',
    
    // Onboarding - Questions
    'question': 'Question',
    'of': 'sur',
    'q1': 'Quand vous travaillez sur un projet important, vous avez tendance à…',
    'q1a': 'Vous perdre dans les détails',
    'q1b': 'Procrastiner',
    'q1c': 'Sauter entre les tâches',
    'q1d': 'Commencer fort, puis perdre la motivation',
    'q2': 'À la fin de votre journée, vous vous sentez généralement…',
    'q2a': 'Frustré de ne pas en faire assez',
    'q2b': 'Fatigué sans savoir pourquoi',
    'q2c': 'Fier, mais pas clair sur la vue d\'ensemble',
    'q2d': 'Perdu dans vos priorités',
    'q3': 'Votre téléphone pendant le travail est…',
    'q3a': 'Mon pire ennemi',
    'q3b': '"Juste 2 minutes"… puis 2 heures plus tard',
    'q3c': 'Je le range mais le reprends',
    'q3d': 'J\'ai appris à le gérer',
    'q3social': 'Vous n\'êtes pas seul — 92% des utilisateurs de Productif.io avaient le même problème avant de commencer.',
    'q4': 'Quand vous sentez-vous le plus productif?',
    'q4a': 'Tôt le matin (5h-9h)',
    'q4b': 'Midi (10h-14h)',
    'q4c': 'Après-midi/Soirée (15h-20h)',
    'q4d': 'Tard le soir (21h+)',
    'q4social': 'Comprendre vos heures de pointe nous aide à optimiser votre emploi du temps pour une concentration maximale.',
    'q5': 'Comment gérez-vous les pauses pendant le travail?',
    'q5a': 'J\'oublie de les prendre',
    'q5b': 'Les courtes pauses deviennent longues',
    'q5c': 'Je les prends mais me sens coupable',
    'q5d': 'Je les planifie stratégiquement',
    'q6': 'Quel est votre objectif principal maintenant?',
    'q6a': 'Développer mon entreprise/projet',
    'q6b': 'Mieux gérer mes études',
    'q6c': 'Construire la discipline',
    'q6d': 'Trouver l\'équilibre vie-travail',
    
    // Onboarding - Building Plan
    'analyzingAnswers': 'Analyse de vos réponses...',
    'identifyingPatterns': 'Identification des modèles...',
    'buildingProfile': 'Construction de votre profil...',
    'personalizingInsights': 'Personnalisation des insights...',
    'almostReady': 'Presque prêt...',
    
    // Onboarding - Symptoms
    'tellUsSymptoms': 'Parlez-nous de vos symptômes',
    'selectAllApply': 'Sélectionnez tout ce qui s\'applique pour obtenir une analyse personnalisée',
    'symptomDistraction': 'Je me laisse facilement distraire en travaillant',
    'symptomProcrastination': 'Je procrastine souvent sur des tâches importantes',
    'symptomOverwhelmed': 'Je me sens débordé par ma liste de tâches',
    'symptomFocus': 'J\'ai du mal à maintenir ma concentration pendant de longues périodes',
    'symptomMotivation': 'Je manque de motivation pour commencer les tâches',
    'symptomSleep': 'Mon horaire de sommeil est irrégulier',
    'symptomInfo': 'En fonction de vos symptômes, nous créerons un plan personnalisé pour stimuler votre productivité',
    'discoverProfile': 'Découvrir mon profil',
    'symptomsSelected': 'symptôme(s) sélectionné(s)',
    'analyzingSymptoms': 'Analyse de vos symptômes...',
    'creatingPersonalizedProfile': 'Nous créons un profil de productivité personnalisé basé sur vos réponses',
    'scanningPatterns': 'Scan des modèles comportementaux...',
    'mappingIndicators': 'Cartographie des indicateurs de concentration...',
    'optimizingRecommendations': 'Optimisation des recommandations...',
    
    // Onboarding - Profile Reveal
    'yourProductivityProfile': 'Votre profil de productivité',
    'theAmbitiousAchiever': 'L\'Ambitieux Performant',
    'achieverDescription': 'Vous avez le dynamisme et le potentiel — ce qui manque, c\'est le bon système. Productif.io fournit la structure et les insights pour vous aider à atteindre vos objectifs de manière cohérente.',
    'focus': 'Focus',
    'tasks': 'Tâches',
    'stress': 'Stress',
    'choosePlan': 'Choisissez votre plan',
    'annualPlan': 'Plan annuel',
    'trialExpiredTitle': 'Période d\'essai terminée',
    'trialExpiredSubtitle': 'Continuez votre progression avec Productif.io',
    'upgradeFeature1': 'Assistant IA illimité',
    'upgradeFeature1Desc': 'Planification, rappels et conseils personnalisés',
    'upgradeFeature2': 'Toutes les fonctionnalités',
    'upgradeFeature2Desc': 'Tâches, habitudes, deep work, statistiques',
    'upgradeFeature3': 'Synchronisation multi-appareils',
    'upgradeFeature3Desc': 'Accès web, mobile et WhatsApp',
    'save60PerYear': 'Économisez 60€ par an',
    'chooseMyPlan': 'Choisir mon abonnement',
    'later': 'Plus tard',
    'month': 'mois',
    'bestValue': 'Meilleure valeur',
    'savePerYear': 'Économisez $60/an',
    'perMonth': 'par mois',
    'billedAnnually': 'facturé annuellement',
    'monthlyPlan': 'Plan mensuel',
    'flexibleBilling': 'Facturation flexible',
    'freeTrial': 'Essai gratuit de 7 jours',
    'users': 'utilisateurs',
    'cancelAnytime': 'Annulez à tout moment',
    'startFreeTrial': 'Commencer mon essai gratuit',
    'skip': 'Passer',
    'agreeTerms': 'En continuant, vous acceptez nos Conditions générales et notre Politique de confidentialité',
    
    // Onboarding - Social Proof
    'trustedByThousands': 'Approuvé par des milliers',
    'seeWhatUsersSay': 'Découvrez ce que disent les utilisateurs',
    'reportMajorImprovements': 'Signalent des améliorations majeures',
    'earlyAdopters': '1500+ early adopters',
    'activeUsersWorldwide': 'Utilisateurs actifs dans le monde',
    'averageRating': 'Note moyenne',
    'savedDailyPerUser': 'Économisées quotidiennement par utilisateur',
    'successStories': 'Histoires de succès',
    'before': 'Avant',
    'after': 'Après',
    'whatUsersSay': 'Ce que disent les utilisateurs',
    'verified': 'Vérifié',
    'ratingFromReviews': '4,9/5 sur 12 847 avis',
    'trustedByProfessionals': 'Approuvé par des professionnels chez Google, Apple, Meta et plus',
    'freeTrialCancelAnytime': 'Essai gratuit de 7 jours, annulez à tout moment',
    'moneyBackGuarantee': 'Garantie de remboursement si non satisfait',
    // Case Studies
    'benjaminName': 'Benjamin Courdrais',
    'benjaminRole': 'Entrepreneur',
    'benjaminBefore': 'Projets multiples dispersés',
    'benjaminAfter': 'Temps précieux gagné',
    'benjaminQuote': 'En tant que fondateur de startup, je travaille sur plusieurs projets en parallèle. Productif.io m\'a fait gagner un temps précieux en centralisant toutes mes tâches et objectifs.',
    'benjaminTimeframe': '4 semaines',
    'benjaminMetric1': 'Tâches centralisées',
    'benjaminMetric2': 'Temps gagné',
    'sabrinaName': 'Sabrina',
    'sabrinaRole': 'Freelance Media Buyer',
    'sabrinaBefore': 'Organisation des tâches chaotique',
    'sabrinaAfter': 'Organisation intuitive parfaite',
    'sabrinaQuote': 'Je viens de l\'essayer et c\'est parfait. J\'ADORE comment l\'app organise mes tâches et m\'aide à suivre mes habitudes. C\'est vraiment intuitif !',
    'sabrinaTimeframe': '2 semaines',
    'sabrinaMetric1': 'Tâches organisées',
    'sabrinaMetric2': 'Habitudes suivies',
    'gaetanName': 'Gaëtan Silgado',
    'gaetanRole': 'Infopreneur',
    'gaetanBefore': 'Distractions constantes',
    'gaetanAfter': 'Revenus générés en hausse',
    'gaetanQuote': 'En tant qu\'infopreneur, Productif.io m\'a aidé à m\'organiser et à travailler sans distractions. En conséquence, j\'ai généré beaucoup plus de revenus en restant concentré sur ce qui compte.',
    'gaetanTimeframe': '3 semaines',
    'gaetanMetric1': 'Concentration',
    'gaetanMetric2': 'Revenus',
    // Testimonials
    'fabioTestimonial': 'Productif.io a complètement transformé ma façon de travailler. Les insights de l\'IA sont incroyables.',
    'fabioName': 'Fabio R.',
    'noahTestimonial': 'Enfin une app qui comprend vraiment les défis de productivité. Le système de suivi est parfait.',
    'noahName': 'Noah S.',
    'arthurTestimonial': 'J\'ai doublé ma productivité en 3 semaines. L\'assistant IA est comme un coach personnel 24/7.',
    'arthurName': 'Arthur L.',
    'seeMyResults': 'Voir mes résultats',
  },
  en: {
    // Navigation
    'dashboard': 'Dashboard',
    'projects': 'Projects',
    'tasks': 'Tasks',
    'habits': 'Habits',
    'timer': 'Timer',
    'assistant': 'Assistant',
    'more': 'More',
    'settings': 'Settings',
    'analytics': 'Analytics',
    'objectives': 'Objectives',
    'notifications': 'Notifications',
    
    // Common
    'save': 'Save',
    'cancel': 'Cancel',
    'delete': 'Delete',
    'edit': 'Edit',
    'add': 'Add',
    'create': 'Create',
    'update': 'Update',
    'loading': 'Loading...',
    'error': 'Error',
    'success': 'Success',
    'done': 'Done',
    'today': 'Today',
    'day': 'day',
    'days': 'days',
    'left': 'left',
    'upgrade': 'Upgrade',
    'viewAll': 'View all',
    'viewData': 'View data',
    'points': 'points',
    'continue': 'Continue',
    'or': 'or',
    
    // Dashboard
    'hello': 'Hello',
    'letsMakeTodayProductive': 'Let\'s make today productive',
    'dailyProgress': 'Daily Progress',
    'focusTime': 'Focus Time',
    'tasksCompleted': 'Tasks Completed',
    'currentStreak': 'Current Streak',
    'productivityScore': 'Productivity Score',
    'totalHours': 'Total',
    'thisWeek': 'This Week',
    'bestTime': 'Best',
    'globalRank': 'Rank',
    'weeklyTrend': 'Weekly Trend',
    'dailyHabits': 'Daily Habits',
    'achievementsUnlocked': 'Achievements Unlocked',
    'unlocked': 'Unlocked',
    'leaderboard': 'Leaderboard',
    'viewFullLeaderboard': 'View Full Leaderboard',
    
    // Settings
    'theme': 'Theme',
    'language': 'Language',
    'light': 'Light',
    'dark': 'Dark',
    'system': 'System',
    'french': 'French',
    'english': 'English',
    
    // Onboarding - Intro
    'introSubtitle': 'Struggling with focus, procrastination, and scattered habits? Let\'s fix that together.',
    'letsGo': 'Let\'s go',
    'takesLessMinutes': 'Takes less than 2 minutes',
    
    // Onboarding - Language
    'chooseLanguage': 'Choose Your Language',
    'selectPreferredLanguage': 'Select your preferred language to continue',
    'changeLanguageLater': 'You can change this later in Settings',
    
    // Onboarding - Connection
    'connectionTitle': 'How would you like to continue?',
    'connectionSubtitle': 'Connect with your favorite platform',
    'aiAssistantBenefit': 'AI Assistant to guide you 24/7',
    'trackHabitsBenefit': 'Track habits & build streaks',
    'advancedAnalyticsBenefit': 'Advanced analytics & insights',
    'competeFriendsBenefit': 'Compete with friends',
    'syncDevicesBenefit': 'Sync across all devices',
    'joinElite': 'Join the Elite — Create Your Account',
    'freeTrialNoCC': 'Free 7-day trial • No credit card required',
    'continueWithEmail': 'Continue with Email',
    'continueWithApple': 'Continue with Apple',
    'continueWithGoogle': 'Continue with Google',
    'alreadyHaveAccount': 'Already have an account?',
    'logIn': 'Log in',
    'skipForNow': 'Skip for now',
    
    // Onboarding - Questions
    'question': 'Question',
    'of': 'of',
    'q1': 'When you work on an important project, you tend to…',
    'q1a': 'Get lost in details',
    'q1b': 'Procrastinate',
    'q1c': 'Jump between tasks',
    'q1d': 'Start strong, then lose motivation',
    'q2': 'At the end of your day, you usually feel…',
    'q2a': 'Frustrated for not doing enough',
    'q2b': 'Tired without knowing why',
    'q2c': 'Proud, but unclear about the big picture',
    'q2d': 'Lost in your priorities',
    'q3': 'Your phone while working is…',
    'q3a': 'My worst enemy',
    'q3b': '"Just 2 minutes"… then 2 hours later',
    'q3c': 'I put it away but take it back',
    'q3d': 'I\'ve learned to manage it',
    'q3social': 'You\'re not alone — 92% of Productif.io users had the same issue before starting.',
    'q4': 'When do you feel most productive?',
    'q4a': 'Early morning (5am-9am)',
    'q4b': 'Midday (10am-2pm)',
    'q4c': 'Afternoon/Evening (3pm-8pm)',
    'q4d': 'Late night (9pm+)',
    'q4social': 'Understanding your peak hours helps us optimize your schedule for maximum focus.',
    'q5': 'How do you handle breaks during work?',
    'q5a': 'I forget to take them',
    'q5b': 'Short breaks turn into long ones',
    'q5c': 'I take them but feel guilty',
    'q5d': 'I schedule them strategically',
    'q6': 'What\'s your main goal right now?',
    'q6a': 'Grow my business/project',
    'q6b': 'Manage my studies better',
    'q6c': 'Build discipline',
    'q6d': 'Find work-life balance',
    
    // Onboarding - Building Plan
    'analyzingAnswers': 'Analyzing your answers...',
    'identifyingPatterns': 'Identifying patterns...',
    'buildingProfile': 'Building your profile...',
    'personalizingInsights': 'Personalizing insights...',
    'almostReady': 'Almost ready...',
    
    // Onboarding - Symptoms
    'tellUsSymptoms': 'Tell Us About Your Symptoms',
    'selectAllApply': 'Select all that apply to get a personalized analysis',
    'symptomDistraction': 'I get distracted easily while working',
    'symptomProcrastination': 'I often procrastinate on important tasks',
    'symptomOverwhelmed': 'I feel overwhelmed by my to-do list',
    'symptomFocus': 'I struggle to maintain focus for long periods',
    'symptomMotivation': 'I lack motivation to start tasks',
    'symptomSleep': 'My sleep schedule is irregular',
    'symptomInfo': 'Based on your symptoms, we\'ll create a custom plan to boost your productivity',
    'discoverProfile': 'Discover My Profile',
    'symptomsSelected': 'symptom(s) selected',
    'analyzingSymptoms': 'Analyzing Your Symptoms...',
    'creatingPersonalizedProfile': 'We\'re creating a personalized productivity profile based on your answers',
    'scanningPatterns': 'Scanning behavioral patterns...',
    'mappingIndicators': 'Mapping focus indicators...',
    'optimizingRecommendations': 'Optimizing recommendations...',
    
    // Onboarding - Profile Reveal
    'yourProductivityProfile': 'Your productivity profile',
    'theAmbitiousAchiever': 'The Ambitious Achiever',
    'achieverDescription': 'You have the drive and potential — what\'s missing is the right system. Productif.io provides the structure and insights to help you reach your goals consistently.',
    'focus': 'Focus',
    'tasks': 'Tasks',
    'stress': 'Stress',
    'choosePlan': 'Choose your plan',
    'annualPlan': 'Annual Plan',
    'trialExpiredTitle': 'Trial Period Ended',
    'trialExpiredSubtitle': 'Continue your progress with Productif.io',
    'upgradeFeature1': 'Unlimited AI Assistant',
    'upgradeFeature1Desc': 'Planning, reminders and personalized advice',
    'upgradeFeature2': 'All Features',
    'upgradeFeature2Desc': 'Tasks, habits, deep work, statistics',
    'upgradeFeature3': 'Multi-device Sync',
    'upgradeFeature3Desc': 'Web, mobile and WhatsApp access',
    'save60PerYear': 'Save €60 per year',
    'chooseMyPlan': 'Choose my plan',
    'later': 'Later',
    'month': 'month',
    'bestValue': 'Best Value',
    'savePerYear': 'Save $60/year',
    'perMonth': 'per month',
    'billedAnnually': 'billed annually',
    'monthlyPlan': 'Monthly Plan',
    'flexibleBilling': 'Flexible billing',
    'freeTrial': '7-Day Free Trial',
    'users': 'users',
    'cancelAnytime': 'Cancel anytime',
    'startFreeTrial': 'Start My Free Trial',
    'skip': 'Skip',
    'agreeTerms': 'By continuing, you agree to our Terms & Privacy Policy',
    
    // Onboarding - Social Proof
    'trustedByThousands': 'Trusted by Thousands',
    'seeWhatUsersSay': 'See what users are saying',
    'reportMajorImprovements': 'Report major improvements',
    'earlyAdopters': '1500+ early adopters',
    'activeUsersWorldwide': 'Active users worldwide',
    'averageRating': 'Average rating',
    'savedDailyPerUser': 'Saved daily per user',
    'successStories': 'Success Stories',
    'before': 'Before',
    'after': 'After',
    'whatUsersSay': 'What Users Say',
    'verified': 'Verified',
    'ratingFromReviews': '4.9/5 rating from 12,847 reviews',
    'trustedByProfessionals': 'Trusted by professionals at Google, Apple, Meta & more',
    'freeTrialCancelAnytime': '7-day free trial, cancel anytime',
    'moneyBackGuarantee': 'Money-back guarantee if not satisfied',
    // Case Studies
    'benjaminName': 'Benjamin Courdrais',
    'benjaminRole': 'Entrepreneur',
    'benjaminBefore': 'Multiple scattered projects',
    'benjaminAfter': 'Precious time saved',
    'benjaminQuote': 'As a startup founder, I work on multiple projects in parallel. Productif.io saved me precious time by centralizing all my tasks and goals.',
    'benjaminTimeframe': '4 weeks',
    'benjaminMetric1': 'Centralized tasks',
    'benjaminMetric2': 'Time saved',
    'sabrinaName': 'Sabrina',
    'sabrinaRole': 'Freelance Media Buyer',
    'sabrinaBefore': 'Chaotic task organization',
    'sabrinaAfter': 'Perfect intuitive organization',
    'sabrinaQuote': 'I just tried it and it\'s perfect. I LOVE how the app organizes my tasks and helps me track my habits. It\'s truly intuitive!',
    'sabrinaTimeframe': '2 weeks',
    'sabrinaMetric1': 'Organized tasks',
    'sabrinaMetric2': 'Tracked habits',
    'gaetanName': 'Gaëtan Silgado',
    'gaetanRole': 'Infopreneur',
    'gaetanBefore': 'Constant distractions',
    'gaetanAfter': 'Increased revenue generated',
    'gaetanQuote': 'As an infopreneur, Productif.io helped me organize and work without distractions. As a result, I generated much more revenue by staying focused on what matters.',
    'gaetanTimeframe': '3 weeks',
    'gaetanMetric1': 'Focus',
    'gaetanMetric2': 'Revenue',
    // Testimonials
    'fabioTestimonial': 'Productif.io has completely transformed my way of working. The AI insights are incredible.',
    'fabioName': 'Fabio R.',
    'noahTestimonial': 'Finally an app that truly understands productivity challenges. The tracking system is perfect.',
    'noahName': 'Noah S.',
    'arthurTestimonial': 'I doubled my productivity in 3 weeks. The AI assistant is like a personal coach 24/7.',
    'arthurName': 'Arthur L.',
    'seeMyResults': 'See My Results',
  },
};

export function LanguageProvider({ children, initialLocale = 'fr' }: { children: ReactNode, initialLocale?: Locale }) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const [mounted, setMounted] = useState(false);

  // Charger la langue depuis AsyncStorage au démarrage
  useEffect(() => {
    const loadLocale = async () => {
      try {
        const savedLocale = await AsyncStorage.getItem(LOCALE_STORAGE_KEY);
        if (savedLocale && (savedLocale === 'fr' || savedLocale === 'en')) {
          setLocaleState(savedLocale as Locale);
        }
      } catch (error) {
        console.error('Erreur lors du chargement de la langue:', error);
      } finally {
        setMounted(true);
      }
    };
    loadLocale();
  }, []);

  // Sauvegarder la langue dans AsyncStorage à chaque changement
  useEffect(() => {
    if (mounted) {
      AsyncStorage.setItem(LOCALE_STORAGE_KEY, locale).catch((error) => {
        console.error('Erreur lors de la sauvegarde de la langue:', error);
      });
    }
  }, [locale, mounted]);

  // Fonction de traduction
  const t = (key: string): string => {
    if (locale === 'fr' && key in translations.fr) {
      return translations.fr[key as keyof typeof translations.fr];
    } else if (locale === 'en' && key in translations.en) {
      return translations.en[key as keyof typeof translations.en];
    }
    return key;
  };

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

