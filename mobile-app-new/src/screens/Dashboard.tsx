import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { format, addDays, startOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';

interface DashboardMetrics {
  tasks: {
    total: number;
    completed: number;
    urgent: number;
  };
  habits: {
    total: number;
    completed: number;
    streak: number;
  };
  timeStats: {
    todayMinutes: number;
    weekMinutes: number;
  };
  gamification: {
    level: number;
    experience: number;
    nextLevelExp: number;
  };
}

export const Dashboard = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()));
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = async (date = selectedDate) => {
    try {
      const formattedDate = format(date, 'yyyy-MM-dd');
      const response = await apiService.get(`/dashboard/metrics?date=${formattedDate}`);
      setMetrics(response);
    } catch (error) {
      console.error('Erreur lors du chargement des métriques:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [selectedDate]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchMetrics();
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

  const formatMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return hours > 0 ? `${hours}h ${remainingMinutes}min` : `${remainingMinutes}min`;
  };

  const StatCard = ({ title, value, icon, subtitle }: any) => (
    <View style={styles.statCard}>
      <Ionicons name={icon} size={24} color="#22c55e" style={styles.statIcon} />
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={styles.statValue}>{value}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* En-tête avec navigation par date */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Bonjour, {user?.name}</Text>
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

        {/* Statistiques rapides */}
        <View style={styles.statsGrid}>
          <StatCard
            title="Tâches"
            value={`${metrics?.tasks.completed || 0}/${metrics?.tasks.total || 0}`}
            icon="list"
            subtitle={`${metrics?.tasks.urgent || 0} urgentes`}
          />
          <StatCard
            title="Habitudes"
            value={`${metrics?.habits.completed || 0}/${metrics?.habits.total || 0}`}
            icon="calendar"
            subtitle={`Série: ${metrics?.habits.streak || 0}j`}
          />
          <StatCard
            title="Temps"
            value={formatMinutes(metrics?.timeStats.todayMinutes || 0)}
            icon="timer"
            subtitle={`Cette semaine: ${formatMinutes(metrics?.timeStats.weekMinutes || 0)}`}
          />
          <StatCard
            title="Niveau"
            value={metrics?.gamification.level || 1}
            icon="trophy"
            subtitle={`${metrics?.gamification.experience || 0}/${metrics?.gamification.nextLevelExp || 100} XP`}
          />
        </View>

        {/* Barre de progression XP */}
        {metrics?.gamification && (
          <View style={styles.xpContainer}>
            <View style={styles.xpBar}>
              <View
                style={[
                  styles.xpProgress,
                  {
                    width: `${(metrics.gamification.experience / metrics.gamification.nextLevelExp) * 100}%`,
                  },
                ]}
              />
            </View>
            <Text style={styles.xpText}>
              {metrics.gamification.experience} / {metrics.gamification.nextLevelExp} XP
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#111827',
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
  },
  statCard: {
    width: (Dimensions.get('window').width - 32) / 2,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    margin: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statIcon: {
    marginBottom: 8,
  },
  statTitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  statSubtitle: {
    fontSize: 12,
    color: '#6b7280',
  },
  xpContainer: {
    padding: 16,
    backgroundColor: '#ffffff',
    marginTop: 16,
    marginHorizontal: 8,
    borderRadius: 12,
  },
  xpBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  xpProgress: {
    height: '100%',
    backgroundColor: '#22c55e',
  },
  xpText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
  },
}); 