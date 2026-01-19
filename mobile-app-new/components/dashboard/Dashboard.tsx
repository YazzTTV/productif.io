import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '@/contexts/LanguageContext';
import { dashboardService, habitsService, authService } from '@/lib/api';

interface Task {
  id: string;
  title: string;
  subject?: string;
  estimatedMinutes?: number;
  completed: boolean;
}

interface Habit {
  id: string;
  name: string;
  completed: boolean;
}

interface MentalState {
  focus: number;
  energy: number;
  stress: number;
}

export function Dashboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  
  const [userName, setUserName] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [mentalState, setMentalState] = useState<MentalState>({
    focus: 72,
    energy: 65,
    stress: 38,
  });

  // Obtenir le bon message de salutation
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('goodMorning');
    if (hour < 18) return t('goodAfternoon');
    return t('goodEvening');
  };

  const loadData = async () => {
    try {
      // Charger les infos utilisateur
      const user = await authService.checkAuth();
      if (user?.name) {
        setUserName(user.name.split(' ')[0]);
      }

      // Charger les habitudes
      const habitsData = await habitsService.getAll();
      if (Array.isArray(habitsData)) {
        const today = new Date().toISOString().split('T')[0];
        setHabits(habitsData.slice(0, 4).map((h: any) => ({
          id: h.id,
          name: h.name,
          completed: h.entries?.some((e: any) => 
            e.date?.startsWith(today) && e.completed
          ) || false,
        })));
      }

      // Charger les tâches (via l'endpoint tasks, pas metrics)
      try {
        const tasksData = await dashboardService.getTasks?.() || [];
        if (Array.isArray(tasksData)) {
          setTasks(tasksData.slice(0, 3).map((t: any) => ({
            id: t.id,
            title: t.title,
            subject: t.subject,
            estimatedMinutes: t.estimatedMinutes,
            completed: t.completed || false,
          })));
        }
      } catch {
        // Tasks endpoint not available, use empty array
        setTasks([]);
      }
    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  const mainPriority = tasks[0] || {
    title: 'Aucune tâche prioritaire',
    subject: '',
    estimatedMinutes: 0,
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#16A34A" />
        }
      >
        {/* Header */}
        <Animated.View entering={FadeInUp.delay(100).duration(400)} style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.userName}>
              {t('todaysIdealDay', { name: userName || 'User' })}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => router.push('/parametres')}
          >
            <Ionicons name="settings-outline" size={22} color="#000" />
          </TouchableOpacity>
        </Animated.View>

        {/* Mental State */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.mentalStateCard}>
          <Text style={styles.cardLabel}>{t('currentState')}</Text>
          <View style={styles.stateList}>
            {[
              { key: 'focus', value: mentalState.focus, color: '#16A34A' },
              { key: 'energy', value: mentalState.energy, color: '#16A34A' },
              { key: 'stress', value: mentalState.stress, color: 'rgba(0,0,0,0.2)' },
            ].map((item) => (
              <View key={item.key} style={styles.stateRow}>
                <Text style={styles.stateLabel}>{t(item.key as any)}</Text>
                <View style={styles.stateBarContainer}>
                  <View style={styles.stateBarTrack}>
                    <View 
                      style={[styles.stateBarFill, { width: `${item.value}%`, backgroundColor: item.color }]} 
                    />
                  </View>
                  <Text style={styles.stateValue}>{item.value}%</Text>
                </View>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Main Priority */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.section}>
          <Text style={styles.cardLabel}>{t('mainPriority')}</Text>
          <View style={styles.priorityCard}>
            <View style={styles.priorityContent}>
              <Text style={styles.priorityTitle}>{mainPriority.title}</Text>
              {mainPriority.subject && (
                <Text style={styles.prioritySubject}>{mainPriority.subject}</Text>
              )}
              {mainPriority.estimatedMinutes && mainPriority.estimatedMinutes > 0 && (
                <Text style={styles.priorityTime}>~{mainPriority.estimatedMinutes} min</Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.startFocusButton}
              onPress={() => router.push('/focus')}
              activeOpacity={0.8}
            >
              <Text style={styles.startFocusText}>{t('startFocusButton')}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Also Scheduled */}
        {tasks.length > 1 && (
          <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.section}>
            <Text style={styles.cardLabel}>{t('alsoScheduled')}</Text>
            <View style={styles.tasksList}>
              {tasks.slice(1).map((task) => (
                <View key={task.id} style={styles.taskCard}>
                  <View style={styles.taskContent}>
                    <Text style={styles.taskTitle}>{task.title}</Text>
                    {task.subject && (
                      <Text style={styles.taskSubject}>{task.subject}</Text>
                    )}
                  </View>
                  {task.estimatedMinutes && (
                    <Text style={styles.taskTime}>{task.estimatedMinutes} min</Text>
                  )}
                </View>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Habits */}
        <Animated.View entering={FadeInDown.delay(500).duration(400)} style={styles.section}>
          <Text style={styles.cardLabel}>{t('todaysHabits')}</Text>
          {habits.length > 0 ? (
            <View style={styles.habitsList}>
              {habits.map((habit) => (
                <TouchableOpacity
                  key={habit.id}
                  style={[styles.habitCard, habit.completed && styles.habitCardCompleted]}
                  onPress={() => {
                    // Toggle habit
                    habitsService.complete(habit.id, undefined, habit.completed);
                    setHabits(prev => prev.map(h => 
                      h.id === habit.id ? { ...h, completed: !h.completed } : h
                    ));
                  }}
                >
                  <View style={[styles.habitCheckbox, habit.completed && styles.habitCheckboxCompleted]}>
                    {habit.completed && <View style={styles.habitCheckmark} />}
                  </View>
                  <Text style={[styles.habitName, habit.completed && styles.habitNameCompleted]}>
                    {habit.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyHabitsContainer}>
              <Text style={styles.emptyHabitsText}>Aucune habitude aujourd'hui</Text>
            </View>
          )}
          
          {/* Add habit button - Design System style */}
          <TouchableOpacity
            style={styles.addHabitButton}
            onPress={() => router.push('/(tabs)/habits')}
            activeOpacity={0.8}
          >
            <View style={styles.addHabitIconContainer}>
              <Ionicons name="add" size={16} color="rgba(0, 0, 0, 0.4)" />
            </View>
            <Text style={styles.addHabitText}>{t('addHabit')}</Text>
          </TouchableOpacity>
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
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.4)',
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: '600',
    letterSpacing: -0.5,
    color: '#000000',
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: 24,
  },
  cardLabel: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.6)',
    marginBottom: 12,
  },
  mentalStateCard: {
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    backgroundColor: '#FFFFFF',
    marginBottom: 24,
  },
  stateList: {
    gap: 16,
  },
  stateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stateLabel: {
    fontSize: 15,
    color: '#000000',
    width: 80,
  },
  stateBarContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stateBarTrack: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  stateBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  stateValue: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.4)',
    width: 40,
    textAlign: 'right',
  },
  priorityCard: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'rgba(22, 163, 74, 0.2)',
    backgroundColor: 'rgba(22, 163, 74, 0.05)',
  },
  priorityContent: {
    marginBottom: 20,
  },
  priorityTitle: {
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: -0.5,
    color: '#000000',
    marginBottom: 8,
  },
  prioritySubject: {
    fontSize: 15,
    color: 'rgba(0, 0, 0, 0.6)',
    marginBottom: 4,
  },
  priorityTime: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.4)',
  },
  startFocusButton: {
    backgroundColor: '#16A34A',
    paddingVertical: 16,
    borderRadius: 24,
    alignItems: 'center',
  },
  startFocusText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  tasksList: {
    gap: 12,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    backgroundColor: '#FFFFFF',
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 4,
  },
  taskSubject: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.4)',
  },
  taskTime: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.4)',
  },
  habitsList: {
    gap: 12,
  },
  habitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    backgroundColor: '#FFFFFF',
    gap: 16,
  },
  habitCardCompleted: {
    borderColor: 'rgba(22, 163, 74, 0.2)',
    backgroundColor: 'rgba(22, 163, 74, 0.05)',
  },
  habitCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  habitCheckboxCompleted: {
    borderColor: '#16A34A',
    backgroundColor: '#16A34A',
  },
  habitCheckmark: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
  },
  habitName: {
    fontSize: 16,
    color: '#000000',
    flex: 1,
  },
  habitNameCompleted: {
    color: 'rgba(0, 0, 0, 0.6)',
  },
  emptyHabitsContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyHabitsText: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.4)',
  },
  addHabitButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    marginTop: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 16,
    backgroundColor: 'transparent',
  },
  addHabitIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addHabitText: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.4)',
  },
});

