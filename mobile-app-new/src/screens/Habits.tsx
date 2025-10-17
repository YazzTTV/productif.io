import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { format, startOfDay, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { apiService } from '../services/api';

interface Habit {
  id: string;
  name: string;
  description?: string;
  frequency: string[];
  timeOfDay?: string;
  type: 'boolean' | 'rating' | 'number';
  target?: number;
  streak: number;
  entries: {
    date: string;
    completed: boolean;
    value?: number;
  }[];
}

export const Habits = () => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()));
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchHabits = async () => {
    try {
      const response = await apiService.get('/habits');
      setHabits(response);
    } catch (error) {
      console.error('Erreur lors du chargement des habitudes:', error);
      Alert.alert('Erreur', 'Impossible de charger les habitudes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHabits();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchHabits();
  };

  const handlePreviousDay = () => {
    setSelectedDate(prev => addDays(prev, -1));
  };

  const handleNextDay = () => {
    setSelectedDate(prev => addDays(prev, 1));
  };

  const handleToday = () => {
    setSelectedDate(startOfDay(new Date()));
  };

  const toggleHabit = async (habitId: string, completed: boolean) => {
    try {
      await apiService.post(`/habits/${habitId}/toggle`, {
        date: format(selectedDate, 'yyyy-MM-dd'),
        completed
      });
      await fetchHabits(); // Recharger pour avoir les données à jour
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'habitude:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour l\'habitude');
    }
  };

  const getHabitStatus = (habit: Habit) => {
    const entry = habit.entries.find(
      e => e.date === format(selectedDate, 'yyyy-MM-dd')
    );
    return entry?.completed || false;
  };

  const HabitCard = ({ habit }: { habit: Habit }) => {
    const completed = getHabitStatus(habit);
    
    return (
      <TouchableOpacity
        style={[styles.habitCard, completed && styles.habitCardCompleted]}
        onPress={() => toggleHabit(habit.id, !completed)}
      >
        <View style={styles.habitHeader}>
          <Text style={styles.habitName}>{habit.name}</Text>
          <View style={styles.streakContainer}>
            <Ionicons name="flame" size={16} color="#ff6b6b" />
            <Text style={styles.streakText}>{habit.streak}j</Text>
          </View>
        </View>
        
        {habit.description && (
          <Text style={styles.habitDescription}>{habit.description}</Text>
        )}
        
        <View style={styles.habitFooter}>
          <Text style={styles.habitTime}>
            {habit.timeOfDay || 'Toute la journée'}
          </Text>
          <View style={[styles.checkCircle, completed && styles.checkCircleCompleted]}>
            {completed && <Ionicons name="checkmark" size={20} color="#ffffff" />}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* En-tête avec navigation par date */}
      <View style={styles.header}>
        <Text style={styles.title}>Mes Habitudes</Text>
        <View style={styles.dateNav}>
          <TouchableOpacity onPress={handlePreviousDay}>
            <Ionicons name="chevron-back" size={24} color="#22c55e" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleToday} style={styles.dateButton}>
            <Text style={styles.dateText}>
              {format(selectedDate, 'EEEE d MMMM', { locale: fr })}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleNextDay}>
            <Ionicons name="chevron-forward" size={24} color="#22c55e" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={styles.habitsList}>
          {habits.map(habit => (
            <HabitCard key={habit.id} habit={habit} />
          ))}
        </View>
      </ScrollView>

      {/* Bouton d'ajout d'habitude */}
      <TouchableOpacity style={styles.addButton}>
        <Ionicons name="add" size={24} color="#ffffff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  dateNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  dateButton: {
    paddingHorizontal: 16,
  },
  dateText: {
    fontSize: 16,
    color: '#22c55e',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  habitsList: {
    padding: 16,
  },
  habitCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  habitCardCompleted: {
    backgroundColor: '#f0fdf4',
  },
  habitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  habitName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff1f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  streakText: {
    marginLeft: 4,
    color: '#ff6b6b',
    fontWeight: '600',
  },
  habitDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  habitFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  habitTime: {
    fontSize: 12,
    color: '#6b7280',
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircleCompleted: {
    backgroundColor: '#22c55e',
  },
  addButton: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
}); 