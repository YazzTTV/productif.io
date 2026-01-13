import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, ScrollView, PanResponder, Modal, Alert } from 'react-native';
import { useState, useEffect, useCallback, useRef } from 'react';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { useLanguage } from '@/contexts/LanguageContext';
import { assistantService, tasksService } from '@/lib/api';
import { selectExamTasks, TaskForExam } from '@/utils/taskSelection';
import { useDailyStructureSettings } from '@/hooks/useDailyStructureSettings';

const { width } = Dimensions.get('window');
const RING_SIZE = Math.min(width * 0.65, 260);
const STROKE_WIDTH = 8;
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const PRESET_DURATIONS = [25, 45, 60, 90];
const MIN_DURATION = 5;
const MAX_DURATION = 180;
const BREAK_DURATIONS = [5, 10, 15, 20];

// Max Sessions Slider Component
function MaxSessionsSlider({ value, onValueChange, min, max }: { value: number; onValueChange: (value: number) => void; min: number; max: number }) {
  const sliderWidth = width - 96; // Account for padding
  const trackWidth = sliderWidth - 80; // Account for value display
  const thumbSize = 24;
  const thumbPosition = ((value - min) / (max - min)) * trackWidth;
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<View>(null);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setIsDragging(true);
      },
      onPanResponderMove: (evt) => {
        if (trackRef.current) {
          trackRef.current.measure((x, y, w, h, pageX, pageY) => {
            const touchX = evt.nativeEvent.pageX - pageX;
            const newX = Math.max(0, Math.min(trackWidth, touchX));
            const newValue = Math.round(
              min + (newX / trackWidth) * (max - min)
            );
            onValueChange(newValue);
          });
        }
      },
      onPanResponderRelease: () => {
        setIsDragging(false);
      },
    })
  ).current;

  return (
    <View style={maxSessionsSliderStyles.container}>
      <View
        ref={trackRef}
        style={maxSessionsSliderStyles.trackContainer}
        {...panResponder.panHandlers}
      >
        <View style={[maxSessionsSliderStyles.trackBackground, { width: trackWidth }]} />
        <View style={[maxSessionsSliderStyles.trackFill, { width: thumbPosition }]} />
        <View
          style={[
            maxSessionsSliderStyles.thumb,
            { left: thumbPosition - thumbSize / 2 },
            isDragging && maxSessionsSliderStyles.thumbActive
          ]}
        />
      </View>
    </View>
  );
}

const maxSessionsSliderStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  trackContainer: {
    height: 40,
    justifyContent: 'center',
    position: 'relative',
  },
  trackBackground: {
    height: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 4,
    position: 'absolute',
  },
  trackFill: {
    height: 8,
    backgroundColor: '#16A34A',
    borderRadius: 4,
    position: 'absolute',
  },
  thumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#16A34A',
    position: 'absolute',
    top: 8,
  },
  thumbActive: {
    transform: [{ scale: 1.2 }],
  },
});

// Session Settings Modal Component
interface SessionSettingsModalProps {
  isVisible: boolean;
  onClose: () => void;
  focusDuration: number;
  breakDuration: number;
  maxSessions: number;
  onSave: (settings: { focusDuration: number; breakDuration: number; maxSessions: number }) => void;
}

function SessionSettingsModal({
  isVisible,
  onClose,
  focusDuration: initialFocusDuration,
  breakDuration: initialBreakDuration,
  maxSessions: initialMaxSessions,
  onSave,
}: SessionSettingsModalProps) {
  const [focusDuration, setFocusDuration] = useState(initialFocusDuration);
  const [breakDuration, setBreakDuration] = useState(initialBreakDuration);
  const [maxSessions, setMaxSessions] = useState(initialMaxSessions);

  useEffect(() => {
    if (isVisible) {
      setFocusDuration(initialFocusDuration);
      setBreakDuration(initialBreakDuration);
      setMaxSessions(initialMaxSessions);
    }
  }, [isVisible, initialFocusDuration, initialBreakDuration, initialMaxSessions]);

  const handleSave = () => {
    onSave({ focusDuration, breakDuration, maxSessions });
  };

  const totalTime = (focusDuration + breakDuration) * maxSessions;

  if (!isVisible) return null;

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={settingsModalStyles.overlay}>
        <TouchableOpacity
          style={settingsModalStyles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={settingsModalStyles.modalContainer}>
          <Animated.View 
            entering={FadeInUp.duration(300)} 
            style={settingsModalStyles.modal}
          >
            <ScrollView
              style={settingsModalStyles.scrollView}
              contentContainerStyle={settingsModalStyles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
            {/* Header */}
            <View style={settingsModalStyles.header}>
              <Text style={settingsModalStyles.headerTitle}>Session Settings</Text>
              <TouchableOpacity
                style={settingsModalStyles.closeButton}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={20} color="rgba(0, 0, 0, 0.6)" />
              </TouchableOpacity>
            </View>

            {/* Focus Duration */}
            <View style={settingsModalStyles.section}>
              <Text style={settingsModalStyles.sectionTitle}>{t('focusDuration') || 'Focus duration'}</Text>
              <Text style={settingsModalStyles.sectionSubtitle}>{t('lengthOfEachSession') || 'Length of each focus session'}</Text>
              <View style={settingsModalStyles.buttonRow}>
                {PRESET_DURATIONS.map((duration) => (
                  <TouchableOpacity
                    key={duration}
                    style={[
                      settingsModalStyles.durationButton,
                      focusDuration === duration && settingsModalStyles.durationButtonActive
                    ]}
                    onPress={() => setFocusDuration(duration)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        settingsModalStyles.durationButtonText,
                        focusDuration === duration && settingsModalStyles.durationButtonTextActive
                      ]}
                    >
                      {duration}m
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Break Duration */}
            <View style={settingsModalStyles.section}>
              <Text style={settingsModalStyles.sectionTitle}>{t('breakDuration') || 'Break duration'}</Text>
              <Text style={settingsModalStyles.sectionSubtitle}>{t('restBetweenSessions') || 'Rest between sessions'}</Text>
              <View style={settingsModalStyles.buttonRow}>
                {BREAK_DURATIONS.map((duration) => (
                  <TouchableOpacity
                    key={duration}
                    style={[
                      settingsModalStyles.durationButton,
                      breakDuration === duration && settingsModalStyles.durationButtonActive
                    ]}
                    onPress={() => setBreakDuration(duration)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        settingsModalStyles.durationButtonText,
                        breakDuration === duration && settingsModalStyles.durationButtonTextActive
                      ]}
                    >
                      {duration}m
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Maximum Sessions */}
            <View style={settingsModalStyles.section}>
              <Text style={settingsModalStyles.sectionTitle}>{t('maximumSessions') || 'Maximum sessions'}</Text>
              <Text style={settingsModalStyles.sectionSubtitle}>{t('sessionsPlannedToday') || 'Sessions planned for today'}</Text>
              <View style={settingsModalStyles.sliderContainer}>
                <MaxSessionsSlider
                  value={maxSessions}
                  onValueChange={setMaxSessions}
                  min={1}
                  max={8}
                />
                <Text style={settingsModalStyles.sliderValue}>{maxSessions}</Text>
              </View>
            </View>

            {/* Session Preview */}
            <View style={settingsModalStyles.previewCard}>
              <Text style={settingsModalStyles.previewLabel}>{t('sessionPreview') || 'Session preview'}</Text>
              <Text style={settingsModalStyles.previewText}>
                {maxSessions} × {focusDuration}{t('min')} {t('focus')} + {breakDuration}{t('min')} {t('break')}
              </Text>
              <Text style={settingsModalStyles.previewSubtext}>
                {t('totalTime')}: ~{totalTime}{t('min')}
              </Text>
            </View>

            {/* Save Button */}
            <TouchableOpacity
              style={settingsModalStyles.saveButton}
              onPress={handleSave}
              activeOpacity={0.8}
            >
              <Text style={settingsModalStyles.saveButtonText}>{t('saveSettings') || t('save')}</Text>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
        </View>
      </View>
    </Modal>
  );
}

// Slider component
function DurationSlider({ value, onValueChange }: { value: number; onValueChange: (value: number) => void }) {
  const sliderWidth = width - 48;
  const trackWidth = sliderWidth - 32;
  const thumbSize = 24;
  const thumbPosition = ((value - MIN_DURATION) / (MAX_DURATION - MIN_DURATION)) * trackWidth;
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<View>(null);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setIsDragging(true);
      },
      onPanResponderMove: (evt, gestureState) => {
        if (trackRef.current) {
          trackRef.current.measure((x, y, w, h, pageX, pageY) => {
            const touchX = evt.nativeEvent.pageX - pageX;
            const newX = Math.max(0, Math.min(trackWidth, touchX));
            const newValue = Math.round(
              MIN_DURATION + (newX / trackWidth) * (MAX_DURATION - MIN_DURATION)
            );
            onValueChange(newValue);
          });
        }
      },
      onPanResponderRelease: () => {
        setIsDragging(false);
      },
    })
  ).current;

  return (
    <View style={sliderStyles.container}>
      <View 
        ref={trackRef}
        style={sliderStyles.trackContainer}
        {...panResponder.panHandlers}
      >
        <View style={[sliderStyles.trackBackground, { width: trackWidth }]} />
        <View style={[sliderStyles.trackFill, { width: thumbPosition }]} />
        <TouchableOpacity
          style={[
            sliderStyles.thumb, 
            { left: thumbPosition - thumbSize / 2 },
            isDragging && sliderStyles.thumbActive
          ]}
          activeOpacity={1}
        />
      </View>
    </View>
  );
}

const sliderStyles = StyleSheet.create({
  container: {
    paddingVertical: 32,
    width: '100%',
    alignItems: 'center',
  },
  trackContainer: {
    height: 40,
    width: width - 48,
    justifyContent: 'center',
    paddingHorizontal: 16,
    position: 'relative',
  },
  trackBackground: {
    height: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 4,
    position: 'absolute',
    left: 16,
  },
  trackFill: {
    height: 8,
    backgroundColor: '#16A34A',
    borderRadius: 4,
    position: 'absolute',
    left: 16,
  },
  thumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#16A34A',
    position: 'absolute',
    top: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  thumbActive: {
    transform: [{ scale: 1.2 }],
  },
});

type FocusPhase = 'intro' | 'active';

export default function FocusScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const params = useLocalSearchParams();
  const { settings: dailyStructure } = useDailyStructureSettings();
  
  const [phase, setPhase] = useState<FocusPhase>('intro');
  const [selectedDuration, setSelectedDuration] = useState(parseInt(params.duration as string) || dailyStructure.focusDuration);
  const [showSettings, setShowSettings] = useState(false);
  const [focusDuration, setFocusDuration] = useState(dailyStructure.focusDuration);
  const [breakDuration, setBreakDuration] = useState(10);
  const [maxSessions, setMaxSessions] = useState(dailyStructure.maxSessions);
  const taskId = params.taskId as string | undefined;
  
  // Tasks management
  const [tasks, setTasks] = useState<Array<{ id: string; title: string; subject: string; completed: boolean }>>([]);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [loadingTasks, setLoadingTasks] = useState(true);
  
  const currentTask = tasks[currentTaskIndex] || { id: '', title: '', subject: '', completed: false };
  const completedCount = tasks.filter(t => t.completed).length;

  // Synchroniser avec les paramètres de Daily Structure
  useEffect(() => {
    if (!params.duration) {
      setSelectedDuration(dailyStructure.focusDuration);
    }
    setFocusDuration(dailyStructure.focusDuration);
    setMaxSessions(dailyStructure.maxSessions);
  }, [dailyStructure]);

  // Load prioritized tasks on mount
  useEffect(() => {
    loadPrioritizedTasks();
  }, []);

  const loadPrioritizedTasks = async () => {
    try {
      setLoadingTasks(true);
      
      // Si on a des paramètres de tâche depuis la navigation, les utiliser
      if (taskId && params.title && params.subject) {
        setTasks([
          { 
            id: taskId, 
            title: params.title as string, 
            subject: params.subject as string, 
            completed: false 
          }
        ]);
        setLoadingTasks(false);
        return;
      }

      // Sinon, charger les tâches prioritaires depuis l'API
      const { primary, next } = await selectExamTasks();

      const allTasks: Array<{ id: string; title: string; subject: string; completed: boolean }> = [];

      // Ajouter la tâche principale
      if (primary) {
        allTasks.push({
          id: primary.id,
          title: primary.title,
          subject: primary.subjectName,
          completed: false,
        });
      }

      // Ajouter les 3 prochaines tâches les plus importantes
      next.slice(0, 3).forEach(task => {
        allTasks.push({
          id: task.id,
          title: task.title,
          subject: task.subjectName,
          completed: false,
        });
      });

      // Si aucune tâche n'est trouvée, utiliser des valeurs par défaut
      if (allTasks.length === 0) {
        allTasks.push({
          id: 'default',
          title: 'No tasks available',
          subject: 'Add tasks to get started',
          completed: false,
        });
      }

      setTasks(allTasks);
      setCurrentTaskIndex(0);
    } catch (error) {
      console.error('Error loading prioritized tasks:', error);
      // En cas d'erreur, utiliser des valeurs par défaut
      setTasks([
        {
          id: 'error',
          title: 'Unable to load tasks',
          subject: 'Please try again',
          completed: false,
        }
      ]);
    } finally {
      setLoadingTasks(false);
    }
  };
  
  const totalSeconds = selectedDuration * 60;
  const [timeLeft, setTimeLeft] = useState(totalSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const progress = (totalSeconds - timeLeft) / totalSeconds;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const progressAnimation = useSharedValue(0);

  const handleStartFocus = async () => {
    try {
      const startLocally = () => {
        setTimeLeft(selectedDuration * 60);
        setPhase('active');
        setIsRunning(true);
        setCurrentTaskIndex(0);
      };

      // Vérifier s'il y a une session active
      try {
        const activeSessionData = await assistantService.getActiveDeepWorkSession();
        
        // La réponse peut être un tableau ou un objet avec une propriété sessions
        const activeSessions = Array.isArray(activeSessionData) 
          ? activeSessionData 
          : activeSessionData?.sessions || activeSessionData?.data || [];
        
        if (activeSessions && activeSessions.length > 0) {
          // Il y a une session active, la terminer proprement d'abord
          const existingSession = activeSessions[0];
          const sessionIdToCancel = existingSession.id || existingSession.sessionId;
          
          if (sessionIdToCancel) {
            console.log('⚠️ [Focus] Session active trouvée, arrêt de la session précédente...', sessionIdToCancel);
            try {
              await assistantService.endDeepWorkSession(sessionIdToCancel, 'cancel');
              console.log('✅ [Focus] Session précédente terminée');
            } catch (cancelError) {
              console.log('ℹ️ [Focus] Erreur lors de l\'arrêt de la session précédente (peut être déjà terminée):', cancelError);
            }
          }
        }
      } catch (checkError) {
        // Si la vérification échoue, on continue quand même
        console.log('ℹ️ [Focus] Impossible de vérifier les sessions actives, continuation:', checkError);
      }

      const result = await assistantService.startDeepWorkSession(selectedDuration, 'deepwork', currentTask.title);
      if (result?.session?.id) {
        setSessionId(result.session.id);
        console.log('✅ [Focus] Nouvelle session démarrée:', result.session.id);
      }
      startLocally();
    } catch (error: any) {
      // Si l'erreur indique qu'une session est déjà en cours, on continue quand même localement
      const errorMessage = error?.message || '';
      const errorLower = errorMessage.toLowerCase();
      
      console.log('🔍 [Focus] Erreur capturée:', {
        message: errorMessage,
        status: error?.status,
        locked: error?.locked,
        feature: error?.feature
      });
      
      // Détecter les erreurs de limite Premium (doit être vérifié AVANT les autres erreurs)
      const isPlanLocked = 
        errorLower.includes('limite') || 
        errorLower.includes('premium') || 
        errorLower.includes('plan') ||
        errorLower.includes('durée max') ||
        errorLower.includes('freemium') ||
        error?.status === 403 ||
        error?.locked === true;
      
      console.log('🔍 [Focus] isPlanLocked:', isPlanLocked);
      
      const startLocally = () => {
        setTimeLeft(selectedDuration * 60);
        setPhase('active');
        setIsRunning(true);
        setCurrentTaskIndex(0);
      };

      // Si c'est une erreur de limite Premium, bloquer et afficher l'alerte
      if (isPlanLocked) {
        Alert.alert(
          'Focus limité',
          errorMessage || '1 session Focus par jour en freemium. Passez en Premium pour continuer.',
          [
            { text: 'Plus tard', style: 'cancel' },
            { text: 'Passer en Premium', onPress: () => router.push('/paywall') }
          ]
        );
        setPhase('intro');
        setIsRunning(false);
        return;
      }

      // Si c'est une session déjà en cours (sans erreur de limite), continuer localement
      if (errorMessage.includes('déjà en cours') || (errorMessage.includes('session') && errorMessage.includes('déjà'))) {
        console.log('⚠️ [Focus] Session déjà en cours côté serveur, continuation locale');
        startLocally();
      } else {
        console.error('❌ [Focus] Erreur lors du démarrage de la session:', error);
        // Continuer quand même en mode local pour les autres erreurs
        startLocally();
      }
    }
  };

  const handleCompleteTask = async () => {
    const taskToComplete = tasks[currentTaskIndex];
    if (!taskToComplete) return;
    
    // Mettre à jour l'état local immédiatement
    setTasks(prev =>
      prev.map((task, index) =>
        index === currentTaskIndex ? { ...task, completed: true } : task
      )
    );
    
    // Marquer la tâche comme complétée dans la base de données
    if (taskToComplete.id && taskToComplete.id !== 'default' && taskToComplete.id !== 'error') {
      try {
        console.log('📤 [Focus] Marquage de la tâche comme complétée:', taskToComplete.id);
        await tasksService.updateTask(taskToComplete.id, { completed: true });
        console.log('✅ [Focus] Tâche marquée comme complétée avec succès');
      } catch (error) {
        console.error('❌ [Focus] Erreur lors du marquage de la tâche:', error);
        // Annuler la mise à jour locale en cas d'erreur
        setTasks(prev =>
          prev.map((task, index) =>
            index === currentTaskIndex ? { ...task, completed: false } : task
          )
        );
      }
    }
    
    // Move to next incomplete task
    const nextIncompleteIndex = tasks.findIndex((task, index) => 
      index > currentTaskIndex && !task.completed
    );
    if (nextIncompleteIndex !== -1) {
      setCurrentTaskIndex(nextIncompleteIndex);
    }
  };

  // Timer logic
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    if (!isRunning || phase !== 'active') return;

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
          setIsRunning(false);
          handleComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, phase]);

  // Update progress animation
  useEffect(() => {
    if (phase === 'active') {
    progressAnimation.value = withTiming(progress, {
      duration: 1000,
      easing: Easing.linear,
    });
    }
  }, [progress, phase]);

  const handleComplete = useCallback(async () => {
    if (sessionId) {
      try {
        await assistantService.endDeepWorkSession(sessionId, 'complete');
      } catch (error) {
        console.log('Session terminée localement');
      }
    }
    router.back();
  }, [sessionId, router]);

  const handleExit = useCallback(async () => {
    if (phase === 'active') {
      // Arrêter le timer
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setIsRunning(false);
      
      // Arrêter la session deep work
      if (sessionId) {
      try {
        await assistantService.endDeepWorkSession(sessionId, 'cancel');
      } catch (error) {
        console.log('Session annulée localement');
        }
      }
    }
    router.back();
  }, [sessionId, phase, router]);

  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);

  // ━━━━━━━━━━━━━━━━━━━━━━
  // INTRO SCREEN - Design System
  // ━━━━━━━━━━━━━━━━━━━━━━
  if (phase === 'intro') {
    return (
      <>
        <View style={[introStyles.container, { paddingTop: insets.top }]}>
          <ScrollView 
            style={introStyles.scrollView}
            contentContainerStyle={introStyles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Header - Design System */}
            <Animated.View entering={FadeInUp.delay(100).duration(400)} style={introStyles.header}>
              <View style={introStyles.headerLeft}>
                <TouchableOpacity
                  style={introStyles.backButton}
                  onPress={handleExit}
                  activeOpacity={0.7}
                >
                  <Ionicons name="arrow-back" size={20} color="#000" />
                </TouchableOpacity>
                <View style={introStyles.headerTitleContainer}>
                  <Ionicons name="flag" size={20} color="#16A34A" />
                  <View>
                    <Text style={introStyles.headerTitle}>{t('focusSession') || 'Focus Session'}</Text>
                    <Text style={introStyles.headerSubtitle}>{t('aiSelectedTask') || 'AI-selected task'}</Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity
                style={introStyles.settingsButton}
                activeOpacity={0.7}
                onPress={() => setShowSettings(true)}
              >
                <Ionicons name="settings-outline" size={20} color="rgba(0, 0, 0, 0.6)" />
              </TouchableOpacity>
            </Animated.View>

            <View style={introStyles.content}>
              {/* Main heading - Simplifié */}
              <Animated.View entering={FadeInDown.delay(200).duration(400)} style={introStyles.headingSection}>
                <Text style={introStyles.mainHeading}>{t('readyToFocus')}</Text>
              </Animated.View>

              {/* Task card - Simplifié */}
              {loadingTasks ? (
                <Animated.View entering={FadeInDown.delay(300).duration(400)} style={introStyles.taskCard}>
                  <Text style={introStyles.taskCardTitle}>{t('loadingTask') || t('loading')}</Text>
                </Animated.View>
              ) : (
                <Animated.View entering={FadeInDown.delay(300).duration(400)} style={introStyles.taskCard}>
                  <Text style={introStyles.taskCardTitle} numberOfLines={0}>{currentTask.title}</Text>
                  {currentTask.subject && (
                    <Text style={introStyles.taskCardSubject} numberOfLines={0}>{currentTask.subject}</Text>
                  )}
                </Animated.View>
              )}

              {/* Duration selection - Avec cursor/timer et slider */}
              <Animated.View entering={FadeInDown.delay(400).duration(400)} style={introStyles.durationSection}>
                {/* Cursor/Timer - Affichage de la durée en grand */}
                <Animated.View 
                  key={selectedDuration}
                  entering={FadeInDown.delay(100).duration(300)}
                >
                  <Text style={introStyles.durationDisplay}>{selectedDuration} min</Text>
                </Animated.View>

                {/* Slider pour ajuster la durée */}
                <DurationSlider value={selectedDuration} onValueChange={setSelectedDuration} />

                {/* Preset buttons */}
                <View style={introStyles.presetButtons}>
                  {PRESET_DURATIONS.map((preset) => (
                    <TouchableOpacity
                      key={preset}
                      style={[
                        introStyles.presetButton,
                        selectedDuration === preset && introStyles.presetButtonActive
                      ]}
                      onPress={() => setSelectedDuration(preset)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          introStyles.presetButtonText,
                          selectedDuration === preset && introStyles.presetButtonTextActive
                        ]}
                      >
                        {preset}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </Animated.View>

              {/* Start button - Simplifié */}
              <Animated.View entering={FadeInDown.delay(500).duration(400)} style={introStyles.startButtonContainer}>
                <TouchableOpacity
                  style={introStyles.startButton}
                  onPress={handleStartFocus}
                  activeOpacity={0.8}
                >
                  <Text style={introStyles.startButtonText}>{t('startFocus')}</Text>
                </TouchableOpacity>
              </Animated.View>
            </View>
          </ScrollView>
        </View>

        {/* Session Settings Modal */}
        <SessionSettingsModal
          isVisible={showSettings}
          onClose={() => setShowSettings(false)}
          focusDuration={focusDuration}
          breakDuration={breakDuration}
          maxSessions={maxSessions}
          onSave={(settings) => {
            setFocusDuration(settings.focusDuration);
            setBreakDuration(settings.breakDuration);
            setMaxSessions(settings.maxSessions);
            setShowSettings(false);
          }}
        />
      </>
    );
  }

  // ━━━━━━━━━━━━━━━━━━━━━━
  // ACTIVE FOCUS SESSION (Ancienne version)
  // ━━━━━━━━━━━━━━━━━━━━━━
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        {/* Progress Ring */}
        <Animated.View entering={FadeIn.delay(100).duration(600)} style={styles.ringContainer}>
          <Svg width={RING_SIZE} height={RING_SIZE}>
            {/* Background Circle */}
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RADIUS}
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth={STROKE_WIDTH}
              fill="none"
            />
            {/* Progress Circle */}
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RADIUS}
              stroke="#16A34A"
              strokeWidth={STROKE_WIDTH}
              fill="none"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              rotation={-90}
              origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
            />
            {/* Progress indicator dot at top */}
            <Circle
              cx={RING_SIZE / 2}
              cy={STROKE_WIDTH / 2}
              r={6}
              fill="#16A34A"
            />
          </Svg>

          {/* Timer Display */}
          <View style={styles.timerContainer}>
            <Text style={styles.timerText}>
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </Text>
          </View>
        </Animated.View>

        {/* Task Info Section */}
        <Animated.View entering={FadeInDown.delay(300).duration(500)} style={styles.taskSection}>
          <Text style={styles.taskIndicator}>
            {t('currentTask')} • {currentTaskIndex + 1} {t('of') || 'of'} {tasks.length}
          </Text>
          
          <View style={styles.taskCard}>
            <Text style={styles.taskTitle} numberOfLines={0}>{currentTask.title}</Text>
            <Text style={styles.taskSubject} numberOfLines={0}>{currentTask.subject}</Text>
            
            {!currentTask.completed && (
              <TouchableOpacity
                style={styles.completeTaskButton}
                onPress={handleCompleteTask}
                activeOpacity={0.8}
              >
                <Text style={styles.completeTaskButtonText}>{t('completeTaskButton')}</Text>
              </TouchableOpacity>
            )}
            
            {currentTask.completed && (
              <View style={styles.taskCompletedIndicator}>
                <Ionicons name="checkmark-circle" size={24} color="#16A34A" />
                <Text style={styles.taskCompletedText}>{t('taskComplete') || 'Task complete'}</Text>
              </View>
            )}
          </View>
        </Animated.View>

        {/* Controls */}
        <Animated.View entering={FadeInDown.delay(500).duration(400)} style={styles.controlsContainer}>
          <TouchableOpacity
            style={styles.pauseButton}
            onPress={() => setIsRunning(!isRunning)}
            activeOpacity={0.7}
          >
            <Ionicons 
              name={isRunning ? "pause" : "play"} 
              size={24} 
              color="#FFFFFF" 
            />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.endSessionButton}
            onPress={handleExit}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={20} color="rgba(255, 255, 255, 0.6)" />
            <Text style={styles.endSessionButtonText}>{t('endSessionButton')}</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

const introStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
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
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.6)',
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 64,
    paddingBottom: 64,
    alignItems: 'center',
  },
  headingSection: {
    alignItems: 'center',
    marginBottom: 48,
  },
  mainHeading: {
    fontSize: 32,
    fontWeight: '600',
    letterSpacing: -1.28, // -0.04em * 32
    color: '#000000',
    textAlign: 'center',
  },
  taskCard: {
    width: '100%',
    maxWidth: 400,
    padding: 24,
    borderWidth: 2,
    borderColor: 'rgba(22, 163, 74, 0.2)',
    backgroundColor: 'rgba(22, 163, 74, 0.05)',
    borderRadius: 24,
    marginBottom: 48,
    alignItems: 'center',
    gap: 8,
  },
  taskCardTitle: {
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: -0.6, // -0.03em * 20
    color: '#000000',
    textAlign: 'center',
  },
  taskCardSubject: {
    fontSize: 16,
    color: 'rgba(0, 0, 0, 0.6)',
    textAlign: 'center',
  },
  durationSection: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    marginBottom: 48,
    gap: 24,
  },
  durationDisplay: {
    fontSize: 64,
    fontWeight: '600',
    letterSpacing: -2.56, // -0.04em * 64
    color: '#000000',
    textAlign: 'center',
    lineHeight: 64,
  },
  presetButtons: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  presetButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 9999,
    backgroundColor: 'rgba(0, 0, 0, 0.05)', // bg-black/5
  },
  presetButtonActive: {
    backgroundColor: '#000000',
  },
  presetButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(0, 0, 0, 0.6)',
  },
  presetButtonTextActive: {
    color: '#FFFFFF',
  },
  startButtonContainer: {
    width: '100%',
    maxWidth: 400,
  },
  startButton: {
    width: '100%',
    paddingVertical: 20,
    backgroundColor: '#16A34A',
    borderRadius: 24, // rounded-3xl
    alignItems: 'center',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  startButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
  },
  ringContainer: {
    width: RING_SIZE,
    height: RING_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 20,
  },
  timerContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerText: {
    fontSize: 56,
    fontWeight: '300',
    letterSpacing: -0.04 * 56,
    color: '#FFFFFF',
  },
  taskSection: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingTop: 40,
  },
  taskIndicator: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 16,
  },
  taskCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  taskTitle: {
    fontSize: 24,
    fontWeight: '600',
    letterSpacing: -0.03 * 24,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  taskSubject: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 24,
  },
  completeTaskButton: {
    paddingVertical: 14,
    backgroundColor: '#16A34A',
    borderRadius: 16,
    alignItems: 'center',
  },
  completeTaskButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  taskCompletedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  taskCompletedText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#16A34A',
  },
  controlsContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 20,
  },
  pauseButton: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  endSessionButton: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  endSessionButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.6)',
  },
});

const settingsModalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  modalContainer: {
    width: '100%',
    maxHeight: Dimensions.get('window').height * 0.9,
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 20,
  },
  scrollView: {
    maxHeight: Dimensions.get('window').height * 0.85,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    letterSpacing: -0.04 * 24,
    color: '#000000',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.6)',
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  durationButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  durationButtonActive: {
    borderColor: '#16A34A',
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
  },
  durationButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
  durationButtonTextActive: {
    color: '#16A34A',
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  sliderValue: {
    fontSize: 32,
    fontWeight: '500',
    color: '#000000',
    width: 40,
    textAlign: 'center',
  },
  previewCard: {
    marginHorizontal: 24,
    marginTop: 24,
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  previewLabel: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.6)',
    marginBottom: 8,
  },
  previewText: {
    fontSize: 16,
    color: 'rgba(0, 0, 0, 0.8)',
    marginBottom: 4,
  },
  previewSubtext: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.6)',
  },
  saveButton: {
    marginHorizontal: 24,
    marginTop: 24,
    paddingVertical: 16,
    backgroundColor: '#16A34A',
    borderRadius: 24,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
