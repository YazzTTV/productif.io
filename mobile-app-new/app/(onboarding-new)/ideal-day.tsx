import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useOnboardingData } from '@/hooks/useOnboardingData';
import { useSuperwall } from '@/hooks/useSuperwall';
import { SUPERWALL_EVENTS } from '@/lib/superwallEvents';
import { setTutorialCompleted, setTutorialStage } from '@/tutorial/tutorialStorage';
import { maybePrimePushPermission } from '@/lib/pushPermission';
import DateTimePicker from '@react-native-community/datetimepicker';

interface TimelineBlock {
  time: string;
  duration: number;
  activity: string;
  priority: boolean;
}

export default function IdealDayScreen() {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const { saveResponse, saveResponses } = useOnboardingData();
  const { triggerEvent } = useSuperwall();
  const [priorities, setPriorities] = useState<string[]>([]);
  const [timeline, setTimeline] = useState<TimelineBlock[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedTime, setSelectedTime] = useState(new Date());
  /** Verrouille les deux sorties de l'ecran : sans lui, un double tap lance deux fois la sequence de fin. */
  const [isFinishing, setIsFinishing] = useState(false);

  useEffect(() => {
    try {
      const tasksParam = params.tasks as string;
      if (tasksParam) {
        const tasks = JSON.parse(tasksParam);
        
        // Extraire les 3 tâches prioritaires
        const priorityTasks = tasks
          .filter((task: any) => task.priority)
          .slice(0, 3)
          .map((task: any) => task.title);
        setPriorities(priorityTasks);

        // Créer la timeline à partir des tâches.
        //
        // Ce filtre ne lisait que dueDate. Or une tâche issue du repli local
        // (analyse IA indisponible) n'a pas de dueDate, et une tâche planifiée
        // porte sa date sur scheduledFor. Résultat : la « journée idéale »
        // s'affichait entièrement vide, sous un texte affirmant qu'elle
        // suffisait à faire une bonne journée. Constaté sur le compte du
        // premier testeur externe, le 8 septembre 2026.
        const readTaskDate = (task: any): Date | null => {
          const raw = task.dueDate || task.scheduledFor;
          if (!raw) return null;
          const parsed = new Date(raw);
          return Number.isNaN(parsed.getTime()) ? null : parsed;
        };

        const estimateDuration = (task: any): number => {
          if (task.energyLevel === 0) return 30;
          if (task.energyLevel === 1) return 45;
          if (task.energyLevel === 3) return 90;
          return 60;
        };

        // Sans aucune date exploitable, on étale les tâches à partir de 9h
        // plutôt que de rendre un écran vide : l'utilisateur a bien saisi des
        // tâches, il doit les voir.
        let fallbackCursor = 9 * 60;

        const blocks: TimelineBlock[] = tasks
          .filter((task: any) => (task.title || task.name))
          .map((task: any) => {
            const duration = estimateDuration(task);
            const date = readTaskDate(task);

            let minutesFromMidnight: number;
            if (date) {
              minutesFromMidnight = date.getHours() * 60 + date.getMinutes();
            } else {
              minutesFromMidnight = fallbackCursor;
              fallbackCursor += duration + 15;
            }

            const hours = Math.floor(minutesFromMidnight / 60) % 24;
            const minutes = minutesFromMidnight % 60;

            return {
              time: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`,
              duration,
              activity: task.title || task.name,
              // La clarification renvoie un booléen, que les deux tests
              // d'origine laissaient passer à travers.
              priority: task.priority === true || task.priority === 4 || task.priority === 'high',
            };
          })
          .sort((a: TimelineBlock, b: TimelineBlock) => {
            const [aHours, aMinutes] = a.time.split(':').map(Number);
            const [bHours, bMinutes] = b.time.split(':').map(Number);
            return aHours * 60 + aMinutes - (bHours * 60 + bMinutes);
          });

        // Ajouter des pauses entre les blocs de travail
        const blocksWithBreaks: TimelineBlock[] = [];
        for (let i = 0; i < blocks.length; i++) {
          blocksWithBreaks.push(blocks[i]);
          
          // Ajouter une pause de 15 minutes après chaque bloc de travail de 90+ minutes
          if (blocks[i].duration >= 90 && i < blocks.length - 1) {
            const [hours, minutes] = blocks[i].time.split(':').map(Number);
            const endTime = hours * 60 + minutes + blocks[i].duration;
            const breakHours = Math.floor(endTime / 60);
            const breakMinutes = endTime % 60;
            const breakTimeStr = `${breakHours.toString().padStart(2, '0')}:${breakMinutes.toString().padStart(2, '0')}`;
            
            blocksWithBreaks.push({
              time: breakTimeStr,
              duration: 15,
              activity: t('breakLabel'),
              priority: false,
            });
          }
        }
        
        setTimeline(blocksWithBreaks);
        
        // Sauvegarder la journée idéale
        void saveResponses({
          idealDay: {
            priorities: priorityTasks,
            timeline: blocksWithBreaks,
          },
          currentStep: 11,
        }).catch((error) => {
          console.error('[Onboarding] Erreur sauvegarde journée idéale:', error);
        });
      }
    } catch (error) {
      console.error('Erreur lors du parsing des tâches:', error);
    }
  }, [params.tasks]);

  /**
   * Demande la permission de notification, une seule fois par appareil.
   *
   * C'est sur cet ecran et nulle part ailleurs, parce qu'il est le seul point
   * de passage OBLIGE de la fin de l'onboarding : les deux sorties (lancer une
   * session, ou synchroniser l'agenda) partent de lui. Et c'est le bon moment,
   * l'utilisateur vient de voir sa journee avec des horaires : un rappel a ces
   * heures-la se comprend tout seul.
   *
   * DECLENCHE A L'ARRIVEE SUR L'ECRAN, ET SURTOUT PAS A SA SORTIE. La premiere
   * version appelait ceci dans les deux handlers de sortie, juste avant
   * `triggerEvent`. Constate sur appareil le 17 septembre : la boite systeme
   * d'iOS et le paywall Superwall se sont superposes. `useSuperwall` a bien une
   * garde `isPresenting`, mais elle ne protege que d'un second PAYWALL, elle ne
   * sait rien d'une alerte systeme. La seule facon fiable de ne pas les
   * empiler est de ne jamais les mettre dans le meme geste utilisateur.
   *
   * N'echoue jamais et ne bloque jamais la suite, cf. lib/pushPermission.ts.
   */
  const askForNotifications = async () => {
    await maybePrimePushPermission({
      title: t('pushPrimingTitle', undefined, 'Autoriser les rappels ?'),
      message: t(
        'pushPrimingMessage',
        undefined,
        "Sans notification, l'app ne peut rien te rappeler : ni ta session du matin, ni ce que tu as prévu de réviser. Tu règles la fréquence, et tu peux tout couper dans les réglages."
      ),
      later: t('pushPrimingLater', undefined, 'Plus tard'),
      enable: t('pushPrimingEnable', undefined, 'Activer'),
    });
  };

  // Le delai laisse les animations d'entree se poser : une alerte qui apparait
  // pendant le FadeInDown donne l'impression que l'ecran a plante. Le timeout
  // est annule au demontage, sinon l'alerte s'afficherait par-dessus l'ecran
  // suivant si l'utilisateur va plus vite qu'elle.
  useEffect(() => {
    const timer = setTimeout(() => {
      void askForNotifications();
    }, 900);
    return () => clearTimeout(timer);
  }, []);

  const handleSyncCalendar = async () => {
    if (isFinishing) return;
    setIsFinishing(true);

    try {
      // Récupérer le firstName depuis AsyncStorage pour le passer à calendar-sync
      const storedFirstName = await AsyncStorage.getItem('onboarding_firstName');
      const tasksParam = params.tasks as string;

      router.push({
        pathname: '/(onboarding-new)/calendar-sync',
        params: {
          ...(storedFirstName ? { firstName: storedFirstName } : {}),
          ...(tasksParam ? { tasks: tasksParam } : {}),
        },
      });
    } catch (error) {
      console.error('[Onboarding] Navigation vers calendar-sync impossible:', error);
      setIsFinishing(false);
    }
  };

  const handleStartFocus = async () => {
    if (isFinishing) return;
    setIsFinishing(true);

    // `saveResponse` ecrit en local ET lance deja la synchronisation backend en
    // arriere-plan (useOnboardingData.saveResponses, sans await). Le
    // `forceSync()` qui suivait renvoyait donc le MEME document une seconde
    // fois, en concurrence avec le premier envoi, et il etait attendu : il
    // enchaine `checkAuth()` puis `saveOnboardingData()`, soit DEUX appels en
    // serie plafonnes a 30 000 ms chacun par `apiCall`, donc 60 secondes de
    // blocage possible sur un simple tap. Et `syncToBackend` avale deja ses
    // erreurs en disant lui-meme que "les donnees sont deja en local" : on
    // attendait un resultat dont personne ne faisait rien. Retire.
    // Tout ce bloc est enveloppe, et la navigation vit dans le `finally`.
    // Raison : `useSuperwall.triggerEvent` n'a qu'un `try/finally` et AUCUN
    // `catch`, donc une erreur du SDK Superwall remonte jusqu'ici. Sans cette
    // enveloppe, l'exception sautait `router.replace` pendant que la garde
    // `isFinishing` restait a true : l'utilisateur se retrouvait bloque sur cet
    // ecran, les deux boutons desactives, sans aucun moyen d'entrer dans l'app.
    // Le paywall est un bonus, l'entree dans l'app est la promesse : elle ne
    // doit dependre d'aucun appel qui peut echouer.
    try {
      await saveResponse('completed', true);
      await AsyncStorage.setItem('onboarding_completed', 'true');
      await setTutorialCompleted(false);
      await setTutorialStage('calendar');
      await triggerEvent(SUPERWALL_EVENTS.ONBOARDING_COMPLETED, {
        params: { source: 'ideal_day_start_focus' },
        requireNonPremium: false,
        bypassCooldown: true,
      });
    } catch (error) {
      console.error('[Onboarding] Sortie ideal-day degradee:', error);
    } finally {
      router.replace('/(tabs)');
    }
  };

  const handleAdjust = () => {
    setIsEditing(true);
  };

  const handleTimeEdit = (index: number) => {
    const block = timeline[index];
    const [hours, minutes] = block.time.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    setSelectedTime(date);
    setEditingIndex(index);
    setShowTimePicker(true);
  };

  const handleTimeChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (date && editingIndex !== null) {
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      
      const updatedTimeline = [...timeline];
      updatedTimeline[editingIndex] = {
        ...updatedTimeline[editingIndex],
        time: timeStr,
      };
      
      // Trier la timeline par heure
      updatedTimeline.sort((a, b) => {
        const [aHours, aMinutes] = a.time.split(':').map(Number);
        const [bHours, bMinutes] = b.time.split(':').map(Number);
        return aHours * 60 + aMinutes - (bHours * 60 + bMinutes);
      });
      
      setTimeline(updatedTimeline);
      setEditingIndex(null);
    }
  };

  const handleSaveAdjustments = () => {
    setIsEditing(false);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Title */}
          <Animated.View entering={FadeIn.delay(100).duration(400)}>
            <Text style={styles.title}>
              {t('idealDayTitle') || "Here's your ideal day for tomorrow."}
            </Text>
          </Animated.View>

          {/* Top priorities card */}
          {priorities.length > 0 && (
            <Animated.View
              entering={FadeInDown.delay(200).duration(400)}
              style={styles.prioritiesCard}
            >
              <Text style={styles.prioritiesTitle}>
                {t('topPriorities') || 'Your 3 priorities'}
              </Text>
              <View style={styles.prioritiesList}>
                {priorities.map((priority, index) => (
                  <Animated.View
                    key={index}
                    entering={FadeInDown.delay(300 + index * 100).duration(400)}
                    style={styles.priorityItem}
                  >
                    <View style={styles.priorityNumber}>
                      <Text style={styles.priorityNumberText}>{index + 1}</Text>
                    </View>
                    <Text style={styles.priorityText}>{priority}</Text>
                  </Animated.View>
                ))}
              </View>
            </Animated.View>
          )}

          {/* Timeline */}
          <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.timelineContainer}>
            {timeline.map((block, index) => {
              if (block.duration === 0) return null;

              return (
                <Animated.View
                  key={index}
                  entering={FadeInDown.delay(500 + index * 30).duration(400)}
                  style={[
                    styles.timelineBlock,
                    block.priority && styles.timelineBlockPriority,
                    isEditing && styles.timelineBlockEditing,
                  ]}
                >
                  <TouchableOpacity
                    style={styles.timelineTime}
                    onPress={isEditing ? () => handleTimeEdit(index) : undefined}
                    disabled={!isEditing}
                    activeOpacity={isEditing ? 0.7 : 1}
                  >
                    <Text style={[
                      styles.timelineTimeText,
                      isEditing && styles.timelineTimeTextEditable,
                    ]}>
                      {block.time}
                    </Text>
                    <Text style={styles.timelineDurationText}>{block.duration}min</Text>
                    {isEditing && (
                      <Ionicons name="chevron-down" size={12} color="rgba(0, 0, 0, 0.4)" />
                    )}
                  </TouchableOpacity>

                  <View style={styles.timelineContent}>
                    <Text style={[
                      styles.timelineActivity,
                      block.priority && styles.timelineActivityPriority,
                    ]}>
                      {block.activity}
                    </Text>
                  </View>

                  {block.priority && (
                    <View style={styles.priorityDot} />
                  )}
                </Animated.View>
              );
            })}
          </Animated.View>

          {timeline.length > 0 && (
            <Animated.View entering={FadeIn.delay(800).duration(400)}>
              <Text style={styles.footerText}>
                {t('enoughForGoodDay') || 'This is enough to make tomorrow a good day.'}
              </Text>
            </Animated.View>
          )}
        </View>
      </ScrollView>

      {/* Fixed bottom CTAs */}
      <View style={styles.footer}>
        <TouchableOpacity
          onPress={handleSyncCalendar}
          disabled={isFinishing}
          style={styles.syncButton}
          activeOpacity={0.8}
        >
          <Ionicons name="calendar-outline" size={20} color="#FFFFFF" />
          <Text style={styles.syncButtonText}>
            {t('syncCalendar') || 'Sync to Google Calendar'}
          </Text>
        </TouchableOpacity>

        <View style={styles.secondaryButtons}>
          <TouchableOpacity
            onPress={handleStartFocus}
            disabled={isFinishing}
            style={styles.startFocusButton}
            activeOpacity={0.8}
          >
            <Ionicons name="play" size={18} color="#000000" style={styles.playIcon} />
            <Text style={styles.startFocusButtonText}>
              {t('startFocusNow') || 'Start Focus now'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={isEditing ? handleSaveAdjustments : handleAdjust}
            style={[styles.adjustButton, isEditing && styles.adjustButtonActive]}
            activeOpacity={0.8}
          >
            <Ionicons 
              name={isEditing ? "checkmark" : "create-outline"} 
              size={16} 
              color={isEditing ? "#FFFFFF" : "rgba(0, 0, 0, 0.6)"} 
            />
            <Text style={[styles.adjustButtonText, isEditing && styles.adjustButtonTextActive]}>
              {isEditing ? (t('save') || 'Save') : (t('adjust') || 'Adjust')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Time Picker Modal */}
      {showTimePicker && (
        <Modal
          visible={showTimePicker}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowTimePicker(false)}
        >
          <View style={styles.timePickerOverlay}>
            <View style={styles.timePickerContainer}>
              <View style={styles.timePickerHeader}>
                <Text style={styles.timePickerTitle}>
                  {t('selectTime') || 'Select time'}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowTimePicker(false);
                    setEditingIndex(null);
                  }}
                  style={styles.timePickerCloseButton}
                >
                  <Ionicons name="close" size={24} color="#000000" />
                </TouchableOpacity>
              </View>
              
              <DateTimePicker
                value={selectedTime}
                mode="time"
                is24Hour={true}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleTimeChange}
                style={styles.timePicker}
              />

              {Platform.OS === 'ios' && (
                <TouchableOpacity
                  onPress={() => {
                    handleTimeChange(null, selectedTime);
                    setShowTimePicker(false);
                  }}
                  style={styles.timePickerConfirmButton}
                >
                  <Text style={styles.timePickerConfirmText}>
                    {t('confirm') || 'Confirm'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Modal>
      )}
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
    paddingBottom: 200,
  },
  content: {
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 32,
    letterSpacing: -0.03 * 24,
  },
  prioritiesCard: {
    padding: 24,
    borderRadius: 24,
    backgroundColor: 'rgba(22, 163, 74, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(22, 163, 74, 0.2)',
    marginBottom: 32,
  },
  prioritiesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
    letterSpacing: -0.02 * 18,
  },
  prioritiesList: {
    gap: 12,
  },
  priorityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  priorityNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  priorityNumberText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  priorityText: {
    flex: 1,
    fontSize: 16,
    color: 'rgba(0, 0, 0, 0.8)',
  },
  timelineContainer: {
    gap: 8,
    marginBottom: 32,
  },
  timelineBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    backgroundColor: '#FFFFFF',
  },
  timelineBlockPriority: {
    borderColor: 'rgba(22, 163, 74, 0.3)',
    backgroundColor: 'rgba(22, 163, 74, 0.05)',
  },
  timelineTime: {
    width: 64,
    alignItems: 'center',
    gap: 4,
  },
  timelineTimeText: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.6)',
  },
  timelineDurationText: {
    fontSize: 12,
    color: 'rgba(0, 0, 0, 0.4)',
  },
  timelineContent: {
    flex: 1,
  },
  timelineActivity: {
    fontSize: 16,
    color: 'rgba(0, 0, 0, 0.7)',
  },
  timelineActivityPriority: {
    color: '#000000',
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#16A34A',
  },
  footerText: {
    fontSize: 16,
    color: 'rgba(0, 0, 0, 0.6)',
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
    gap: 12,
  },
  syncButton: {
    backgroundColor: '#16A34A',
    height: 56,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  syncButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  startFocusButton: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 12,
  },
  playIcon: {
    marginLeft: -2, // Légèrement décalé pour mieux centrer visuellement
  },
  startFocusButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
  adjustButton: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  adjustButtonText: {
    fontSize: 16,
    color: 'rgba(0, 0, 0, 0.6)',
  },
  adjustButtonActive: {
    backgroundColor: '#16A34A',
    borderWidth: 0,
  },
  adjustButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  timelineBlockEditing: {
    borderColor: 'rgba(22, 163, 74, 0.3)',
  },
  timelineTimeTextEditable: {
    color: '#16A34A',
    fontWeight: '600',
  },
  timePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timePickerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    width: '90%',
    maxWidth: 400,
    padding: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  timePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  timePickerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    letterSpacing: -0.02 * 20,
  },
  timePickerCloseButton: {
    padding: 4,
  },
  timePicker: {
    width: '100%',
    height: Platform.OS === 'ios' ? 200 : undefined,
  },
  timePickerConfirmButton: {
    marginTop: 20,
    backgroundColor: '#16A34A',
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timePickerConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
