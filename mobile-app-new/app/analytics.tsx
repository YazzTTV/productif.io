import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { dashboardService } from '@/lib/api';
import { format, startOfDay } from 'date-fns';

export default function AnalyticsScreen() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  const fetchData = async () => {
    try {
      const date = startOfDay(new Date());
      const d = await dashboardService.getMetrics(format(date, 'yyyy-MM-dd'));
      setData(d);
    } catch (e) {
      console.error('Erreur chargement analytics:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#8b5cf6" />
        <Text style={{ marginTop: 12, color: '#6b7280' }}>Chargement des analytics...</Text>
      </View>
    );
  }

  const habits = data?.habits ?? {};
  const tasks = data?.tasks ?? {};
  const productivity = data?.productivity ?? {};

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Analytics</Text>
        <Text style={styles.subtitle}>Statistiques détaillées</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.kpiRow}>
          <View style={[styles.kpiCard, { backgroundColor: '#EEF2FF' }]}> 
            <Ionicons name="flame" size={20} color="#6366F1" />
            <Text style={styles.kpiLabel}>Streak</Text>
            <Text style={styles.kpiValue}>{habits.streak ?? 0} j</Text>
          </View>
          <View style={[styles.kpiCard, { backgroundColor: '#ECFDF5' }]}> 
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            <Text style={styles.kpiLabel}>Habitudes complétées</Text>
            <Text style={styles.kpiValue}>{habits.completed ?? 0}</Text>
          </View>
        </View>

        <View style={styles.kpiRow}>
          <View style={[styles.kpiCard, { backgroundColor: '#FEF3C7' }]}> 
            <Ionicons name="hourglass" size={20} color="#F59E0B" />
            <Text style={styles.kpiLabel}>Tâches du jour</Text>
            <Text style={styles.kpiValue}>{tasks.today ?? 0}</Text>
          </View>
          <View style={[styles.kpiCard, { backgroundColor: '#FEE2E2' }]}> 
            <Ionicons name="close-circle" size={20} color="#EF4444" />
            <Text style={styles.kpiLabel}>Restantes</Text>
            <Text style={styles.kpiValue}>{(tasks.today ?? 0) - (tasks.completed ?? 0)}</Text>
          </View>
        </View>

        <View style={styles.kpiRow}>
          <View style={[styles.kpiCard, { backgroundColor: '#DBEAFE' }]}> 
            <Ionicons name="trending-up" size={20} color="#3B82F6" />
            <Text style={styles.kpiLabel}>Score</Text>
            <Text style={styles.kpiValue}>{productivity.score ?? 0}</Text>
          </View>
          <View style={[styles.kpiCard, { backgroundColor: '#E0E7FF' }]}> 
            <Ionicons name="stats-chart" size={20} color="#6366F1" />
            <Text style={styles.kpiLabel}>Tendance</Text>
            <Text style={styles.kpiValue}>{productivity.trend ?? '-'}</Text>
          </View>
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#111827' },
  subtitle: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  content: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  kpiRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, marginTop: 16 },
  kpiCard: { flex: 1, borderRadius: 12, padding: 16, gap: 6 },
  kpiLabel: { color: '#374151' },
  kpiValue: { fontSize: 18, fontWeight: '800', color: '#111827' },
});
