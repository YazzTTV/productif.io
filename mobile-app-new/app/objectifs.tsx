import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiCall } from '@/lib/api';

interface Objective {
  id: string;
  title: string;
  missionTitle?: string;
  description?: string | null;
  progress?: number | null;
  current?: number | null;
  target?: number | null;
  createdAt?: string;
}

export default function ObjectivesScreen() {
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchObjectives = async () => {
    try {
      // Utiliser l'endpoint qui renvoie les objectifs de la mission courante
      const data = await apiCall<Objective[]>('/objectives/current');
      setObjectives(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Erreur chargement objectifs:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchObjectives(); }, []);

  const handleCreate = async () => {
    Alert.alert('À implémenter', 'Création d\'objectif à venir.');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Objectifs</Text>
        <Text style={styles.subtitle}>Définir et suivre vos objectifs</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <Text style={styles.loading}>Chargement...</Text>
        ) : objectives.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="flag-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>Aucun objectif</Text>
            <Text style={styles.emptySubtitle}>Ajoutez votre premier objectif pour suivre votre progression.</Text>
          </View>
        ) : (
          objectives.map((o) => (
            <View key={o.id} style={styles.card}>
              <Text style={styles.cardTitle}>{o.title}</Text>
              {o.missionTitle ? (
                <Text style={styles.cardMeta}>{o.missionTitle}</Text>
              ) : null}
              {(o.current !== undefined && o.target !== undefined) ? (
                <Text style={styles.cardDesc}>Progression: {o.current}/{o.target} {o.progress ? `(${o.progress}%)` : ''}</Text>
              ) : null}
            </View>
          ))
        )}
        <View style={{ height: 80 }} />
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={handleCreate}>
        <Ionicons name="add" size={22} color="#fff" />
        <Text style={styles.fabText}>Nouvel objectif</Text>
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
  loading: { color: '#6b7280', padding: 20 },
  emptyState: { alignItems: 'center', paddingVertical: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#374151', marginTop: 12 },
  emptySubtitle: { fontSize: 14, color: '#6b7280', marginTop: 4, textAlign: 'center', paddingHorizontal: 24 },
  card: { backgroundColor: '#fff', marginHorizontal: 20, marginTop: 12, borderRadius: 12, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  cardMeta: { marginTop: 4, color: '#6b7280' },
  cardDesc: { marginTop: 6, color: '#374151' },
  fab: { position: 'absolute', bottom: 24, right: 24, backgroundColor: '#10b981', borderRadius: 28, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 8, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 6 },
  fabText: { color: '#fff', fontWeight: '700' },
});
