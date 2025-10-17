import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, RefreshControl, Alert, TouchableOpacity, Text, Dimensions } from 'react-native';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import { Ionicons } from '@expo/vector-icons';
import { dashboardService, tasksService, habitsService, gamificationService } from '../../lib/api';
import { dashboardEvents, DASHBOARD_DATA_CHANGED } from '../../lib/events';
import Svg, { Circle } from 'react-native-svg';
import { format, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

// Interface pour les données du dashboard
interface DashboardData {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  totalTimeToday: number;
  totalTimeWeek: number;
  activeHabits: number;
  completedHabitsToday: number;
  currentStreak: number;
  level: number;
  experience: number;
  nextLevelExp: number;
  recentAchievements: any[];
}

export default function DashboardScreen() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [leaderboard, setLeaderboard] = useState<any[] | null>(null);
  const [userRank, setUserRank] = useState<number | undefined>(undefined);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${minutes}min`;
  };

  const getProgressPercentage = (current: number, total: number): number => {
    if (total === 0) return 0;
    return Math.round((current / total) * 100);
  };

  const loadDashboardData = async () => {
    try {
      setError(null);
      console.log('🔄 Chargement des données du dashboard...');

      // Charger les données en parallèle avec gestion d'erreur améliorée
      const results = await Promise.allSettled([
        tasksService.getTasks(),
        habitsService.getAll(),
        dashboardService.getMetrics(),
        dashboardService.getGamificationStats(),
        gamificationService.getLeaderboard(3, true)
      ]);

      // Extraire les données ou valeurs par défaut
      const tasksResult = results[0].status === 'fulfilled' ? results[0].value : null;
      const habitsResult = results[1].status === 'fulfilled' ? results[1].value : null;
      const metricsResult = results[2].status === 'fulfilled' ? results[2].value : null;
      const gamificationResult = results[3].status === 'fulfilled' ? results[3].value : null;
      const leaderboardResult = results[4].status === 'fulfilled' ? results[4].value : null;

      console.log('📊 Résultats API:', {
        tasks: tasksResult ? 'OK' : 'ERREUR',
        habits: habitsResult ? 'OK' : 'ERREUR',
        metrics: metricsResult ? 'OK' : 'ERREUR',
        gamification: gamificationResult ? 'OK' : 'ERREUR',
        leaderboard: leaderboardResult ? 'OK' : 'ERREUR'
      });

      // Traiter le leaderboard et stocker en état
      let topLeaderboard: any[] = [];
      let rank: number | undefined = undefined;
      if (leaderboardResult) {
        if (Array.isArray(leaderboardResult)) {
          topLeaderboard = leaderboardResult;
        } else if (Array.isArray((leaderboardResult as any).leaderboard)) {
          topLeaderboard = (leaderboardResult as any).leaderboard;
          rank = (leaderboardResult as any).userRank;
        }
      }
      setLeaderboard(topLeaderboard);
      setUserRank(rank);

      // Traiter les tâches
      let tasks = [];
      if (tasksResult && Array.isArray(tasksResult.tasks)) {
        tasks = tasksResult.tasks;
      } else if (tasksResult && Array.isArray(tasksResult)) {
        tasks = tasksResult;
      }
      
      // Filtrer les tâches d'aujourd'hui seulement
      const today = new Date().toISOString().split('T')[0];
      const todayTasks = tasks.filter((task: any) => {
        const taskDate = task.createdAt ? new Date(task.createdAt).toISOString().split('T')[0] : today;
        const dueDate = task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : null;
        // Inclure les tâches créées aujourd'hui ou dues aujourd'hui
        return taskDate === today || dueDate === today || task.status === 'PENDING' || task.status === 'IN_PROGRESS';
      });
      
      const completedTasks = todayTasks.filter((task: any) => task.status === 'COMPLETED').length;
      const pendingTasks = todayTasks.filter((task: any) => 
        task.status === 'PENDING' || task.status === 'IN_PROGRESS'
      ).length;

      // Traiter les habitudes
      let habits = [];
      if (habitsResult && Array.isArray(habitsResult.habits)) {
        habits = habitsResult.habits;
      } else if (habitsResult && Array.isArray(habitsResult)) {
        habits = habitsResult;
      }
      const activeHabits = habits.filter((h: any) => h.isActive !== false).length;
      
      // Compter les habitudes complétées aujourd'hui
      const completedHabitsToday = habits.filter((habit: any) => {
        const entries = habit.entries || habit.completions || [];
        return entries.some((entry: any) => {
          const entryDate = new Date(entry.date).toISOString().split('T')[0];
          return entryDate === today && entry.completed === true;
        });
      }).length;

      // Données de gamification
      const streak = gamificationResult?.streak || gamificationResult?.currentStreak || 0;
      const level = gamificationResult?.level || 1;
      const experience = gamificationResult?.experience || 0;
      const nextLevelExp = gamificationResult?.nextLevelExp || 100;

      // Construire les données du dashboard
      const dashboardData: DashboardData = {
        totalTasks: todayTasks.length,
        completedTasks,
        pendingTasks,
        totalTimeToday: metricsResult?.totalTimeToday || 0,
        totalTimeWeek: metricsResult?.totalTimeWeek || 0,
        activeHabits,
        completedHabitsToday,
        currentStreak: streak,
        level,
        experience,
        nextLevelExp,
        recentAchievements: gamificationResult?.recentAchievements || []
      };

      console.log('✅ Dashboard final:', dashboardData);
      setData(dashboardData);

    } catch (err: any) {
      console.error('❌ Erreur critique lors du chargement du dashboard:', err);
      setError(`Erreur de connexion: ${err.message}`);
      
      // Ne pas mettre de données par défaut, garder null pour forcer l'affichage d'erreur
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Écouter les événements de mise à jour du dashboard
  useFocusEffect(
    React.useCallback(() => {
      const handleDataChange = () => {
        console.log('📡 Événement reçu : mise à jour du dashboard');
        loadDashboardData();
      };

      dashboardEvents.on(DASHBOARD_DATA_CHANGED, handleDataChange);
      
      // Charger les données à chaque fois qu'on revient sur l'écran
      loadDashboardData();

      return () => {
        dashboardEvents.off(DASHBOARD_DATA_CHANGED, handleDataChange);
      };
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <Ionicons name="hourglass" size={48} color="#22c55e" />
        <ThemedText style={styles.loadingText}>
          Chargement de votre tableau de bord...
        </ThemedText>
      </ThemedView>
    );
  }

  if (!data) {
    return (
      <ThemedView style={styles.errorContainer}>
        <Ionicons name="warning" size={48} color="#f59e0b" />
        <ThemedText style={styles.errorText}>
          {error || 'Impossible de charger le dashboard'}
        </ThemedText>
        <TouchableOpacity style={styles.retryButton} onPress={loadDashboardData}>
          <Ionicons name="refresh" size={24} color="#22c55e" />
          <Text style={styles.retryText}>
            Réessayer
          </Text>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  const today = new Date();
  const habitsProgress = data.activeHabits > 0 ? (data.completedHabitsToday / data.activeHabits) * 100 : 0;

  // Composant de cercle de progression
  const ProgressCircle = ({ percentage, size = 200, strokeWidth = 16, color = "#10B981" }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={size} height={size} style={{ position: 'absolute' }}>
          {/* Cercle de fond */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#E5E7EB"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Cercle de progression */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${size/2} ${size/2})`}
          />
        </Svg>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 36, fontWeight: 'bold', color: '#111827' }}>
            {Math.round(percentage)}%
          </Text>
          <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 4 }}>
            {data.completedHabitsToday}/{data.activeHabits}
          </Text>
          <Text style={{ fontSize: 16, color: '#111827', fontWeight: '600', marginTop: 2 }}>
            Habitudes
          </Text>
        </View>
      </View>
    );
  };

  // Composant de métrique circulaire
  const MetricCircle = ({ value, label, color = "#6B7280" }) => (
    <View style={styles.metricCircle}>
      <View style={[styles.metricCircleInner, { borderColor: color }]}>
        <Text style={[styles.metricValue, { color }]}>{value}</Text>
      </View>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView 
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header avec navigation de date */}
        <View style={styles.header}>
          <View style={styles.dateNavigation}>
            <TouchableOpacity style={styles.navButton}>
              <Ionicons name="chevron-back" size={24} color="#374151" />
            </TouchableOpacity>
            
            <View style={styles.dateContainer}>
              <Text style={styles.dateText}>
                {format(today, 'EEEE d MMMM', { locale: fr })}
              </Text>
              <Text style={styles.dateSubtext}>Aujourd'hui</Text>
            </View>
            
            <TouchableOpacity style={styles.navButton}>
              <Ionicons name="chevron-forward" size={24} color="#374151" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Cercle principal de progression des habitudes */}
        <View style={styles.mainProgressContainer}>
          <ProgressCircle 
            percentage={habitsProgress} 
            size={200} 
            color="#10B981" 
          />
        </View>

        {/* Métriques circulaires */}
        <View style={styles.metricsRow}>
          <MetricCircle 
            value={data.currentStreak} 
            label="Streak" 
            color="#10B981"
          />
          <MetricCircle 
            value={data.activeHabits} 
            label="Habitudes" 
            color="#6B7280"
          />
          <MetricCircle 
            value={data.pendingTasks} 
            label="restantes" 
            color="#F59E0B"
          />
          <MetricCircle 
            value={data.level} 
            label="Score" 
            color="#8B5CF6"
          />
        </View>

        {/* Section Habitudes */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Habitudes d'aujourd'hui</Text>
            <TouchableOpacity>
              <Text style={styles.sectionLink}>Voir tout</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.sectionContent}>
            <Text style={styles.progressLabel}>Progression</Text>
            <Text style={styles.progressValue}>
              {data.completedHabitsToday}/{data.activeHabits}
            </Text>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressBarFill, 
                  { width: `${habitsProgress}%` }
                ]} 
              />
            </View>
            <TouchableOpacity 
              style={styles.manageButton}
              onPress={() => router.push('/(tabs)/habits')}
            >
              <Text style={styles.manageButtonText}>Gérer mes habitudes</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Section Tâches */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Tâches d'aujourd'hui</Text>
            <TouchableOpacity>
              <Text style={styles.sectionLink}>Voir tout</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.sectionContent}>
            <Text style={styles.progressLabel}>Restantes</Text>
            <Text style={styles.progressValue}>
              {data.pendingTasks} tâche{data.pendingTasks !== 1 ? 's' : ''}
            </Text>
            <Text style={styles.progressLabel}>Progression</Text>
            <Text style={styles.progressValue}>
              {data.completedTasks}/{data.totalTasks}
            </Text>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressBarFill, 
                  { 
                    width: `${getProgressPercentage(data.completedTasks, data.totalTasks)}%`,
                    backgroundColor: '#F59E0B'
                  }
                ]} 
              />
            </View>
            <TouchableOpacity 
              style={styles.manageButton}
              onPress={() => router.push('/(tabs)/tasks')}
            >
              <Text style={styles.manageButtonText}>Gérer mes tâches</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Section Top Classement */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.leaderboardHeader}>
              <Ionicons name="trophy" size={24} color="#F59E0B" />
              <Text style={styles.sectionTitle}>Top Classement</Text>
            </View>
          </View>
          
          {/* Top leaderboard réel depuis l'API */}
          {(() => {
            const top = leaderboard || [];
            if (!top || top.length === 0) {
              return (
                <View style={{ paddingVertical: 8 }}>
                  <Text style={{ color: '#6B7280' }}>Aucun classement disponible pour le moment.</Text>
                </View>
              );
            }
            return (
              <>
                {top.slice(0, 3).map((entry: any, idx: number) => (
                  <View key={entry.userId || idx} style={styles.leaderboardItem}>
                    <View style={styles.leaderboardRank}>
                      {idx === 0 ? (
                        <Ionicons name="trophy" size={20} color="#FFD700" />
                      ) : idx === 1 ? (
                        <Ionicons name="trophy" size={20} color="#C0C0C0" />
                      ) : (
                        <Text style={styles.rankNumber}>{entry.rank ?? idx + 1}</Text>
                      )}
                    </View>
                    <View style={styles.leaderboardInfo}>
                      <Text style={styles.leaderboardName}>{entry.userName || 'Utilisateur'}</Text>
                      <View style={styles.leaderboardStats}>
                        <Ionicons name="star" size={16} color="#F59E0B" />
                        <Text style={styles.leaderboardPoints}>{entry.totalPoints}</Text>
                        <Text style={styles.leaderboardStreak}>• {entry.currentStreak}j streak</Text>
                      </View>
                    </View>
                    <View style={styles.leaderboardBadge}>
                      <Text style={styles.leaderboardLevel}>Niv.{entry.level}</Text>
                    </View>
                  </View>
                ))}
                {typeof userRank === 'number' && userRank > 3 && (
                  <>
                    <View style={styles.leaderboardDivider} />
                    <View style={styles.leaderboardItem}>
                      <View style={styles.leaderboardRank}>
                        <Text style={styles.rankNumber}>{userRank}</Text>
                      </View>
                      <View style={styles.leaderboardInfo}>
                        <Text style={styles.leaderboardName}>Vous</Text>
                        <View style={styles.leaderboardStats}>
                          <Ionicons name="star" size={16} color="#F59E0B" />
                          <Text style={styles.leaderboardPoints}>{data.experience}</Text>
                          <Text style={styles.leaderboardStreak}>• {data.currentStreak}j streak</Text>
                        </View>
                      </View>
                      <View style={styles.leaderboardBadge}>
                        <Text style={styles.leaderboardLevel}>Niv.{data.level}</Text>
                      </View>
                    </View>
                  </>
                )}
              </>
            );
          })()}
        </View>

        {/* Espacement en bas */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: 'white',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  dateNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  dateContainer: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 16,
  },
  dateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    textTransform: 'capitalize',
  },
  dateSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  mainProgressContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: 'white',
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  metricCircle: {
    alignItems: 'center',
  },
  metricCircleInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  metricLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  sectionCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  sectionLink: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
  },
  sectionContent: {
    gap: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  progressValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    marginVertical: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  manageButton: {
    backgroundColor: '#10B981',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  manageButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  leaderboardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    marginBottom: 8,
  },
  leaderboardRank: {
    width: 40,
    alignItems: 'center',
  },
  rankNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F59E0B',
  },
  leaderboardDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  leaderboardInfo: {
    flex: 1,
    marginLeft: 12,
  },
  leaderboardName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  leaderboardStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  leaderboardPoints: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  leaderboardStreak: {
    fontSize: 14,
    color: '#6B7280',
  },
  leaderboardBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  leaderboardLevel: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.8,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#F9FAFB',
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.8,
    marginBottom: 20,
    color: '#6B7280',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f0fdf4',
  },
  retryText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#22c55e',
  },
});