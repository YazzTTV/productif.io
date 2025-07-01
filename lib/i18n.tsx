"use client"

import { useEffect, createContext, useContext, useState, ReactNode } from 'react';

// Types des traductions
export type Locale = 'fr' | 'en';

// Type des clés de traduction
export type TranslationKey = keyof typeof translations.fr;

// Context pour la gestion de la langue
type LocaleContextType = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
};

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

// Provider pour la langue
export function LocaleProvider({ children, initialLocale = 'fr' }: { children: ReactNode, initialLocale?: Locale }) {
  const [locale, setLocale] = useState<Locale>(initialLocale);

  // Récupération de la langue depuis le localStorage au chargement
  useEffect(() => {
    const savedLocale = localStorage.getItem('locale') as Locale;
    if (savedLocale && (savedLocale === 'fr' || savedLocale === 'en')) {
      setLocale(savedLocale);
    }
  }, []);

  // Sauvegarde de la langue dans le localStorage à chaque changement
  useEffect(() => {
    localStorage.setItem('locale', locale);
    document.documentElement.lang = locale;
  }, [locale]);

  // Fonction de traduction
  const t = (key: string): string => {
    if (locale === 'fr' && key in translations.fr) {
      return translations.fr[key as keyof typeof translations.fr];
    } else if (locale === 'en' && key in translations.en) {
      return translations.en[key as keyof typeof translations.en];
    }
    return key;
  };

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

// Hook personnalisé pour utiliser les traductions
export function useLocale() {
  const context = useContext(LocaleContext);
  if (context === undefined) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
}

// Traductions
export const translations = {
  fr: {
    // Navigation
    'dashboard': 'Tableau de bord',
    'projects': 'Projets',
    'tasks': 'Tâches',
    'calendar': 'Calendrier',
    'analytics': 'Analyses',
    'settings': 'Paramètres',
    'time': 'Temps',
    'deepWork': 'Travail profond',
    'habits': 'Habitudes',
    'objectives': 'Objectifs',
    'monEspace': 'Mon espace',
    'admin': 'Administration',
    'companies': 'Entreprises',
    'users': 'Utilisateurs',
    'adminDashboard': 'Tableau de bord admin',
    'memberTasks': 'Tâches des membres',
    'teamPerformance': 'Performance d\'équipe',
    'quit': 'Quitter',
    
    // Paramètres
    'accountInfo': 'Informations du compte',
    'managePersonalInfo': 'Gérez vos informations personnelles',
    'email': 'Email',
    'name': 'Nom',
    'memberSince': 'Membre depuis',
    'password': 'Mot de passe',
    'changePassword': 'Changer le mot de passe',
    'currentPassword': 'Mot de passe actuel',
    'newPassword': 'Nouveau mot de passe',
    'confirmNewPassword': 'Confirmer le nouveau mot de passe',
    'update': 'Mettre à jour',
    'updating': 'Mise à jour...',
    'preferences': 'Préférences',
    'customizeExperience': 'Personnalisez votre expérience',
    'theme': 'Thème',
    'light': 'Clair',
    'dark': 'Sombre',
    'system': 'Système',
    'language': 'Langue',
    'notifications': 'Notifications',
    'manageNotifications': 'Gérez vos préférences de notifications',
    'emailNotifications': 'Notifications par email',
    'receiveEmailNotifications': 'Recevoir des notifications par email',
    'taskReminders': 'Rappels de tâches',
    'receiveTaskReminders': 'Recevoir des rappels pour les tâches à venir',
    'accountDeletion': 'Suppression du compte',
    'deleteAccount': 'Supprimer le compte',
    'deleteAccountDescription': 'Supprimez définitivement votre compte et toutes vos données',
    'areYouSure': 'Êtes-vous sûr ?',
    'irreversibleAction': 'Cette action est irréversible. Toutes vos données seront supprimées définitivement.',
    'typeDeleteToConfirm': 'Pour confirmer, écrivez SUPPRIMER en majuscules.',
    'cancel': 'Annuler',
    'deleting': 'Suppression...',
    'success': 'Succès',
    'error': 'Erreur',
    'settingsUpdated': 'Vos paramètres ont été mis à jour.',
    'passwordUpdated': 'Votre mot de passe a été mis à jour.',
    'passwordMismatch': 'Les mots de passe ne correspondent pas.',
    'passwordTooShort': 'Le nouveau mot de passe doit contenir au moins 8 caractères.',
    'accountDeleted': 'Compte supprimé',
    'accountDeletedDescription': 'Votre compte et toutes vos données ont été supprimés.',
    'invalidConfirmation': 'La confirmation n\'est pas valide. Veuillez écrire SUPPRIMER en majuscules.',
  },
  en: {
    // Navigation
    'dashboard': 'Dashboard',
    'projects': 'Projects',
    'tasks': 'Tasks',
    'calendar': 'Calendar',
    'analytics': 'Analytics',
    'settings': 'Settings',
    'time': 'Time',
    'deepWork': 'Deep Work',
    'habits': 'Habits',
    'objectives': 'Objectives',
    'monEspace': 'My Space',
    'admin': 'Administration',
    'companies': 'Companies',
    'users': 'Users',
    'adminDashboard': 'Admin Dashboard',
    'memberTasks': 'Member Tasks',
    'teamPerformance': 'Team Performance',
    'quit': 'Quit',
    
    // Settings
    'accountInfo': 'Account Information',
    'managePersonalInfo': 'Manage your personal information',
    'email': 'Email',
    'name': 'Name',
    'memberSince': 'Member since',
    'password': 'Password',
    'changePassword': 'Change password',
    'currentPassword': 'Current password',
    'newPassword': 'New password',
    'confirmNewPassword': 'Confirm new password',
    'update': 'Update',
    'updating': 'Updating...',
    'preferences': 'Preferences',
    'customizeExperience': 'Customize your experience',
    'theme': 'Theme',
    'light': 'Light',
    'dark': 'Dark',
    'system': 'System',
    'language': 'Language',
    'notifications': 'Notifications',
    'manageNotifications': 'Manage your notification preferences',
    'emailNotifications': 'Email notifications',
    'receiveEmailNotifications': 'Receive email notifications',
    'taskReminders': 'Task reminders',
    'receiveTaskReminders': 'Receive reminders for upcoming tasks',
    'accountDeletion': 'Account Deletion',
    'deleteAccount': 'Delete account',
    'deleteAccountDescription': 'Permanently delete your account and all your data',
    'areYouSure': 'Are you sure?',
    'irreversibleAction': 'This action is irreversible. All your data will be permanently deleted.',
    'typeDeleteToConfirm': 'To confirm, type DELETE in capital letters.',
    'cancel': 'Cancel',
    'deleting': 'Deleting...',
    'success': 'Success',
    'error': 'Error',
    'settingsUpdated': 'Your settings have been updated.',
    'passwordUpdated': 'Your password has been updated.',
    'passwordMismatch': 'Passwords do not match.',
    'passwordTooShort': 'New password must be at least 8 characters long.',
    'accountDeleted': 'Account deleted',
    'accountDeletedDescription': 'Your account and all your data have been deleted.',
    'invalidConfirmation': 'Invalid confirmation. Please type DELETE in capital letters.',
  },
}; 