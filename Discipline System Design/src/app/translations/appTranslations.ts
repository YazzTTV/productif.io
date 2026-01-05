import { Language } from '../hooks/useLanguage';

export const appTranslations = {
  en: {
    // Settings
    settings: 'Settings',
    account: 'Account',
    name: 'Name',
    academicField: 'Academic field',
    studyLevel: 'Study level',
    editProfile: 'Edit profile',
    dailyStructure: 'Daily Structure',
    notifications: 'Notifications',
    privacyData: 'Privacy & Data',
    subscription: 'Subscription',
    supportInfo: 'Support & Info',
    help: 'Help',
    contactSupport: 'Contact support',
    termsOfService: 'Terms of Service',
    privacyPolicy: 'Privacy Policy',
    logout: 'Log out',
    saveChanges: 'Save Changes',
    saved: 'Saved',
    
    // Dashboard
    welcomeBack: 'Welcome back',
    todaysPlan: "Today's plan",
    startFocus: 'Start Focus',
    examMode: 'Exam Mode',
    planMyDay: 'Plan My Day',
    tasks: 'Tasks',
    habits: 'Habits',
    journal: 'Journal',
    analytics: 'Analytics',
    
    // Focus Flow
    focusSession: 'Focus Session',
    readyToFocus: 'Ready to focus',
    startFocusBtn: 'Start focus',
    pause: 'Pause',
    resume: 'Resume',
    endSession: 'End session',
    
    // Common
    continue: 'Continue',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    save: 'Save',
    back: 'Back',
  },
  
  fr: {
    // Settings
    settings: 'Paramètres',
    account: 'Compte',
    name: 'Nom',
    academicField: 'Domaine académique',
    studyLevel: 'Niveau d\\'études',
    editProfile: 'Modifier le profil',
    dailyStructure: 'Structure quotidienne',
    notifications: 'Notifications',
    privacyData: 'Confidentialité et données',
    subscription: 'Abonnement',
    supportInfo: 'Support et info',
    help: 'Aide',
    contactSupport: 'Contacter le support',
    termsOfService: 'Conditions d\\'utilisation',
    privacyPolicy: 'Politique de confidentialité',
    logout: 'Se déconnecter',
    saveChanges: 'Enregistrer les modifications',
    saved: 'Enregistré',
    
    // Dashboard
    welcomeBack: 'Bon retour',
    todaysPlan: 'Plan du jour',
    startFocus: 'Commencer Focus',
    examMode: 'Mode Examen',
    planMyDay: 'Planifier ma journée',
    tasks: 'Tâches',
    habits: 'Habitudes',
    journal: 'Journal',
    analytics: 'Analyses',
    
    // Focus Flow
    focusSession: 'Session Focus',
    readyToFocus: 'Prêt à te concentrer',
    startFocusBtn: 'Commencer le focus',
    pause: 'Pause',
    resume: 'Reprendre',
    endSession: 'Terminer la session',
    
    // Common
    continue: 'Continuer',
    cancel: 'Annuler',
    delete: 'Supprimer',
    edit: 'Modifier',
    save: 'Enregistrer',
    back: 'Retour',
  },
  
  es: {
    // Settings
    settings: 'Configuración',
    account: 'Cuenta',
    name: 'Nombre',
    academicField: 'Campo académico',
    studyLevel: 'Nivel de estudios',
    editProfile: 'Editar perfil',
    dailyStructure: 'Estructura diaria',
    notifications: 'Notificaciones',
    privacyData: 'Privacidad y datos',
    subscription: 'Suscripción',
    supportInfo: 'Soporte e info',
    help: 'Ayuda',
    contactSupport: 'Contactar soporte',
    termsOfService: 'Términos de servicio',
    privacyPolicy: 'Política de privacidad',
    logout: 'Cerrar sesión',
    saveChanges: 'Guardar cambios',
    saved: 'Guardado',
    
    // Dashboard
    welcomeBack: 'Bienvenido de vuelta',
    todaysPlan: 'Plan de hoy',
    startFocus: 'Comenzar Focus',
    examMode: 'Modo Examen',
    planMyDay: 'Planificar mi día',
    tasks: 'Tareas',
    habits: 'Hábitos',
    journal: 'Diario',
    analytics: 'Análisis',
    
    // Focus Flow
    focusSession: 'Sesión Focus',
    readyToFocus: 'Listo para concentrarte',
    startFocusBtn: 'Comenzar focus',
    pause: 'Pausa',
    resume: 'Reanudar',
    endSession: 'Terminar sesión',
    
    // Common
    continue: 'Continuar',
    cancel: 'Cancelar',
    delete: 'Eliminar',
    edit: 'Editar',
    save: 'Guardar',
    back: 'Atrás',
  },
};

export const useTranslation = (language: Language) => {
  return appTranslations[language];
};
