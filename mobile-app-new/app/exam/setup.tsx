import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Switch, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { selectExamTasks, TaskForExam } from '@/utils/taskSelection';
import { saveExamSession, getActiveExamSession } from '@/utils/examSession';
import { checkPremiumStatus } from '@/utils/premium';
import { useLanguage } from '@/contexts/LanguageContext';

const MIN_DURATION = 25;
const MAX_DURATION = 180;
const DEFAULT_DURATION = 45;

export default function ExamSetupScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [duration, setDuration] = useState(DEFAULT_DURATION);
  const [hardMode, setHardMode] = useState(true);
  const [breaks, setBreaks] = useState(false);
  const [primaryTask, setPrimaryTask] = useState<TaskForExam | null>(null);
  const [nextTasks, setNextTasks] = useState<TaskForExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    checkActiveSession();
    loadTasks();
    checkAccess();
  }, []);

  const checkActiveSession = async () => {
    const activeSession = await getActiveExamSession();
    if (activeSession) {
      router.replace({
        pathname: '/exam/session',
        params: { sessionId: activeSession.sessionId },
      });
    }
  };

  const checkAccess = async () => {
    const status = await checkPremiumStatus();
    if (!status.isPremium) {
      router.replace('/exam/preview');
    }
  };

  const loadTasks = async () => {
    try {
      setLoading(true);
      const { primary, next } = await selectExamTasks();
      setPrimaryTask(primary);
      setNextTasks(next);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async () => {
    if (!primaryTask) {
      // Show empty state or task creation
      return;
    }

    setStarting(true);
    try {
      const sessionId = `exam_${Date.now()}`;
      const allTaskIds = [primaryTask.id, ...nextTasks.map(t => t.id)].filter(Boolean);
      
      await saveExamSession({
        sessionId,
        startedAt: Date.now(),
        plannedDuration: duration,
        hardMode,
        breaks,
        currentTaskIndex: 0,
        plannedTaskIds: allTaskIds,
        completedTaskIds: [],
      });

      router.push({
        pathname: '/exam/session',
        params: { sessionId },
      });
    } catch (error) {
      console.error('Error starting session:', error);
    } finally {
      setStarting(false);
    }
  };

  const handleEditTasks = () => {
    router.push('/(tabs)/tasks');
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#16A34A" />
        <Text style={styles.loadingText}>{t('loadingTasks') || t('loading')}</Text>
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
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={22} color="#000" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>{t('startExamMode')}</Text>
          </View>
          <View style={styles.backButton} />
        </Animated.View>

        {/* Duration Slider */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.section}>
          <Text style={styles.sectionLabel}>{t('duration')}</Text>
          <View style={styles.durationCard}>
            <Text style={styles.durationValue}>{duration} min</Text>
            <View style={styles.sliderContainer}>
              <TouchableOpacity
                style={styles.sliderButton}
                onPress={() => setDuration(Math.max(MIN_DURATION, duration - 5))}
              >
                <Ionicons name="remove" size={20} color="#000" />
              </TouchableOpacity>
              <View style={styles.sliderTrack}>
                <View style={[styles.sliderFill, { width: `${((duration - MIN_DURATION) / (MAX_DURATION - MIN_DURATION)) * 100}%` }]} />
              </View>
              <TouchableOpacity
                style={styles.sliderButton}
                onPress={() => setDuration(Math.min(MAX_DURATION, duration + 5))}
              >
                <Ionicons name="add" size={20} color="#000" />
              </TouchableOpacity>
            </View>
            <View style={styles.durationPresets}>
              {[25, 45, 60, 90].map((preset) => (
                <TouchableOpacity
                  key={preset}
                  style={[
                    styles.presetButton,
                    duration === preset && styles.presetButtonActive,
                  ]}
                  onPress={() => setDuration(preset)}
                >
                  <Text
                    style={[
                      styles.presetText,
                      duration === preset && styles.presetTextActive,
                    ]}
                  >
                    {preset}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Animated.View>

        {/* Primary Task */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.section}>
          <Text style={styles.sectionLabel}>{t('primaryTask')}</Text>
          {primaryTask ? (
            <View style={styles.taskCard}>
              <Text style={styles.taskTitle} numberOfLines={0}>{primaryTask.title}</Text>
              <Text style={styles.taskSubject} numberOfLines={0}>{primaryTask.subjectName}</Text>
              <Text style={styles.taskCoeff}>Coef {primaryTask.subjectCoefficient}</Text>
            </View>
          ) : (
            <View style={styles.emptyTaskCard}>
              <Ionicons name="add-circle-outline" size={32} color="rgba(0, 0, 0, 0.3)" />
              <Text style={styles.emptyTaskText}>{t('noTasksAvailable') || 'No tasks available'}</Text>
              <TouchableOpacity
                style={styles.addTaskButton}
                onPress={handleEditTasks}
              >
                <Text style={styles.addTaskText}>{t('addFirstTask') || 'Add your first task'}</Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>

        {/* Up Next */}
        {nextTasks.length > 0 && (
          <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.section}>
            <Text style={styles.sectionLabel}>{t('upNext')}</Text>
            {nextTasks.map((task, index) => (
              <View key={task.id} style={styles.nextTaskItem}>
                <View style={styles.nextTaskNumber}>
                  <Text style={styles.nextTaskNumberText}>{index + 2}</Text>
                </View>
                <View style={styles.nextTaskContent}>
                  <Text style={styles.nextTaskTitle} numberOfLines={0}>{task.title}</Text>
                  <Text style={styles.nextTaskSubject} numberOfLines={0}>{task.subjectName}</Text>
                </View>
              </View>
            ))}
          </Animated.View>
        )}

        {/* Options */}
        <Animated.View entering={FadeInDown.delay(500).duration(400)} style={styles.section}>
          <View style={styles.optionItem}>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>{t('hardMode')}</Text>
              <Text style={styles.optionDescription}>{t('hardModeDescription')}</Text>
            </View>
            <Switch
              value={hardMode}
              onValueChange={setHardMode}
              trackColor={{ false: 'rgba(0, 0, 0, 0.1)', true: '#16A34A' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.optionItem}>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>{t('breaks')}</Text>
              <Text style={styles.optionDescription}>{t('breaksDescription')}</Text>
            </View>
            <Switch
              value={breaks}
              onValueChange={setBreaks}
              trackColor={{ false: 'rgba(0, 0, 0, 0.1)', true: '#16A34A' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </Animated.View>

        {/* CTA */}
        <Animated.View entering={FadeInDown.delay(600).duration(400)} style={styles.ctaSection}>
          <TouchableOpacity
            style={[styles.startButton, !primaryTask && styles.startButtonDisabled]}
            onPress={handleStart}
            disabled={!primaryTask || starting}
            activeOpacity={0.8}
          >
            {starting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.startButtonText}>{t('startExamMode')}</Text>
            )}
          </TouchableOpacity>

          {primaryTask && (
            <TouchableOpacity
              style={styles.editTasksButton}
              onPress={handleEditTasks}
            >
              <Text style={styles.editTasksText}>{t('editTasks')}</Text>
            </TouchableOpacity>
          )}
        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
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
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    marginBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
  },
  section: {
    marginBottom: 32,
  },
  sectionLabel: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.4)',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  durationCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderRadius: 16,
    padding: 24,
  },
  durationValue: {
    fontSize: 48,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
    marginBottom: 24,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  sliderButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sliderTrack: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  sliderFill: {
    height: '100%',
    backgroundColor: '#16A34A',
  },
  durationPresets: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  presetButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  presetButtonActive: {
    backgroundColor: '#000',
  },
  presetText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(0, 0, 0, 0.6)',
  },
  presetTextActive: {
    color: '#FFFFFF',
  },
  taskCard: {
    backgroundColor: 'rgba(22, 163, 74, 0.05)',
    borderWidth: 2,
    borderColor: 'rgba(22, 163, 74, 0.2)',
    borderRadius: 16,
    padding: 20,
    width: '100%',
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
    flexShrink: 0,
    flexWrap: 'wrap',
  },
  taskSubject: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.6)',
    marginBottom: 4,
    flexShrink: 0,
    flexWrap: 'wrap',
  },
  taskCoeff: {
    fontSize: 12,
    color: 'rgba(0, 0, 0, 0.4)',
  },
  emptyTaskCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    borderStyle: 'dashed',
  },
  emptyTaskText: {
    fontSize: 16,
    color: 'rgba(0, 0, 0, 0.4)',
    marginTop: 12,
    marginBottom: 16,
  },
  addTaskButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#16A34A',
  },
  addTaskText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  nextTaskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderRadius: 12,
    marginBottom: 8,
  },
  nextTaskNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  nextTaskNumberText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  nextTaskContent: {
    flex: 1,
  },
  nextTaskTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 2,
    flexShrink: 0,
    flexWrap: 'wrap',
  },
  nextTaskSubject: {
    fontSize: 12,
    color: 'rgba(0, 0, 0, 0.4)',
    flexShrink: 0,
    flexWrap: 'wrap',
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderRadius: 12,
    marginBottom: 8,
  },
  optionContent: {
    flex: 1,
    marginRight: 16,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 12,
    color: 'rgba(0, 0, 0, 0.4)',
  },
  ctaSection: {
    marginTop: 8,
    gap: 12,
  },
  startButton: {
    backgroundColor: '#16A34A',
    paddingVertical: 18,
    borderRadius: 24,
    alignItems: 'center',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  startButtonDisabled: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    shadowOpacity: 0,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  editTasksButton: {
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  editTasksText: {
    color: 'rgba(0, 0, 0, 0.6)',
    fontSize: 16,
    fontWeight: '500',
  },
});

