import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Habit {
  id: string;
  name: string;
  category: 'morning' | 'day' | 'evening' | 'anti-habit';
  completed: boolean;
  streak?: number;
}

export function ReviewHabits() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [habits, setHabits] = useState<Habit[]>([
    { id: '1', name: 'Morning pages', category: 'morning', completed: false, streak: 12 },
    { id: '2', name: 'Light breakfast', category: 'morning', completed: false, streak: 8 },
    { id: '3', name: 'Review today\'s plan', category: 'morning', completed: false, streak: 15 },
    { id: '4', name: 'Lunch away from desk', category: 'day', completed: false, streak: 5 },
    { id: '5', name: 'Walk outside', category: 'day', completed: false, streak: 3 },
    { id: '6', name: 'Hydration check', category: 'day', completed: false, streak: 18 },
    { id: '7', name: 'Close open loops', category: 'evening', completed: false, streak: 7 },
    { id: '8', name: 'No screens 30min before bed', category: 'evening', completed: false, streak: 4 },
    { id: '9', name: 'Tomorrow\'s priorities', category: 'evening', completed: false, streak: 11 },
    { id: '10', name: 'Social media scrolling', category: 'anti-habit', completed: false },
    { id: '11', name: 'Working through breaks', category: 'anti-habit', completed: false },
    { id: '12', name: 'Late night studying', category: 'anti-habit', completed: false },
  ]);

  const [consistencyDays, setConsistencyDays] = useState(4);
  const [showCompletion, setShowCompletion] = useState(false);

  const toggleHabit = (id: string) => {
    setHabits(prev =>
      prev.map(h => (h.id === id ? { ...h, completed: !h.completed } : h))
    );
  };

  const allCompleted = habits.every(h => h.completed);

  useEffect(() => {
    if (allCompleted && habits.length > 0) {
      setTimeout(() => {
        setShowCompletion(true);
        setTimeout(() => {
          router.back();
        }, 2000);
      }, 500);
    }
  }, [allCompleted, habits.length, router]);

  const getHabitsByCategory = (category: Habit['category']) => {
    return habits.filter(h => h.category === category);
  };

  const categoryConfig = {
    morning: { label: 'Morning', description: 'Start the day' },
    day: { label: 'Day', description: 'During work' },
    evening: { label: 'Evening', description: 'Wind down' },
    'anti-habit': { label: 'Anti-habits', description: 'Did you avoid these today?' },
  };

  if (showCompletion) {
    return (
      <View style={[styles.container, styles.completionContainer]}>
        <Animated.View entering={FadeInUp.delay(200).duration(400)} style={styles.completionContent}>
          <View style={styles.completionIcon}>
            <View style={styles.completionIconInner} />
          </View>
          <Text style={styles.completionText}>Noted.</Text>
        </Animated.View>
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
            <Text style={styles.headerTitle}>Habits</Text>
            <Text style={styles.headerSubtitle}>Small actions. Repeated.</Text>
          </View>
        </Animated.View>

        {/* Weekly consistency indicator */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.consistencySection}>
          <View style={styles.consistencyRow}>
            <Text style={styles.consistencyText}>
              Consistency this week: {consistencyDays}/7 days
            </Text>
            <View style={styles.consistencyDots}>
              {[...Array(7)].map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.consistencyDot,
                    i < consistencyDays && styles.consistencyDotActive,
                  ]}
                />
              ))}
            </View>
          </View>
        </Animated.View>

        {/* Morning Habits */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>{categoryConfig.morning.label}</Text>
            <Text style={styles.sectionDescription}>{categoryConfig.morning.description}</Text>
          </View>
          <View style={styles.habitsList}>
            {getHabitsByCategory('morning').map((habit, index) => (
              <TouchableOpacity
                key={habit.id}
                style={[
                  styles.habitCard,
                  habit.completed && styles.habitCardCompleted,
                ]}
                onPress={() => toggleHabit(habit.id)}
                activeOpacity={0.7}
              >
                <View style={styles.habitContent}>
                  <View
                    style={[
                      styles.habitCheckbox,
                      habit.completed && styles.habitCheckboxCompleted,
                    ]}
                  >
                    {habit.completed && (
                      <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.habitName,
                      habit.completed && styles.habitNameCompleted,
                    ]}
                  >
                    {habit.name}
                  </Text>
                </View>
                {habit.streak && habit.streak > 2 && (
                  <View style={styles.streakBadge}>
                    <Text style={styles.streakText}>{habit.streak} days</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Day Habits */}
        <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>{categoryConfig.day.label}</Text>
            <Text style={styles.sectionDescription}>{categoryConfig.day.description}</Text>
          </View>
          <View style={styles.habitsList}>
            {getHabitsByCategory('day').map((habit) => (
              <TouchableOpacity
                key={habit.id}
                style={[
                  styles.habitCard,
                  habit.completed && styles.habitCardCompleted,
                ]}
                onPress={() => toggleHabit(habit.id)}
                activeOpacity={0.7}
              >
                <View style={styles.habitContent}>
                  <View
                    style={[
                      styles.habitCheckbox,
                      habit.completed && styles.habitCheckboxCompleted,
                    ]}
                  >
                    {habit.completed && (
                      <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.habitName,
                      habit.completed && styles.habitNameCompleted,
                    ]}
                  >
                    {habit.name}
                  </Text>
                </View>
                {habit.streak && habit.streak > 2 && (
                  <View style={styles.streakBadge}>
                    <Text style={styles.streakText}>{habit.streak} days</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Evening Habits */}
        <Animated.View entering={FadeInDown.delay(500).duration(400)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>{categoryConfig.evening.label}</Text>
            <Text style={styles.sectionDescription}>{categoryConfig.evening.description}</Text>
          </View>
          <View style={styles.habitsList}>
            {getHabitsByCategory('evening').map((habit) => (
              <TouchableOpacity
                key={habit.id}
                style={[
                  styles.habitCard,
                  habit.completed && styles.habitCardCompleted,
                ]}
                onPress={() => toggleHabit(habit.id)}
                activeOpacity={0.7}
              >
                <View style={styles.habitContent}>
                  <View
                    style={[
                      styles.habitCheckbox,
                      habit.completed && styles.habitCheckboxCompleted,
                    ]}
                  >
                    {habit.completed && (
                      <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.habitName,
                      habit.completed && styles.habitNameCompleted,
                    ]}
                  >
                    {habit.name}
                  </Text>
                </View>
                {habit.streak && habit.streak > 2 && (
                  <View style={styles.streakBadge}>
                    <Text style={styles.streakText}>{habit.streak} days</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Anti-habits */}
        <Animated.View entering={FadeInDown.delay(600).duration(400)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>{categoryConfig['anti-habit'].label}</Text>
            <Text style={styles.sectionDescription}>{categoryConfig['anti-habit'].description}</Text>
          </View>
          <View style={styles.habitsList}>
            {getHabitsByCategory('anti-habit').map((habit) => (
              <TouchableOpacity
                key={habit.id}
                style={[
                  styles.habitCard,
                  habit.completed && styles.habitCardCompleted,
                ]}
                onPress={() => toggleHabit(habit.id)}
                activeOpacity={0.7}
              >
                <View style={styles.habitContent}>
                  <View
                    style={[
                      styles.habitCheckbox,
                      habit.completed && styles.habitCheckboxCompleted,
                    ]}
                  >
                    {habit.completed && (
                      <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.habitName,
                      habit.completed && styles.habitNameCompleted,
                    ]}
                  >
                    {habit.name}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
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
    marginBottom: 24,
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
    marginBottom: 16,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '600',
    letterSpacing: -1.2,
    color: '#000000',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(0, 0, 0, 0.4)',
  },
  consistencySection: {
    marginBottom: 32,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  consistencyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  consistencyText: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.4)',
  },
  consistencyDots: {
    flexDirection: 'row',
    gap: 4,
  },
  consistencyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  consistencyDotActive: {
    backgroundColor: '#16A34A',
  },
  section: {
    marginBottom: 48,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(0, 0, 0, 0.4)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.3)',
  },
  habitsList: {
    gap: 12,
  },
  habitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    backgroundColor: '#FFFFFF',
  },
  habitCardCompleted: {
    borderColor: 'rgba(22, 163, 74, 0.2)',
    backgroundColor: 'rgba(22, 163, 74, 0.05)',
  },
  habitContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
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
  habitName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
  habitNameCompleted: {
    color: 'rgba(0, 0, 0, 0.6)',
  },
  streakBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  streakText: {
    fontSize: 12,
    color: 'rgba(0, 0, 0, 0.4)',
  },
  completionContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  completionContent: {
    alignItems: 'center',
    gap: 24,
  },
  completionIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completionIconInner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#16A34A',
  },
  completionText: {
    fontSize: 32,
    fontWeight: '600',
    letterSpacing: -1,
    color: 'rgba(0, 0, 0, 0.6)',
  },
});

