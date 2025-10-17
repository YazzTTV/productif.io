import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'

type LocalSettings = {
  darkMode: boolean
  haptics: boolean
  sounds: boolean
  autoRefreshDashboard: boolean
}

const DEFAULT_SETTINGS: LocalSettings = {
  darkMode: false,
  haptics: true,
  sounds: true,
  autoRefreshDashboard: true,
}

const STORAGE_KEY = 'app_local_settings'

export default function SettingsPage() {
  const [settings, setSettings] = useState<LocalSettings>(DEFAULT_SETTINGS)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    ;(async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY)
        if (raw) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(raw) })
      } catch (e) {
        console.warn('Unable to load settings')
      } finally {
        setLoaded(true)
      }
    })()
  }, [])

  const save = async (next: LocalSettings) => {
    setSettings(next)
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch (e) {
      Alert.alert('Erreur', "Impossible d'enregistrer les paramètres")
    }
  }

  const Toggle = ({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) => (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Switch value={value} onValueChange={onChange} trackColor={{ false: '#E5E7EB', true: '#10B981' }} thumbColor={value ? '#fff' : '#9CA3AF'} />
    </View>
  )

  if (!loaded) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text>Chargement…</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>Paramètres</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        <View style={styles.card}>
          <Text style={styles.section}>Général</Text>
          <Toggle label="Mode sombre" value={settings.darkMode} onChange={(v) => save({ ...settings, darkMode: v })} />
          <Toggle label="Vibrations (haptics)" value={settings.haptics} onChange={(v) => save({ ...settings, haptics: v })} />
          <Toggle label="Sons" value={settings.sounds} onChange={(v) => save({ ...settings, sounds: v })} />
        </View>
        <View style={styles.card}>
          <Text style={styles.section}>Dashboard</Text>
          <Toggle
            label="Auto-refresh au retour sur l'écran"
            value={settings.autoRefreshDashboard}
            onChange={(v) => save({ ...settings, autoRefreshDashboard: v })}
          />
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: { fontSize: 18, fontWeight: '600', color: '#111827' },
  card: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 12, marginBottom: 12 },
  section: { fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  label: { fontSize: 16, color: '#111827' },
})


