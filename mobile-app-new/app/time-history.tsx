import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { apiCall } from '@/lib/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface TimeEntry {
  id: string;
  projectId?: string | null;
  projectName?: string | null;
  description?: string | null;
  startTime: string;
  endTime?: string | null;
  durationMinutes?: number | null;
  createdAt: string;
}

export default function TimeHistoryScreen() {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchEntries = async () => {
    try {
      const data = await apiCall<any>('/time-entries');
      const list = Array.isArray(data) ? data : (data?.timeEntries || []);
      const formatted = list.map((e: any) => ({
        id: e.id,
        projectId: e.projectId ?? e.project?.id ?? null,
        projectName: e.project?.name ?? e.projectName ?? null,
        description: e.description ?? null,
        startTime: e.startTime,
        endTime: e.endTime ?? null,
        durationMinutes: e.durationMinutes ?? null,
        createdAt: e.createdAt,
      }));
      setEntries(formatted);
    } catch (e) {
      console.error('Erreur chargement time-entries:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchEntries();
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#10b981" />
        <Text style={styles.loadingText}>Chargement de l'historique...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Suivi du temps</Text>
        <Text style={styles.subtitle}>Timer et historique</Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {entries.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="time-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>Aucune entrée</Text>
            <Text style={styles.emptySubtitle}>Lancez un timer pour commencer à suivre votre temps.</Text>
          </View>
        ) : (
          entries.map((e) => {
            const started = new Date(e.startTime);
            const ended = e.endTime ? new Date(e.endTime) : null;
            const duration = e.durationMinutes ?? (ended ? Math.round((+ended - +started) / 60000) : null);
            return (
              <View key={e.id} style={styles.entryCard}>
                <View style={styles.entryHeader}>
                  <Text style={styles.entryProject}>{e.projectName || 'Sans projet'}</Text>
                  <Text style={styles.entryDate}>{format(started, "EEE d MMM, HH:mm", { locale: fr })}</Text>
                </View>
                {e.description ? <Text style={styles.entryDesc}>{e.description}</Text> : null}
                <View style={styles.entryFooter}>
                  <View style={styles.durationBadge}>
                    <Ionicons name="timer" size={14} color="#047857" />
                    <Text style={styles.durationText}>{duration ? `${duration} min` : 'En cours'}</Text>
                  </View>
                  {ended && (
                    <Text style={styles.rangeText}>
                      {format(started, 'HH:mm')} - {format(ended, 'HH:mm')}
                    </Text>
                  )}
                </View>
              </View>
            );
          })
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => router.push('/(tabs)/timer')}>
        <Ionicons name="play" size={22} color="#fff" />
        <Text style={styles.fabText}>Ouvrir le Timer</Text>
      </TouchableOpacity>
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
  loadingText: { marginTop: 12, color: '#6b7280' },
  emptyState: { alignItems: 'center', paddingVertical: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#374151', marginTop: 12 },
  emptySubtitle: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  entryCard: { backgroundColor: '#fff', marginHorizontal: 20, marginTop: 12, borderRadius: 12, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  entryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  entryProject: { fontSize: 16, fontWeight: '700', color: '#111827' },
  entryDate: { fontSize: 12, color: '#6b7280' },
  entryDesc: { marginTop: 8, color: '#374151' },
  entryFooter: { marginTop: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  durationBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#d1fae5', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 9999 },
  durationText: { color: '#065f46', fontWeight: '600' },
  rangeText: { color: '#6b7280' },
  fab: { position: 'absolute', bottom: 24, right: 24, backgroundColor: '#10b981', borderRadius: 28, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 8, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 6 },
  fabText: { color: '#fff', fontWeight: '700' },
});
