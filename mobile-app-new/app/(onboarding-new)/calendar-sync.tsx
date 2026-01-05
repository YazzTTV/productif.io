import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeIn,
} from 'react-native-reanimated';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { connectGoogleCalendar, connectAppleCalendar, createAppleCalendarEvent } from '@/lib/calendarAuth';
import { googleCalendarService } from '@/lib/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function CalendarSyncScreen() {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isCreatingEvents, setIsCreatingEvents] = useState(false);

  const createCalendarEvents = async (tasks: any[], isGoogle: boolean) => {
    setIsCreatingEvents(true);
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      let successCount = 0;
      let errorCount = 0;

      for (const task of tasks) {
        if (!task.id || !task.dueDate) {
          console.log(`⚠️ [CalendarSync] Tâche ignorée (pas d'ID ou de date):`, task);
          continue;
        }

        try {
          const dueDate = new Date(task.dueDate);
          const hours = dueDate.getHours();
          const minutes = dueDate.getMinutes();
          
          // Estimer la durée en fonction de l'énergie
          let duration = 60; // Par défaut 60 minutes
          if (task.energyLevel === 0) duration = 30;
          else if (task.energyLevel === 1) duration = 45;
          else if (task.energyLevel === 2) duration = 60;
          else if (task.energyLevel === 3) duration = 90;

          const startDate = new Date(dueDate);
          startDate.setHours(hours, minutes, 0, 0);
          
          const endDate = new Date(startDate);
          endDate.setMinutes(endDate.getMinutes() + duration);

          if (isGoogle) {
            // Créer l'événement via l'API backend
            const result = await googleCalendarService.scheduleTask(
              task.id,
              startDate.toISOString(),
              endDate.toISOString(),
              timezone
            );

            if (result.success) {
              console.log(`✅ [CalendarSync] Événement créé pour tâche: ${task.title}`);
              successCount++;
            } else {
              console.error(`❌ [CalendarSync] Erreur création événement pour ${task.title}:`, result.error);
              errorCount++;
            }
          } else {
            // Pour Apple Calendar, utiliser le calendrier par défaut
            if (Platform.OS === 'ios') {
              try {
                const CalendarModule = await import('expo-calendar');
                const calendars = await CalendarModule.default.getCalendarsAsync(
                  CalendarModule.default.EntityTypes.EVENT
                );
                
                if (calendars.length > 0) {
                  const defaultCalendar = calendars.find(c => c.isPrimary) || calendars[0];
                  const eventId = await createAppleCalendarEvent(
                    defaultCalendar.id,
                    task.title,
                    startDate,
                    endDate,
                    task.description
                  );

                  if (eventId) {
                    console.log(`✅ [CalendarSync] Événement Apple créé pour tâche: ${task.title}`);
                    successCount++;
                  } else {
                    console.error(`❌ [CalendarSync] Erreur création événement Apple pour ${task.title}`);
                    errorCount++;
                  }
                }
              } catch (error) {
                console.error(`❌ [CalendarSync] Erreur import expo-calendar:`, error);
                errorCount++;
              }
            }
          }
        } catch (error: any) {
          console.error(`❌ [CalendarSync] Erreur création événement pour ${task.title}:`, error);
          errorCount++;
        }
      }

      console.log(`📅 [CalendarSync] Événements créés: ${successCount} réussis, ${errorCount} erreurs`);
      return { successCount, errorCount };
    } catch (error: any) {
      console.error('❌ [CalendarSync] Erreur lors de la création des événements:', error);
      throw error;
    } finally {
      setIsCreatingEvents(false);
    }
  };

  const handleConnectGoogle = async () => {
    setIsConnecting(true);
    try {
      console.log('🔐 [CalendarSync] Démarrage connexion Google Calendar...');
      const success = await connectGoogleCalendar();
      
      if (success) {
        console.log('✅ [CalendarSync] Google Calendar connecté avec succès');
        
        // Créer les événements pour les tâches
        const tasksParam = params.tasks as string;
        if (tasksParam) {
          try {
            const tasks = JSON.parse(tasksParam);
            await createCalendarEvents(tasks, true);
          } catch (error) {
            console.error('❌ [CalendarSync] Erreur parsing tâches:', error);
          }
        }
        
        // Récupérer le firstName depuis les paramètres ou AsyncStorage
        const firstName = (params.firstName as string) || await AsyncStorage.getItem('onboarding_firstName') || '';
        // Rediriger vers la page de succès après connexion réussie
        router.replace({
          pathname: '/(onboarding-new)/success',
          params: firstName ? { firstName } : {},
        });
      } else {
        console.log('ℹ️ [CalendarSync] Connexion Google Calendar annulée par l\'utilisateur');
        // Ne pas rediriger si l'utilisateur a annulé
      }
    } catch (error: any) {
      console.error('❌ [CalendarSync] Erreur lors de la connexion Google Calendar:', error);
      Alert.alert(
        'Erreur',
        error.message || 'Une erreur est survenue lors de la connexion à Google Calendar'
      );
    } finally {
      setIsConnecting(false);
    }
  };

  const handleConnectApple = async () => {
    if (Platform.OS !== 'ios') {
      Alert.alert(
        'Non disponible',
        'Apple Calendar est uniquement disponible sur iOS'
      );
      return;
    }

    setIsConnecting(true);
    try {
      console.log('🍎 [CalendarSync] Démarrage connexion Apple Calendar...');
      const success = await connectAppleCalendar();
      
      if (success) {
        console.log('✅ [CalendarSync] Apple Calendar connecté avec succès');
        
        // Créer les événements pour les tâches
        const tasksParam = params.tasks as string;
        if (tasksParam) {
          try {
            const tasks = JSON.parse(tasksParam);
            await createCalendarEvents(tasks, false);
          } catch (error) {
            console.error('❌ [CalendarSync] Erreur parsing tâches:', error);
          }
        }
        
        // Récupérer le firstName depuis les paramètres ou AsyncStorage
        const firstName = (params.firstName as string) || await AsyncStorage.getItem('onboarding_firstName') || '';
        // Rediriger vers la page de succès après connexion réussie
        router.replace({
          pathname: '/(onboarding-new)/success',
          params: firstName ? { firstName } : {},
        });
      } else {
        console.log('ℹ️ [CalendarSync] Connexion Apple Calendar annulée ou refusée');
        // Ne pas rediriger si l'utilisateur a refusé
      }
    } catch (error: any) {
      console.error('❌ [CalendarSync] Erreur lors de la connexion Apple Calendar:', error);
      Alert.alert(
        'Erreur',
        error.message || 'Une erreur est survenue lors de la connexion à Apple Calendar'
      );
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSkip = () => {
    router.replace('/(tabs)');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Icon */}
          <Animated.View
            entering={FadeIn.delay(100).duration(400)}
            style={styles.iconContainer}
          >
            <View style={styles.iconCircle}>
              <Ionicons name="calendar-outline" size={40} color="#16A34A" />
            </View>
          </Animated.View>

          {/* Title */}
          <Animated.View entering={FadeIn.delay(200).duration(400)}>
            <Text style={styles.title}>
              {t('syncYourDay') || 'Sync your day'}
            </Text>
            <Text style={styles.subtitle}>
              {t('createEvents') || 'We create events for your plan.'}
            </Text>
          </Animated.View>

          {/* Calendar options */}
          <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.optionsContainer}>
            {/* Google Calendar */}
            <TouchableOpacity
              onPress={handleConnectGoogle}
              disabled={isConnecting}
              style={[
                styles.optionButton,
                isConnecting && styles.optionButtonDisabled,
              ]}
              activeOpacity={0.7}
            >
              <View style={styles.optionIconContainer}>
                <View style={styles.googleIcon}>
                  {isConnecting ? (
                    <ActivityIndicator size="small" color="#4285F4" />
                  ) : (
                    <Ionicons name="logo-google" size={28} color="#4285F4" />
                  )}
                </View>
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>
                  {t('googleCalendar') || 'Google Calendar'}
                </Text>
                {(isConnecting || isCreatingEvents) && (
                  <Text style={styles.optionSubtitle}>
                    {isConnecting 
                      ? (t('connecting') || 'Connecting...')
                      : (t('creatingEvents') || 'Creating events...')
                    }
                  </Text>
                )}
              </View>
            </TouchableOpacity>

            {/* Apple Calendar */}
            {Platform.OS === 'ios' && (
              <TouchableOpacity
                onPress={handleConnectApple}
                disabled={isConnecting}
                style={[
                  styles.optionButton,
                  isConnecting && styles.optionButtonDisabled,
                ]}
                activeOpacity={0.7}
              >
                <View style={styles.optionIconContainer}>
                  <View style={styles.appleIcon}>
                    {isConnecting ? (
                      <ActivityIndicator size="small" color="#000000" />
                    ) : (
                      <Ionicons name="logo-apple" size={28} color="#000000" />
                    )}
                  </View>
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>
                    {t('appleCalendar') || 'Apple Calendar'}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          </Animated.View>
        </View>
      </ScrollView>

      {/* Skip button */}
      <View style={styles.footer}>
        <TouchableOpacity
          onPress={handleSkip}
          disabled={isConnecting}
          style={styles.skipButton}
          activeOpacity={0.7}
        >
          <Text style={styles.skipButtonText}>
            {t('skip') || 'Skip for now'}
          </Text>
        </TouchableOpacity>
      </View>
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
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 24,
    paddingVertical: 48,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 32,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.03 * 24,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(0, 0, 0, 0.6)',
    textAlign: 'center',
    marginBottom: 48,
  },
  optionsContainer: {
    width: '100%',
    gap: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    backgroundColor: '#FFFFFF',
    gap: 16,
  },
  optionButtonDisabled: {
    opacity: 0.6,
  },
  optionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIcon: {
    // Google icon styling
  },
  appleIcon: {
    // Apple icon styling
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    letterSpacing: -0.02 * 18,
  },
  optionSubtitle: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.6)',
    marginTop: 4,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 16,
  },
  skipButton: {
    width: '100%',
    paddingVertical: 16,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 16,
    color: 'rgba(0, 0, 0, 0.6)',
  },
});

