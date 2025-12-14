import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { LineChart } from 'react-native-chart-kit';
import { dashboardService, habitsService } from '@/lib/api';
import { format, subDays, startOfDay } from 'date-fns';
import { useTranslation } from '@/hooks/useTranslation';

const { width } = Dimensions.get('window');

type TimePeriod = 'week' | 'month' | 'trimester' | 'year';

export default function AnalyticsScreen() {
  const t = useTranslation();
  const [loading, setLoading] = useState(true);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('week');
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [habits, setHabits] = useState<any[]>([]);
  const [stats, setStats] = useState({
    avgProductivity: 0,
    totalTasks: 0,
    totalHabits: 0,
    focusHours: 0,
  });

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);

      // Fetch analytics stats for the selected period
      const analyticsStats = await dashboardService.getAnalyticsStats(timePeriod);
      
      if (analyticsStats?.stats) {
        setStats({
          avgProductivity: analyticsStats.stats.avgProductivity || 0,
          totalTasks: analyticsStats.stats.totalTasks || 0,
          totalHabits: analyticsStats.stats.habitsCompletion || 0, // Now it's a percentage
          focusHours: analyticsStats.stats.focusHours || 0,
        });
      }

      // Fetch weekly productivity data for charts (supports all periods now)
      const weeklyProductivity = await dashboardService.getWeeklyProductivity(timePeriod);
      const weeklyDataArray = weeklyProductivity?.weeklyData || [];

      setWeeklyData(weeklyDataArray);

      // Fetch habits for streaks display
      const habitsData = await habitsService.getAll();

      // Process habits for streaks display
      if (habitsData && Array.isArray(habitsData)) {
        const habitsWithStreaks = habitsData
          .filter((h: any) => h.isActive !== false)
          .map((habit: any) => {
            // Calculate completion percentage based on entries
            const entries = habit.entries || [];
            const completedEntries = entries.filter((e: any) => e.completed).length;
            const totalEntries = entries.length;
            const completion = totalEntries > 0 
              ? Math.round((completedEntries / totalEntries) * 100)
              : 0;

            return {
              id: habit.id,
              name: habit.name,
              streak: habit.currentStreak || 0,
              icon: '🔥',
              color: '#00C27A',
              completed: completion,
            };
          })
          .sort((a: any, b: any) => b.streak - a.streak)
          .slice(0, 5);

        setHabits(habitsWithStreaks);
      }
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalyticsData();
  }, [timePeriod]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#00C27A" />
        <Text style={styles.loadingText}>{t('loadingAnalytics')}</Text>
      </View>
    );
  }

  // Prepare chart data
  const chartData = {
    labels: weeklyData.map((d) => d.day),
    datasets: [
      {
        data: weeklyData.map((d) => d.score),
        color: (opacity = 1) => `rgba(0, 194, 122, ${opacity})`,
        strokeWidth: 3,
      },
    ],
  };

  // Calculate max value for bar chart scaling
  const maxBarValue = Math.max(
    ...weeklyData.map((d) => Math.max(d.habitsProgress || 0, d.tasksProgress || 0)),
    100
  );

  const timePeriods: TimePeriod[] = ['week', 'month', 'trimester', 'year'];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('analytics')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Time Period Selector */}
        <View style={styles.periodSelector}>
          {timePeriods.map((period) => (
            <TouchableOpacity
              key={period}
              onPress={() => setTimePeriod(period)}
              style={[
                styles.periodButton,
                timePeriod === period && styles.periodButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.periodButtonText,
                  timePeriod === period && styles.periodButtonTextActive,
                ]}
              >
                {t(period)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <Animated.View
            entering={FadeInDown.delay(100).duration(400)}
            style={styles.statCard}
          >
            <View style={styles.statHeader}>
              <Ionicons name="trending-up" size={18} color="#00C27A" />
              <Text style={styles.statLabel}>{t('avgProductivity')}</Text>
            </View>
            <Text style={styles.statValue}>{stats.avgProductivity}%</Text>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(150).duration(400)}
            style={styles.statCard}
          >
            <View style={styles.statHeader}>
              <Ionicons name="checkmark-circle" size={18} color="#3B82F6" />
              <Text style={styles.statLabel}>{t('totalTasks')}</Text>
            </View>
            <Text style={styles.statValue}>{stats.totalTasks}</Text>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(200).duration(400)}
            style={styles.statCard}
          >
            <View style={styles.statHeader}>
              <Ionicons name="flame" size={18} color="#F59E0B" />
              <Text style={styles.statLabel}>{t('habitsTracked')}</Text>
            </View>
            <Text style={styles.statValue}>{stats.totalHabits}%</Text>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(250).duration(400)}
            style={styles.statCard}
          >
            <View style={styles.statHeader}>
              <Ionicons name="time" size={18} color="#8B5CF6" />
              <Text style={styles.statLabel}>{t('focusHours')}</Text>
            </View>
            <Text style={styles.statValue}>{stats.focusHours}h</Text>
          </Animated.View>
        </View>

        {/* Productivity Trend Chart */}
        <Animated.View
          entering={FadeInDown.delay(300).duration(400)}
          style={styles.chartCard}
        >
          <Text style={styles.chartTitle}>{t('productivityTrend')}</Text>
          {weeklyData.length > 0 ? (
            <LineChart
              data={chartData}
              width={width - 48}
              height={200}
              chartConfig={{
                backgroundColor: '#FFFFFF',
                backgroundGradientFrom: '#FFFFFF',
                backgroundGradientTo: '#FFFFFF',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(0, 194, 122, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
                style: {
                  borderRadius: 16,
                },
                propsForDots: {
                  r: '4',
                  strokeWidth: '2',
                  stroke: '#00C27A',
                },
              }}
              bezier
              style={{
                marginVertical: 8,
                borderRadius: 16,
              }}
              withInnerLines={false}
              withOuterLines={false}
              withVerticalLabels={true}
              withHorizontalLabels={true}
            />
          ) : (
            <View style={styles.emptyChart}>
              <Text style={styles.emptyText}>{t('noDataAvailable')}</Text>
            </View>
          )}
        </Animated.View>

        {/* Focus vs Tasks Chart */}
        <Animated.View
          entering={FadeInDown.delay(350).duration(400)}
          style={styles.chartCard}
        >
          <Text style={styles.chartTitle}>{t('focusScoreVsTasks')}</Text>
          {weeklyData.length > 0 ? (
            <View style={styles.barChartContainer}>
              <View style={styles.barChart}>
                {weeklyData.map((day, index) => (
                  <View key={index} style={styles.barGroup}>
                    <View style={styles.barContainer}>
                      <View style={styles.barBackground}>
                        <View
                          style={[
                            styles.bar,
                            styles.barHabits,
                            {
                              height: `${((day.habitsProgress || 0) / maxBarValue) * 100}%`,
                            },
                          ]}
                        />
                      </View>
                      <View style={styles.barBackground}>
                        <View
                          style={[
                            styles.bar,
                            styles.barTasks,
                            {
                              height: `${((day.tasksProgress || 0) / maxBarValue) * 100}%`,
                            },
                          ]}
                        />
                      </View>
                    </View>
                    <Text style={styles.barLabel}>{day.day}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.barLegend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: '#00C27A' }]} />
                  <Text style={styles.legendText}>{t('habits')}</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: '#60A5FA' }]} />
                  <Text style={styles.legendText}>{t('tasks')}</Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.emptyChart}>
              <Text style={styles.emptyText}>{t('noDataAvailable')}</Text>
            </View>
          )}
        </Animated.View>

        {/* Habit Streaks */}
        <Animated.View
          entering={FadeInDown.delay(400).duration(400)}
          style={styles.chartCard}
        >
          <View style={styles.habitStreaksHeader}>
            <Text style={styles.chartTitle}>{t('habitStreaks')}</Text>
            <Ionicons name="trophy" size={20} color="#00C27A" />
          </View>

          {habits.length > 0 ? (
            <View style={styles.habitsList}>
              {habits.map((habit, index) => (
                <Animated.View
                  key={habit.id}
                  entering={FadeIn.delay(500 + index * 100).duration(400)}
                  style={styles.habitItem}
                >
                  <View style={styles.habitHeader}>
                    <View style={styles.habitInfo}>
                      <Text style={styles.habitIcon}>🔥</Text>
                      <View>
                        <Text style={styles.habitName}>{habit.name}</Text>
                        <Text style={styles.habitCompletion}>
                          {habit.completed}% {t('completion')}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.habitStreak}>
                      <View style={styles.streakRow}>
                        <Ionicons name="flame" size={16} color="#F59E0B" />
                        <Text style={styles.streakValue}>{habit.streak}</Text>
                      </View>
                      <Text style={styles.streakLabel}>{t('dayStreak')}</Text>
                    </View>
                  </View>

                  {/* Progress Bar */}
                  <View style={styles.progressBarContainer}>
                    <View
                      style={[
                        styles.progressBar,
                        { width: `${habit.completed || 0}%` },
                      ]}
                    />
                  </View>
                </Animated.View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyChart}>
              <Text style={styles.emptyText}>{t('noHabitsFound')}</Text>
            </View>
          )}
        </Animated.View>

        {/* Weekly Consistency Heatmap */}
        <Animated.View
          entering={FadeInDown.delay(600).duration(400)}
          style={styles.chartCard}
        >
          <Text style={styles.chartTitle}>{t('weeklyConsistency')}</Text>
          <View style={styles.heatmap}>
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => (
              <View key={index} style={styles.heatmapDay}>
                <Text style={styles.heatmapDayLabel}>{day}</Text>
                <View
                  style={[
                    styles.heatmapBox,
                    index < 5 && styles.heatmapBoxActive,
                  ]}
                />
                <Text style={styles.heatmapCheck}>
                  {index < 5 ? '✓' : '–'}
                </Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Bottom spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    color: '#6B7280',
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 24,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  periodSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  periodButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  periodButtonActive: {
    backgroundColor: '#00C27A',
    borderColor: '#00C27A',
  },
  periodButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  periodButtonTextActive: {
    color: '#FFFFFF',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: (width - 60) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  emptyChart: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  habitStreaksHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  habitsList: {
    gap: 12,
  },
  habitItem: {
    borderWidth: 1,
    borderColor: '#F3F4F6',
    borderRadius: 16,
    padding: 16,
  },
  habitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  habitInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  habitIcon: {
    fontSize: 24,
  },
  habitName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  habitCompletion: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  habitStreak: {
    alignItems: 'flex-end',
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  streakValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  streakLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#00C27A',
    borderRadius: 4,
  },
  heatmap: {
    flexDirection: 'row',
    gap: 8,
  },
  heatmapDay: {
    flex: 1,
    alignItems: 'center',
  },
  heatmapDayLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  heatmapBox: {
    width: '100%',
    height: 48,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
  },
  heatmapBoxActive: {
    backgroundColor: '#00C27A',
  },
  heatmapCheck: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  barChartContainer: {
    marginVertical: 8,
  },
  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 180,
    marginBottom: 16,
  },
  barGroup: {
    flex: 1,
    alignItems: 'center',
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    height: '100%',
    width: '100%',
    justifyContent: 'center',
  },
  barBackground: {
    flex: 1,
    height: '100%',
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    borderRadius: 4,
    minHeight: 2,
  },
  barHabits: {
    backgroundColor: '#00C27A',
  },
  barTasks: {
    backgroundColor: '#60A5FA',
  },
  barLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
  },
  barLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 12,
    color: '#6B7280',
  },
});
