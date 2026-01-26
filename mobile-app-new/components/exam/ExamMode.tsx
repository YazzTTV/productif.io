import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { selectExamTasks, TaskForExam } from '@/utils/taskSelection';
import { subjectsService, authService } from '@/lib/api';
import { checkPremiumStatus } from '@/utils/premium';
import { useLanguage } from '@/contexts/LanguageContext';
import { useExamSettings } from '@/hooks/useExamSettings';

type ExamPhase = 'dashboard' | 'focus' | 'paused' | 'complete';

interface Task {
  id: string;
  title: string;
  subject: string;
  priority: 'critical' | 'supporting' | 'light';
  completed: boolean;
}

interface ExamInfo {
  subject: string;
  date: string;
  daysUntil: number;
}

export function ExamMode() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { settings: examSettings } = useExamSettings();
  const [phase, setPhase] = useState<ExamPhase>('dashboard');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [upcomingExam, setUpcomingExam] = useState<ExamInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const completedCount = tasks.filter(t => t.completed).length;
  const allTasksCompleted = tasks.every(t => t.completed);

  useEffect(() => {
    checkExamModeAccess();
  }, []);

  const checkExamModeAccess = async () => {
    try {
      // Vérifier le statut Premium via l'API
      const user = await authService.checkAuth();
      
      if (user && user.planLimits) {
        // Vérifier si Exam Mode est activé
        if (!user.planLimits.examModeEnabled) {
          // Rediriger vers la page preview avec paywall
          router.replace('/exam/preview');
          return;
        }
      } else {
        // Fallback : vérifier via checkPremiumStatus
        const status = await checkPremiumStatus();
        if (!status.isPremium) {
          router.replace('/exam/preview');
          return;
        }
      }
      
      // Si on arrive ici, l'utilisateur a accès à Exam Mode
      loadExamData();
    } catch (error) {
      console.error('Error checking Exam Mode access:', error);
      // En cas d'erreur, rediriger vers preview pour sécurité
      router.replace('/exam/preview');
    }
  };

  const loadExamData = async () => {
    try {
      setLoading(true);
      
      // Récupérer les matières pour trouver celle avec la deadline la plus proche
      const subjectsData = await subjectsService.getAll();
      const subjects = Array.isArray(subjectsData) ? subjectsData : [];

      // Trouver la matière la plus importante (coefficient + deadline)
      let primarySubject: any = null;
      let highestScore = -1;

      for (const subject of subjects) {
        if (!subject.deadline) continue;

        const deadlineDate = new Date(subject.deadline);
        const now = new Date();
        const daysUntilDeadline = Math.ceil(
          (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Score combinant coefficient et urgence de deadline
        const score = subject.coefficient * 100 + (daysUntilDeadline <= 7 ? 500 : daysUntilDeadline <= 30 ? 200 : 50);

        if (score > highestScore) {
          highestScore = score;
          primarySubject = subject;
        }
      }

      // Si on a trouvé une matière principale, créer l'info d'examen
      if (primarySubject && primarySubject.deadline) {
        const deadlineDate = new Date(primarySubject.deadline);
        const now = new Date();
        const daysUntil = Math.ceil(
          (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        const dateStr = deadlineDate.toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'long',
        });

        setUpcomingExam({
          subject: primarySubject.name,
          date: dateStr,
          daysUntil: Math.max(0, daysUntil),
        });
      }

      // Récupérer toutes les tâches pour Exam Mode
      const { primary, next } = await selectExamTasks();

      // Si on a une matière principale, filtrer les tâches pour ne garder que celles de cette matière
      let tasksForPrimarySubject: TaskForExam[] = [];
      
      if (primarySubject) {
        // Récupérer toutes les tâches et filtrer par matière principale
        const allTasks = [primary, ...next].filter(Boolean) as TaskForExam[];
        tasksForPrimarySubject = allTasks.filter(
          task => task.subjectId === primarySubject.id
        );

        // Si on n'a pas assez de tâches pour la matière principale, prendre les plus importantes globalement
        if (tasksForPrimarySubject.length < examSettings.maxTasks) {
          // Prendre le nombre maximum de tâches défini dans les paramètres
          tasksForPrimarySubject = allTasks.slice(0, examSettings.maxTasks);
        } else {
          // Prendre le nombre maximum de tâches de la matière principale
          tasksForPrimarySubject = tasksForPrimarySubject.slice(0, examSettings.maxTasks);
        }
      } else {
        // Pas de matière principale trouvée, prendre le nombre maximum de tâches défini dans les paramètres
        const allTasks = [primary, ...next].filter(Boolean) as TaskForExam[];
        tasksForPrimarySubject = allTasks.slice(0, examSettings.maxTasks);
      }

      // Convertir les tâches en format Task
      const allExamTasks: Task[] = tasksForPrimarySubject.map(task => ({
        id: task.id,
        title: task.title,
        subject: task.subjectName,
        priority: task.priority === 'high' ? 'critical' : task.priority === 'medium' ? 'supporting' : 'light',
        completed: false,
      }));

      setTasks(allExamTasks);
    } catch (error) {
      console.error('Error loading exam data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTask = (taskId: string) => {
    setTasks(prev =>
      prev.map(task =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const handleStartFocus = () => {
    router.push('/focus');
  };

  const handleSettingsPress = () => {
    router.push('/exam/settings');
  };

  if (phase === 'dashboard') {
    if (loading) {
      return (
        <View style={[styles.container, styles.centerContent, { paddingTop: insets.top }]}>
          <ActivityIndicator size="large" color="#16A34A" />
          <Text style={styles.loadingText}>{t('loadingExamData')}</Text>
        </View>
      );
    }

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

            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>{t('examMode')}</Text>
              <Text style={styles.headerSubtitle}>{t('focusOnWhatMatters')}</Text>
            </View>

            <TouchableOpacity
              style={styles.settingsButton}
              onPress={handleSettingsPress}
            >
              <Ionicons name="settings-outline" size={20} color="#000" />
            </TouchableOpacity>
          </Animated.View>

          {/* Exam Countdown */}
          {upcomingExam && (
            <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.examCard}>
              <View style={styles.examCardContent}>
                <View style={styles.examIcon}>
                  <Ionicons name="calendar-outline" size={24} color="#16A34A" />
                </View>
                <View style={styles.examInfo}>
                  <Text style={styles.examSubject} numberOfLines={0}>{upcomingExam.subject}</Text>
                  <Text style={styles.examDate}>{upcomingExam.date}</Text>
                </View>
                <View style={styles.examDays}>
                  <Text style={styles.examDaysNumber}>{upcomingExam.daysUntil}</Text>
                  <Text style={styles.examDaysLabel}>{t('days')}</Text>
                </View>
              </View>
            </Animated.View>
          )}

          {/* Today's Priorities */}
          <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.section}>
            <Text style={styles.sectionLabel}>{t('todaysPriorities')}</Text>
            <View style={styles.tasksList}>
              {tasks.map((task, index) => (
                <View
                  key={task.id}
                  style={[
                    styles.taskCard,
                    task.completed && styles.taskCardCompleted,
                    task.priority === 'critical' && styles.taskCardCritical,
                  ]}
                >
                  <View style={styles.taskContent}>
                    <View style={styles.taskHeader}>
                      {task.priority === 'critical' && (
                        <View style={styles.priorityBadge}>
                          <Text style={styles.priorityBadgeText}>{t('critical')}</Text>
                        </View>
                      )}
                      {task.priority === 'supporting' && (
                        <View style={styles.priorityBadgeSupporting}>
                          <Text style={styles.priorityBadgeTextSupporting}>{t('supporting')}</Text>
                        </View>
                      )}
                      {task.priority === 'light' && (
                        <View style={styles.priorityBadgeLight}>
                          <Text style={styles.priorityBadgeTextLight}>{t('light')}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.taskTitle} numberOfLines={0}>{task.title}</Text>
                    <Text style={styles.taskSubject} numberOfLines={0}>{task.subject}</Text>
                  </View>
                  {task.completed && (
                    <View style={styles.completedIcon}>
                      <Ionicons name="checkmark-circle" size={32} color="#16A34A" />
                    </View>
                  )}
                </View>
              ))}
            </View>
          </Animated.View>

          {/* Micro-reassurance */}
          <Animated.View entering={FadeInDown.delay(500).duration(400)} style={styles.reassuranceCard}>
            <Text style={styles.reassuranceText}>
              {allTasksCompleted
                ? t('examEnoughForToday') || "This is enough for today."
                : completedCount > 0
                ? t('examCoveringWhatMatters') || "You're covering what matters."
                : t('examConsistencyBeatsPanic') || "Consistency beats panic."}
            </Text>
          </Animated.View>

          {/* Bottom spacing */}
          <View style={{ height: 120 }} />
        </ScrollView>

        {/* Fixed Bottom CTA */}
        <View style={styles.bottomCTA}>
          {!allTasksCompleted && (
            <TouchableOpacity
              style={styles.startFocusButton}
              onPress={handleStartFocus}
              activeOpacity={0.8}
            >
              <Text style={styles.startFocusText}>{t('startFocus')}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.exitButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Text style={styles.exitButtonText}>{t('exitExamMode')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // This should not be reached anymore since we redirect to /focus
  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: 'rgba(0, 0, 0, 0.6)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 200,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
  headerContent: {
    flex: 1,
    gap: 8,
  },
  headerTitle: {
    fontSize: 40,
    fontWeight: '600',
    letterSpacing: -1.5,
    color: '#000000',
  },
  headerSubtitle: {
    fontSize: 18,
    color: 'rgba(0, 0, 0, 0.6)',
  },
  settingsButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  examCard: {
    marginBottom: 32,
  },
  examCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'rgba(22, 163, 74, 0.2)',
    backgroundColor: 'rgba(22, 163, 74, 0.05)',
    gap: 16,
  },
  examIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  examInfo: {
    flex: 1,
    gap: 4,
  },
  examSubject: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.5,
    color: '#000000',
    flexShrink: 0,
    flexWrap: 'wrap',
  },
  examDate: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.6)',
  },
  examDays: {
    alignItems: 'flex-end',
  },
  examDaysNumber: {
    fontSize: 24,
    fontWeight: '600',
    letterSpacing: -0.5,
    color: '#000000',
  },
  examDaysLabel: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.6)',
  },
  section: {
    marginBottom: 32,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(0, 0, 0, 0.4)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
  },
  tasksList: {
    gap: 12,
  },
  taskCard: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  taskCardCompleted: {
    borderColor: 'rgba(22, 163, 74, 0.2)',
    backgroundColor: 'rgba(22, 163, 74, 0.05)',
  },
  taskCardCritical: {
    borderColor: 'rgba(0, 0, 0, 0.2)',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  taskContent: {
    flex: 1,
    gap: 8,
  },
  taskHeader: {
    marginBottom: 4,
  },
  priorityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#000000',
  },
  priorityBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  priorityBadgeSupporting: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  priorityBadgeTextSupporting: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(0, 0, 0, 0.6)',
  },
  priorityBadgeLight: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  priorityBadgeTextLight: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(0, 0, 0, 0.4)',
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.5,
    color: '#000000',
    flexShrink: 0,
    flexWrap: 'wrap',
  },
  taskSubject: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.6)',
    flexShrink: 0,
    flexWrap: 'wrap',
  },
  completedIcon: {
    marginLeft: 16,
  },
  reassuranceCard: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
  },
  reassuranceText: {
    fontSize: 16,
    color: 'rgba(0, 0, 0, 0.6)',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  bottomCTA: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
    gap: 12,
  },
  startFocusButton: {
    backgroundColor: '#16A34A',
    paddingVertical: 16,
    borderRadius: 24,
    alignItems: 'center',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  startFocusText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  exitButton: {
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: 'center',
  },
  exitButtonText: {
    color: 'rgba(0, 0, 0, 0.6)',
    fontSize: 16,
  },
});

