import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Switch, TextInput, Alert, Linking, Platform, InteractionManager } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService, onboardingService, apiCall } from '@/lib/api';
import { connectGoogleCalendar, isGoogleCalendarConnected } from '@/lib/calendarAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { useOnboardingData } from '@/hooks/useOnboardingData';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useDailyStructureSettings } from '@/hooks/useDailyStructureSettings';

type SettingsView = 'main' | 'editProfile' | 'dailyStructure' | 'notifications';

type FocusDuration = 25 | 45 | 60 | 90;
type WorkloadIntensity = 'light' | 'balanced' | 'intensive';

export function SettingsNew() {
  const { t } = useLanguage();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { getResponse, saveResponse, responses } = useOnboardingData();
  const { requestPermissions, permissionStatus } = usePushNotifications();
  const { settings: dailyStructure, saveSettings: saveDailyStructure } = useDailyStructureSettings();
  const [view, setView] = useState<SettingsView>('main');
  const [savedFeedback, setSavedFeedback] = useState(false);

  // Profile
  const [name, setName] = useState('');
  const [academicField, setAcademicField] = useState('');
  const [studyLevel, setStudyLevel] = useState<number>(1);

  // Daily Structure - Initialiser depuis le hook
  const [focusDuration, setFocusDuration] = useState<FocusDuration>(dailyStructure.focusDuration);
  const [maxSessions, setMaxSessions] = useState(dailyStructure.maxSessions);
  const [workloadIntensity, setWorkloadIntensity] = useState<WorkloadIntensity>(dailyStructure.workloadIntensity);

  // Synchroniser avec les paramètres du hook
  useEffect(() => {
    setFocusDuration(dailyStructure.focusDuration);
    setMaxSessions(dailyStructure.maxSessions);
    setWorkloadIntensity(dailyStructure.workloadIntensity);
  }, [dailyStructure]);

  // Notifications
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [isRequestingNotificationPermission, setIsRequestingNotificationPermission] = useState(false);
  const [startOfDayReminder, setStartOfDayReminder] = useState(true);
  const [focusReminder, setFocusReminder] = useState(true);
  const [breakReminder, setBreakReminder] = useState(false);
  const [endOfDayRecap, setEndOfDayRecap] = useState(true);
  const [startOfDayTime, setStartOfDayTime] = useState('08:00');
  const [breakTime, setBreakTime] = useState('12:00');
  const [endOfDayTime, setEndOfDayTime] = useState('21:00');
  const [notificationPrefs, setNotificationPrefs] = useState<any | null>(null);
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);
  const isMountedRef = useRef(true);

  // Connection status
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [calendarLoading, setCalendarLoading] = useState(false);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const user = await authService.checkAuth();
        if (user?.name) {
          setName(user.name);
        }

        // Charger les données de l'onboarding depuis le backend
        try {
          const { data: onboardingData } = await onboardingService.getOnboardingData();
          if (onboardingData) {
            if (onboardingData.studentType) {
              setAcademicField(onboardingData.studentType);
            }
            if (onboardingData.studyLevel) {
              setStudyLevel(onboardingData.studyLevel);
            }
          }
        } catch (error) {
          console.log('Onboarding data not loaded from backend, using local');
          // Fallback sur AsyncStorage si le backend échoue
          const savedStudentType = getResponse('studentType');
          const savedStudyLevel = getResponse('studyLevel');

          if (savedStudentType) {
            setAcademicField(savedStudentType);
          }
          if (savedStudyLevel) {
            setStudyLevel(typeof savedStudyLevel === 'number' ? savedStudyLevel : 1);
          }
        }

        // Vérifier l'état de connexion Google Calendar
        const connected = await isGoogleCalendarConnected();
        setCalendarConnected(connected);
      } catch (error) {
        console.log('User not loaded');
      }
    };
    loadUserData();
  }, []);

  // Charger les préférences de notifications (backend) pour synchroniser l'écran simple
  useEffect(() => {
    const loadNotificationSettings = async () => {
      try {
        const prefs = await apiCall<any>('/notifications/preferences');
        if (!prefs) return;

        setNotificationPrefs(prefs);
        setNotificationsEnabled(Boolean(prefs.isEnabled));
        setStartOfDayReminder(prefs.morningReminder ?? true);
        setBreakReminder(prefs.noonReminder ?? false);
        setEndOfDayRecap(prefs.recapReminder ?? true);
        setStartOfDayTime(prefs.morningTime || '08:00');
        setBreakTime(prefs.noonTime || '12:00');
        setEndOfDayTime(prefs.recapTime || '21:00');
      } catch (error) {
        console.log('❌ Impossible de charger les préférences de notifications pour SettingsNew:', error);
      }
    };

    loadNotificationSettings();
  }, []);

  // Recharger les données quand on revient à la vue principale
  useEffect(() => {
    if (view === 'main') {
      const reloadData = async () => {
        try {
          const { data: onboardingData } = await onboardingService.getOnboardingData();
          if (onboardingData) {
            if (onboardingData.studentType) {
              setAcademicField(onboardingData.studentType);
            }
            if (onboardingData.studyLevel) {
              setStudyLevel(onboardingData.studyLevel);
            }
          }
        } catch (error) {
          console.log('Failed to reload from backend, using local');
          const savedStudentType = getResponse('studentType');
          const savedStudyLevel = getResponse('studyLevel');
          
          if (savedStudentType) {
            setAcademicField(savedStudentType);
          }
          if (savedStudyLevel) {
            setStudyLevel(typeof savedStudyLevel === 'number' ? savedStudyLevel : 1);
          }
        }
      };
      reloadData();
    }
  }, [view]);

  // Synchroniser l'état des notifications avec le statut des permissions
  useEffect(() => {
    if (permissionStatus === 'granted') {
      setNotificationsEnabled(true);
    } else if (permissionStatus === 'denied') {
      setNotificationsEnabled(false);
    }
  }, [permissionStatus]);

  const saveNotificationPreferences = async (updates: Record<string, any>) => {
    if (!isMountedRef.current) return;

    if (!notificationPrefs) {
      // Si on n'a pas encore les préférences complètes, tenter de les charger d'abord
      try {
        const prefs = await apiCall<any>('/notifications/preferences');
        if (!isMountedRef.current) return;
        setNotificationPrefs(prefs);
      } catch (error) {
        console.log('❌ Impossible de charger les préférences avant sauvegarde:', error);
      }
    }

    const current = notificationPrefs || {};
    const body = { ...current, ...updates };

    if (!isMountedRef.current) return;
    setNotificationPrefs(body);

    try {
      if (!isMountedRef.current) return;
      setIsSavingNotifications(true);
      console.log('💾 [SettingsNew] Sauvegarde préférences notifications (vue simple):', updates);
      await apiCall('/notifications/preferences', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      
      // Utiliser InteractionManager pour différer les mises à jour d'état
      InteractionManager.runAfterInteractions(() => {
        setTimeout(() => {
          if (!isMountedRef.current) return;
          console.log('✅ [SettingsNew] Préférences notifications sauvegardées');
          showSavedFeedback();
        }, 300);
      });
    } catch (error) {
      if (!isMountedRef.current) return;
      console.error('❌ [SettingsNew] Erreur lors de la sauvegarde des préférences notifications:', error);
      InteractionManager.runAfterInteractions(() => {
        setTimeout(() => {
          if (!isMountedRef.current) return;
          Alert.alert(
            t('error') || 'Erreur',
            t('notifSaveError') || 'Impossible de sauvegarder vos préférences de notification. Veuillez réessayer.'
          );
        }, 300);
      });
    } finally {
      if (isMountedRef.current) {
        setIsSavingNotifications(false);
      }
    }
  };

  const isValidTime = (value: string) => {
    const match = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/.exec(value.trim());
    return !!match;
  };

  // Fonction pour gérer le changement du toggle de notifications
  const handleNotificationToggle = async (value: boolean) => {
    // Empêcher les changements multiples pendant la demande de permission
    if (isRequestingNotificationPermission) {
      return;
    }

    if (value) {
      // L'utilisateur veut activer les notifications, demander la permission
      setIsRequestingNotificationPermission(true);
      try {
        const granted = await requestPermissions();
        if (granted) {
          if (!isMountedRef.current) return;
          setNotificationsEnabled(true);
          await saveNotificationPreferences({ isEnabled: true });
        } else {
          // Permission refusée - remettre le toggle à false
          if (!isMountedRef.current) return;
          setNotificationsEnabled(false);
          
          // Vérifier si la permission a été refusée définitivement
          const currentStatus = permissionStatus;
          const isDenied = currentStatus === 'denied';
          
          InteractionManager.runAfterInteractions(() => {
            setTimeout(() => {
              if (!isMountedRef.current) return;
              Alert.alert(
                t('notificationPermissionRequired') || 'Permission requise',
                isDenied
                  ? (t('notificationPermissionDeniedMessage') || 'Les notifications ont été refusées. Pour les activer, allez dans Réglages > Applications > Productif.io > Notifications.')
                  : (t('notificationPermissionMessage') || 'Veuillez autoriser les notifications pour recevoir vos rappels.'),
                [
                  { text: t('cancel') || 'Annuler', style: 'cancel' },
                  ...(isDenied ? [{
                    text: t('openSettings') || 'Ouvrir les réglages',
                    onPress: () => {
                      if (Platform.OS === 'android') {
                        Linking.openSettings();
                      } else {
                        Linking.openURL('app-settings:');
                      }
                    }
                  }] : [])
                ]
              );
            }, 300);
          });
        }
      } catch (error) {
        console.error('Erreur lors de la demande de permission:', error);
        if (!isMountedRef.current) return;
        setNotificationsEnabled(false);
        InteractionManager.runAfterInteractions(() => {
          setTimeout(() => {
            if (!isMountedRef.current) return;
            Alert.alert(
              t('error') || 'Erreur',
              t('notificationPermissionError') || 'Une erreur est survenue lors de la demande de permission.'
            );
          }, 300);
        });
      } finally {
        if (isMountedRef.current) {
          setIsRequestingNotificationPermission(false);
        }
      }
    } else {
      // L'utilisateur désactive les notifications
      if (!isMountedRef.current) return;
      setNotificationsEnabled(false);
      await saveNotificationPreferences({ isEnabled: false });
    }
  };

  const showSavedFeedback = () => {
    if (!isMountedRef.current) return;
    setSavedFeedback(true);
    setTimeout(() => {
      if (isMountedRef.current) {
        setSavedFeedback(false);
      }
    }, 2000);
  };

  const handleConnectCalendar = async () => {
    setCalendarLoading(true);
    try {
      const success = await connectGoogleCalendar();
      if (success) {
        setCalendarConnected(true);
        showSavedFeedback();
        Alert.alert(t('success') || 'Succès', t('calendarConnected') || 'Google Calendar connecté avec succès');
      }
    } catch (error) {
      console.error('Erreur connexion Google Calendar:', error);
      Alert.alert(
        t('error') || 'Erreur',
        t('calendarConnectionError') || 'Impossible de connecter Google Calendar. Veuillez réessayer.'
      );
    } finally {
      setCalendarLoading(false);
    }
  };

  const handleDisconnectCalendar = async () => {
    Alert.alert(
      t('disconnectCalendar') || 'Déconnecter Google Calendar',
      t('disconnectCalendarConfirm') || 'Voulez-vous vraiment déconnecter Google Calendar ?',
      [
        { text: t('cancel') || 'Annuler', style: 'cancel' },
        {
          text: t('disconnect') || 'Déconnecter',
          style: 'destructive',
          onPress: async () => {
            try {
              // TODO: Implémenter la déconnexion côté backend si nécessaire
              setCalendarConnected(false);
              showSavedFeedback();
            } catch (error) {
              console.error('Erreur déconnexion Google Calendar:', error);
              Alert.alert(
                t('error') || 'Erreur',
                t('calendarDisconnectionError') || 'Impossible de déconnecter Google Calendar.'
              );
            }
          },
        },
      ]
    );
  };

  const resetOnboarding = async () => {
    Alert.alert(
      'Réinitialiser l\'onboarding',
      'Voulez-vous vraiment réinitialiser l\'onboarding ? Vous serez redirigé vers l\'écran d\'accueil.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Réinitialiser',
          style: 'default',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('onboarding_completed');
              router.replace('/(onboarding-new)/intro');
            } catch (error) {
              console.error('Erreur lors de la réinitialisation de l\'onboarding:', error);
              Alert.alert(t('error'), t('resetOnboardingError') || 'Impossible de réinitialiser l\'onboarding');
            }
          },
        },
      ]
    );
  };

  if (view === 'editProfile') {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInUp.delay(100).duration(400)} style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setView('main')}
            >
              <Ionicons name="arrow-back" size={22} color="#000" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t('editProfile') || 'Edit Profile'}</Text>
            <View style={{ width: 40 }} />
          </Animated.View>

          <View style={styles.formContainer}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>{t('name') || 'Name'}</Text>
              <TextInput
                style={styles.formInput}
                value={name}
                onChangeText={setName}
                placeholder={t('name') || 'Name'}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>{t('academicField') || 'Academic field'}</Text>
              <TextInput
                style={styles.formInput}
                value={academicField}
                onChangeText={setAcademicField}
                placeholder={t('academicField') || 'Academic field'}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>{t('studyLevel') || 'Study level'}</Text>
              <Text style={styles.formHint}>{t('selectYearLevel') || 'Select your year (1-9)'}</Text>
              <View style={styles.yearSelector}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((year) => (
                  <TouchableOpacity
                    key={year}
                    style={[
                      styles.yearButton,
                      studyLevel === year && styles.yearButtonSelected,
                    ]}
                    onPress={() => setStudyLevel(year)}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.yearButtonText,
                      studyLevel === year && styles.yearButtonTextSelected,
                    ]}>
                      {year}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={async () => {
                // Sauvegarder dans useOnboardingData
                await saveResponse('studentType', academicField);
                await saveResponse('studyLevel', studyLevel);
                showSavedFeedback();
                setTimeout(() => setView('main'), 500);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.saveButtonText}>{t('saveChanges') || 'Save Changes'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  if (view === 'dailyStructure') {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInUp.delay(100).duration(400)} style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setView('main')}
            >
              <Ionicons name="arrow-back" size={22} color="#000" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t('dailyStructure') || 'Daily Structure'}</Text>
            {savedFeedback && (
              <View style={styles.savedBadge}>
                <Ionicons name="checkmark" size={16} color="#16A34A" />
                <Text style={styles.savedText}>{t('saved') || 'Saved'}</Text>
              </View>
            )}
          </Animated.View>

          <View style={styles.settingsContainer}>
            <Text style={styles.settingsHint}>
              Ces paramètres aident le système à s'adapter à vous.
            </Text>

            {/* Preferred focus duration */}
            <View style={styles.settingCard}>
              <View style={styles.settingCardHeader}>
                <Text style={styles.settingCardTitle}>Durée de concentration préférée</Text>
                <Text style={styles.settingCardSubtitle}>Durée de session par défaut</Text>
              </View>
              <View style={styles.durationButtons}>
                {([25, 45, 60, 90] as const).map((duration) => (
                  <TouchableOpacity
                    key={duration}
                    style={[
                      styles.durationButton,
                      focusDuration === duration && styles.durationButtonActive,
                    ]}
                    onPress={() => {
                      setFocusDuration(duration);
                      saveDailyStructure({ focusDuration: duration });
                      showSavedFeedback();
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.durationButtonText,
                        focusDuration === duration && styles.durationButtonTextActive,
                      ]}
                    >
                      {duration}m
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Max sessions per day */}
            <View style={styles.settingCard}>
              <View style={styles.settingCardHeader}>
                <Text style={styles.settingCardTitle}>Sessions de concentration maximum par jour</Text>
                <Text style={styles.settingCardSubtitle}>Limite de capacité quotidienne</Text>
              </View>
              <View style={styles.sliderContainer}>
                <View style={styles.sliderTrack}>
                  <View
                    style={[
                      styles.sliderFill,
                      { width: `${((maxSessions - 3) / 5) * 100}%` },
                    ]}
                  />
                </View>
                <View style={styles.sliderValueContainer}>
                  <Text style={styles.sliderValue}>{maxSessions}</Text>
                </View>
              </View>
              <View style={styles.sliderButtons}>
                <TouchableOpacity
                  style={styles.sliderButton}
                  onPress={() => {
                    if (maxSessions > 3) {
                      const newValue = maxSessions - 1;
                      setMaxSessions(newValue);
                      saveDailyStructure({ maxSessions: newValue });
                      showSavedFeedback();
                    }
                  }}
                >
                  <Ionicons name="remove" size={20} color="#000" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.sliderButton}
                  onPress={() => {
                    if (maxSessions < 8) {
                      const newValue = maxSessions + 1;
                      setMaxSessions(newValue);
                      saveDailyStructure({ maxSessions: newValue });
                      showSavedFeedback();
                    }
                  }}
                >
                  <Ionicons name="add" size={20} color="#000" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Workload intensity */}
            <View style={styles.settingCard}>
              <View style={styles.settingCardHeader}>
                <Text style={styles.settingCardTitle}>Intensité de charge de travail quotidienne</Text>
                <Text style={styles.settingCardSubtitle}>Rythme et fréquence des sessions</Text>
              </View>
              <View style={styles.intensityButtons}>
                {(['light', 'balanced', 'intensive'] as const).map((intensity) => (
                  <TouchableOpacity
                    key={intensity}
                    style={[
                      styles.intensityButton,
                      workloadIntensity === intensity && styles.intensityButtonActive,
                    ]}
                    onPress={() => {
                      setWorkloadIntensity(intensity);
                      saveDailyStructure({ workloadIntensity: intensity });
                      showSavedFeedback();
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.intensityButtonText,
                        workloadIntensity === intensity && styles.intensityButtonTextActive,
                      ]}
                    >
                      {intensity.charAt(0).toUpperCase() + intensity.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Bottom spacing */}
          <View style={{ height: 120 }} />
        </ScrollView>
      </View>
    );
  }

  if (view === 'notifications') {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInUp.delay(100).duration(400)} style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setView('main')}
            >
              <Ionicons name="arrow-back" size={22} color="#000" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Notifications</Text>
            {savedFeedback && (
              <View style={styles.savedBadge}>
                <Ionicons name="checkmark" size={16} color="#16A34A" />
                <Text style={styles.savedText}>{t('saved') || 'Saved'}</Text>
              </View>
            )}
          </Animated.View>

          <View style={styles.settingsContainer}>
            {/* Global toggle */}
            <View style={styles.settingCard}>
              <View style={styles.settingCardRow}>
                <View style={[styles.settingCardContent, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.settingCardTitle}>
                    {t('enableNotifications', undefined, 'Activer les notifications')}
                  </Text>
                  <Text style={styles.settingCardSubtitle}>
                    {t('enableNotificationsDescription', undefined, 'Recevoir des rappels et mises à jour')}
                  </Text>
                </View>
                <Switch
                  value={notificationsEnabled}
                  onValueChange={handleNotificationToggle}
                  trackColor={{ false: 'rgba(0, 0, 0, 0.1)', true: '#16A34A' }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>

            {/* Sub-section: Rappels et horaires */}
            {notificationsEnabled && (
              <>
                <Text style={styles.subsectionLabel}>
                  {t('remindersAndSchedules', undefined, 'Rappels et horaires')}
                </Text>

                <View style={styles.settingCard}>
                  <View style={styles.settingCardRow}>
                    <Text style={[styles.settingCardTitle, { flex: 1, marginRight: 12 }]}>
                      {t('startOfDayReminder', undefined, 'Rappel début de journée')}
                    </Text>
                    <TextInput
                      style={styles.timeInlineInput}
                      value={startOfDayTime}
                      onChangeText={async (value) => {
                        if (!isMountedRef.current) return;
                        setStartOfDayTime(value);
                        if (isValidTime(value)) {
                          await saveNotificationPreferences({ morningTime: value });
                        }
                      }}
                      placeholder="08:00"
                      maxLength={5}
                      keyboardType="numbers-and-punctuation"
                    />
                    <Switch
                      value={startOfDayReminder}
                      onValueChange={async (value) => {
                        if (!isMountedRef.current) return;
                        setStartOfDayReminder(value);
                        await saveNotificationPreferences({ morningReminder: value });
                      }}
                      trackColor={{ false: 'rgba(0, 0, 0, 0.1)', true: '#16A34A' }}
                      thumbColor="#FFFFFF"
                    />
                  </View>
                </View>

                <View style={styles.settingCard}>
                  <View style={styles.settingCardRow}>
                    <View style={[styles.settingCardContent, { flex: 1, marginRight: 8 }]}>
                      <Text style={styles.settingCardTitle}>
                        {t('focusSessionReminder', undefined, 'Rappel de session de concentration')}
                      </Text>
                      <Text style={styles.settingCardSubtitle}>
                        {t('focusSessionReminderDescription', undefined, 'Avant les blocs planifiés')}
                      </Text>
                    </View>
                    <Switch
                      value={focusReminder}
                      onValueChange={(value) => {
                        if (!isMountedRef.current) return;
                        setFocusReminder(value);
                        InteractionManager.runAfterInteractions(() => {
                          setTimeout(() => {
                            if (isMountedRef.current) {
                              showSavedFeedback();
                            }
                          }, 300);
                        });
                      }}
                      trackColor={{ false: 'rgba(0, 0, 0, 0.1)', true: '#16A34A' }}
                      thumbColor="#FFFFFF"
                    />
                  </View>
                </View>

                <View style={styles.settingCard}>
                  <View style={styles.settingCardRow}>
                    <Text style={[styles.settingCardTitle, { flex: 1, marginRight: 12 }]}>
                      {t('breakReminder', undefined, 'Rappel de pause')}
                    </Text>
                    <TextInput
                      style={styles.timeInlineInput}
                      value={breakTime}
                      onChangeText={async (value) => {
                        if (!isMountedRef.current) return;
                        setBreakTime(value);
                        if (isValidTime(value)) {
                          await saveNotificationPreferences({ noonTime: value, noonReminder: breakReminder });
                        }
                      }}
                      placeholder="12:00"
                      maxLength={5}
                      keyboardType="numbers-and-punctuation"
                    />
                    <Switch
                      value={breakReminder}
                      onValueChange={async (value) => {
                        if (!isMountedRef.current) return;
                        setBreakReminder(value);
                        await saveNotificationPreferences({ noonReminder: value });
                      }}
                      trackColor={{ false: 'rgba(0, 0, 0, 0.1)', true: '#16A34A' }}
                      thumbColor="#FFFFFF"
                    />
                  </View>
                </View>

                <View style={styles.settingCard}>
                  <View style={styles.settingCardRow}>
                    <Text style={[styles.settingCardTitle, { flex: 1, marginRight: 12 }]}>
                      {t('endOfDayRecap', undefined, 'Heure du récapitulatif du soir')}
                    </Text>
                    <TextInput
                      style={styles.timeInlineInput}
                      value={endOfDayTime}
                      onChangeText={async (value) => {
                        if (!isMountedRef.current) return;
                        setEndOfDayTime(value);
                        if (isValidTime(value)) {
                          await saveNotificationPreferences({ recapTime: value, recapReminder: endOfDayRecap });
                        }
                      }}
                      placeholder="21:00"
                      maxLength={5}
                      keyboardType="numbers-and-punctuation"
                    />
                    <Switch
                      value={endOfDayRecap}
                      onValueChange={async (value) => {
                        if (!isMountedRef.current) return;
                        setEndOfDayRecap(value);
                        await saveNotificationPreferences({ recapReminder: value });
                      }}
                      trackColor={{ false: 'rgba(0, 0, 0, 0.1)', true: '#16A34A' }}
                      thumbColor="#FFFFFF"
                    />
                  </View>
                </View>
              </>
            )}
          </View>

          {/* Bottom spacing */}
          <View style={{ height: 120 }} />
        </ScrollView>
      </View>
    );
  }

  // MAIN VIEW
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeInUp.delay(100).duration(400)} style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={22} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('settings')}</Text>
          {savedFeedback && (
            <View style={styles.savedBadge}>
              <Ionicons name="checkmark" size={16} color="#16A34A" />
              <Text style={styles.savedText}>Saved</Text>
            </View>
          )}
        </Animated.View>

        {/* SECTION 1 — ACCOUNT */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.section}>
          <Text style={styles.sectionLabel}>{t('account')}</Text>
          <View style={styles.accountCard}>
            <View style={styles.accountRow}>
              <Text style={styles.accountLabel}>{t('name') || 'Name'}</Text>
              <Text style={styles.accountValue}>{name}</Text>
            </View>
            <View style={styles.accountDivider} />
            <View style={styles.accountRow}>
              <Text style={styles.accountLabel}>{t('academicField') || 'Academic field'}</Text>
              <Text style={styles.accountValue}>{academicField}</Text>
            </View>
            <View style={styles.accountDivider} />
            <View style={styles.accountRow}>
              <Text style={styles.accountLabel}>{t('studyLevel') || 'Study level'}</Text>
              <Text style={styles.accountValue}>{t('yearLevel', { year: studyLevel }) || `Year ${studyLevel}`}</Text>
            </View>
            <View style={styles.accountDivider} />
            <TouchableOpacity
              style={styles.accountButton}
              onPress={() => setView('editProfile')}
              activeOpacity={0.7}
            >
              <Text style={styles.accountButtonText}>{t('editProfile')}</Text>
              <Ionicons name="chevron-forward" size={20} color="rgba(0, 0, 0, 0.4)" />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* SECTION 2 — DAILY STRUCTURE */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.section}>
          <Text style={styles.sectionLabel}>{t('dailyStructure') || 'Daily Structure'}</Text>
          <TouchableOpacity
            style={styles.structureCard}
            onPress={() => setView('dailyStructure')}
            activeOpacity={0.7}
          >
            <View style={styles.structureCardContent}>
              <View style={styles.structureIcon}>
                <Ionicons name="time-outline" size={24} color="#16A34A" />
              </View>
              <View style={styles.structureInfo}>
                <Text style={styles.structureTitle}>{t('dailyStructureSettings') || t('dailyStructure') || 'Structure quotidienne'}</Text>
                <Text style={styles.structureSubtitle} numberOfLines={1}>
                  {focusDuration}{t('min') || 'min'} • {maxSessions} {t('sessions') || 'sessions'} • {workloadIntensity === 'light' ? t('workloadIntensityLight') : workloadIntensity === 'balanced' ? t('workloadIntensityBalanced') : t('workloadIntensityIntensive') || workloadIntensity}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="rgba(0, 0, 0, 0.4)" />
          </TouchableOpacity>
        </Animated.View>

        {/* SECTION 3 — NOTIFICATIONS */}
        <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.section}>
          <Text style={styles.sectionLabel}>{t('notifications')}</Text>
          <View style={styles.notificationsContainer}>
            <View style={styles.settingCard}>
              <View style={styles.settingCardRow}>
                <View style={styles.settingCardContent}>
                  <View style={styles.settingIcon}>
                    <Ionicons name="notifications-outline" size={24} color="#16A34A" />
                  </View>
                  <Text style={styles.settingCardTitle}>{t('notifications')}</Text>
                </View>
                <Switch
                  value={notificationsEnabled}
                  onValueChange={handleNotificationToggle}
                  disabled={isRequestingNotificationPermission}
                  trackColor={{ false: 'rgba(0, 0, 0, 0.1)', true: '#16A34A' }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>

            {notificationsEnabled && (
              <TouchableOpacity
                style={styles.settingCard}
                onPress={() => setView('notifications')}
                activeOpacity={0.7}
              >
                <View style={styles.settingCardRow}>
                  <View style={styles.settingCardContent}>
                    <View style={styles.settingIcon}>
                      <Ionicons name="alarm-outline" size={24} color="#16A34A" />
                    </View>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={styles.settingCardTitle} numberOfLines={1}>{t('remindersAndSchedules') || 'Rappels et horaires'}</Text>
                      <Text style={styles.settingCardSubtitle} numberOfLines={2}>
                        {t('remindersAndSchedulesDescription') || 'Matin, midi, soir, questions humeur/stress/focus'}
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="rgba(0, 0, 0, 0.4)" />
                </View>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>

        {/* SECTION 4 — PRIVACY & DATA */}
        <Animated.View entering={FadeInDown.delay(500).duration(400)} style={styles.section}>
          <Text style={styles.sectionLabel}>{t('privacyData') || 'Privacy & Data'}</Text>
          <View style={styles.privacyContainer}>
            <View style={styles.settingCard}>
              <View style={styles.settingCardRow}>
                <View style={styles.settingCardContent}>
                  <Text style={styles.settingCardTitle}>{t('googleCalendar')}</Text>
                  <Text style={styles.settingCardSubtitle}>
                    {calendarConnected ? (t('connected') || 'Connected') : (t('notConnected') || 'Not connected')}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusDot,
                    calendarConnected && styles.statusDotActive,
                  ]}
                />
              </View>
              {calendarConnected ? (
                <TouchableOpacity
                  style={styles.disconnectButton}
                  onPress={handleDisconnectCalendar}
                  activeOpacity={0.7}
                  disabled={calendarLoading}
                >
                  <Text style={styles.disconnectButtonText}>{t('disconnectButton') || 'Se déconnecter'}</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.connectButton}
                  onPress={handleConnectCalendar}
                  activeOpacity={0.7}
                  disabled={calendarLoading}
                >
                  <Text style={styles.connectButtonText}>
                    {calendarLoading ? (t('connecting') || 'Connexion...') : (t('connectCalendar') || 'Connecter')}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity style={styles.deleteCard} activeOpacity={0.7}>
              <Text style={styles.deleteText}>Supprimer mon compte</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* SECTION 5 — SUBSCRIPTION */}
        <Animated.View entering={FadeInDown.delay(600).duration(400)} style={styles.section}>
          <Text style={styles.sectionLabel}>{t('subscription') || 'Subscription'}</Text>
          <TouchableOpacity
            style={styles.subscriptionCard}
            onPress={() => router.push('/paywall')}
            activeOpacity={0.7}
          >
            <View style={styles.subscriptionContent}>
              <Text style={styles.subscriptionTitle}>{t('currentPlan')}: {t('free')}</Text>
              <Text style={styles.subscriptionSubtitle}>
                {t('unlockFeaturesDescription') || 'Unlock Exam Mode, calendar sync, and advanced AI'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#16A34A" />
          </TouchableOpacity>
        </Animated.View>

        {/* SECTION 6 — SUPPORT & INFO */}
        <Animated.View entering={FadeInDown.delay(700).duration(400)} style={styles.section}>
          <Text style={styles.sectionLabel}>{t('supportInfo') || 'Support & Info'}</Text>
          <View style={styles.supportContainer}>
            <TouchableOpacity 
              style={styles.settingCard} 
              activeOpacity={0.7}
              onPress={async () => {
                const email = 'mailto:contact@productif.io';
                try {
                  const canOpen = await Linking.canOpenURL(email);
                  if (canOpen) {
                    await Linking.openURL(email);
                  } else {
                    Alert.alert(
                      t('error') || 'Erreur',
                      'Impossible d\'ouvrir l\'application email. Veuillez envoyer un email à contact@productif.io'
                    );
                  }
                } catch (error) {
                  Alert.alert(
                    t('error') || 'Erreur',
                    'Impossible d\'ouvrir l\'application email. Veuillez envoyer un email à contact@productif.io'
                  );
                }
              }}
            >
              <View style={styles.settingCardRow}>
                <Text style={styles.settingCardTitle}>{t('contactSupport') || 'Contact support'}</Text>
                <Ionicons name="chevron-forward" size={20} color="rgba(0, 0, 0, 0.4)" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.settingCard} 
              activeOpacity={0.7}
              onPress={async () => {
                const url = 'https://productif.io/terms';
                try {
                  const canOpen = await Linking.canOpenURL(url);
                  if (canOpen) {
                    await Linking.openURL(url);
                  } else {
                    Alert.alert(
                      t('error') || 'Erreur',
                      'Impossible d\'ouvrir le navigateur.'
                    );
                  }
                } catch (error) {
                  Alert.alert(
                    t('error') || 'Erreur',
                    'Impossible d\'ouvrir le navigateur.'
                  );
                }
              }}
            >
              <View style={styles.settingCardRow}>
                <Text style={styles.settingCardTitle}>{t('termsPrivacy') || 'Terms & privacy'}</Text>
                <Ionicons name="chevron-forward" size={20} color="rgba(0, 0, 0, 0.4)" />
              </View>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* SECTION 7 — DEVELOPMENT */}
        <Animated.View entering={FadeInDown.delay(750).duration(400)} style={styles.section}>
          <Text style={styles.sectionLabel}>Développement</Text>
          <TouchableOpacity 
            style={styles.settingCard} 
            activeOpacity={0.7}
            onPress={resetOnboarding}
          >
            <View style={styles.settingCardRow}>
              <View style={styles.settingCardContent}>
                <Text style={styles.settingCardTitle}>Réinitialiser l'onboarding</Text>
                <Text style={styles.settingCardSubtitle}>Tester à nouveau le flux d'onboarding</Text>
              </View>
              <Ionicons name="refresh-outline" size={20} color="#16A34A" />
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* SECTION 8 — LOGOUT */}
        <Animated.View entering={FadeInDown.delay(800).duration(400)} style={styles.section}>
          <TouchableOpacity
            style={styles.logoutCard}
            onPress={async () => {
              try {
                // Nettoyer la session
                await authService.logout();
                // Supprimer le flag d'onboarding pour forcer la redirection vers l'intro
                await AsyncStorage.removeItem('onboarding_completed');
                // Rediriger vers la page de connexion
                router.replace('/(onboarding-new)/connection');
              } catch (error) {
                console.error('Erreur lors de la déconnexion:', error);
                // Même en cas d'erreur, nettoyer et rediriger
                await AsyncStorage.removeItem('onboarding_completed');
                router.replace('/(onboarding-new)/connection');
              }
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            <Text style={styles.logoutText}>{t('logout')}</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Footer */}
        <Animated.View entering={FadeInDown.delay(900).duration(400)} style={styles.footer}>
          <Text style={styles.footerText}>Productif.io — built for serious students.</Text>
          <Text style={styles.footerVersion}>Version 1.0.0</Text>
        </Animated.View>

        {/* Bottom spacing */}
        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
    gap: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '600',
    letterSpacing: -1.2,
    color: '#000000',
    flex: 1,
  },
  savedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
  },
  savedText: {
    fontSize: 14,
    color: '#16A34A',
    fontWeight: '500',
  },
  section: {
    marginBottom: 48,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(0, 0, 0, 0.4)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
  },
  accountCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  accountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  accountLabel: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.4)',
  },
  accountValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
  accountDivider: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    marginHorizontal: 20,
  },
  accountButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  accountButtonText: {
    fontSize: 16,
    color: '#000000',
  },
  structureCard: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  structureCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  structureIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  structureInfo: {
    flex: 1,
  },
  structureTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 4,
  },
  structureSubtitle: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.6)',
    flexShrink: 1,
  },
  notificationsContainer: {
    gap: 12,
  },
  settingCard: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    backgroundColor: '#FFFFFF',
  },
  settingCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
    flexShrink: 1,
  },
  settingIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingCardTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 4,
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  settingCardSubtitle: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.6)',
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  subsectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(0, 0, 0, 0.4)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 8,
    marginBottom: 12,
  },
  timeInlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  timeInlineInput: {
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 70,
    textAlign: 'center',
    fontSize: 14,
    color: '#000000',
    backgroundColor: '#F9FAFB',
  },
  privacyContainer: {
    gap: 12,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  statusDotActive: {
    backgroundColor: '#16A34A',
  },
  disconnectButton: {
    marginTop: 16,
    paddingVertical: 10,
    borderRadius: 16,
    alignItems: 'center',
  },
  disconnectButtonText: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.6)',
  },
  connectButton: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: '#16A34A',
    alignItems: 'center',
  },
  connectButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  deleteCard: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  deleteText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(0, 0, 0, 0.6)',
  },
  subscriptionCard: {
    padding: 32,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'rgba(22, 163, 74, 0.2)',
    backgroundColor: 'rgba(22, 163, 74, 0.05)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subscriptionContent: {
    flex: 1,
  },
  subscriptionTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 4,
  },
  subscriptionSubtitle: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.6)',
  },
  supportContainer: {
    gap: 12,
  },
  logoutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#EF4444',
  },
  footer: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 32,
  },
  footerText: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.4)',
    fontStyle: 'italic',
  },
  footerVersion: {
    fontSize: 12,
    color: 'rgba(0, 0, 0, 0.2)',
  },
  formContainer: {
    gap: 24,
  },
  formGroup: {
    gap: 8,
  },
  formLabel: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 4,
  },
  formHint: {
    fontSize: 12,
    color: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: 4,
    marginTop: -4,
  },
  formInput: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    backgroundColor: '#FFFFFF',
    fontSize: 16,
    color: '#000000',
  },
  yearSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  yearButton: {
    width: 56,
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  yearButtonSelected: {
    borderColor: '#16A34A',
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
  },
  yearButtonText: {
    fontSize: 18,
    fontWeight: '500',
    color: 'rgba(0, 0, 0, 0.6)',
  },
  yearButtonTextSelected: {
    color: '#16A34A',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#16A34A',
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  settingsContainer: {
    gap: 16,
  },
  settingsHint: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.4)',
    marginBottom: 16,
  },
  durationButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  durationButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    alignItems: 'center',
  },
  durationButtonActive: {
    borderColor: '#16A34A',
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
  },
  durationButtonText: {
    fontSize: 16,
    color: '#000000',
  },
  durationButtonTextActive: {
    color: '#16A34A',
    fontWeight: '600',
  },
  sliderContainer: {
    marginTop: 16,
    gap: 12,
  },
  sliderTrack: {
    height: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  sliderFill: {
    height: '100%',
    backgroundColor: '#16A34A',
    borderRadius: 4,
  },
  sliderValueContainer: {
    alignItems: 'center',
  },
  sliderValue: {
    fontSize: 24,
    fontWeight: '500',
    color: '#000000',
  },
  sliderButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
  },
  sliderButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  intensityButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  intensityButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    alignItems: 'center',
  },
  intensityButtonActive: {
    borderColor: '#16A34A',
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
  },
  intensityButtonText: {
    fontSize: 16,
    color: '#000000',
  },
  intensityButtonTextActive: {
    color: '#16A34A',
    fontWeight: '600',
  },
});

