import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ExamPhase = 'dashboard' | 'focus' | 'paused' | 'complete';

interface Task {
  id: string;
  title: string;
  subject: string;
  priority: 'critical' | 'supporting' | 'light';
  completed: boolean;
}

export function ExamMode() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [phase, setPhase] = useState<ExamPhase>('dashboard');
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      title: 'Complete Chapter 12 Summary',
      subject: 'Organic Chemistry',
      priority: 'critical',
      completed: false,
    },
    {
      id: '2',
      title: 'Review lecture notes',
      subject: 'Physics - Thermodynamics',
      priority: 'supporting',
      completed: false,
    },
    {
      id: '3',
      title: 'Organize study materials',
      subject: 'General',
      priority: 'light',
      completed: false,
    },
  ]);

  const upcomingExams = [
    { subject: 'Organic Chemistry', date: 'March 15', daysUntil: 3 },
    { subject: 'Physics', date: 'March 18', daysUntil: 6 },
  ];

  const completedCount = tasks.filter(t => t.completed).length;
  const allTasksCompleted = tasks.every(t => t.completed);

  const handleCompleteTask = (taskId: string) => {
    setTasks(prev =>
      prev.map(task =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const handleStartFocus = () => {
    setPhase('focus');
  };

  if (phase === 'dashboard') {
    const nextExam = upcomingExams[0];

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
              <Text style={styles.headerTitle}>Exam Mode</Text>
              <Text style={styles.headerSubtitle}>Focus on what truly matters.</Text>
            </View>

            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => {}}
            >
              <Ionicons name="settings-outline" size={20} color="#000" />
            </TouchableOpacity>
          </Animated.View>

          {/* Exam Countdown */}
          {nextExam && (
            <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.examCard}>
              <View style={styles.examCardContent}>
                <View style={styles.examIcon}>
                  <Ionicons name="calendar-outline" size={24} color="#16A34A" />
                </View>
                <View style={styles.examInfo}>
                  <Text style={styles.examSubject}>{nextExam.subject}</Text>
                  <Text style={styles.examDate}>{nextExam.date}</Text>
                </View>
                <View style={styles.examDays}>
                  <Text style={styles.examDaysNumber}>{nextExam.daysUntil}</Text>
                  <Text style={styles.examDaysLabel}>days</Text>
                </View>
              </View>
            </Animated.View>
          )}

          {/* Today's Priorities */}
          <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.section}>
            <Text style={styles.sectionLabel}>Today's priorities</Text>
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
                          <Text style={styles.priorityBadgeText}>Critical</Text>
                        </View>
                      )}
                      {task.priority === 'supporting' && (
                        <View style={styles.priorityBadgeSupporting}>
                          <Text style={styles.priorityBadgeTextSupporting}>Supporting</Text>
                        </View>
                      )}
                      {task.priority === 'light' && (
                        <View style={styles.priorityBadgeLight}>
                          <Text style={styles.priorityBadgeTextLight}>Light</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.taskTitle}>{task.title}</Text>
                    <Text style={styles.taskSubject}>{task.subject}</Text>
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
                ? "This is enough for today."
                : completedCount > 0
                ? "You're covering what matters."
                : "Consistency beats panic."}
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
              <Text style={styles.startFocusText}>Start Focus</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.exitButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Text style={styles.exitButtonText}>Exit Exam Mode</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Focus phase - simplified for now
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text>Focus Mode - Coming soon</Text>
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
  },
  taskSubject: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.6)',
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

