import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, BackHandler, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, { FadeIn, FadeOut, SlideInRight, SlideOutLeft } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { getActiveExamSession, clearExamSession, calculateTimeRemaining, saveExamSession, ExamSession } from '@/utils/examSession';
import { tasksService, subjectsService } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';

const RING_SIZE = 280;
const RADIUS = 130;
const STROKE_WIDTH = 8;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface Task {
  id: string;
  title: string;
  subjectName: string;
}

export default function ExamSessionScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const sessionId = params.sessionId as string;

  const [session, setSession] = useState<ExamSession | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isRunning, setIsRunning] = useState(true);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [nextTask, setNextTask] = useState<Task | null>(null);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pausedAtRef = useRef<number | null>(null);

  useEffect(() => {
    loadSession();
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      backHandler.remove();
    };
  }, []);

  useEffect(() => {
    if (session && isRunning) {
      startTimer();
    } else {
      stopTimer();
    }
    return () => stopTimer();
  }, [session, isRunning]);

  const loadSession = async () => {
    try {
      setLoading(true);
      const activeSession = await getActiveExamSession();
      if (!activeSession) {
        // Si c'est une démo demandée via paramètre, créer une session de démo
        if (params.demo === 'true' && sessionId) {
          // La session de démo devrait déjà être créée, mais si elle n'existe pas, rediriger vers preview
          router.replace('/exam/preview');
          return;
        }
        router.replace('/exam/setup');
        return;
      }
      
      // Vérifier si c'est une session de démo
      const isDemo = activeSession.sessionId.startsWith('exam_demo_') || params.demo === 'true';
      
      setSession(activeSession);
      
      // Pour les sessions de démo, initialiser le timer à exactement 5 minutes
      // Pour éviter les problèmes de timing entre la création et le chargement
      if (isDemo) {
        // Réinitialiser startedAt pour que le timer démarre à 5:00
        const updatedSession = {
          ...activeSession,
          startedAt: Date.now(), // Réinitialiser le temps de départ
          totalPausedTime: 0, // Réinitialiser le temps de pause
          pausedAt: undefined, // S'assurer qu'il n'y a pas de pause
        };
        await saveExamSession(updatedSession);
        setSession(updatedSession);
        setTimeRemaining(5 * 60); // Exactement 5 minutes (300 secondes)
      } else {
        setTimeRemaining(calculateTimeRemaining(activeSession));
      }
      
      setIsRunning(!activeSession.pausedAt);

      // Load tasks (gère aussi le mode démo)
      await loadTasks(activeSession);
    } catch (error) {
      console.error('Error loading session:', error);
      // En cas d'erreur, rediriger vers preview si c'était une démo, sinon vers setup
      if (params.demo === 'true') {
        router.replace('/exam/preview');
      } else {
        router.replace('/exam/setup');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadTasks = async (activeSession: ExamSession) => {
    try {
      // Charger les vraies tâches (pour les sessions normales ET les démos)
      const subjectsData = await subjectsService.getAll();
      // subjectsService.getAll() retourne maintenant directement un tableau
      const subjects = Array.isArray(subjectsData) ? subjectsData : [];
      
      const taskMap = new Map<string, Task>();
      subjects.forEach((subject: any) => {
        if (subject.tasks && Array.isArray(subject.tasks)) {
          subject.tasks.forEach((task: any) => {
            taskMap.set(task.id, {
              id: task.id,
              title: task.title,
              subjectName: subject.name,
            });
          });
        }
      });

      const tasks: Task[] = [];
      activeSession.plannedTaskIds.forEach(taskId => {
        const task = taskMap.get(taskId);
        if (task) tasks.push(task);
      });

      // Si aucune tâche trouvée et que c'est une démo, on peut afficher un message
      if (tasks.length === 0) {
        const isDemo = activeSession.sessionId.startsWith('exam_demo_') || params.demo === 'true';
        if (isDemo) {
          console.warn('No tasks found for demo session');
        }
      }

      setAllTasks(tasks);
      if (tasks.length > activeSession.currentTaskIndex) {
        setCurrentTask(tasks[activeSession.currentTaskIndex]);
        if (tasks.length > activeSession.currentTaskIndex + 1) {
          setNextTask(tasks[activeSession.currentTaskIndex + 1]);
        }
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  };

  const startTimer = () => {
    if (timerIntervalRef.current) return;
    
    timerIntervalRef.current = setInterval(() => {
      if (!session) return;
      
      // Pour les sessions de démo, utiliser un timer simple qui décrémente
      // Pour les sessions normales, calculer depuis startedAt
      const isDemo = session.sessionId.startsWith('exam_demo_') || params.demo === 'true';
      
      let remaining: number;
      if (isDemo) {
        // Pour la démo, décrémenter simplement le timer
        setTimeRemaining((prev) => {
          const newTime = prev - 1;
          if (newTime <= 0) {
            handleSessionEnd();
            return 0;
          }
          return newTime;
        });
        return;
      } else {
        remaining = calculateTimeRemaining(session);
        setTimeRemaining(remaining);
      }

      if (remaining <= 0) {
        handleSessionEnd();
      }
    }, 1000);
  };

  const stopTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };

  const handleBackPress = () => {
    if (session?.hardMode && isRunning) {
      Alert.alert(
        t('hardModeActive'),
        t('hardModeWarning'),
        [{ text: t('ok') }]
      );
      return true;
    }
    return false;
  };


  const handleComplete = async () => {
    if (!session || !currentTask) return;

    // Vérifier si c'est une démo
    const isDemo = session.sessionId.startsWith('exam_demo_') || params.demo === 'true';
    
    // En mode démo, on ne marque pas vraiment les tâches comme complétées
    // pour ne pas modifier les vraies données
    if (!isDemo) {
      // Mark task as completed (seulement pour les sessions normales)
      try {
        await tasksService.updateTask(currentTask.id, { completed: true });
      } catch (error) {
        console.error('Error completing task:', error);
      }
    }

    const newCompletedIds = [...session.completedTaskIds, currentTask.id];
    const newTaskIndex = session.currentTaskIndex + 1;

    // Check if there are more tasks
    if (newTaskIndex >= allTasks.length) {
      // No more tasks - show finish option
      handleNoMoreTasks();
      return;
    }

    // Update session
    const updatedSession: ExamSession = {
      ...session,
      currentTaskIndex: newTaskIndex,
      completedTaskIds: newCompletedIds,
    };

    await saveExamSession(updatedSession);
    setSession(updatedSession);

    // Animate to next task
    setCurrentTask(allTasks[newTaskIndex]);
    if (newTaskIndex + 1 < allTasks.length) {
      setNextTask(allTasks[newTaskIndex + 1]);
    } else {
      setNextTask(null);
    }
  };

  const handleNoMoreTasks = () => {
    Alert.alert(
      t('allTasksComplete'),
      t('allTasksCompleteMessage'),
      [
        {
          text: t('addTask'),
          onPress: () => {
            // Could open task picker modal
            router.push('/(tabs)/tasks');
          },
        },
        {
          text: t('finishSession'),
          onPress: handleEndSession,
          style: 'default',
        },
      ]
    );
  };

  const handlePause = async () => {
    if (!session) return;
    
    setIsRunning(false);
    pausedAtRef.current = Date.now();
    
    const updatedSession: ExamSession = {
      ...session,
      pausedAt: Date.now(),
    };
    await saveExamSession(updatedSession);
    setSession(updatedSession);
  };

  const handleResume = async () => {
    if (!session || !pausedAtRef.current) return;
    
    const pauseDuration = (Date.now() - pausedAtRef.current) / 1000;
    const totalPaused = (session.totalPausedTime || 0) + pauseDuration;
    
    setIsRunning(true);
    pausedAtRef.current = null;
    
    const updatedSession: ExamSession = {
      ...session,
      pausedAt: undefined,
      totalPausedTime: totalPaused,
    };
    await saveExamSession(updatedSession);
    setSession(updatedSession);
  };

  const handleEndSession = async () => {
    const isDemo = session?.sessionId.startsWith('exam_demo_') || params.demo === 'true';
    
    if (isDemo) {
      // Pour la démo, rediriger vers le paywall
      Alert.alert(
        t('demoEnded'),
        t('demoEndedMessage'),
        [
          { text: t('cancel'), style: 'cancel' },
          {
            text: t('unlockExamMode'),
            onPress: async () => {
              await clearExamSession();
              router.replace('/paywall');
            },
          },
        ]
      );
      return;
    }

    Alert.alert(
      t('endSession') || 'Terminer la session',
      t('endSessionConfirm') || 'Êtes-vous sûr de vouloir terminer cette session ?',
      [
        { text: t('cancel') || 'Annuler', style: 'cancel' },
        {
          text: t('end') || 'Terminer',
          style: 'destructive',
          onPress: async () => {
            await clearExamSession();
            const completedCount = session?.completedTaskIds.length || 0;
            router.replace({
              pathname: '/exam/summary',
              params: {
                duration: session?.plannedDuration.toString() || '0',
                completed: completedCount.toString(),
              },
            });
          },
        },
      ]
    );
  };

  const handleSessionEnd = async () => {
    stopTimer();
    const isDemo = session?.sessionId.startsWith('exam_demo_') || params.demo === 'true';
    
    await clearExamSession();
    
    if (isDemo) {
      // Pour la démo, rediriger vers le paywall
      Alert.alert(
        t('demoEnded'),
        t('demoEndedMessage'),
        [
          {
            text: t('unlockExamMode'),
            onPress: () => {
              router.replace('/paywall');
            },
          },
        ]
      );
      return;
    }
    
    const completedCount = session?.completedTaskIds.length || 0;
    router.replace({
      pathname: '/exam/summary',
      params: {
        duration: session?.plannedDuration.toString() || '0',
        completed: completedCount.toString(),
      },
    });
  };

  if (loading || !session || !currentTask) {
    return (
      <View style={[styles.container, styles.centerContent, { paddingTop: insets.top }]}>
        <Text style={styles.loadingText}>{t('loadingSession')}</Text>
      </View>
    );
  }

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const progress = session.plannedDuration * 60 > 0 
    ? 1 - (timeRemaining / (session.plannedDuration * 60))
    : 0;
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        {!session.hardMode && (
          <TouchableOpacity
            style={styles.endButton}
            onPress={handleEndSession}
            activeOpacity={0.7}
          >
            <Text style={styles.endButtonText}>{t('end')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Timer Ring + centered time */}
      <View style={styles.timerContainer}>
        <Svg width={RING_SIZE} height={RING_SIZE}>
          <Circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RADIUS}
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth={STROKE_WIDTH}
            fill="none"
          />
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
        </Svg>
        <View style={styles.timerOverlay}>
          <Text style={styles.timerText}>
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </Text>
        </View>
      </View>

      {/* Task Card */}
      <Animated.View
        key={currentTask.id}
        entering={SlideInRight.duration(200)}
        exiting={SlideOutLeft.duration(200)}
        style={styles.taskCard}
      >
        <Text style={styles.taskTitle} numberOfLines={0}>{currentTask.title}</Text>
        <Text style={styles.taskSubject} numberOfLines={0}>{currentTask.subjectName}</Text>
      </Animated.View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.completeButton}
          onPress={handleComplete}
          activeOpacity={0.8}
        >
            <Text style={styles.completeButtonText}>{t('complete')}</Text>
        </TouchableOpacity>

        {!session.hardMode && (
          <TouchableOpacity
            style={styles.pauseButton}
            onPress={isRunning ? handlePause : handleResume}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isRunning ? 'pause' : 'play'}
              size={24}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Next Task Preview */}
      {nextTask && (
        <View style={styles.nextTaskPreview}>
          <Text style={styles.nextTaskLabel}>{t('next')}: {nextTask.title}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  timeDisplay: {
    flex: 1,
  },
  timeText: {
    fontSize: 20,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  endButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  endButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  timerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 40,
  },
  timerOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerText: {
    fontSize: 48,
    fontWeight: '300',
    letterSpacing: -2,
    color: '#FFFFFF',
  },
  taskCard: {
    marginHorizontal: 24,
    padding: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 32,
    width: '100%',
    alignSelf: 'stretch',
  },
  taskTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
    flexShrink: 0,
    flexWrap: 'wrap',
  },
  taskSubject: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    flexShrink: 0,
    flexWrap: 'wrap',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  completeButton: {
    flex: 1,
    backgroundColor: '#16A34A',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  pauseButton: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextTaskPreview: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    alignItems: 'center',
  },
  nextTaskLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.4)',
  },
});

